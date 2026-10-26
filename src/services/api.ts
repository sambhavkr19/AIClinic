import {
  User,
  Clinic,
  Service,
  Patient,
  Appointment,
  AppointmentStatus,
  ConsultationRecord,
  Invoice,
  Payment,
  DashboardStats,
  AuditLog
} from '../types/index.js';

const TOKEN_KEY = 'clinicpilot_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: User; clinic: Clinic }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  registerClinic: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    clinic_name: string;
    address?: string;
    specialization?: string;
    registration_number?: string;
  }) =>
    request<{ token: string; user: User; clinic: Clinic }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  switchDemo: (email: string) =>
    request<{ token: string; user: User; clinic: Clinic }>('/auth/switch-demo', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  getDemoAccounts: () =>
    request<{ demo_accounts: Array<{ id: string; clinic_id: string; name: string; email: string; role: string; specialization?: string; clinic_name: string }> }>(
      '/auth/demo-accounts'
    ),

  getMe: () => request<{ user: User; clinic: Clinic }>('/auth/me'),

  // Clinic
  getCurrentClinic: () => request<{ clinic: Clinic }>('/clinics/current'),
  updateClinic: (data: Partial<Clinic>) =>
    request<{ clinic: Clinic }>('/clinics/current', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Staff
  getStaff: () => request<{ staff: User[] }>('/staff'),
  createStaff: (data: any) =>
    request<{ message: string; id: string }>('/staff', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  toggleStaffStatus: (id: string, is_active: boolean) =>
    request<{ message: string }>(`/staff/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active })
    }),

  // Services
  getServices: () => request<{ services: Service[] }>('/services'),
  createService: (data: any) =>
    request<{ message: string; id: string }>('/services', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Patients
  getPatients: (params?: { search?: string; include_archived?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.append('search', params.search);
    if (params?.include_archived) qs.append('include_archived', 'true');
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ patients: Patient[] }>(`/patients${query}`);
  },
  getPatientById: (id: string) =>
    request<{
      patient: Patient;
      appointments: Appointment[];
      invoices: Invoice[];
      clinical_records: ConsultationRecord[];
    }>(`/patients/${id}`),
  createPatient: (data: Partial<Patient>, forceCreate = false) =>
    request<{ patient: Patient }>(`/patients${forceCreate ? '?force_create=true' : ''}`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updatePatient: (id: string, data: Partial<Patient>) =>
    request<{ patient: Patient }>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  archivePatient: (id: string, reason: string) =>
    request<{ message: string }>(`/patients/${id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),

  // Appointments
  getAppointments: (params?: { date?: string; doctor_id?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.date) qs.append('date', params.date);
    if (params?.doctor_id) qs.append('doctor_id', params.doctor_id);
    if (params?.status) qs.append('status', params.status);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ appointments: Appointment[] }>(`/appointments${query}`);
  },
  createAppointment: (data: {
    patient_id: string;
    doctor_id: string;
    service_id: string;
    appointment_date: string;
    start_time: string;
    type?: string;
    reason?: string;
    allow_override?: boolean;
  }) =>
    request<{ appointment: Appointment }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateAppointmentStatus: (id: string, status: AppointmentStatus, cancellation_reason?: string) =>
    request<{ message: string; status: string }>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, cancellation_reason })
    }),
  sendAppointmentReminder: (id: string) =>
    request<{ message: string; reminder_text: string; patient_phone: string }>(
      `/appointments/${id}/send-reminder`,
      { method: 'POST' }
    ),

  // Clinical Records (Doctor / Owner only)
  getClinicalRecord: (appointmentId: string) =>
    request<{ record: ConsultationRecord }>(`/clinical-records/appointment/${appointmentId}`),
  saveClinicalRecord: (data: Partial<ConsultationRecord>) =>
    request<{ message: string; id: string; status: 'Draft' | 'Finalised' }>('/clinical-records', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Billing
  getInvoices: () => request<{ invoices: Invoice[] }>('/billing/invoices'),
  createInvoice: (data: {
    appointment_id?: string;
    patient_id: string;
    items: Array<{ description: string; qty: number; unit_price: number; amount: number }>;
    discount_amount?: number;
    discount_reason?: string;
    tax_amount?: number;
    notes?: string;
  }) =>
    request<{ invoice: Invoice }>('/billing/invoices', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  recordPayment: (
    invoiceId: string,
    data: {
      amount: number;
      payment_method: string;
      transaction_reference?: string;
      notes?: string;
    }
  ) =>
    request<{ message: string; payment_id: string; new_balance_due: number; status: string }>(
      `/billing/invoices/${invoiceId}/payments`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    ),
  refundPayment: (paymentId: string, reason: string) =>
    request<{ message: string }>(`/billing/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),
  getDailySummary: () =>
    request<{
      date: string;
      total_collected: number;
      cash_total: number;
      upi_total: number;
      card_total: number;
      netbanking_total: number;
      total_outstanding: number;
    }>('/billing/daily-summary'),

  // Dashboard
  getDashboard: () =>
    request<{
      stats: DashboardStats;
      recent_activity: AuditLog[];
    }>('/dashboard'),

  // Audit Logs
  getAuditLogs: () => request<{ logs: AuditLog[] }>('/audit-logs'),

  // AI Assistant
  askAssistant: (data: {
    action: 'clinic_faq' | 'patient_message' | 'admin_summary' | 'visit_summary_explainer';
    prompt: string;
    additionalData?: Record<string, any>;
  }) =>
    request<{ response: string; disclaimer: string }>('/ai/assistant', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // System Health & Automated Verification Suite
  runHealthTests: () =>
    request<{
      status: string;
      clinic_id: string;
      timestamp: string;
      tests: Array<{ name: string; description: string; passed: boolean; details: string }>;
    }>('/health-and-tests')
};
