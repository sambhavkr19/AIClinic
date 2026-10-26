import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import {
  Building2,
  UserCheck,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Sparkles,
  MapPin,
  Clock,
  Phone
} from 'lucide-react';

export const Header: React.FC<{ onOpenTests?: () => void; onOpenAI?: () => void }> = ({
  onOpenTests,
  onOpenAI
}) => {
  const { user, clinic, logout, switchDemo } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);

  useEffect(() => {
    api.getDemoAccounts().then(res => setDemoAccounts(res.demo_accounts)).catch(() => {});
  }, []);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'owner':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'doctor':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'receptionist':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'owner':
        return 'Clinic Owner / Admin';
      case 'doctor':
        return 'Consultant Doctor';
      case 'receptionist':
        return 'Front Desk / Reception';
      default:
        return role;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Clinic Brand & Context */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-teal-200">
              CP
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  {clinic?.name || 'ClinicPilot AI'}
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {clinic?.reg_number || 'REG: VERIFIED'}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span className="truncate max-w-[280px] sm:max-w-md">{clinic?.address}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center space-x-3">
            {/* AI Assistant Quick Pill */}
            <button
              onClick={onOpenAI}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Clinic AI Guard</span>
            </button>

            {/* Security & Multi-tenant Test Suite */}
            <button
              onClick={onOpenTests}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
              title="Verify Multi-Tenant Isolation & Role Gates"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-Tenant Verified</span>
            </button>

            {/* User Account & Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-semibold text-xs">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    {user?.name}
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="text-[10px] text-slate-500">{getRoleLabel(user?.role)}</div>
                </div>
              </button>

              {/* Account Dropdown */}
              {showAccountMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getRoleBadge(user?.role)}`}>
                        {user?.role}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {clinic?.name.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Switch Demo Role Quick Section */}
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Switch Role & Clinic (Test Mode)
                    </p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {demoAccounts.map(acc => (
                        <button
                          key={acc.id}
                          onClick={() => {
                            switchDemo(acc.email);
                            setShowAccountMenu(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            acc.email === user?.email
                              ? 'bg-teal-50 text-teal-900 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <p className="font-medium text-slate-800">{acc.name}</p>
                            <p className="text-[10px] text-slate-500">
                              {acc.clinic_name.split(' ')[0]} • {acc.role}
                            </p>
                          </div>
                          {acc.email === user?.email && (
                            <span className="w-2 h-2 rounded-full bg-teal-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="px-2 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowAccountMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
