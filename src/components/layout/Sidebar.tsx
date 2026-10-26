import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Stethoscope,
  Receipt,
  Sparkles,
  Settings,
  ShieldAlert,
  Lock,
  Building
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'appointments'
  | 'patients'
  | 'doctor-workspace'
  | 'billing'
  | 'ai-assistant'
  | 'settings'
  | 'audit-tests';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, clinic } = useAuth();
  const isDoctorOrOwner = user?.role === 'doctor' || user?.role === 'owner';
  const isOwner = user?.role === 'owner';

  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Main Dashboard',
      icon: LayoutDashboard,
      roles: ['owner', 'doctor', 'receptionist']
    },
    {
      id: 'appointments' as TabType,
      label: 'OPD Queue & Calendar',
      icon: CalendarDays,
      roles: ['owner', 'doctor', 'receptionist']
    },
    {
      id: 'patients' as TabType,
      label: 'Patient Management',
      icon: Users,
      roles: ['owner', 'doctor', 'receptionist']
    },
    {
      id: 'doctor-workspace' as TabType,
      label: 'Doctor Workspace',
      icon: Stethoscope,
      roles: ['owner', 'doctor'],
      restrictedMessage: 'Doctors only'
    },
    {
      id: 'billing' as TabType,
      label: 'Billing & Receipts',
      icon: Receipt,
      roles: ['owner', 'receptionist', 'doctor']
    },
    {
      id: 'ai-assistant' as TabType,
      label: 'AI Admin Assistant',
      icon: Sparkles,
      roles: ['owner', 'doctor', 'receptionist'],
      badge: 'Gemini'
    },
    {
      id: 'settings' as TabType,
      label: 'Clinic & Staff Setup',
      icon: Settings,
      roles: ['owner'],
      restrictedMessage: 'Owner only'
    },
    {
      id: 'audit-tests' as TabType,
      label: 'Security & Audit Suite',
      icon: ShieldAlert,
      roles: ['owner', 'doctor', 'receptionist']
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      {/* Clinic Mini Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center space-x-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
          <Building className="w-3.5 h-3.5" />
          <span>Active Clinic Facility</span>
        </div>
        <p className="text-sm font-bold text-white truncate">{clinic?.name}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Timings: {clinic?.opening_time} - {clinic?.closing_time}
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isAllowed = item.roles.includes(user?.role || '');
          const isActive = currentTab === item.id;

          if (!isAllowed) {
            return (
              <div
                key={item.id}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-500 cursor-not-allowed opacity-60"
                title={`Restricted: Available to ${item.restrictedMessage || 'authorized personnel'}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span>{item.label}</span>
                </div>
                <Lock className="w-3.5 h-3.5 text-slate-600" />
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs shadow-teal-500/20 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/30 text-teal-300 border border-teal-400/40">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/30 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span>Logged in as:</span>
          <span className="text-teal-400 font-semibold capitalize">{user?.role}</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500 font-mono">
          Clinic ID: {clinic?.id}
        </div>
      </div>
    </aside>
  );
};
