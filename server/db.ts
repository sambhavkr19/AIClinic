import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'clinicpilot.sqlite');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = new DatabaseSync(DB_FILE);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clinics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tagline TEXT,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      reg_number TEXT NOT NULL,
      opening_time TEXT NOT NULL DEFAULT '08:30',
      closing_time TEXT NOT NULL DEFAULT '20:30',
      lunch_start TEXT NOT NULL DEFAULT '13:30',
      lunch_end TEXT NOT NULL DEFAULT '16:00',
      working_days TEXT NOT NULL DEFAULT '["Mon","Tue","Wed","Thu","Fri","Sat"]',
      consultation_fee_default REAL NOT NULL DEFAULT 500,
      appointment_buffer_minutes INTEGER NOT NULL DEFAULT 5,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('owner', 'doctor', 'receptionist')),
      specialization TEXT,
      registration_number TEXT,
      qualification TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      name TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 15,
      fee REAL NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      patient_uid TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      dob TEXT,
      age INTEGER,
      gender TEXT NOT NULL CHECK(gender IN ('Male', 'Female', 'Other')),
      blood_group TEXT,
      address TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      emergency_contact_relation TEXT,
      allergies TEXT,
      chronic_conditions TEXT,
      communication_pref TEXT NOT NULL DEFAULT 'WhatsApp' CHECK(communication_pref IN ('WhatsApp', 'SMS', 'Call', 'Email')),
      consent_data_sharing INTEGER NOT NULL DEFAULT 1,
      is_archived INTEGER NOT NULL DEFAULT 0,
      archive_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_clinic_uid ON patients(clinic_id, patient_uid);
    CREATE INDEX IF NOT EXISTS idx_patients_clinic_phone ON patients(clinic_id, phone);
    CREATE INDEX IF NOT EXISTS idx_patients_clinic_name ON patients(clinic_id, name);

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      token_number INTEGER NOT NULL DEFAULT 1,
      appointment_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Booked' CHECK(status IN ('Booked', 'Confirmed', 'Checked In', 'In Consultation', 'Completed', 'Cancelled', 'No-show')),
      type TEXT NOT NULL DEFAULT 'Scheduled' CHECK(type IN ('Scheduled', 'Walk-in')),
      reason TEXT,
      cancellation_reason TEXT,
      reminder_sent INTEGER NOT NULL DEFAULT 0,
      reminder_sent_at TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON appointments(clinic_id, appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);

    CREATE TABLE IF NOT EXISTS consultation_records (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      appointment_id TEXT NOT NULL UNIQUE,
      patient_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      encounter_date TEXT NOT NULL,
      vitals TEXT NOT NULL DEFAULT '{}',
      chief_complaint TEXT NOT NULL,
      history_of_illness TEXT,
      examination_notes TEXT,
      diagnosis TEXT NOT NULL,
      prescriptions TEXT NOT NULL DEFAULT '[]',
      lab_investigations TEXT,
      instructions_lifestyle TEXT,
      follow_up_date TEXT,
      status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft', 'Finalised')),
      finalised_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      invoice_number TEXT NOT NULL,
      appointment_id TEXT,
      patient_id TEXT NOT NULL,
      subtotal REAL NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0,
      discount_reason TEXT,
      discount_authorized_by TEXT,
      tax_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      paid_amount REAL NOT NULL DEFAULT 0,
      balance_due REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Paid', 'Pending', 'Partially Paid', 'Refunded')),
      items TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_clinic_number ON invoices(clinic_id, invoice_number);

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      invoice_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('Cash', 'UPI', 'Card', 'NetBanking')),
      transaction_reference TEXT,
      received_by TEXT NOT NULL,
      payment_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Completed' CHECK(status IN ('Completed', 'Refunded')),
      refund_reason TEXT,
      refunded_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      clinic_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_audit_clinic ON audit_logs(clinic_id, created_at DESC);
  `);

  seedInitialData();
}

export function logAudit(params: {
  clinic_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any> | string;
}) {
  try {
    const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const detailsStr = typeof params.details === 'string' ? params.details : JSON.stringify(params.details);
    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, clinic_id, user_id, user_name, user_role, action, target_type, target_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      params.clinic_id,
      params.user_id,
      params.user_name,
      params.user_role,
      params.action,
      params.target_type,
      params.target_id,
      detailsStr,
      new Date().toISOString()
    );
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
}

function seedInitialData() {
  const existingClinic = db.prepare('SELECT COUNT(*) as count FROM clinics').get() as { count: number };
  if (existingClinic.count > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial multi-clinic demo dataset...');
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('password123', salt);

  // Clinic 1: Arogya Family Health & Polyclinic (Gurugram)
  const c1Id = 'clinic_arogya';
  db.prepare(`
    INSERT INTO clinics (id, name, tagline, address, phone, email, reg_number, opening_time, closing_time, lunch_start, lunch_end, working_days, consultation_fee_default, appointment_buffer_minutes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    c1Id,
    'Arogya Family Health & Polyclinic',
    'Comprehensive Family Care, Pediatrics & Chronic Disease Management',
    'Shop 12-14, Sunrise Galleria, Sector 49, Sohna Road, Gurugram, Haryana - 122018',
    '+91 98112 34567',
    'care@arogyaclinic.in',
    'HR/GGM/CLINIC/2021/4891',
    '08:30',
    '20:30',
    '13:30',
    '16:30',
    JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
    500,
    5,
    now.toISOString()
  );

  // Clinic 2: Sanjeevani Care & Diagnostics (Bengaluru)
  const c2Id = 'clinic_sanjeevani';
  db.prepare(`
    INSERT INTO clinics (id, name, tagline, address, phone, email, reg_number, opening_time, closing_time, lunch_start, lunch_end, working_days, consultation_fee_default, appointment_buffer_minutes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    c2Id,
    'Sanjeevani Care & Diagnostics',
    'Internal Medicine, Diabetes Care & Diagnostic Consultation',
    'Plot 42, 100ft Road, 4th Block, Indiranagar, Bengaluru, Karnataka - 560038',
    '+91 98860 11223',
    'help@sanjeevanicare.in',
    'KA/BLR/MEC/2020/9124',
    '09:00',
    '20:00',
    '13:00',
    '16:00',
    JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
    600,
    10,
    now.toISOString()
  );

  // Users for Clinic 1 (Arogya)
  const u1Owner = 'usr_c1_owner';
  const u1Doc = 'usr_c1_doc';
  const u1Recep = 'usr_c1_recep';

  const userStmt = db.prepare(`
    INSERT INTO users (id, clinic_id, name, email, phone, password_hash, role, specialization, registration_number, qualification, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  userStmt.run(
    u1Owner,
    c1Id,
    'Dr. Rajesh Sharma',
    'rajesh@arogya.in',
    '+91 98112 00001',
    defaultPasswordHash,
    'owner',
    'Internal Medicine & Family Physician',
    'MCI-48291 / DMC-12849',
    'MBBS, MD (Medicine)',
    1,
    now.toISOString()
  );

  userStmt.run(
    u1Doc,
    c1Id,
    'Dr. Priya Sen',
    'priya@arogya.in',
    '+91 98112 00002',
    defaultPasswordHash,
    'doctor',
    'Consultant Pediatrician & Neonatologist',
    'DMC-49201',
    'MBBS, DCH, DNB (Pediatrics)',
    1,
    now.toISOString()
  );

  userStmt.run(
    u1Recep,
    c1Id,
    'Sunita Verma',
    'sunita@arogya.in',
    '+91 98112 00003',
    defaultPasswordHash,
    'receptionist',
    'Clinic Front Desk Lead',
    '',
    'B.Com, Healthcare Administration Dip.',
    1,
    now.toISOString()
  );

  // Users for Clinic 2 (Sanjeevani)
  const u2Owner = 'usr_c2_owner';
  const u2Doc = 'usr_c2_doc';
  const u2Recep = 'usr_c2_recep';

  userStmt.run(
    u2Owner,
    c2Id,
    'Dr. Arvind Nair',
    'arvind@sanjeevani.in',
    '+91 98860 00001',
    defaultPasswordHash,
    'owner',
    'Senior Consultant Diabetologist & General Physician',
    'KMC-38192',
    'MBBS, MD, Fellowship in Diabetology (CMC Vellore)',
    1,
    now.toISOString()
  );

  userStmt.run(
    u2Doc,
    c2Id,
    'Dr. Kavita Rao',
    'kavita@sanjeevani.in',
    '+91 98860 00002',
    defaultPasswordHash,
    'doctor',
    'General Practitioner & Women Health Consultant',
    'KMC-52194',
    'MBBS, DGO',
    1,
    now.toISOString()
  );

  userStmt.run(
    u2Recep,
    c2Id,
    'Rahul Deshmukh',
    'rahul@sanjeevani.in',
    '+91 98860 00003',
    defaultPasswordHash,
    'receptionist',
    'Senior Receptionist & Patient Coordinator',
    '',
    'B.Sc, Hospital Front Office Cert.',
    1,
    now.toISOString()
  );

  // Services for Clinic 1
  const srvStmt = db.prepare(`
    INSERT INTO services (id, clinic_id, name, duration_minutes, fee, description, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  srvStmt.run('srv_c1_gen', c1Id, 'General OPD Consultation', 15, 500, 'Routine consultation with physical vitals check', 1);
  srvStmt.run('srv_c1_fol', c1Id, 'Follow-up Consultation (Within 7 Days)', 10, 250, 'Review of lab reports and medication adjustment', 1);
  srvStmt.run('srv_c1_ped', c1Id, 'Pediatric Health Check & Growth Review', 20, 600, 'Thorough developmental milestone and growth tracking', 1);
  srvStmt.run('srv_c1_vax', c1Id, 'Vaccination & Immunization Administration', 15, 300, 'Administering vaccine plus cold chain management', 1);
  srvStmt.run('srv_c1_ecg', c1Id, '12-Lead ECG with Doctor Interpretation', 15, 450, 'Standard 12-lead diagnostic electrocardiogram', 1);
  srvStmt.run('srv_c1_drss', c1Id, 'Wound Care & Sterile Dressing', 20, 350, 'Minor wound cleaning and antiseptic dressing', 1);

  // Services for Clinic 2
  srvStmt.run('srv_c2_gen', c2Id, 'Comprehensive Medical Consultation', 20, 600, 'Detailed physician assessment', 1);
  srvStmt.run('srv_c2_dm', c2Id, 'Diabetes & Metabolic Review', 30, 800, 'Comprehensive glycemic and lifestyle evaluation', 1);
  srvStmt.run('srv_c2_fol', c2Id, 'Follow-up Visit', 15, 300, 'Progress and blood sugar report review', 1);

  // Seed Patients for Clinic 1
  const patStmt = db.prepare(`
    INSERT INTO patients (id, clinic_id, patient_uid, name, phone, email, dob, age, gender, blood_group, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, allergies, chronic_conditions, communication_pref, consent_data_sharing, is_archived, archive_reason, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  patStmt.run(
    'pat_c1_1',
    c1Id,
    'AFH-2026-00101',
    'Ramesh Chawla',
    '+91 98101 23456',
    'ramesh.chawla@gmail.com',
    '1968-05-14',
    58,
    'Male',
    'B+',
    'H.No. 412, Sector 15, Part 2, Gurugram',
    'Kavita Chawla',
    '+91 98101 23457',
    'Spouse',
    'Sulfa drugs, Penicillin',
    'Type 2 Diabetes Mellitus (HbA1c 7.4%), Essential Hypertension',
    'WhatsApp',
    1,
    0,
    null,
    now.toISOString(),
    now.toISOString()
  );

  patStmt.run(
    'pat_c1_2',
    c1Id,
    'AFH-2026-00102',
    'Ananya Sen (Master Aarav)',
    '+91 98711 54321',
    'ananya.sen@outlook.com',
    '2021-09-10',
    5,
    'Male',
    'O+',
    'Tower 3, Flat 904, Park View Spa, Sector 47, Gurugram',
    'Subhash Sen',
    '+91 98711 54320',
    'Father',
    'None reported',
    'Mild Childhood Bronchial Asthma (Trigger: cold weather)',
    'WhatsApp',
    1,
    0,
    null,
    now.toISOString(),
    now.toISOString()
  );

  patStmt.run(
    'pat_c1_3',
    c1Id,
    'AFH-2026-00103',
    'Vikram Malhotra',
    '+91 98188 99887',
    'v.malhotra@techcorp.in',
    '1989-11-23',
    36,
    'Male',
    'A+',
    'Villa 28, Nirvana Country, Sector 50, Gurugram',
    'Ritu Malhotra',
    '+91 98188 99888',
    'Spouse',
    'NSAIDs (Gastritis trigger)',
    'Dyslipidemia, Work-related Cervical Spondylosis',
    'WhatsApp',
    1,
    0,
    null,
    now.toISOString(),
    now.toISOString()
  );

  patStmt.run(
    'pat_c1_4',
    c1Id,
    'AFH-2026-00104',
    'Sunita Mehra',
    '+91 99100 44332',
    'sunita.mehra@yahoo.co.in',
    '1974-03-19',
    52,
    'Female',
    'AB+',
    'B-104, South City 2, Gurugram',
    'Alok Mehra',
    '+91 99100 44331',
    'Spouse',
    'None',
    'Hypothyroidism on Eltroxin 75mcg',
    'SMS',
    1,
    0,
    null,
    now.toISOString(),
    now.toISOString()
  );

  patStmt.run(
    'pat_c1_5',
    c1Id,
    'AFH-2026-00105',
    'Amitabh Kashyap',
    '+91 98120 77665',
    '',
    '1995-07-08',
    31,
    'Male',
    'O+',
    'D-22, DLF Phase 1, Gurugram',
    'Deepak Kashyap',
    '+91 98120 77660',
    'Brother',
    'Aspirin',
    'None',
    'WhatsApp',
    1,
    0,
    null,
    now.toISOString(),
    now.toISOString()
  );

  // Seed Patients for Clinic 2 (Sanjeevani)
  patStmt.run(
    'pat_c2_1',
    c2Id,
    'SNC-2026-00045',
    'Suresh Hegde',
    '+91 98450 67890',
    'suresh.hegde@rediffmail.com',
    '1962-08-12',
    64,
    'Male',
    'B+',
    '14th Main, HAL 2nd Stage, Indiranagar, Bengaluru',
    'Shailaja Hegde',
    '+91 98450 67891',
    'Spouse',
    'None',
    'Type 2 Diabetes, Diabetic Neuropathy',
    'WhatsApp',
    1,
    0,
    null,
    now.toISOString(),
    now.toISOString()
  );

  // Seed Today's Appointments for Clinic 1 (Arogya)
  const apptStmt = db.prepare(`
    INSERT INTO appointments (id, clinic_id, patient_id, doctor_id, service_id, token_number, appointment_date, start_time, end_time, status, type, reason, cancellation_reason, reminder_sent, reminder_sent_at, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Appointment 1: Completed earlier today
  const appt1Id = 'apt_c1_101';
  apptStmt.run(
    appt1Id,
    c1Id,
    'pat_c1_1',
    u1Owner,
    'srv_c1_gen',
    1,
    todayStr,
    '09:00',
    '09:15',
    'Completed',
    'Scheduled',
    'Routine 3-month diabetes follow-up and BP check',
    null,
    1,
    `${todayStr}T08:00:00Z`,
    u1Recep,
    now.toISOString(),
    now.toISOString()
  );

  // Appointment 2: In Consultation right now
  const appt2Id = 'apt_c1_102';
  apptStmt.run(
    appt2Id,
    c1Id,
    'pat_c1_2',
    u1Doc,
    'srv_c1_ped',
    2,
    todayStr,
    '09:30',
    '09:50',
    'In Consultation',
    'Scheduled',
    'Persistent dry cough for 3 days and low grade fever',
    null,
    1,
    `${todayStr}T08:30:00Z`,
    u1Recep,
    now.toISOString(),
    now.toISOString()
  );

  // Appointment 3: Checked In (Waiting in Queue)
  const appt3Id = 'apt_c1_103';
  apptStmt.run(
    appt3Id,
    c1Id,
    'pat_c1_3',
    u1Owner,
    'srv_c1_gen',
    3,
    todayStr,
    '10:00',
    '10:15',
    'Checked In',
    'Walk-in',
    'Severe acidity, retrosternal burning and headache',
    null,
    1,
    `${todayStr}T09:15:00Z`,
    u1Recep,
    now.toISOString(),
    now.toISOString()
  );

  // Appointment 4: Confirmed (Expected soon)
  const appt4Id = 'apt_c1_104';
  apptStmt.run(
    appt4Id,
    c1Id,
    'pat_c1_4',
    u1Owner,
    'srv_c1_gen',
    4,
    todayStr,
    '11:00',
    '11:15',
    'Confirmed',
    'Scheduled',
    'Thyroid report evaluation and energy fatigue',
    null,
    1,
    `${todayStr}T08:00:00Z`,
    u1Recep,
    now.toISOString(),
    now.toISOString()
  );

  // Appointment 5: Cancelled with reason
  const appt5Id = 'apt_c1_105';
  apptStmt.run(
    appt5Id,
    c1Id,
    'pat_c1_5',
    u1Doc,
    'srv_c1_vax',
    5,
    todayStr,
    '11:30',
    '11:45',
    'Cancelled',
    'Scheduled',
    'Flu vaccination dose',
    'Patient had urgent office meeting out of town; rescheduled for Saturday',
    1,
    `${todayStr}T08:15:00Z`,
    u1Recep,
    now.toISOString(),
    now.toISOString()
  );

  // Seed Consultation Record for Completed Appointment 1 (Doctor Dr. Rajesh Sharma)
  const crStmt = db.prepare(`
    INSERT INTO consultation_records (id, clinic_id, appointment_id, patient_id, doctor_id, encounter_date, vitals, chief_complaint, history_of_illness, examination_notes, diagnosis, prescriptions, lab_investigations, instructions_lifestyle, follow_up_date, status, finalised_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  crStmt.run(
    'cr_c1_101',
    c1Id,
    appt1Id,
    'pat_c1_1',
    u1Owner,
    todayStr,
    JSON.stringify({
      bp: '134/86 mmHg',
      pulse: 76,
      temp: '98.4°F',
      spo2: '98%',
      weight: '74 kg',
      height: '170 cm',
      bmi: '25.6'
    }),
    'Routine 3-month review for Type 2 Diabetes and Hypertension. Patient feels well, occasional mild fatigue.',
    'Known diabetic for 8 years, hypertensive for 5 years. Compliant with morning oral medications. No chest pain, no pedal edema.',
    'CVS: S1 S2 normal. RS: Bilateral air entry clear. Abdomen: Soft, non-tender. Feet: Monofilament test normal, peripheral pulses palpable.',
    'Type 2 Diabetes Mellitus - Moderately Controlled; Essential Hypertension - Stage 1',
    JSON.stringify([
      {
        id: 'rx_1',
        medicine: 'Tab. Glycomet GP 1 (Metformin 500mg + Glimepiride 1mg)',
        dosage: '1 Tablet',
        frequency: '1-0-0 (Once daily)',
        duration: '30 days',
        timing: 'Before breakfast',
        instructions: 'Do not skip breakfast after taking'
      },
      {
        id: 'rx_2',
        medicine: 'Tab. Telma 40 (Telmisartan 40mg)',
        dosage: '1 Tablet',
        frequency: '1-0-0 (Morning)',
        duration: '30 days',
        timing: 'After breakfast',
        instructions: 'Monitor morning BP weekly'
      },
      {
        id: 'rx_3',
        medicine: 'Tab. Neurobion Forte',
        dosage: '1 Tablet',
        frequency: '0-0-1 (Night)',
        duration: '30 days',
        timing: 'After dinner',
        instructions: 'Vitamin supplement for peripheral nerve health'
      }
    ]),
    'Fasting Blood Sugar (FBS), Postprandial Blood Sugar (PPBS), HbA1c, Serum Creatinine in 3 weeks',
    '30 minutes brisk morning walk 5 days a week. Avoid refined sugar and bakery goods. Foot hygiene care.',
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    'Finalised',
    now.toISOString(),
    now.toISOString(),
    now.toISOString()
  );

  // Seed Draft Consultation Record for Appointment 2 (Dr. Priya Sen)
  crStmt.run(
    'cr_c1_102',
    c1Id,
    appt2Id,
    'pat_c1_2',
    u1Doc,
    todayStr,
    JSON.stringify({
      bp: '100/65 mmHg',
      pulse: 98,
      temp: '100.2°F',
      spo2: '99%',
      weight: '18 kg',
      height: '108 cm',
      bmi: '15.4'
    }),
    'Master Aarav brought by mother with complaints of dry cough for 3 days, low grade fever spike today morning.',
    'No vomiting, active between cough episodes. Throat irritation present.',
    'Pharynx congested, tonsils grade 1 enlargement without pus flakes. Chest: Bilateral rhonchi absent, vesicular breathing.',
    'Acute Viral Upper Respiratory Infection (URTI) with mild pharyngitis',
    JSON.stringify([
      {
        id: 'rx_p1',
        medicine: 'Syp. Calpol 250 (Paracetamol 250mg/5ml)',
        dosage: '5 ml',
        frequency: 'As needed (max 3 times/day)',
        duration: '3 days',
        timing: 'After food',
        instructions: 'Give only if temperature exceeds 99.5°F'
      },
      {
        id: 'rx_p2',
        medicine: 'Syp. Ascoril LS Junior',
        dosage: '2.5 ml',
        frequency: '1-0-1 (Twice daily)',
        duration: '4 days',
        timing: 'After food',
        instructions: 'Shake well before use'
      }
    ]),
    'None required at present. If fever persists past 72h, review for CBC.',
    'Lukewarm water sips. Saline nasal drops 2 drops each nostril before sleep.',
    new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    'Draft',
    null,
    now.toISOString(),
    now.toISOString()
  );

  // Invoices for Clinic 1
  const invStmt = db.prepare(`
    INSERT INTO invoices (id, clinic_id, invoice_number, appointment_id, patient_id, subtotal, discount_amount, discount_reason, discount_authorized_by, tax_amount, total_amount, paid_amount, balance_due, status, items, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const payStmt = db.prepare(`
    INSERT INTO payments (id, clinic_id, invoice_id, amount, payment_method, transaction_reference, received_by, payment_date, status, refund_reason, refunded_at, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Invoice 1: Paid via UPI (GPay)
  const inv1Id = 'inv_c1_001';
  invStmt.run(
    inv1Id,
    c1Id,
    'INV-2026-0041',
    appt1Id,
    'pat_c1_1',
    500,
    0,
    null,
    null,
    0,
    500,
    500,
    0,
    'Paid',
    JSON.stringify([
      { id: 'i1', description: 'General OPD Consultation - Dr. Rajesh Sharma', qty: 1, unit_price: 500, amount: 500 }
    ]),
    'Routine consult',
    now.toISOString(),
    now.toISOString()
  );

  payStmt.run(
    'pay_c1_001',
    c1Id,
    inv1Id,
    500,
    'UPI',
    'UPI-UTR-981244018231',
    u1Recep,
    todayStr,
    'Completed',
    null,
    null,
    'GPay UPI payment verified at reception',
    now.toISOString()
  );

  // Invoice 2: Pediatric Visit + Dressing - Partially Paid / Pending Balance
  const inv2Id = 'inv_c1_002';
  invStmt.run(
    inv2Id,
    c1Id,
    'INV-2026-0042',
    appt2Id,
    'pat_c1_2',
    950,
    50,
    'Senior Citizen / Family Loyalty Discount authorized by Clinic Owner',
    u1Owner,
    0,
    900,
    500,
    400,
    'Partially Paid',
    JSON.stringify([
      { id: 'i2_1', description: 'Pediatric Health Check - Dr. Priya Sen', qty: 1, unit_price: 600, amount: 600 },
      { id: 'i2_2', description: 'Wound Care & Sterile Dressing', qty: 1, unit_price: 350, amount: 350 }
    ]),
    'Balance Rs 400 to be cleared on next visit',
    now.toISOString(),
    now.toISOString()
  );

  payStmt.run(
    'pay_c1_002',
    c1Id,
    inv2Id,
    500,
    'Cash',
    'CASH-REC-0082',
    u1Recep,
    todayStr,
    'Completed',
    null,
    null,
    'Cash received at front desk',
    now.toISOString()
  );

  // Log some initial audit events
  logAudit({
    clinic_id: c1Id,
    user_id: u1Owner,
    user_name: 'Dr. Rajesh Sharma',
    user_role: 'owner',
    action: 'INIT_CLINIC_SETUP',
    target_type: 'clinic',
    target_id: c1Id,
    details: { message: 'Clinic operational hours and services configured' }
  });

  logAudit({
    clinic_id: c1Id,
    user_id: u1Recep,
    user_name: 'Sunita Verma',
    user_role: 'receptionist',
    action: 'REGISTER_PATIENT',
    target_type: 'patient',
    target_id: 'pat_c1_1',
    details: { patient_uid: 'AFH-2026-00101', name: 'Ramesh Chawla' }
  });

  logAudit({
    clinic_id: c1Id,
    user_id: u1Owner,
    user_name: 'Dr. Rajesh Sharma',
    user_role: 'owner',
    action: 'FINALIZE_PRESCRIPTION',
    target_type: 'consultation_record',
    target_id: 'cr_c1_101',
    details: { patient_id: 'pat_c1_1', diagnosis: 'Type 2 Diabetes Mellitus' }
  });

  logAudit({
    clinic_id: c1Id,
    user_id: u1Recep,
    user_name: 'Sunita Verma',
    user_role: 'receptionist',
    action: 'RECEIVE_PAYMENT',
    target_type: 'payment',
    target_id: 'pay_c1_001',
    details: { amount: 500, method: 'UPI', utr: 'UPI-UTR-981244018231' }
  });

  console.log('Database seeded successfully with 2 clinics, doctors, receptionists, patients, and financial records.');
}
