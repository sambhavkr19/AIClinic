import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Appointment, ConsultationRecord, PrescriptionItem, Vitals } from '../../types/index.js';
import {
  Stethoscope,
  Activity,
  Heart,
  FileCheck,
  Printer,
  Sparkles,
  Calendar,
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  Lock,
  Save,
  CheckCircle2,
  ShieldCheck,
  User,
  ArrowRight
} from 'lucide-react';

interface DoctorWorkspaceViewProps {
  initialAppointmentId?: string;
}

export const DoctorWorkspaceView: React.FC<DoctorWorkspaceViewProps> = ({
  initialAppointmentId
}) => {
  const { user, clinic } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [clinicalRecord, setClinicalRecord] = useState<ConsultationRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Form Fields
  const [vitals, setVitals] = useState<Vitals>({
    bp: '120/80',
    pulse: 72,
    temp: '98.6',
    spo2: '99',
    weight: '68',
    height: '172',
    bmi: '23.0'
  });
  const [chiefComplaint, setChiefComplaint] = useState<string>('');
  const [historyOfIllness, setHistoryOfIllness] = useState<string>('');
  const [examinationNotes, setExaminationNotes] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    {
      id: '1',
      medicine: 'Tab. Paracetamol 650mg',
      dosage: '1 Tablet',
      frequency: '1-0-1',
      duration: '3 days',
      timing: 'After food',
      instructions: 'Take if fever > 99.5°F'
    }
  ]);
  const [labInvestigations, setLabInvestigations] = useState<string>('');
  const [instructionsLifestyle, setInstructionsLifestyle] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [recordStatus, setRecordStatus] = useState<'Draft' | 'Finalised'>('Draft');

  const fetchDoctorQueue = async () => {
    setIsLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await api.getAppointments({
        date: todayStr,
        doctor_id: user?.role === 'doctor' ? user.id : undefined
      });
      setAppointments(res.appointments);

      if (initialAppointmentId) {
        const target = res.appointments.find(a => a.id === initialAppointmentId);
        if (target) {
          selectAppointment(target);
          return;
        }
      }

      if (res.appointments.length > 0 && !selectedAppointment) {
        // Pick in-consultation or first waiting/confirmed
        const currentActive =
          res.appointments.find(a => a.status === 'In Consultation') ||
          res.appointments.find(a => a.status === 'Checked In') ||
          res.appointments[0];
        selectAppointment(currentActive);
      }
    } catch (err: any) {
      console.error('Failed to load doctor workspace:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorQueue();
  }, [user?.id, clinic?.id]);

  const selectAppointment = async (appt: Appointment) => {
    setSelectedAppointment(appt);
    setAiSummary(null);

    try {
      const recordRes = await api.getClinicalRecord(appt.id);
      if (recordRes.record) {
        const r = recordRes.record;
        setClinicalRecord(r);
        setVitals(r.vitals || {});
        setChiefComplaint(r.chief_complaint || '');
        setHistoryOfIllness(r.history_of_illness || '');
        setExaminationNotes(r.examination_notes || '');
        setDiagnosis(r.diagnosis || '');
        setPrescriptions(r.prescriptions || []);
        setLabInvestigations(r.lab_investigations || '');
        setInstructionsLifestyle(r.instructions_lifestyle || '');
        setFollowUpDate(r.follow_up_date || '');
        setRecordStatus(r.status);
        return;
      }
    } catch (e) {
      // No existing record yet -> start fresh draft
      setClinicalRecord(null);
      setChiefComplaint(appt.reason || '');
      setHistoryOfIllness('');
      setExaminationNotes('');
      setDiagnosis('');
      setPrescriptions([
        {
          id: String(Date.now()),
          medicine: 'Tab. Paracetamol 650mg',
          dosage: '1 Tab',
          frequency: '1-0-1',
          duration: '3 days',
          timing: 'After food',
          instructions: 'For symptom relief'
        }
      ]);
      setLabInvestigations('');
      setInstructionsLifestyle('Adequate hydration, warm water sips, rest.');
      setRecordStatus('Draft');
    }
  };

  const calculateBMI = (wt: string, ht: string) => {
    const w = parseFloat(wt);
    const h = parseFloat(ht) / 100;
    if (w > 0 && h > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return '';
  };

  const handleVitalsChange = (field: keyof Vitals, val: string) => {
    const updated = { ...vitals, [field]: val };
    if (field === 'weight' || field === 'height') {
      const bmi = calculateBMI(updated.weight || '', updated.height || '');
      if (bmi) updated.bmi = bmi;
    }
    setVitals(updated);
  };

  const addPrescriptionItem = () => {
    setPrescriptions([
      ...prescriptions,
      {
        id: String(Date.now()),
        medicine: '',
        dosage: '1 Tab',
        frequency: '1-0-1',
        duration: '5 days',
        timing: 'After food',
        instructions: ''
      }
    ]);
  };

  const removePrescriptionItem = (id: string) => {
    setPrescriptions(prescriptions.filter(p => p.id !== id));
  };

  const updatePrescriptionItem = (id: string, field: keyof PrescriptionItem, val: string) => {
    setPrescriptions(
      prescriptions.map(p => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const handleSave = async (statusToSet: 'Draft' | 'Finalised') => {
    if (!selectedAppointment) return;
    if (!chiefComplaint.trim() || !diagnosis.trim()) {
      alert('Please fill in Chief Complaint and Diagnosis before saving.');
      return;
    }

    if (statusToSet === 'Finalised') {
      const confirmSign = window.confirm(
        `Doctor Sign-Off: You are about to finalize and digitally stamp this prescription under your registration number. Finalised records are locked for clinical safety. Proceed?`
      );
      if (!confirmSign) return;
    }

    setIsSaving(true);
    try {
      const res = await api.saveClinicalRecord({
        appointment_id: selectedAppointment.id,
        patient_id: selectedAppointment.patient_id,
        vitals,
        chief_complaint: chiefComplaint,
        history_of_illness: historyOfIllness,
        examination_notes: examinationNotes,
        diagnosis,
        prescriptions,
        lab_investigations: labInvestigations,
        instructions_lifestyle: instructionsLifestyle,
        follow_up_date: followUpDate,
        status: statusToSet
      });

      setRecordStatus(res.status);
      alert(res.message);
      fetchDoctorQueue();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAiLaypersonSummary = async () => {
    if (!diagnosis) {
      alert('Please enter a diagnosis first.');
      return;
    }
    setIsGeneratingAi(true);
    try {
      const res = await api.askAssistant({
        action: 'visit_summary_explainer',
        prompt: `Explain this consultation for patient ${selectedAppointment?.patient_name} in simple layperson terms with clear medicine timetable.`,
        additionalData: {
          doctor_name: user?.name,
          diagnosis,
          chief_complaint: chiefComplaint,
          prescriptions,
          instructions_lifestyle: instructionsLifestyle,
          follow_up_date: followUpDate
        }
      });
      setAiSummary(res.response);
    } catch (err: any) {
      alert(`AI summary generation failed: ${err.message}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isFinalised = recordStatus === 'Finalised';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            <span>Doctor Consultation Workspace</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dr. {user?.name} • Reg No: {user?.registration_number || 'MCI/NMC REGISTERED'} • {clinic?.name}
          </p>
        </div>

        {selectedAppointment && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Print Official Prescription
            </button>

            <button
              onClick={handleGenerateAiLaypersonSummary}
              disabled={isGeneratingAi}
              className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className={`w-3.5 h-3.5 text-teal-600 ${isGeneratingAi ? 'animate-spin' : ''}`} />
              Draft Patient Summary
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Today's Doctor Queue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col max-h-[820px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Today's Patients ({appointments.length})
            </h3>
            <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-mono font-bold">
              Queue
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {appointments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No patients assigned today.</p>
            ) : (
              appointments.map(appt => {
                const isSelected = selectedAppointment?.id === appt.id;
                return (
                  <div
                    key={appt.id}
                    onClick={() => selectAppointment(appt)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 truncate">{appt.patient_name}</span>
                      <span className="font-mono text-[11px] font-bold text-slate-600">
                        #{appt.token_number}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>{appt.start_time} ({appt.service_name})</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          appt.status === 'In Consultation'
                            ? 'bg-teal-200 text-teal-900'
                            : appt.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 3 Columns: Active Consultation & Prescription Canvas */}
        <div className="lg:col-span-3 space-y-6">
          {!selectedAppointment ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <Stethoscope className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Select a patient from the queue to start encounter</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Patient Banner */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-base font-mono">
                    #{selectedAppointment.token_number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{selectedAppointment.patient_name}</h3>
                      <span className="text-xs font-mono font-bold text-teal-800 px-2 py-0.5 bg-teal-50 border border-teal-200 rounded">
                        {selectedAppointment.patient_uid}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {selectedAppointment.patient_age}y / {selectedAppointment.patient_gender} • Phone: {selectedAppointment.patient_phone} • Slot: {selectedAppointment.start_time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      isFinalised
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    {isFinalised ? 'Finalised & Signed ✓' : 'Draft In-Progress'}
                  </span>
                </div>
              </div>

              {/* AI Layperson Take-Home Summary Card (if generated) */}
              {aiSummary && (
                <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-4 shadow-xs space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      Patient Take-Home Guide (Layperson Friendly)
                    </span>
                    <button
                      onClick={() => setAiSummary(null)}
                      className="text-teal-700 hover:text-teal-900 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-teal-200 text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {aiSummary}
                  </div>
                  <p className="text-[10px] text-teal-700 italic">
                    Doctor verification rule: Please review this patient explanation before handing it to the patient.
                  </p>
                </div>
              )}

              {/* Vitals Bar */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>Physical Vitals & Screening</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">BP (mmHg)</label>
                    <input
                      type="text"
                      disabled={isFinalised}
                      value={vitals.bp || ''}
                      onChange={e => handleVitalsChange('bp', e.target.value)}
                      placeholder="120/80"
                      className="w-full mt-1 border border-slate-300 rounded p-1.5 font-mono text-xs focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Pulse (bpm)</label>
                    <input
                      type="number"
                      disabled={isFinalised}
                      value={vitals.pulse || ''}
                      onChange={e => handleVitalsChange('pulse', e.target.value)}
                      placeholder="72"
                      className="w-full mt-1 border border-slate-300 rounded p-1.5 font-mono text-xs focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Temp (°F)</label>
                    <input
                      type="text"
                      disabled={isFinalised}
                      value={vitals.temp || ''}
                      onChange={e => handleVitalsChange('temp', e.target.value)}
                      placeholder="98.6"
                      className="w-full mt-1 border border-slate-300 rounded p-1.5 font-mono text-xs focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">SpO2 (%)</label>
                    <input
                      type="text"
                      disabled={isFinalised}
                      value={vitals.spo2 || ''}
                      onChange={e => handleVitalsChange('spo2', e.target.value)}
                      placeholder="99"
                      className="w-full mt-1 border border-slate-300 rounded p-1.5 font-mono text-xs focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Weight (kg)</label>
                    <input
                      type="text"
                      disabled={isFinalised}
                      value={vitals.weight || ''}
                      onChange={e => handleVitalsChange('weight', e.target.value)}
                      placeholder="68"
                      className="w-full mt-1 border border-slate-300 rounded p-1.5 font-mono text-xs focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Height (cm)</label>
                    <input
                      type="text"
                      disabled={isFinalised}
                      value={vitals.height || ''}
                      onChange={e => handleVitalsChange('height', e.target.value)}
                      placeholder="172"
                      className="w-full mt-1 border border-slate-300 rounded p-1.5 font-mono text-xs focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">BMI</label>
                    <input
                      type="text"
                      disabled
                      value={vitals.bmi || ''}
                      placeholder="23.0"
                      className="w-full mt-1 border border-slate-200 bg-slate-50 text-slate-700 rounded p-1.5 font-mono text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Complaints & Diagnosis */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Chief Complaint & Duration *
                    </label>
                    <textarea
                      rows={3}
                      disabled={isFinalised}
                      value={chiefComplaint}
                      onChange={e => setChiefComplaint(e.target.value)}
                      placeholder="e.g. Fever with chills for 3 days, body ache, dry cough..."
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Clinical Findings / Examination
                    </label>
                    <textarea
                      rows={3}
                      disabled={isFinalised}
                      value={examinationNotes}
                      onChange={e => setExaminationNotes(e.target.value)}
                      placeholder="e.g. Pharynx congested, chest clear, no lymphadenopathy..."
                      className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-teal-900 mb-1 text-xs">
                    Clinical / ICD Diagnosis *
                  </label>
                  <input
                    type="text"
                    disabled={isFinalised}
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Upper Respiratory Tract Infection (URTI) with Pharyngitis"
                    className="w-full border border-teal-300 bg-teal-50/30 font-bold text-slate-900 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Prescription Builder (Rx) */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-lg text-teal-800">℞</span>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Prescription & Dosage Schedule ({prescriptions.length})
                    </h3>
                  </div>

                  {!isFinalised && (
                    <button
                      onClick={addPrescriptionItem}
                      className="px-2.5 py-1 text-xs bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 rounded-lg font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Medicine
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {prescriptions.map((rx, idx) => (
                    <div
                      key={rx.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 grid grid-cols-1 md:grid-cols-12 gap-2 text-xs items-center"
                    >
                      <div className="md:col-span-4">
                        <label className="text-[10px] text-slate-500 block mb-0.5">Medicine Name</label>
                        <input
                          type="text"
                          disabled={isFinalised}
                          placeholder="e.g. Tab. Augmentin 625mg"
                          value={rx.medicine}
                          onChange={e => updatePrescriptionItem(rx.id, 'medicine', e.target.value)}
                          className="w-full border border-slate-300 rounded p-1.5 font-semibold text-slate-900 focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] text-slate-500 block mb-0.5">Frequency</label>
                        <input
                          type="text"
                          disabled={isFinalised}
                          placeholder="1-0-1"
                          value={rx.frequency}
                          onChange={e => updatePrescriptionItem(rx.id, 'frequency', e.target.value)}
                          className="w-full border border-slate-300 rounded p-1.5 font-mono focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] text-slate-500 block mb-0.5">Duration</label>
                        <input
                          type="text"
                          disabled={isFinalised}
                          placeholder="5 days"
                          value={rx.duration}
                          onChange={e => updatePrescriptionItem(rx.id, 'duration', e.target.value)}
                          className="w-full border border-slate-300 rounded p-1.5 focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-[10px] text-slate-500 block mb-0.5">Timing & Notes</label>
                        <input
                          type="text"
                          disabled={isFinalised}
                          placeholder="After food / with water"
                          value={rx.timing}
                          onChange={e => updatePrescriptionItem(rx.id, 'timing', e.target.value)}
                          className="w-full border border-slate-300 rounded p-1.5 focus:outline-none"
                        />
                      </div>

                      {!isFinalised && (
                        <div className="md:col-span-1 text-right pt-4">
                          <button
                            onClick={() => removePrescriptionItem(rx.id)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded"
                            title="Remove Medicine"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Lab Orders & Instructions */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Lab Investigations Ordered
                    </label>
                    <input
                      type="text"
                      disabled={isFinalised}
                      value={labInvestigations}
                      onChange={e => setLabInvestigations(e.target.value)}
                      placeholder="e.g. Complete Blood Count (CBC), Urine R/M"
                      className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Next Follow-Up Date
                    </label>
                    <input
                      type="date"
                      disabled={isFinalised}
                      value={followUpDate}
                      onChange={e => setFollowUpDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Dietary & Lifestyle Instructions
                  </label>
                  <textarea
                    rows={2}
                    disabled={isFinalised}
                    value={instructionsLifestyle}
                    onChange={e => setInstructionsLifestyle(e.target.value)}
                    placeholder="e.g. Avoid oily/fried food, drink 2.5L water, 30 mins brisk walk daily..."
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons: Save Draft vs Finalize */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Physician approval gate: Doctor must review and sign all clinical entries.</span>
                </div>

                <div className="flex items-center gap-2">
                  {!isFinalised && (
                    <button
                      onClick={() => handleSave('Draft')}
                      disabled={isSaving}
                      className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save as Draft
                    </button>
                  )}

                  {!isFinalised ? (
                    <button
                      onClick={() => handleSave('Finalised')}
                      disabled={isSaving}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <FileCheck className="w-4 h-4" />
                      Finalize & Sign Prescription
                    </button>
                  ) : (
                    <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                      Finalised & Locked (Clinical Record Immutable)
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HIDDEN PRINTABLE OFFICIAL PRESCRIPTION FOR BROWSER PRINT DIALOG */}
      {selectedAppointment && (
        <div id="printable-document" className="hidden print:block font-serif text-black p-8 max-w-3xl mx-auto">
          {/* Clinic Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wider">{clinic?.name}</h1>
              <p className="text-xs text-slate-700">{clinic?.tagline}</p>
              <p className="text-xs text-slate-700">{clinic?.address}</p>
              <p className="text-xs text-slate-700">Phone: {clinic?.phone} • Email: {clinic?.email}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Clinic Reg No: {clinic?.reg_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-700">{user?.qualification}</p>
              <p className="text-xs text-slate-700">{user?.specialization}</p>
              <p className="text-[11px] font-mono text-slate-800 font-bold">
                Reg No: {user?.registration_number || 'NMC-48291'}
              </p>
            </div>
          </div>

          {/* Patient Details Row */}
          <div className="bg-slate-100 p-3 rounded mb-4 text-xs grid grid-cols-4 gap-2 border border-slate-300">
            <div>
              <span className="font-bold">Patient Name:</span> {selectedAppointment.patient_name}
            </div>
            <div>
              <span className="font-bold">Age / Gender:</span> {selectedAppointment.patient_age}y / {selectedAppointment.patient_gender}
            </div>
            <div>
              <span className="font-bold">Patient ID:</span> {selectedAppointment.patient_uid}
            </div>
            <div>
              <span className="font-bold">Encounter Date:</span> {selectedAppointment.appointment_date}
            </div>
          </div>

          {/* Vitals */}
          <div className="text-xs mb-4 pb-2 border-b border-slate-200">
            <span className="font-bold">Vitals:</span> BP: {vitals.bp || 'N/A'} mmHg • Pulse: {vitals.pulse || 'N/A'} bpm • Temp: {vitals.temp || 'N/A'} °F • SpO2: {vitals.spo2 || 'N/A'}% • Wt: {vitals.weight || 'N/A'} kg • BMI: {vitals.bmi || 'N/A'}
          </div>

          {/* Diagnosis */}
          <div className="text-sm mb-4">
            <span className="font-bold uppercase tracking-wide">Diagnosis:</span>{' '}
            <span className="font-bold text-slate-900">{diagnosis || 'General Consultation'}</span>
          </div>

          {/* Rx Symbol & Medications */}
          <div className="mb-6">
            <div className="text-2xl font-bold font-serif mb-2">℞</div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-400 text-left font-bold">
                  <th className="py-1">#</th>
                  <th className="py-1">Medication Name</th>
                  <th className="py-1">Dosage</th>
                  <th className="py-1">Frequency</th>
                  <th className="py-1">Duration</th>
                  <th className="py-1">Instructions</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((rx, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="py-1.5">{idx + 1}</td>
                    <td className="py-1.5 font-bold">{rx.medicine}</td>
                    <td className="py-1.5">{rx.dosage}</td>
                    <td className="py-1.5 font-mono">{rx.frequency}</td>
                    <td className="py-1.5">{rx.duration}</td>
                    <td className="py-1.5">{rx.timing} {rx.instructions ? `(${rx.instructions})` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lab Investigations & Advice */}
          {labInvestigations && (
            <div className="text-xs mb-3">
              <span className="font-bold">Diagnostic Tests Recommended:</span> {labInvestigations}
            </div>
          )}

          {instructionsLifestyle && (
            <div className="text-xs mb-3">
              <span className="font-bold">Diet & Lifestyle Advice:</span> {instructionsLifestyle}
            </div>
          )}

          {followUpDate && (
            <div className="text-xs mb-8">
              <span className="font-bold">Next Review Date:</span> {followUpDate}
            </div>
          )}

          {/* Signature Block */}
          <div className="mt-12 pt-6 border-t border-slate-400 flex justify-between items-end text-xs">
            <p className="text-[10px] text-slate-500">
              Generated via ClinicPilot AI Healthcare Management Suite • Confidential
            </p>
            <div className="text-right">
              <div className="font-serif italic font-bold text-sm mb-1">{user?.name}</div>
              <p className="font-bold font-mono text-[11px]">NMC/MCI Reg: {user?.registration_number || '48291'}</p>
              <p className="text-[10px] text-slate-600">Authorized Physician Signature</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
