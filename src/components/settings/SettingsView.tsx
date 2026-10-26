import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { User, Service, Clinic } from '../../types/index.js';
import {
  Building2,
  Users,
  Clock,
  IndianRupee,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  UserPlus
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, clinic, refreshClinic } = useAuth();
  const [activeTab, setActiveTab] = useState<'clinic' | 'staff' | 'services'>('clinic');

  // Clinic Form
  const [clinicForm, setClinicForm] = useState<Partial<Clinic>>({});
  const [isSavingClinic, setIsSavingClinic] = useState<boolean>(false);

  // Staff List
  const [staff, setStaff] = useState<User[]>([]);
  const [showAddStaffModal, setShowAddStaffModal] = useState<boolean>(false);
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'password123',
    role: 'doctor' as 'doctor' | 'receptionist',
    specialization: '',
    registration_number: '',
    qualification: ''
  });

  // Services
  const [services, setServices] = useState<Service[]>([]);
  const [showAddServiceModal, setShowAddServiceModal] = useState<boolean>(false);
  const [newServiceForm, setNewServiceForm] = useState({
    name: '',
    duration_minutes: 15,
    fee: 500,
    description: ''
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [staffRes, srvRes] = await Promise.all([api.getStaff(), api.getServices()]);
      setStaff(staffRes.staff);
      setServices(srvRes.services);
      if (clinic) {
        setClinicForm({ ...clinic });
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clinic?.id]);

  const handleSaveClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingClinic(true);
    try {
      await api.updateClinic(clinicForm);
      await refreshClinic();
      alert('Clinic operational profile updated successfully.');
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setIsSavingClinic(false);
    }
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStaff(newStaffForm);
      setShowAddStaffModal(false);
      setNewStaffForm({
        name: '',
        email: '',
        phone: '',
        password: 'password123',
        role: 'doctor',
        specialization: '',
        registration_number: '',
        qualification: ''
      });
      fetchData();
    } catch (err: any) {
      alert(`Failed to add staff: ${err.message}`);
    }
  };

  const handleToggleStaffStatus = async (staffUser: User) => {
    if (staffUser.id === user?.id) {
      alert('Cannot deactivate your own account.');
      return;
    }
    const newStatus = staffUser.is_active === 1 ? false : true;
    try {
      await api.toggleStaffStatus(staffUser.id, newStatus);
      fetchData();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleAddServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createService(newServiceForm);
      setShowAddServiceModal(false);
      setNewServiceForm({
        name: '',
        duration_minutes: 15,
        fee: 500,
        description: ''
      });
      fetchData();
    } catch (err: any) {
      alert(`Failed to add service: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Building2 className="w-5 h-5 text-teal-600" />
          <span>Clinic Facility & Staff Configuration</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Restricted to Clinic Owner/Admin • Configure operational hours, staff roles, and buffer rules.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('clinic')}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === 'clinic'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Clinic Operating Profile
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === 'staff'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Authorised Staff & Doctors ({staff.length})
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`pb-3 px-1 border-b-2 transition-colors ${
            activeTab === 'services'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Services & Consultation Fees ({services.length})
        </button>
      </div>

      {/* TAB 1: CLINIC PROFILE */}
      {activeTab === 'clinic' && (
        <form onSubmit={handleSaveClinic} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Clinic Name *</label>
              <input
                type="text"
                required
                value={clinicForm.name || ''}
                onChange={e => setClinicForm({ ...clinicForm, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Clinic Tagline / Subtitle</label>
              <input
                type="text"
                value={clinicForm.tagline || ''}
                onChange={e => setClinicForm({ ...clinicForm, tagline: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone *</label>
              <input
                type="text"
                required
                value={clinicForm.phone || ''}
                onChange={e => setClinicForm({ ...clinicForm, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Email *</label>
              <input
                type="email"
                required
                value={clinicForm.email || ''}
                onChange={e => setClinicForm({ ...clinicForm, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Registration Number *</label>
            <input
              type="text"
              required
              value={clinicForm.reg_number || ''}
              onChange={e => setClinicForm({ ...clinicForm, reg_number: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinic Physical Address *</label>
            <textarea
              rows={2}
              required
              value={clinicForm.address || ''}
              onChange={e => setClinicForm({ ...clinicForm, address: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
            />
          </div>

          {/* OPD Operating Hours & Buffer */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>OPD Timings & Buffer Configuration</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Opening Time</label>
                <input
                  type="time"
                  value={clinicForm.opening_time || '08:30'}
                  onChange={e => setClinicForm({ ...clinicForm, opening_time: e.target.value })}
                  className="w-full border border-slate-300 rounded p-1.5 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Closing Time</label>
                <input
                  type="time"
                  value={clinicForm.closing_time || '20:30'}
                  onChange={e => setClinicForm({ ...clinicForm, closing_time: e.target.value })}
                  className="w-full border border-slate-300 rounded p-1.5 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Lunch Break Start</label>
                <input
                  type="time"
                  value={clinicForm.lunch_start || '13:30'}
                  onChange={e => setClinicForm({ ...clinicForm, lunch_start: e.target.value })}
                  className="w-full border border-slate-300 rounded p-1.5 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Lunch Break End</label>
                <input
                  type="time"
                  value={clinicForm.lunch_end || '16:00'}
                  onChange={e => setClinicForm({ ...clinicForm, lunch_end: e.target.value })}
                  className="w-full border border-slate-300 rounded p-1.5 font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Default Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={clinicForm.consultation_fee_default || 500}
                  onChange={e => setClinicForm({ ...clinicForm, consultation_fee_default: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded p-1.5 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Appointment Buffer (Minutes between slots)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={clinicForm.appointment_buffer_minutes || 5}
                  onChange={e => setClinicForm({ ...clinicForm, appointment_buffer_minutes: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded p-1.5 font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingClinic}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold shadow-xs flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingClinic ? 'Updating...' : 'Save Clinic Profile'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: STAFF MANAGEMENT */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Doctors access clinical workspace & records. Receptionists manage appointments & billing.
            </p>
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Staff Member
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Specialization / Reg No</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.role === 'owner'
                            ? 'bg-indigo-50 text-indigo-700'
                            : s.role === 'doctor'
                            ? 'bg-teal-50 text-teal-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {s.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      <div>{s.email}</div>
                      <div className="text-[10px] text-slate-400">{s.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      {s.role === 'doctor' || s.role === 'owner' ? (
                        <div>
                          <div className="font-medium text-slate-800">{s.specialization}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {s.qualification} • {s.registration_number || 'REG: NMC'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Front Office Administration</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {s.is_active === 1 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {s.id !== user?.id && (
                        <button
                          onClick={() => handleToggleStaffStatus(s)}
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            s.is_active === 1
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {s.is_active === 1 ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SERVICES */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">Configure consultation types, procedures, and default rates.</p>
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Service
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {services.map(srv => (
              <div key={srv.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-900 text-xs">{srv.name}</h4>
                  <span className="font-mono font-bold text-emerald-800 text-xs">₹{srv.fee}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{srv.description || 'Standard clinic procedure'}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
                  <span>Duration: {srv.duration_minutes} mins</span>
                  <span className="text-emerald-600 font-semibold">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Add Authorized Staff Member</h3>
            <form onSubmit={handleAddStaffSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Aman Verma"
                  value={newStaffForm.name}
                  onChange={e => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role *</label>
                <select
                  value={newStaffForm.role}
                  onChange={e => setNewStaffForm({ ...newStaffForm, role: e.target.value as any })}
                  className="w-full border border-slate-300 rounded p-2 focus:outline-none"
                >
                  <option value="doctor">Consulting Doctor</option>
                  <option value="receptionist">Receptionist / Front Desk</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newStaffForm.email}
                    onChange={e => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={newStaffForm.phone}
                    onChange={e => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {newStaffForm.role === 'doctor' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Specialization</label>
                    <input
                      type="text"
                      placeholder="e.g. General Medicine, ENT, Pediatrics"
                      value={newStaffForm.specialization}
                      onChange={e => setNewStaffForm({ ...newStaffForm, specialization: e.target.value })}
                      className="w-full border border-slate-300 rounded p-2 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">NMC/MCI Reg No</label>
                      <input
                        type="text"
                        placeholder="e.g. DMC-59102"
                        value={newStaffForm.registration_number}
                        onChange={e => setNewStaffForm({ ...newStaffForm, registration_number: e.target.value })}
                        className="w-full border border-slate-300 rounded p-2 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Qualifications</label>
                      <input
                        type="text"
                        placeholder="e.g. MBBS, MD"
                        value={newStaffForm.qualification}
                        onChange={e => setNewStaffForm({ ...newStaffForm, qualification: e.target.value })}
                        className="w-full border border-slate-300 rounded p-2 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-semibold"
                >
                  Create Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SERVICE MODAL */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Add Service / Procedure</h3>
            <form onSubmit={handleAddServiceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diabetes Annual Review"
                  value={newServiceForm.name}
                  onChange={e => setNewServiceForm({ ...newServiceForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newServiceForm.fee}
                    onChange={e => setNewServiceForm({ ...newServiceForm, fee: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={newServiceForm.duration_minutes}
                    onChange={e => setNewServiceForm({ ...newServiceForm, duration_minutes: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief explanation for patients..."
                  value={newServiceForm.description}
                  onChange={e => setNewServiceForm({ ...newServiceForm, description: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-semibold"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
