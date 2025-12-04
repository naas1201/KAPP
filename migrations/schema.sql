-- =============================================================================
-- KAPP Medical Booking Application - D1 Database Schema
-- =============================================================================
-- This schema is designed for Cloudflare D1 (SQLite-based) database.
-- Run this migration in the Cloudflare Dashboard D1 Console or via wrangler CLI.
--
-- Usage via Dashboard:
--   1. Go to Cloudflare Dashboard → Workers & Pages → D1 SQL Database
--   2. Click on your database (kapp-db)
--   3. Go to Console tab
--   4. Copy and paste this entire file
--   5. Click Execute
--
-- Usage via CLI (if wrangler is configured):
--   wrangler d1 execute kapp-db --file=./migrations/schema.sql
-- =============================================================================

-- =============================================================================
-- USERS & AUTHENTICATION
-- =============================================================================

-- Users table (integrates with Firebase Auth)
-- The id field uses Firebase UID for consistency
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    firebase_uid TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    email_lower TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'patient' CHECK(role IN ('patient', 'doctor', 'admin')),
    name TEXT,
    phone TEXT,
    avatar_url TEXT,
    staff_id TEXT,
    access_code TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(email_lower);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_staff_id ON users(staff_id);

CREATE TABLE IF NOT EXISTS pending_staff (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('doctor', 'admin')),
    staff_id TEXT,
    access_code TEXT,
    invited_by TEXT REFERENCES users(id),
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pending_staff_email ON pending_staff(email);

CREATE TABLE IF NOT EXISTS staff_credentials (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('doctor', 'admin')),
    user_id TEXT REFERENCES users(id),
    staff_id TEXT,
    access_code TEXT,
    verified_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK(gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    address TEXT,
    city TEXT,
    postal_code TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_user ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(last_name, first_name);

CREATE TABLE IF NOT EXISTS medical_info (
    id TEXT PRIMARY KEY,
    patient_id TEXT UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
    blood_type TEXT CHECK(blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown')),
    allergies TEXT,
    current_medications TEXT,
    medical_conditions TEXT,
    previous_surgeries TEXT,
    family_history TEXT,
    notes TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medical_info_patient ON medical_info(patient_id);

CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    specialization TEXT,
    license_number TEXT,
    phone TEXT,
    bio TEXT,
    education TEXT,
    experience_years INTEGER,
    consultation_fee DECIMAL(10,2),
    is_available BOOLEAN DEFAULT TRUE,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctors_user ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_available ON doctors(is_available);

CREATE TABLE IF NOT EXISTS treatments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    price DECIMAL(10,2),
    duration_minutes INTEGER DEFAULT 30,
    category TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    requires_consultation BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_treatments_category ON treatments(category);
CREATE INDEX IF NOT EXISTS idx_treatments_active ON treatments(is_active);

CREATE TABLE IF NOT EXISTS doctor_services (
    id TEXT PRIMARY KEY,
    doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    treatment_id TEXT NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
    custom_price DECIMAL(10,2),
    custom_duration INTEGER,
    is_enabled BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, treatment_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_services_doctor ON doctor_services(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_services_treatment ON doctor_services(treatment_id);

CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    doctor_id TEXT REFERENCES doctors(id),
    treatment_id TEXT REFERENCES treatments(id),
    
    date_time DATETIME NOT NULL,
    end_time DATETIME,
    duration_minutes INTEGER,
    
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK(status IN ('pending', 'approved', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rejected')),
    
    patient_notes TEXT,
    doctor_notes TEXT,
    cancellation_reason TEXT,
    
    price DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_price DECIMAL(10,2),
    payment_status TEXT DEFAULT 'unpaid' 
        CHECK(payment_status IN ('unpaid', 'pending', 'paid', 'refunded', 'failed')),
    payment_method TEXT,
    payment_id TEXT,
    
    booked_as_guest BOOLEAN DEFAULT FALSE,
    guest_email TEXT,
    guest_phone TEXT,
    guest_name TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_treatment ON appointments(treatment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date_time);
CREATE INDEX IF NOT EXISTS idx_appointments_payment ON appointments(payment_status);

CREATE TABLE IF NOT EXISTS treatment_records (
    id TEXT PRIMARY KEY,
    appointment_id TEXT REFERENCES appointments(id),
    patient_id TEXT NOT NULL REFERENCES patients(id),
    doctor_id TEXT NOT NULL REFERENCES doctors(id),
    
    diagnosis TEXT,
    treatment_notes TEXT,
    recommendations TEXT,
    
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_treatment_records_patient ON treatment_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_doctor ON treatment_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_appointment ON treatment_records(appointment_id);

CREATE TABLE IF NOT EXISTS prescriptions (
    id TEXT PRIMARY KEY,
    treatment_record_id TEXT REFERENCES treatment_records(id),
    patient_id TEXT NOT NULL REFERENCES patients(id),
    doctor_id TEXT NOT NULL REFERENCES doctors(id),
    
    prescription_number TEXT UNIQUE NOT NULL,
    medication_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    duration TEXT,
    quantity INTEGER,
    instructions TEXT,
    
    issued_date DATE NOT NULL,
    expiry_date DATE,
    
    is_active BOOLEAN DEFAULT TRUE,
    refills_remaining INTEGER DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_number ON prescriptions(prescription_number);

CREATE TABLE IF NOT EXISTS authorized_patients (
    id TEXT PRIMARY KEY,
    doctor_id TEXT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    authorized_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    authorized_by TEXT,
    notes TEXT,
    UNIQUE(doctor_id, patient_id)
);

CREATE INDEX IF NOT EXISTS idx_authorized_patients_doctor ON authorized_patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_authorized_patients_patient ON authorized_patients(patient_id);

CREATE TABLE IF NOT EXISTS chat_rooms (
    id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed', 'archived')),
    subject TEXT,
    last_message_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_participants (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unread_count INTEGER DEFAULT 0,
    last_read_at DATETIME,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_participants_room ON chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id);

CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text', 'image', 'file', 'system')),
    file_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

CREATE TABLE IF NOT EXISTS ratings (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    doctor_id TEXT NOT NULL REFERENCES doctors(id),
    appointment_id TEXT REFERENCES appointments(id),
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ratings_doctor ON ratings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_ratings_patient ON ratings(patient_id);
CREATE INDEX IF NOT EXISTS idx_ratings_appointment ON ratings(appointment_id);

CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    
    path TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    
    entity_type TEXT,
    entity_id TEXT,
    
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_entity ON files(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK(type IN ('info', 'warning', 'urgent', 'maintenance')),
    target_audience TEXT DEFAULT 'all' CHECK(target_audience IN ('all', 'patients', 'doctors', 'staff')),
    is_active BOOLEAN DEFAULT TRUE,
    is_pinned BOOLEAN DEFAULT FALSE,
    start_date DATETIME,
    end_date DATETIME,
    created_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON announcements(start_date, end_date);

CREATE TABLE IF NOT EXISTS faqs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    treatment_id TEXT REFERENCES treatments(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_treatment ON faqs(treatment_id);

CREATE TABLE IF NOT EXISTS discount_codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase DECIMAL(10,2),
    max_discount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    valid_from DATETIME,
    valid_until DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    applicable_treatments TEXT,
    created_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active);

CREATE TABLE IF NOT EXISTS feature_flags (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    config TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT,
    source TEXT,
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'converted', 'closed', 'spam')),
    assigned_to TEXT REFERENCES users(id),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL REFERENCES users(id),
    reported_user_id TEXT REFERENCES users(id),
    reported_entity_type TEXT,
    reported_entity_id TEXT,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    resolution TEXT,
    resolved_by TEXT REFERENCES users(id),
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================
-- Note: SQLite/D1 doesn't support triggers in the same way as other databases
-- You'll need to handle updated_at in your application code or use D1's 
-- native support when available.

-- =============================================================================
-- INITIAL DATA (Optional)
-- =============================================================================
-- Uncomment and modify as needed for initial setup

-- INSERT INTO feature_flags (id, name, description, is_enabled) VALUES
-- ('ff_1', 'ai_faq_generation', 'Enable AI-powered FAQ generation', true),
-- ('ff_2', 'guest_booking', 'Allow booking without account', true),
-- ('ff_3', 'online_payments', 'Enable online payment processing', true);
