import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Appointment, AppointmentStatus, User, Service, Patient } from '../../types/index.js';
import {
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  Phone,
  Plus,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Copy,
  Check,
  Send,
  UserCheck,
  Stethoscope
} from 'lucide-react';

interface AppointmentsViewProps {
  onOpenDoctorWorkspace?: (appointmentId: string) => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({ onOpenDoctorWorkspace }) => {
  const { user, clinic } = useAuth();
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'list'>('day');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [bookingPatientId, setBookingPatientId] = useState<string>('');
  const [bookingDoctorId, setBookingDoctorId] = useState<string>('');
  const [bookingServiceId, setBookingServiceId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>(selectedDate);
  const [bookingStartTime, setBookingStartTime] = useState<string>('10:00');
  const [bookingType, setBookingType] = useState<'Scheduled' | 'Walk-in'>('Scheduled');
  const [bookingReason, setBookingReason] = useState<string>('');
  const [allowOverride, setAllowOverride] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Cancel Modal State
  const [cancelModalAppointment, setCancelModalAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  // Reminder Modal State
  const [reminderModalData, setReminderModalData] = useState<{
    appointment: Appointment;
    reminderText: string;
    phone: string;
  } | null>(null);
  const [copiedReminder, setCopiedReminder] = useState<boolean>(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [apptsRes, staffRes, servicesRes, patientsRes] = await Promise.all([
        api.getAppointments({
          date: viewMode === 'day' || viewMode === 'list' ? selectedDate : undefined,
          doctor_id: selectedDoctorId || undefined,
          status: selectedStatus || undefined
        }),
        api.getStaff(),
        api.getServices(),
        api.getPatients()
      ]);

      setAppointments(apptsRes.appointments);
      const docs = staffRes.staff.filter(s => s.role === 'doctor' || s.role === 'owner');
      setDoctors(docs);
      setServices(servicesRes.services);
      setPatients(patientsRes.patients);

      if (docs.length > 0 && !bookingDoctorId) {
        setBookingDoctorId(docs[0].id);
      }
      if (servicesRes.services.length > 0 && !bookingServiceId) {
        setBookingServiceId(servicesRes.services[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load appointments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedDoctorId, selectedStatus, viewMode, clinic?.id]);

  const handleDateChange = (days: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  const handleStatusChange = async (appointmentId: string, status: AppointmentStatus) => {
    try {
      await api.updateAppointmentStatus(appointmentId, status);
      fetchData();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalAppointment) return;
    try {
      await api.updateAppointmentStatus(cancelModalAppointment.id, 'Cancelled', cancelReason);
      setCancelModalAppointment(null);
      setCancelReason('');
      fetchData();
    } catch (err: any) {
      alert(`Failed to cancel appointment: ${err.message}`);
    }
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    try {
      await api.createAppointment({
        patient_id: bookingPatientId,
        doctor_id: bookingDoctorId,
        service_id: bookingServiceId,
        appointment_date: bookingDate,
        start_time: bookingStartTime,
        type: bookingType,
        reason: bookingReason,
        allow_override: allowOverride
      });

      setShowBookingModal(false);
      setBookingReason('');
      setAllowOverride(false);
      fetchData();
    } catch (err: any) {
      setBookingError(err.message || 'Booking conflict or validation error occurred.');
    }
  };

  const handleTriggerReminder = async (appt: Appointment) => {
    try {
      const res = await api.sendAppointmentReminder(appt.id);
      setReminderModalData({
        appointment: appt,
        reminderText: res.reminder_text,
        phone: res.patient_phone
      });
      fetchData();
    } catch (err: any) {
      alert(`Failed to prepare reminder: ${err.message}`);
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'Booked':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Confirmed':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Checked In':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
      case 'In Consultation':
        return 'bg-teal-50 text-teal-800 border-teal-300 font-bold animate-pulse';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border-red-200 line-through';
      case 'No-show':
        return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            OPD Queue & Appointment Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Clinic hours: {clinic?.opening_time} - {clinic?.closing_time} • Buffer: {clinic?.appointment_buffer_minutes}m
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'day' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              List / Queue
            </button>
          </div>

          <button
            onClick={() => {
              setBookingDate(selectedDate);
              setShowBookingModal(true);
            }}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Book Slot
          </button>
        </div>
      </div>

      {/* Date Navigation & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDateChange(-1)}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="text-xs font-bold text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={() => handleDateChange(1)}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="text-xs text-teal-700 font-semibold hover:underline px-2"
          >
            Today
          </button>
        </div>

        {/* Doctor & Status Filters */}
        <div className="flex items-center gap-2">
          <select
            value={selectedDoctorId}
            onChange={e => setSelectedDoctorId(e.target.value)}
            className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="">All Doctors</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.role === 'owner' ? 'Owner' : 'Doctor'})
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Booked">Booked</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checked In">Checked In</option>
            <option value="In Consultation">In Consultation</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="No-show">No-show</option>
          </select>
        </div>
      </div>

      {/* Appointments List / Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading clinic appointments...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-800">No appointments scheduled</p>
            <p className="text-xs text-slate-500 mt-1">
              There are no bookings matching the selected date and filters.
            </p>
            <button
              onClick={() => setShowBookingModal(true)}
              className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold"
            >
              Book an Appointment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Token</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Patient Details</th>
                  <th className="py-3 px-4">Consultant Doctor</th>
                  <th className="py-3 px-4">Service & Fee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map(appt => (
                  <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Token */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200">
                        #{appt.token_number}
                      </span>
                    </td>

                    {/* Time Slot */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 font-mono">
                        {appt.start_time} - {appt.end_time}
                      </div>
                      <div className="text-[10px] text-slate-500">{appt.type}</div>
                    </td>

                    {/* Patient */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{appt.patient_name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span className="font-mono">{appt.patient_uid}</span>
                        <span>•</span>
                        <span>{appt.patient_phone}</span>
                      </div>
                    </td>

                    {/* Doctor */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{appt.doctor_name}</div>
                      <div className="text-[10px] text-slate-500">{appt.doctor_specialization}</div>
                    </td>

                    {/* Service & Fee */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{appt.service_name}</div>
                      <div className="text-[11px] font-mono text-emerald-700 font-semibold">
                        ₹{appt.service_fee}
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] border ${getStatusBadge(
                          appt.status
                        )}`}
                      >
                        {appt.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      {/* Status advancement buttons */}
                      {appt.status === 'Booked' && (
                        <button
                          onClick={() => handleStatusChange(appt.id, 'Confirmed')}
                          className="px-2 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded border border-sky-200 font-medium"
                        >
                          Confirm
                        </button>
                      )}

                      {(appt.status === 'Booked' || appt.status === 'Confirmed') && (
                        <button
                          onClick={() => handleStatusChange(appt.id, 'Checked In')}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-semibold"
                        >
                          Check In
                        </button>
                      )}

                      {appt.status === 'Checked In' && (
                        <button
                          onClick={() => handleStatusChange(appt.id, 'In Consultation')}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-semibold"
                        >
                          Call In
                        </button>
                      )}

                      {appt.status === 'In Consultation' && (
                        <>
                          {(user?.role === 'doctor' || user?.role === 'owner') && onOpenDoctorWorkspace && (
                            <button
                              onClick={() => onOpenDoctorWorkspace(appt.id)}
                              className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 rounded font-semibold"
                            >
                              Rx Notes
                            </button>
                          )}
                          <button
                            onClick={() => handleStatusChange(appt.id, 'Completed')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold"
                          >
                            Finish
                          </button>
                        </>
                      )}

                      {/* WhatsApp / SMS Reminder trigger */}
                      <button
                        onClick={() => handleTriggerReminder(appt)}
                        title="Send / Copy WhatsApp Reminder"
                        className="p-1 text-slate-500 hover:text-teal-600 rounded"
                      >
                        <MessageSquare className="w-3.5 h-3.5 inline" />
                      </button>

                      {/* Cancel option */}
                      {appt.status !== 'Completed' && appt.status !== 'Cancelled' && (
                        <button
                          onClick={() => setCancelModalAppointment(appt)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Cancel Appointment"
                        >
                          <XCircle className="w-3.5 h-3.5 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BOOK APPOINTMENT MODAL */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Book Patient Appointment</h3>
                <p className="text-xs text-slate-500">Real-time schedule check with buffer enforcement</p>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {bookingError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{bookingError}</p>
                  <p className="text-[11px] mt-0.5">
                    You can adjust the time slot, or check the Override box below if authorised for emergency cases.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleBookSubmit} className="space-y-4 text-xs">
              {/* Patient Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={bookingPatientId}
                  onChange={e => setBookingPatientId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">-- Choose Registered Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.patient_uid}) • {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor & Service */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Consulting Doctor *</label>
                  <select
                    required
                    value={bookingDoctorId}
                    onChange={e => setBookingDoctorId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Consultation Service *</label>
                  <select
                    required
                    value={bookingServiceId}
                    onChange={e => setBookingServiceId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} (₹{s.fee}, {s.duration_minutes}m)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time (HH:MM) *</label>
                  <input
                    type="time"
                    required
                    value={bookingStartTime}
                    onChange={e => setBookingStartTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Type: Scheduled vs Walk-in */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Appointment Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="apptType"
                      checked={bookingType === 'Scheduled'}
                      onChange={() => setBookingType('Scheduled')}
                    />
                    <span>Scheduled Visit (Status: Booked)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="apptType"
                      checked={bookingType === 'Walk-in'}
                      onChange={() => setBookingType('Walk-in')}
                    />
                    <span className="font-semibold text-amber-700">Walk-in (Auto Check-In)</span>
                  </label>
                </div>
              </div>

              {/* Reason / Chief complaint */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Visit</label>
                <input
                  type="text"
                  placeholder="e.g. Mild fever, follow-up BP check, routine consult"
                  value={bookingReason}
                  onChange={e => setBookingReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Authorised Emergency Override Checkbox */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowOverride}
                    onChange={e => setAllowOverride(e.target.checked)}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">
                      Authorised Override (Emergency Walk-in / Double-Booking)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Allow booking outside normal operating hours or overlapping existing buffer slots for urgent clinical needs.
                    </p>
                  </div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold shadow-xs"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCELLATION REASON MODAL */}
      {cancelModalAppointment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Cancel Appointment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Patient: {cancelModalAppointment.patient_name} • Token #{cancelModalAppointment.token_number}
            </p>

            <div className="space-y-3 text-xs">
              <label className="block font-semibold text-slate-700">Cancellation Reason *</label>
              <textarea
                required
                rows={3}
                placeholder="Reason provided by patient or doctor..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setCancelModalAppointment(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP REMINDER PREVIEW MODAL */}
      {reminderModalData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">WhatsApp / SMS Reminder</h3>
                  <p className="text-[11px] text-slate-500">Sent to {reminderModalData.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setReminderModalData(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
              {reminderModalData.reminderText}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Reminder logged in audit trail
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(reminderModalData.reminderText);
                  setCopiedReminder(true);
                  setTimeout(() => setCopiedReminder(false), 2000);
                }}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-slate-700"
              >
                {copiedReminder ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
