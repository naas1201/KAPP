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
  const projectId = opts.projectId || process.env.FIRESTORE_PROJECT || 'demo-project';
  const doctorId = opts.doctorId || 'doctor-test';
  const patientId = opts.patientId || 'patient-test';
  const appointmentId = opts.appointmentId || `apt-${Date.now()}`;
  const serviceType = opts.serviceType || 'General Consultation';
  const dateTime = opts.dateTime || new Date(Date.now() + 1000 * 60 * 60).toISOString();

  const seeded: string[] = [];

  // create doctor
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
