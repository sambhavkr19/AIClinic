import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Header } from './components/layout/Header.js';
import { Sidebar, TabType } from './components/layout/Sidebar.js';
import { DashboardView } from './components/dashboard/DashboardView.js';
import { AppointmentsView } from './components/appointments/AppointmentsView.js';
import { PatientsView } from './components/patients/PatientsView.js';
import { DoctorWorkspaceView } from './components/doctor/DoctorWorkspaceView.js';
import { BillingView } from './components/billing/BillingView.js';
import { AIAssistantView } from './components/ai/AIAssistantView.js';
import { SettingsView } from './components/settings/SettingsView.js';
import { AuditAndTestsView } from './components/audit/AuditAndTestsView.js';
import { LoginModal } from './components/auth/LoginModal.js';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [activeConsultationApptId, setActiveConsultationApptId] = useState<string | undefined>(undefined);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-teal-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl animate-pulse">
            CP
          </div>
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Initializing ClinicPilot AI...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginModal />;
  }

  const handleOpenDoctorWorkspace = (appointmentId: string) => {
    setActiveConsultationApptId(appointmentId);
    setCurrentTab('doctor-workspace');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        onOpenTests={() => setCurrentTab('audit-tests')}
        onOpenAI={() => setCurrentTab('ai-assistant')}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={setCurrentTab}
              onBookAppointment={() => setCurrentTab('appointments')}
            />
          )}

          {currentTab === 'appointments' && (
            <AppointmentsView onOpenDoctorWorkspace={handleOpenDoctorWorkspace} />
          )}

          {currentTab === 'patients' && <PatientsView />}

          {currentTab === 'doctor-workspace' && (
            <DoctorWorkspaceView initialAppointmentId={activeConsultationApptId} />
          )}

          {currentTab === 'billing' && <BillingView />}

          {currentTab === 'ai-assistant' && <AIAssistantView />}

          {currentTab === 'settings' && <SettingsView />}

          {currentTab === 'audit-tests' && <AuditAndTestsView />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
