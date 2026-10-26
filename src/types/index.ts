export type UserRole = 'owner' | 'doctor' | 'receptionist';

export interface User {
  id: string;
  clinic_id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  specialization?: string;
  registration_number?: string;
  qualification?: string;
  is_active: number;
  created_at: string;
}

export interface Clinic {
  id: string;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  reg_number: string;
  opening_time: string;
  closing_time: string;
  lunch_start: string;
  lunch_end: string;
  working_days: string[];
  consultation_fee_default: number;
  appointment_buffer_minutes: number;
  created_at: string;
}

export interface Service {
  id: string;
  clinic_id: string;
  name: string;
  duration_minutes: number;
  fee: number;
  description: string;
  is_active: number;
}

export interface Patient {
  id: string;
  clinic_id: string;
  patient_uid: string;
  name: string;
  phone: string;
  email?: string;
  dob?: string;
  age?: number;
  gender: 'Male' | 'Female' | 'Other';
  blood_group?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  allergies?: string;
  chronic_conditions?: string;
  communication_pref: 'WhatsApp' | 'SMS' | 'Call' | 'Email';
  consent_data_sharing: number;
  is_archived: number;
  archive_reason?: string;
  created_at: string;
  updated_at: string;
}

export type AppointmentStatus =
  | 'Booked'
  | 'Confirmed'
  | 'Checked In'
  | 'In Consultation'
  | 'Completed'
  | 'Cancelled'
  | 'No-show';

export type AppointmentType = 'Scheduled' | 'Walk-in';

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  service_id: string;
  token_number: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  type: AppointmentType;
  reason?: string;
  cancellation_reason?: string;
  reminder_sent: number;
  reminder_sent_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  patient_name?: string;
  patient_phone?: string;
  patient_uid?: string;
  patient_gender?: string;
  patient_age?: number;
  doctor_name?: string;
  doctor_specialization?: string;
  service_name?: string;
  service_fee?: number;
}

export interface Vitals {
  bp?: string; // e.g. "120/80"
  pulse?: number; // e.g. 74
  temp?: string; // e.g. "98.6"
  spo2?: string; // e.g. "98"
  weight?: string; // e.g. "68"
  height?: string; // e.g. "172"
  bmi?: string; // e.g. "23.0"
}

export interface PrescriptionItem {
  id: string;
  medicine: string;
  dosage: string;
  frequency: string; // e.g. "1-0-1" or "Once daily"
  duration: string; // e.g. "5 days"
  timing: string; // e.g. "After food"
  instructions?: string;
}

export interface ConsultationRecord {
  id: string;
  clinic_id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  encounter_date: string;
  vitals: Vitals;
  chief_complaint: string;
  history_of_illness?: string;
  examination_notes?: string;
  diagnosis: string;
  prescriptions: PrescriptionItem[];
  lab_investigations?: string;
  instructions_lifestyle?: string;
  follow_up_date?: string;
  status: 'Draft' | 'Finalised';
  finalised_at?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  doctor_name?: string;
  doctor_qualification?: string;
  doctor_registration_number?: string;
  patient_name?: string;
  patient_uid?: string;
  patient_age?: number;
  patient_gender?: string;
}

export type PaymentStatus = 'Paid' | 'Pending' | 'Partially Paid' | 'Refunded';
export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'NetBanking';

export interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  unit_price: number;
  amount: number;
}

export interface Invoice {
  id: string;
  clinic_id: string;
  invoice_number: string;
  appointment_id?: string;
  patient_id: string;
  subtotal: number;
  discount_amount: number;
  discount_reason?: string;
  discount_authorized_by?: string;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  status: PaymentStatus;
  items: InvoiceItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  patient_name?: string;
  patient_phone?: string;
  patient_uid?: string;
}

export interface Payment {
  id: string;
  clinic_id: string;
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_reference?: string;
  received_by: string;
  payment_date: string;
  status: 'Completed' | 'Refunded';
  refund_reason?: string;
  refunded_at?: string;
  notes?: string;
  created_at: string;
  // Joined fields
  received_by_name?: string;
  invoice_number?: string;
  patient_name?: string;
}

export interface AuditLog {
  id: string;
  clinic_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  created_at: string;
}

export interface DashboardStats {
  today_appointments_count: number;
  waiting_queue_count: number;
  in_consultation_count: number;
  completed_today_count: number;
  cancelled_today_count: number;
  no_show_today_count: number;
  today_collection_revenue: number;
  outstanding_balance_total: number;
  new_patients_today: number;
  follow_ups_due_today: number;
  payment_breakdown: {
    cash: number;
    upi: number;
    card: number;
    netbanking: number;
  };
}
