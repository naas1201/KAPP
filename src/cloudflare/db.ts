/**
 * Cloudflare D1 Database Client
 * 
 * This module provides utilities for working with Cloudflare D1 database.
 * D1 is a serverless SQL database built on SQLite.
 * 
 * @see https://developers.cloudflare.com/d1/
 */

import type { D1Database, D1Result, CloudflareContext } from './types';

/**
 * Get the D1 database instance from the Cloudflare context
 */
export function getDB(context: CloudflareContext): D1Database {
  if (!context?.env?.DB) {
    throw new Error(
      'D1 Database not available. Make sure you have configured the DB binding in wrangler.toml'
    );
  }
  return context.env.DB;
}

/**
 * Execute a single query and return all results
 */
export async function query<T = unknown>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<D1Result<T>> {
  const stmt = db.prepare(sql);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  return bound.all<T>();
}

/**
 * Execute a single query and return the first result
 */
export async function queryOne<T = unknown>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const stmt = db.prepare(sql);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  return bound.first<T>();
}

/**
 * Execute a write operation (INSERT, UPDATE, DELETE)
 */
export async function execute(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<D1Result<unknown>> {
  const stmt = db.prepare(sql);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  return bound.run();
}

/**
 * Execute multiple statements in a batch (transaction)
 */
export async function batch<T = unknown>(
  db: D1Database,
  statements: Array<{ sql: string; params?: unknown[] }>
): Promise<D1Result<T>[]> {
  const preparedStatements = statements.map(({ sql, params }) => {
    const stmt = db.prepare(sql);
    return params && params.length > 0 ? stmt.bind(...params) : stmt;
  });
  return db.batch<T>(preparedStatements);
}

// =============================================================================
// USER OPERATIONS
// =============================================================================

export interface DBUser {
  id: string;
  firebase_uid: string | null;
  email: string;
  email_lower: string;
  role: 'patient' | 'doctor' | 'admin';
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  staff_id: string | null;
  access_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get user by Firebase UID
 */
export async function getUserByFirebaseUid(
  db: D1Database,
  firebaseUid: string
): Promise<DBUser | null> {
  return queryOne<DBUser>(
    db,
    'SELECT * FROM users WHERE firebase_uid = ?',
    [firebaseUid]
  );
}

/**
 * Get user by email
 */
export async function getUserByEmail(
  db: D1Database,
  email: string
): Promise<DBUser | null> {
  return queryOne<DBUser>(
    db,
    'SELECT * FROM users WHERE email_lower = ?',
    [email.toLowerCase()]
  );
}

/**
 * Get user by ID
 */
export async function getUserById(
  db: D1Database,
  id: string
): Promise<DBUser | null> {
  return queryOne<DBUser>(
    db,
    'SELECT * FROM users WHERE id = ?',
    [id]
  );
}

/**
 * Create a new user
 */
export async function createUser(
  db: D1Database,
  user: {
    id: string;
    firebase_uid?: string;
    email: string;
    role?: 'patient' | 'doctor' | 'admin';
    name?: string;
    phone?: string;
  }
): Promise<D1Result<unknown>> {
  return execute(
    db,
    `INSERT INTO users (id, firebase_uid, email, email_lower, role, name, phone, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      user.id,
      user.firebase_uid ?? user.id,
      user.email,
      user.email.toLowerCase(),
      user.role ?? 'patient',
      user.name ?? null,
      user.phone ?? null,
    ]
  );
}

/**
 * Update user role
 */
export async function updateUserRole(
  db: D1Database,
  userId: string,
  role: 'patient' | 'doctor' | 'admin'
): Promise<D1Result<unknown>> {
  return execute(
    db,
    `UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?`,
    [role, userId]
  );
}

// =============================================================================
// APPOINTMENT OPERATIONS
// =============================================================================

export interface DBAppointment {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  treatment_id: string | null;
  date_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  status: 'pending' | 'approved' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rejected';
  patient_notes: string | null;
  doctor_notes: string | null;
  cancellation_reason: string | null;
  price: number | null;
  discount_amount: number | null;
  final_price: number | null;
  payment_status: 'unpaid' | 'pending' | 'paid' | 'refunded' | 'failed';
  payment_method: string | null;
  payment_id: string | null;
  booked_as_guest: boolean;
  guest_email: string | null;
  guest_phone: string | null;
  guest_name: string | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get appointments by patient ID
 */
export async function getAppointmentsByPatient(
  db: D1Database,
  patientId: string,
  limit = 50
): Promise<DBAppointment[]> {
  const result = await query<DBAppointment>(
    db,
    `SELECT * FROM appointments WHERE patient_id = ? ORDER BY date_time DESC LIMIT ?`,
    [patientId, limit]
  );
  return result.results;
}

/**
 * Get appointments by doctor ID
 */
export async function getAppointmentsByDoctor(
  db: D1Database,
  doctorId: string,
  status?: string,
  limit = 50
): Promise<DBAppointment[]> {
  let sql = `SELECT * FROM appointments WHERE doctor_id = ?`;
  const params: unknown[] = [doctorId];
  
  if (status) {
    sql += ` AND status = ?`;
    params.push(status);
  }
  
  sql += ` ORDER BY date_time DESC LIMIT ?`;
  params.push(limit);
  
  const result = await query<DBAppointment>(db, sql, params);
  return result.results;
}

/**
 * Get pending appointments for doctor
 */
export async function getPendingAppointments(
  db: D1Database,
  doctorId: string,
  limit = 50
): Promise<DBAppointment[]> {
  return getAppointmentsByDoctor(db, doctorId, 'pending', limit);
}

/**
 * Create a new appointment
 */
export async function createAppointment(
  db: D1Database,
  appointment: {
    id: string;
    patient_id: string;
    doctor_id?: string;
    treatment_id?: string;
    date_time: string;
    duration_minutes?: number;
    patient_notes?: string;
    price?: number;
    booked_as_guest?: boolean;
    guest_email?: string;
    guest_phone?: string;
    guest_name?: string;
  }
): Promise<D1Result<unknown>> {
  return execute(
    db,
    `INSERT INTO appointments (
      id, patient_id, doctor_id, treatment_id, date_time, duration_minutes,
      patient_notes, price, booked_as_guest, guest_email, guest_phone, guest_name,
      status, payment_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', datetime('now'), datetime('now'))`,
    [
      appointment.id,
      appointment.patient_id,
      appointment.doctor_id ?? null,
      appointment.treatment_id ?? null,
      appointment.date_time,
      appointment.duration_minutes ?? 30,
      appointment.patient_notes ?? null,
      appointment.price ?? null,
      appointment.booked_as_guest ? 1 : 0,
      appointment.guest_email ?? null,
      appointment.guest_phone ?? null,
      appointment.guest_name ?? null,
    ]
  );
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  db: D1Database,
  appointmentId: string,
  status: DBAppointment['status'],
  notes?: string
): Promise<D1Result<unknown>> {
  let sql = `UPDATE appointments SET status = ?, updated_at = datetime('now')`;
  const params: unknown[] = [status];
  
  if (notes) {
    sql += `, doctor_notes = ?`;
    params.push(notes);
  }
  
  sql += ` WHERE id = ?`;
  params.push(appointmentId);
  
  return execute(db, sql, params);
}

// =============================================================================
// TREATMENT OPERATIONS
// =============================================================================

export interface DBTreatment {
  id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  price: number | null;
  duration_minutes: number;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
  requires_consultation: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get all active treatments
 */
export async function getActiveTreatments(
  db: D1Database
): Promise<DBTreatment[]> {
  const result = await query<DBTreatment>(
    db,
    `SELECT * FROM treatments WHERE is_active = 1 ORDER BY sort_order, name`,
    []
  );
  return result.results;
}

/**
 * Get treatment by ID
 */
export async function getTreatmentById(
  db: D1Database,
  id: string
): Promise<DBTreatment | null> {
  return queryOne<DBTreatment>(
    db,
    'SELECT * FROM treatments WHERE id = ?',
    [id]
  );
}

/**
 * Get treatments by category
 */
export async function getTreatmentsByCategory(
  db: D1Database,
  category: string
): Promise<DBTreatment[]> {
  const result = await query<DBTreatment>(
    db,
    `SELECT * FROM treatments WHERE category = ? AND is_active = 1 ORDER BY sort_order, name`,
    [category]
  );
  return result.results;
}

// =============================================================================
// DOCTOR OPERATIONS
// =============================================================================

export interface DBDoctor {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  specialization: string | null;
  license_number: string | null;
  phone: string | null;
  bio: string | null;
  education: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  is_available: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get all available doctors
 */
export async function getAvailableDoctors(
  db: D1Database
): Promise<DBDoctor[]> {
  const result = await query<DBDoctor>(
    db,
    `SELECT * FROM doctors WHERE is_available = 1 ORDER BY last_name, first_name`,
    []
  );
  return result.results;
}

/**
 * Get doctor by user ID
 */
export async function getDoctorByUserId(
  db: D1Database,
  userId: string
): Promise<DBDoctor | null> {
  return queryOne<DBDoctor>(
    db,
    'SELECT * FROM doctors WHERE user_id = ?',
    [userId]
  );
}

// =============================================================================
// PATIENT OPERATIONS
// =============================================================================

export interface DBPatient {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get patient by user ID
 */
export async function getPatientByUserId(
  db: D1Database,
  userId: string
): Promise<DBPatient | null> {
  return queryOne<DBPatient>(
    db,
    'SELECT * FROM patients WHERE user_id = ?',
    [userId]
  );
}

/**
 * Create a new patient record
 */
export async function createPatient(
  db: D1Database,
  patient: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  }
): Promise<D1Result<unknown>> {
  return execute(
    db,
    `INSERT INTO patients (id, user_id, first_name, last_name, phone, date_of_birth, gender, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      patient.id,
      patient.user_id,
      patient.first_name,
      patient.last_name,
      patient.phone ?? null,
      patient.date_of_birth ?? null,
      patient.gender ?? null,
    ]
  );
}
