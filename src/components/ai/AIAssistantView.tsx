import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import {
  Sparkles,
  ShieldAlert,
  MessageSquare,
  HelpCircle,
  BarChart3,
  FileText,
  Copy,
  Check,
  Send,
  AlertTriangle,
  HeartPulse
} from 'lucide-react';

export const AIAssistantView: React.FC = () => {
  const { user, clinic } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'clinic_faq' | 'patient_message' | 'admin_summary' | 'visit_summary_explainer'
  >('clinic_faq');

  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const samplePrompts = {
    clinic_faq: [
      'What are our clinic opening hours and doctor consultation fees?',
      'Which pediatric services and vaccination packages do we offer?',
      'What is our walk-in token policy and expected waiting buffer?'
    ],
    patient_message: [
      'Draft a polite WhatsApp reminder for Mr. Ramesh Chawla for his 10:00 AM follow-up tomorrow.',
      'Draft a friendly Hinglish holiday closure announcement for Diwali with emergency contact numbers.',
      'Draft a reminder for pediatric vaccination due date for Master Aarav with Dr. Priya Sen.'
    ],
    admin_summary: [
      'Summarize today’s clinic operational bottlenecks, waiting room load, and collected revenue.',
      'Provide an executive review of cancellation trends and follow-up adherence this week.',
      'Prepare recommendations for optimizing receptionist OPD token flow.'
    ],
    visit_summary_explainer: [
      'Explain a diagnosis of Acute Upper Respiratory Infection (URTI) with Calpol syrup 5ml and saline nasal drops in simple Hindi/English for parents.',
      'Draft take-home instructions for a newly diagnosed Type 2 Diabetes patient starting Metformin 500mg.',
      'Explain post-dressing wound care instructions in comforting layperson words.'
    ]
  };

  const handleRunAI = async (customPrompt?: string) => {
    const textToRun = customPrompt || prompt;
    if (!textToRun.trim()) return;

    setIsLoading(true);
    setResponse(null);
    try {
      const res = await api.askAssistant({
        action: activeTab,
        prompt: textToRun,
        additionalData: {
          requested_by: user?.name,
          role: user?.role
        }
      });
      setResponse(res.response);
      setDisclaimer(res.disclaimer);
    } catch (err: any) {
      alert(`AI execution error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-600" />
          <span>ClinicPilot AI Administrative Assistant</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Server-side Gemini 3.8 Flash • Guardrailed administrative workflows grounded in {clinic?.name}
        </p>
      </div>

      {/* Mandatory Safety Guardrail & Ethical Boundaries Banner */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-900 shadow-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-950 flex items-center gap-1.5">
            <span>Clinical Safety Guardrails & Non-Diagnostic Compliance Notice</span>
          </p>
          <p className="text-[11px] leading-relaxed text-amber-800">
            This AI assistant is engineered exclusively for <strong>administrative operations, clinic FAQ answering, patient communication drafting, and translating approved doctor notes</strong> into patient-friendly layperson language. It does <strong>not</strong> diagnose medical conditions, prescribe drugs, or alter clinical treatment. Urgent or life-threatening symptoms must always be directed immediately to hospital emergency departments.
          </p>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <button
          onClick={() => {
            setActiveTab('clinic_faq');
            setResponse(null);
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === 'clinic_faq'
              ? 'border-teal-500 bg-teal-50/70 shadow-xs text-teal-950 font-semibold'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold">Clinic FAQ & Policies</span>
          </div>
          <p className="text-[10px] text-slate-500">Grounded in clinic hours, doctor specialties, fees</p>
        </button>

        <button
          onClick={() => {
            setActiveTab('patient_message');
            setResponse(null);
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === 'patient_message'
              ? 'border-teal-500 bg-teal-50/70 shadow-xs text-teal-950 font-semibold'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold">Patient Comms Drafter</span>
          </div>
          <p className="text-[10px] text-slate-500">WhatsApp / SMS in polite English & Hinglish</p>
        </button>

        <button
          onClick={() => {
            setActiveTab('admin_summary');
            setResponse(null);
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === 'admin_summary'
              ? 'border-teal-500 bg-teal-50/70 shadow-xs text-teal-950 font-semibold'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold">Operational Brief</span>
          </div>
          <p className="text-[10px] text-slate-500">Summarizes footfall, revenue & bottlenecks</p>
        </button>

        <button
          onClick={() => {
            setActiveTab('visit_summary_explainer');
            setResponse(null);
          }}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === 'visit_summary_explainer'
              ? 'border-teal-500 bg-teal-50/70 shadow-xs text-teal-950 font-semibold'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <HeartPulse className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold">Take-Home Explainer</span>
          </div>
          <p className="text-[10px] text-slate-500">Explains doctor prescription in simple words</p>
        </button>
      </div>

      {/* Main Interaction Canvas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        {/* Sample Prompt Chips */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Suggested Scenarios for Indian Clinics:
          </label>
          <div className="flex flex-wrap gap-2">
            {samplePrompts[activeTab].map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(p);
                  handleRunAI(p);
                }}
                className="text-[11px] text-slate-700 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 rounded-lg px-2.5 py-1 transition-colors text-left"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input prompt */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            Your Instructions / Request:
          </label>
          <div className="flex gap-2">
            <textarea
              rows={3}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Type your inquiry or communication goal here..."
              className="flex-1 border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => handleRunAI()}
              disabled={isLoading || !prompt.trim()}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Synthesizing with Gemini...' : 'Execute Assistant'}
            </button>
          </div>
        </div>

        {/* AI Output Stream */}
        {response && (
          <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Assistant Generated Output:
              </span>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Text
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
              {response}
            </div>

            {disclaimer && (
              <p className="text-[10px] text-slate-400 italic">
                * {disclaimer}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
