import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { DashboardStats, AuditLog, Appointment } from '../../types/index.js';
import {
  Users,
  CalendarCheck2,
  Clock,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserPlus,
  ArrowRight,
  RefreshCw,
  Phone,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  CreditCard
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: any) => void;
  onBookAppointment: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onBookAppointment
}) => {
  const { user, clinic } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [dashRes, apptRes] = await Promise.all([
        api.getDashboard(),
        api.getAppointments({ date: todayStr })
      ]);
      setStats(dashRes.stats);
      setRecentActivity(dashRes.recent_activity);
      setTodayAppointments(apptRes.appointments);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [clinic?.id]);

  const handleUpdateStatus = async (appointmentId: string, newStatus: any) => {
    try {
      await api.updateAppointmentStatus(appointmentId, newStatus);
      fetchDashboardData();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const waitingPatients = todayAppointments.filter(a => a.status === 'Checked In');
  const inConsultationPatient = todayAppointments.find(a => a.status === 'In Consultation');

  return (
    <div className="space-y-6">
      {/* Top Banner & Greetings */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            Live Clinic Console • {clinic?.name}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome back, {user?.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {clinic?.tagline || 'Manage today’s patient appointments, live OPD queue, and verified payments.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={onBookAppointment}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Book Patient / Walk-in
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Appointments */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Today’s Schedule</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats?.today_appointments_count ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">{stats?.completed_today_count ?? 0}</span> completed •{' '}
            <span className="text-red-500 font-medium">{stats?.cancelled_today_count ?? 0}</span> cancelled
          </div>
        </div>

        {/* Patients Waiting Queue */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Checked-in Queue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats?.waiting_queue_count ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {stats?.in_consultation_count ? (
              <span className="text-teal-600 font-semibold">{stats.in_consultation_count} currently inside doctor room</span>
            ) : (
              'Doctor room available'
            )}
          </div>
        </div>

        {/* Today's Consultation Revenue */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Today’s Collections</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            ₹{(stats?.today_collection_revenue ?? 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            UPI: ₹{(stats?.payment_breakdown.upi ?? 0).toLocaleString('en-IN')} • Cash: ₹{(stats?.payment_breakdown.cash ?? 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Outstanding Dues & Pending Balance */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Dues</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            ₹{(stats?.outstanding_balance_total ?? 0).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Follow-ups due today: <span className="font-semibold text-slate-700">{stats?.follow_ups_due_today ?? 0}</span>
          </div>
        </div>
      </div>

      {/* OPD Live Queue & Action Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waiting Room & Active Consultation */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>OPD Waiting Room & Token Queue</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                  {waitingPatients.length} Waiting
                </span>
              </h3>
              <p className="text-xs text-slate-500">Live sequence of patients present at clinic</p>
            </div>
            <button
              onClick={() => onNavigateTab('appointments')}
              className="text-xs text-teal-700 font-semibold hover:text-teal-800 flex items-center gap-1"
            >
              Full Calendar <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Active Consultation Spotlight */}
            {inConsultationPatient ? (
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs font-mono">
                    #{inConsultationPatient.token_number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-200/80 text-teal-900 uppercase tracking-wide">
                        In Consultation Now
                      </span>
                      <span className="text-xs font-mono text-slate-600">
                        {inConsultationPatient.start_time} - {inConsultationPatient.end_time}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {inConsultationPatient.patient_name} ({inConsultationPatient.patient_age}y / {inConsultationPatient.patient_gender})
                    </p>
                    <p className="text-xs text-slate-600">
                      Doctor: {inConsultationPatient.doctor_name} • {inConsultationPatient.reason || 'General Consult'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(user?.role === 'doctor' || user?.role === 'owner') && (
                    <button
                      onClick={() => onNavigateTab('doctor-workspace')}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Open Clinical Notes
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateStatus(inConsultationPatient.id, 'Completed')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Mark Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                No patient is currently in consultation. Ready to call the next patient.
              </div>
            )}

            {/* Waiting Queue List */}
            {waitingPatients.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">The waiting queue is currently clear.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Checked-in walk-in or booked patients will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {waitingPatients.map(appt => (
                  <div
                    key={appt.id}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs font-mono">
                        #{appt.token_number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900">{appt.patient_name}</p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            UID: {appt.patient_uid}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {appt.service_name} • Dr. {appt.doctor_name} • Slot {appt.start_time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'In Consultation')}
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-md text-xs font-semibold transition-colors"
                      >
                        Call Inside
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(appt.id, 'No-show')}
                        className="px-2 py-1 text-slate-500 hover:text-red-600 rounded text-xs transition-colors"
                        title="Mark No-show"
                      >
                        No-show
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Administrative Activity & Audit Trail */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Administrative Audit Trail</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Real-time</span>
          </div>

          <div className="p-4 flex-1 overflow-y-auto max-h-[360px] space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No recent actions logged.</p>
            ) : (
              recentActivity.map(act => (
                <div key={act.id} className="text-xs border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold text-slate-900">{act.user_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[11px] mt-0.5">
                    <span className="font-mono text-teal-700 bg-teal-50 px-1 py-0.5 rounded text-[10px] mr-1">
                      {act.action}
                    </span>
                    {act.target_type} #{act.target_id.slice(-6)}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigateTab('audit-tests')}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              View Full Security Ledger →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
