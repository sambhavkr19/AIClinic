import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Patient, Appointment, Invoice, ConsultationRecord } from '../../types/index.js';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  IndianRupee,
  Lock,
  Archive,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  HeartPulse,
  Edit2
} from 'lucide-react';

export const PatientsView: React.FC = () => {
  const { user, clinic } = useAuth();
  const isDoctorOrOwner = user?.role === 'doctor' || user?.role === 'owner';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [includeArchived, setIncludeArchived] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Patient Detail Modal / Drawer
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientDetail, setPatientDetail] = useState<{
    patient: Patient;
    appointments: Appointment[];
    invoices: Invoice[];
    clinical_records: ConsultationRecord[];
  } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [regForm, setRegForm] = useState({
    name: '',
    phone: '',
    email: '',
    dob: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    blood_group: 'B+',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    allergies: '',
    chronic_conditions: '',
    communication_pref: 'WhatsApp' as 'WhatsApp' | 'SMS' | 'Call' | 'Email',
    consent_data_sharing: true
  });
  const [regError, setRegError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);

  // Archive Modal State
  const [archivePatientTarget, setArchivePatientTarget] = useState<Patient | null>(null);
  const [archiveReason, setArchiveReason] = useState<string>('');

  const fetchPatients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getPatients({
        search: searchQuery || undefined,
        include_archived: includeArchived
      });
      setPatients(res.patients);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch patients.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [searchQuery, includeArchived, clinic?.id]);

  const handleSelectPatient = async (id: string) => {
    setSelectedPatientId(id);
    setIsLoadingDetail(true);
    try {
      const res = await api.getPatientById(id);
      setPatientDetail(res);
    } catch (err: any) {
      alert(`Failed to load patient profile: ${err.message}`);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent, force = false) => {
    e.preventDefault();
    setRegError(null);
    setDuplicateWarning(null);

    try {
      await api.createPatient(
        {
          ...regForm,
          age: regForm.age ? Number(regForm.age) : undefined,
          consent_data_sharing: regForm.consent_data_sharing ? 1 : 0
        },
        force
      );

      setShowRegisterModal(false);
      resetRegForm();
      fetchPatients();
    } catch (err: any) {
      if (err.message.includes('Duplicate patient detected')) {
        setDuplicateWarning({
          message: err.message,
          phone: regForm.phone
        });
      } else {
        setRegError(err.message || 'Registration failed.');
      }
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archivePatientTarget || !archiveReason.trim()) return;
    try {
      await api.archivePatient(archivePatientTarget.id, archiveReason.trim());
      setArchivePatientTarget(null);
      setArchiveReason('');
      if (selectedPatientId === archivePatientTarget.id) {
        setSelectedPatientId(null);
        setPatientDetail(null);
      }
      fetchPatients();
    } catch (err: any) {
      alert(`Archive action failed: ${err.message}`);
    }
  };

  const resetRegForm = () => {
    setRegForm({
      name: '',
      phone: '',
      email: '',
      dob: '',
      age: '',
      gender: 'Male',
      blood_group: 'B+',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relation: '',
      allergies: '',
      chronic_conditions: '',
      communication_pref: 'WhatsApp',
      consent_data_sharing: true
    });
    setRegError(null);
    setDuplicateWarning(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Registration CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Patient Directory & Records</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict tenant isolation • Access controls on private clinical data • Retention compliant
          </p>
        </div>

        <button
          onClick={() => {
            resetRegForm();
            setShowRegisterModal(true);
          }}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Register New Patient
        </button>
      </div>

      {/* Search & Retention Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Patient Name, Mobile (+91...), or UID (e.g. AFH-2026-00101)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={e => setIncludeArchived(e.target.checked)}
            className="rounded text-teal-600 focus:ring-teal-500"
          />
          <span>Show archived / retention records</span>
        </label>
      </div>

      {/* Patient Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading patient records...</div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-800">No patient records found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or register a new patient.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Patient UID</th>
                  <th className="py-3 px-4">Name & Demographics</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Allergies / Conditions</th>
                  <th className="py-3 px-4">Comms Channel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => handleSelectPatient(p.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    {/* UID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-900">
                      <span className="px-2 py-0.5 rounded bg-teal-50 border border-teal-200">
                        {p.patient_uid}
                      </span>
                    </td>

                    {/* Name & Age */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.age ? `${p.age} yrs` : 'Age N/A'} • {p.gender} {p.blood_group ? `• ${p.blood_group}` : ''}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      <div>{p.phone}</div>
                      {p.email && <div className="text-[10px] text-slate-400 font-sans">{p.email}</div>}
                    </td>

                    {/* Allergies / Medical */}
                    <td className="py-3.5 px-4">
                      {p.allergies ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <AlertTriangle className="w-3 h-3" /> {p.allergies}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">None declared</span>
                      )}
                    </td>

                    {/* Comms */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {p.communication_pref}
                      </span>
                    </td>

                    {/* Archive status */}
                    <td className="py-3.5 px-4">
                      {p.is_archived === 1 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Archived
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPatient(p.id);
                        }}
                        className="px-2.5 py-1 text-teal-700 hover:bg-teal-50 rounded font-semibold text-xs inline-flex items-center gap-1"
                      >
                        Profile <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PATIENT DETAIL MODAL / PROFILE DRAWER */}
      {selectedPatientId && patientDetail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg font-mono">
                  {patientDetail.patient.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{patientDetail.patient.name}</h3>
                    <span className="text-xs font-mono font-bold text-teal-800 px-2 py-0.5 bg-teal-50 border border-teal-200 rounded">
                      {patientDetail.patient.patient_uid}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {patientDetail.patient.gender} • {patientDetail.patient.age ? `${patientDetail.patient.age} yrs` : 'DOB N/A'} • Blood: {patientDetail.patient.blood_group || 'Unknown'} • Phone: {patientDetail.patient.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {patientDetail.patient.is_archived === 0 && (
                  <button
                    onClick={() => setArchivePatientTarget(patientDetail.patient)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5 inline mr-1" />
                    Archive
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedPatientId(null);
                    setPatientDetail(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Medical Alert Banner if Allergies / Conditions */}
            {(patientDetail.patient.allergies || patientDetail.patient.chronic_conditions) && (
              <div className="my-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-rose-800 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Clinical Medical Alerts</span>
                </div>
                {patientDetail.patient.allergies && (
                  <p className="text-rose-900">
                    <span className="font-semibold">Known Drug Allergies:</span> {patientDetail.patient.allergies}
                  </p>
                )}
                {patientDetail.patient.chronic_conditions && (
                  <p className="text-rose-900 mt-0.5">
                    <span className="font-semibold">Chronic Conditions:</span> {patientDetail.patient.chronic_conditions}
                  </p>
                )}
              </div>
            )}

            {/* Contact & Emergency info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <p className="font-bold text-slate-700">Residential Address:</p>
                <p className="text-slate-600 mt-0.5">{patientDetail.patient.address || 'Not specified'}</p>
                <p className="font-bold text-slate-700 mt-2">Communication Channel:</p>
                <p className="text-slate-600">{patientDetail.patient.communication_pref} (Consent: {patientDetail.patient.consent_data_sharing ? 'Yes' : 'No'})</p>
              </div>
              <div>
                <p className="font-bold text-slate-700">Emergency Contact:</p>
                <p className="text-slate-600 mt-0.5">
                  {patientDetail.patient.emergency_contact_name || 'N/A'}{' '}
                  {patientDetail.patient.emergency_contact_relation ? `(${patientDetail.patient.emergency_contact_relation})` : ''}
                </p>
                {patientDetail.patient.emergency_contact_phone && (
                  <p className="text-slate-600 font-mono mt-0.5">{patientDetail.patient.emergency_contact_phone}</p>
                )}
              </div>
            </div>

            {/* SECTION 1: APPOINTMENT HISTORY */}
            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>Appointment Encounters ({patientDetail.appointments.length})</span>
              </h4>
              {patientDetail.appointments.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 bg-slate-50 rounded-lg text-center">No past encounters.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {patientDetail.appointments.map(a => (
                    <div key={a.id} className="p-2.5 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800">{a.appointment_date}</span> at <span className="font-mono">{a.start_time}</span>
                        <p className="text-[11px] text-slate-500">Dr. {a.doctor_name} • {a.service_name}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 2: CLINICAL RECORDS (ROLE GATED: DOCTOR / OWNER ONLY) */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                  <span>Protected Clinical Records & Prescriptions</span>
                </h4>
                {!isDoctorOrOwner && (
                  <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Doctor-only access
                  </span>
                )}
              </div>

              {!isDoctorOrOwner ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">Confidential Medical Record Boundary</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      In accordance with clinical privacy standards, private physician examination notes, diagnosis, and prescription details are restricted to consulting doctors and clinic administrators.
                    </p>
                  </div>
                </div>
              ) : patientDetail.clinical_records.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 bg-slate-50 rounded-lg text-center">
                  No clinical notes recorded yet for this patient.
                </p>
              ) : (
                <div className="space-y-3">
                  {patientDetail.clinical_records.map(cr => (
                    <div key={cr.id} className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/30 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-teal-950">
                          Encounter Date: {cr.encounter_date}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cr.status === 'Finalised' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {cr.status} {cr.status === 'Finalised' && '✓ Signed'}
                        </span>
                      </div>

                      <p className="text-slate-800">
                        <span className="font-semibold">Doctor:</span> {cr.doctor_name} ({cr.doctor_qualification})
                      </p>

                      <p className="text-slate-900 font-medium">
                        <span className="font-semibold text-slate-700">Diagnosis:</span> {cr.diagnosis}
                      </p>

                      {cr.chief_complaint && (
                        <p className="text-slate-700 text-[11px]">
                          <span className="font-semibold">Chief Complaint:</span> {cr.chief_complaint}
                        </p>
                      )}

                      {/* Prescriptions */}
                      {cr.prescriptions && cr.prescriptions.length > 0 && (
                        <div className="pt-2 border-t border-teal-100">
                          <p className="font-bold text-teal-900 mb-1">Prescribed Medicines ({cr.prescriptions.length}):</p>
                          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-800">
                            {cr.prescriptions.map((rx: any, idx: number) => (
                              <li key={idx}>
                                <span className="font-semibold">{rx.medicine}</span> — {rx.dosage} • {rx.frequency} • {rx.duration} ({rx.timing})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 3: BILLING & INVOICES */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                <span>Invoices & Payments ({patientDetail.invoices.length})</span>
              </h4>
              {patientDetail.invoices.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 bg-slate-50 rounded-lg text-center">No invoices issued.</p>
              ) : (
                <div className="space-y-2">
                  {patientDetail.invoices.map(inv => (
                    <div key={inv.id} className="p-2.5 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-mono font-bold text-slate-800">{inv.invoice_number}</span>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Total: ₹{inv.total_amount} • Paid: ₹{inv.paid_amount} • Due: ₹{inv.balance_due}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {inv.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REGISTRATION MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">New Patient Registration</h3>
                <p className="text-xs text-slate-500">Auto-generates unique UID & checks for duplicate contacts</p>
              </div>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {duplicateWarning && (
              <div className="p-3 mb-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Duplicate Phone Warning</span>
                </div>
                <p className="mt-1">
                  A patient with phone number <strong>{duplicateWarning.phone}</strong> is already registered. If this is a family member sharing the same phone, you can proceed by clicking "Force Register".
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleRegisterSubmit(e, true)}
                    className="px-3 py-1 bg-amber-600 text-white rounded-md font-semibold text-xs"
                  >
                    Force Register (Same Phone Family Member)
                  </button>
                </div>
              </div>
            )}

            {regError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {regError}
              </div>
            )}

            <form onSubmit={(e) => handleRegisterSubmit(e, false)} className="space-y-3.5 text-xs">
              {/* Full Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chawla"
                    value={regForm.name}
                    onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98101 23456"
                    value={regForm.phone}
                    onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Age / DOB & Gender & Blood Group */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    value={regForm.age}
                    onChange={e => setRegForm({ ...regForm, age: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={regForm.gender}
                    onChange={e => setRegForm({ ...regForm, gender: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={regForm.blood_group}
                    onChange={e => setRegForm({ ...regForm, blood_group: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              {/* Email & Residential Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="patient@gmail.com"
                    value={regForm.email}
                    onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preferred Communication</label>
                  <select
                    value={regForm.communication_pref}
                    onChange={e => setRegForm({ ...regForm, communication_pref: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="WhatsApp">WhatsApp (Preferred)</option>
                    <option value="SMS">SMS</option>
                    <option value="Call">Phone Call</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="House/Flat No, Society/Locality, City"
                  value={regForm.address}
                  onChange={e => setRegForm({ ...regForm, address: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Emergency Contact */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-slate-800">Emergency Contact (Optional)</p>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={regForm.emergency_contact_name}
                    onChange={e => setRegForm({ ...regForm, emergency_contact_name: e.target.value })}
                    className="border border-slate-300 rounded p-1.5 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Relation (e.g. Spouse)"
                    value={regForm.emergency_contact_relation}
                    onChange={e => setRegForm({ ...regForm, emergency_contact_relation: e.target.value })}
                    className="border border-slate-300 rounded p-1.5 focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={regForm.emergency_contact_phone}
                    onChange={e => setRegForm({ ...regForm, emergency_contact_phone: e.target.value })}
                    className="border border-slate-300 rounded p-1.5 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Known Allergies & Conditions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-rose-800 mb-1">Known Drug Allergies</label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Sulfa drugs"
                    value={regForm.allergies}
                    onChange={e => setRegForm({ ...regForm, allergies: e.target.value })}
                    className="w-full border border-rose-200 bg-rose-50/40 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chronic Conditions</label>
                  <input
                    type="text"
                    placeholder="e.g. Type 2 DM, Hypertension"
                    value={regForm.chronic_conditions}
                    onChange={e => setRegForm({ ...regForm, chronic_conditions: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Consent Checkbox */}
              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={regForm.consent_data_sharing}
                  onChange={e => setRegForm({ ...regForm, consent_data_sharing: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 mt-0.5"
                />
                <span className="text-slate-600 text-[11px]">
                  Patient consents to clinic record maintenance and receiving appointment updates via {regForm.communication_pref}.
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold shadow-xs"
                >
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARCHIVE CONFIRMATION MODAL */}
      {archivePatientTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Archive Patient Record</h3>
            <p className="text-xs text-slate-500 mb-4">
              Patient: {archivePatientTarget.name} ({archivePatientTarget.patient_uid})
            </p>

            <div className="space-y-3 text-xs">
              <label className="block font-semibold text-slate-700">Reason for Retention / Archival *</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Patient moved to another city, requested data retention under clinical retention policy..."
                value={archiveReason}
                onChange={e => setArchiveReason(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setArchivePatientTarget(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleArchiveConfirm}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold"
                >
                  Confirm Archival
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
