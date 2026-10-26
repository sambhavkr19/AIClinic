import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { AuditLog } from '../../types/index.js';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  User,
  Filter,
  FileText,
  Lock,
  Database,
  Building
} from 'lucide-react';

export const AuditAndTestsView: React.FC = () => {
  const { user, clinic } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [testResults, setTestResults] = useState<
    Array<{ name: string; description: string; passed: boolean; details: string }>
  >([]);
  const [testStatus, setTestStatus] = useState<string>('IDLE');
  const [isLoadingTests, setIsLoadingTests] = useState<boolean>(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(true);
  const [filterAction, setFilterAction] = useState<string>('');

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      if (user?.role === 'owner') {
        const res = await api.getAuditLogs();
        setLogs(res.logs);
      } else {
        const dashRes = await api.getDashboard();
        setLogs(dashRes.recent_activity);
      }
    } catch (e) {
      console.error('Failed to fetch audit logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const runAutomatedVerification = async () => {
    setIsLoadingTests(true);
    try {
      const res = await api.runHealthTests();
      setTestResults(res.tests);
      setTestStatus(res.status);
    } catch (err: any) {
      setTestStatus('ERROR');
      alert(`Automated test failed: ${err.message}`);
    } finally {
      setIsLoadingTests(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    runAutomatedVerification();
  }, [clinic?.id]);

  const filteredLogs = filterAction
    ? logs.filter(l => l.action.toLowerCase().includes(filterAction.toLowerCase()))
    : logs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Security Ledger & Automated Verification Suite</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time audit log of all clinical and billing actions • Multi-tenant isolation verification
          </p>
        </div>

        <button
          onClick={runAutomatedVerification}
          disabled={isLoadingTests}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTests ? 'animate-spin' : ''}`} />
          Run Verification Suite
        </button>
      </div>

      {/* AUTOMATED TEST SUITE STATUS CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Automated Multi-Tenant & Security Tests
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            {testResults.filter(t => t.passed).length}/{testResults.length} Tests Passing
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {testResults.map((t, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                t.passed ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  {t.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  {t.name}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-800">
                  {t.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">{t.description}</p>
              <p className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/60">
                {t.details}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              System Audit Event Stream ({filteredLogs.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter by action (e.g. PAYMENT, REGISTER)..."
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
            />
            <button
              onClick={fetchLogs}
              className="p-1 text-slate-500 hover:text-slate-700"
              title="Refresh Logs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isLoadingLogs ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading audit trail...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs">No audit events match your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Authorised Actor</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Audit Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-sans font-medium text-slate-900">
                      <div>{l.user_name}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">{l.user_role}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {l.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-sans">
                      {l.target_type} <span className="font-mono text-slate-400 text-[10px]">#{l.target_id.slice(-6)}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 text-[11px] truncate max-w-xs">
                      {typeof l.details === 'string' ? l.details : JSON.stringify(l.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
