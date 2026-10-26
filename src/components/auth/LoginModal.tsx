import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  Building2,
  UserCheck,
  ShieldCheck,
  Lock,
  Mail,
  Key,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  Stethoscope,
  Phone,
  MapPin,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { login, registerClinic, switchDemo } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Sign In State - Pre-filled with working demo account for instant ease of use
  const [signInEmail, setSignInEmail] = useState('rajesh@arogya.in');
  const [signInPassword, setSignInPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  // Register New Clinic State
  const [regDoctorName, setRegDoctorName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regClinicName, setRegClinicName] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regSpecialization, setRegSpecialization] = useState('General Medicine & Family Practice');
  const [regNumber, setRegNumber] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await login({ email: signInEmail, password: signInPassword });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await registerClinic({
        name: regDoctorName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        clinic_name: regClinicName,
        address: regAddress,
        specialization: regSpecialization,
        registration_number: regNumber
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check form details.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoClick = async (email: string) => {
    setSignInEmail(email);
    setSignInPassword('password123');
    setLoading(true);
    setError(null);
    try {
      await switchDemo(email);
    } catch (err: any) {
      setError(err.message || 'Demo switch failed.');
    } finally {
      setLoading(false);
    }
  };

  const demoPresets = [
    {
      clinic: 'Arogya Family Health & Polyclinic (Gurugram)',
      accounts: [
        {
          name: 'Dr. Rajesh Sharma',
          email: 'rajesh@arogya.in',
          role: 'Clinic Owner / Admin',
          badge: 'bg-indigo-100 text-indigo-800 border-indigo-200'
        },
        {
          name: 'Dr. Priya Sen',
          email: 'priya@arogya.in',
          role: 'Consultant Doctor',
          badge: 'bg-teal-100 text-teal-800 border-teal-200'
        },
        {
          name: 'Sunita Verma',
          email: 'sunita@arogya.in',
          role: 'Receptionist',
          badge: 'bg-amber-100 text-amber-800 border-amber-200'
        }
      ]
    },
    {
      clinic: 'Sanjeevani Care & Diagnostics (Bengaluru)',
      accounts: [
        {
          name: 'Dr. Arvind Nair',
          email: 'arvind@sanjeevani.in',
          role: 'Clinic Owner / Admin',
          badge: 'bg-indigo-100 text-indigo-800 border-indigo-200'
        },
        {
          name: 'Dr. Kavita Rao',
          email: 'kavita@sanjeevani.in',
          role: 'Consultant Doctor',
          badge: 'bg-teal-100 text-teal-800 border-teal-200'
        },
        {
          name: 'Rahul Deshmukh',
          email: 'rahul@sanjeevani.in',
          role: 'Receptionist',
          badge: 'bg-amber-100 text-amber-800 border-amber-200'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
        {/* Logo & Headline */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md shadow-teal-200 mb-3">
            CP
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">ClinicPilot AI</h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinic Management & Patient Communication Platform for Clinics in India
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Register New Clinic */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              authMode === 'signin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4 text-teal-600" />
            <span>Sign In to Clinic</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              authMode === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4 text-teal-600" />
            <span>Register New Clinic</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* MODE 1: SIGN IN */}
        {authMode === 'signin' && (
          <div className="space-y-5">
            {/* 1-Click Demo Profiles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  One-Click Demo Login (Instant Access)
                </span>
                <span className="text-[10px] text-teal-700 font-mono font-semibold">
                  Password: password123
                </span>
              </div>

              <div className="space-y-2.5">
                {demoPresets.map((preset, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>{preset.clinic}</span>
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {preset.accounts.map((acc, aIdx) => (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => handleQuickDemoClick(acc.email)}
                          className="p-2 bg-white hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-lg text-left transition-all shadow-2xs group"
                        >
                          <p className="text-[11px] font-bold text-slate-900 truncate group-hover:text-teal-900">
                            {acc.name}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${acc.badge}`}>
                              {acc.role.split(' ')[0]}
                            </span>
                            <span className="text-[10px] text-teal-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                              Sign in →
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative my-3 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-2 text-[11px] font-semibold text-slate-400 uppercase">
                Or sign in with email credentials
              </span>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleFormLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="doctor@arogya.in"
                    value={signInEmail}
                    onChange={e => setSignInEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={e => setSignInPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to ClinicPilot AI'}
              </button>
            </form>
          </div>
        )}

        {/* MODE 2: REGISTER NEW CLINIC */}
        {authMode === 'register' && (
          <form onSubmit={handleFormRegister} className="space-y-3 text-xs">
            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-teal-900 text-[11px] leading-relaxed">
              Register your clinic to set up a brand-new, strictly isolated clinic workspace with custom operating hours and consultation services.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinic Name *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. LifeCare Family Clinic"
                    value={regClinicName}
                    onChange={e => setRegClinicName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Doctor / Owner Full Name *</label>
                <div className="relative">
                  <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Kumar"
                    value={regDoctorName}
                    onChange={e => setRegDoctorName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="doctor@clinic.in"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Create secure password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    placeholder="+91 98112 34567"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. General Medicine, Pediatrics"
                  value={regSpecialization}
                  onChange={e => setRegSpecialization(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Clinic Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Shop 4, Sunrise Plaza, Sector 14, Delhi NCR"
                  value={regAddress}
                  onChange={e => setRegAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {loading ? 'Creating Clinic...' : 'Register Clinic & Enter Dashboard'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
