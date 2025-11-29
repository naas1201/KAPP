/**
 * Helper utilities to seed and teardown Firestore emulator documents for e2e tests.
 *
 * These helpers use the Firestore REST endpoints exposed by the emulator.
 * They expect the emulator host (FIRESTORE_EMULATOR_HOST) and project id
 * (FIRESTORE_PROJECT) to be available in the environment when running tests.
 */

type SeedOpts = {
  host?: string; // e.g. 'localhost:8080'
  projectId?: string;
  doctorId?: string;
  patientId?: string;
  appointmentId?: string;
  serviceType?: string;
  dateTime?: string; // ISO string
  doctorEmail?: string;
  doctorPassword?: string;
  patientEmail?: string;
  patientPassword?: string;
};

function toFirestoreFields(obj: Record<string, any>) {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'string') fields[k] = { stringValue: v };
    else if (typeof v === 'number' && Number.isInteger(v)) fields[k] = { integerValue: String(v) };
    else if (typeof v === 'number') fields[k] = { doubleValue: v };
    else if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    else if (v instanceof Date) fields[k] = { timestampValue: v.toISOString() };
    else if (typeof v === 'object') fields[k] = { stringValue: JSON.stringify(v) };
    else fields[k] = { stringValue: String(v) };
  }
  return { fields };
}

async function postDocument(host: string, projectId: string, collectionPath: string, documentId: string | undefined, data: Record<string, any>) {
  const base = `http://${host}/v1/projects/${projectId}/databases/(default)/documents`;
  const url = documentId
    ? `${base}/${collectionPath}?documentId=${encodeURIComponent(documentId)}`
    : `${base}/${collectionPath}`;

  const body = toFirestoreFields(data);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create document ${collectionPath}/${documentId || ''}: ${res.status} ${text}`);
  }
  return res.json();
}

async function createAuthUser(authHost: string, projectId: string, email: string, password: string) {
  // Auth emulator exposes the Identity Toolkit API under port 9099 by default.
  const signUpUrl = `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fakeKey`;
  const lookupUrl = `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:lookup?key=fakeKey`;
  const body = {
    email,
    password,
    returnSecureToken: true,
  };
  let res = await fetch(signUpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    const errText = text || '';
    // If user already exists, try lookup to get localId
    if (errText.includes('EMAIL_EXISTS') || res.status === 400) {
      const lookupBody = { email: [email] };
      const lookupRes = await fetch(lookupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lookupBody),
      });
      if (!lookupRes.ok) {
        const t = await lookupRes.text();
        throw new Error(`Failed to lookup existing auth user ${email}: ${lookupRes.status} ${t}`);
      }
      const json = await lookupRes.json();
      if (json && Array.isArray(json.users) && json.users[0]) {
        return json.users[0];
      }
      throw new Error(`User ${email} exists but lookup returned no users`);
    }
    throw new Error(`Failed to create auth user ${email}: ${res.status} ${text}`);
  }
  return res.json();
}

async function deleteDocument(host: string, projectId: string, docPath: string) {
  const base = `http://${host}/v1/projects/${projectId}/databases/(default)/documents`;
  const url = `${base}/${docPath}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const text = await res.text();
    // Deleting a missing doc may return 404 which is fine for teardown; just log.
    console.warn(`Delete ${docPath} responded ${res.status}: ${text}`);
  }
  return res.ok;
}

export async function seedBookingAppointment(opts: SeedOpts = {}) {
  const host = opts.host || process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
  const projectId = opts.projectId || process.env.FIRESTORE_PROJECT || 'demo-project';
  const doctorId = opts.doctorId || 'doctor-test';
  const patientId = opts.patientId || 'patient-test';
  const appointmentId = opts.appointmentId || `apt-${Date.now()}`;
  const serviceType = opts.serviceType || 'General Consultation';
  const dateTime = opts.dateTime || new Date(Date.now() + 1000 * 60 * 60).toISOString();
  const doctorEmail = opts.doctorEmail || process.env.DOCTOR_EMAIL || 'doctor@example.test';
  const doctorPassword = opts.doctorPassword || process.env.DOCTOR_PASS || 'password123';
  const patientEmail = opts.patientEmail || process.env.PATIENT_EMAIL || 'patient@example.test';
  const patientPassword = opts.patientPassword || process.env.PATIENT_PASS || 'password123';

  const seeded: string[] = [];

  // create doctor
  // attempt to create auth users in the Auth emulator (if present)
  try {
    await createAuthUser(authHost, projectId, doctorEmail, doctorPassword);
  } catch (err) {
    // non-fatal; continue if auth emulator not running
    console.warn('createAuthUser doctor failed', err?.message || err);
  }
  try {
    await createAuthUser(authHost, projectId, patientEmail, patientPassword);
  } catch (err) {
    console.warn('createAuthUser patient failed', err?.message || err);
  }

  await postDocument(host, projectId, 'doctors', doctorId, {
    firstName: 'E2E',
    lastName: 'Doctor',
    email: 'doctor@example.test',
    role: 'doctor',
    createdAt: new Date().toISOString(),
  });
  seeded.push(`doctors/${doctorId}`);

  // create patient
  await postDocument(host, projectId, 'patients', patientId, {
    firstName: 'E2E',
    lastName: 'Patient',
    email: 'patient@example.test',
    createdAt: new Date().toISOString(),
  });
  seeded.push(`patients/${patientId}`);

  // create appointment in patient subcollection
  await postDocument(host, projectId, `patients/${patientId}/appointments`, appointmentId, {
    patientId,
    doctorId,
    status: 'pending',
    serviceType,
    dateTime,
    notes: 'Seeded by e2e helper',
    createdAt: new Date().toISOString(),
  });
  seeded.push(`patients/${patientId}/appointments/${appointmentId}`);

  // create corresponding top-level appointment for doctor's convenience
  await postDocument(host, projectId, 'appointments', appointmentId, {
    patientId,
    doctorId,
    status: 'pending',
    serviceType,
    dateTime,
    notes: 'Seeded by e2e helper',
    createdAt: new Date().toISOString(),
  });
  seeded.push(`appointments/${appointmentId}`);

  return { host, projectId, seeded, doctorId, patientId, appointmentId };
}

export async function teardownSeeded(paths: string[], opts: { host?: string; projectId?: string } = {}) {
  const host = opts.host || process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
  const projectId = opts.projectId || process.env.FIRESTORE_PROJECT || 'demo-project';

  for (const p of paths) {
    try {
      await deleteDocument(host, projectId, p);
    } catch (err) {
      console.warn('teardown error', err);
    }
  }
}

export default { seedBookingAppointment, teardownSeeded };
