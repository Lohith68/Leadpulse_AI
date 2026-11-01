import React, { useState } from 'react';
import {
  X,
  Target,
  Sparkles,
  Shield,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  Clock,
  UserCheck,
  Send,
  Lock,
} from 'lucide-react';
import { Lead, Activity, Company, Contact, SalesRep, ConsentStatus } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { Badge } from '../common/Badge';
import { generateAIPitch } from '../../services/aiService';

interface LeadDetailsDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onOpenConvertModal: (lead: Lead) => void;
  onOpenActivityModal: (lead: Lead) => void;
}

export const LeadDetailsDrawer: React.FC<LeadDetailsDrawerProps> = ({
  lead,
  onClose,
  onOpenConvertModal,
  onOpenActivityModal,
}) => {
  const {
    companies,
    contacts,
    activities,
    salesReps,
    updateLeadConsent,
    assignRepToLead,
    recalculateLeadScoreAction,
    tasks,
  } = useCRM();

  const [aiPitch, setAiPitch] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [selectedRepId, setSelectedRepId] = useState<string>('');
  const [assignMessage, setAssignMessage] = useState<{ text: string; error?: boolean } | null>(null);

  if (!lead) return null;

  const company = companies.find(c => c.id === lead.companyId);
  const contact = contacts.find(c => c.id === lead.contactId);
  const assignedRep = salesReps.find(r => r.id === lead.assignedRepId);
  const leadActivities = activities.filter(a => a.leadId === lead.id);
  const leadTasks = tasks.filter(t => t.leadId === lead.id);

  const breakdown = lead.scoreBreakdown;

  const handleGeneratePitch = async () => {
    setIsGeneratingAi(true);
    try {
      const pitch = await generateAIPitch(lead, company, contact, leadActivities);
      setAiPitch(pitch);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAssignRep = async () => {
    if (!selectedRepId) return;
    setAssignMessage(null);
    const res = await assignRepToLead(lead.id, selectedRepId);
    if (res.success) {
      setAssignMessage({ text: res.message, error: false });
    } else {
      setAssignMessage({ text: res.message, error: true });
    }
  };

  const handleConsentToggle = async (status: ConsentStatus) => {
    await updateLeadConsent(lead.id, status);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {lead.id}
                </span>
                <Badge
                  variant={
                    lead.scoreCategory === 'HOT'
                      ? 'hot'
                      : lead.scoreCategory === 'WARM'
                      ? 'warm'
                      : 'cold'
                  }
                  size="md"
                >
                  {lead.scoreCategory} ({lead.totalScore} pts)
                </Badge>
                {lead.isDuplicate && <Badge variant="warning">Duplicate Group</Badge>}
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {company?.name || 'Enterprise Account'}
              </h2>
              <p className="text-xs text-slate-500">
                {contact?.firstName} {contact?.lastName} • {contact?.jobTitle} • {lead.territory}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Bar */}
          <div className="px-6 py-2.5 bg-slate-100/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenConvertModal(lead)}
                disabled={lead.lifecycleStatus === 'CONVERTED'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors disabled:opacity-50"
              >
                <Briefcase className="w-3.5 h-3.5" />
                {lead.lifecycleStatus === 'CONVERTED' ? 'Converted' : 'Convert to Opportunity'}
              </button>

              <button
                onClick={() => onOpenActivityModal(lead)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 shadow-2xs transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-purple-600" />
                Log Touchpoint
              </button>
            </div>

            <button
              onClick={() => recalculateLeadScoreAction(lead.id)}
              className="inline-flex items-center gap-1.5 text-purple-700 hover:text-purple-800 font-semibold"
            >
              <Target className="w-3.5 h-3.5" />
              Recalculate Score
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. SCORE BREAKDOWN TRANSPARENCY (Module 3) */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-700" />
                  <span className="text-sm font-bold text-slate-900">
                    Transparent Lead Score Breakdown (Max 100)
                  </span>
                </div>
                <span className="text-base font-black text-slate-900">{lead.totalScore} / 100</span>
              </div>

              {/* Score Meters */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Company Fit</span>
                    <span className="font-bold text-slate-900">{lead.fitScore} / 30</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(lead.fitScore / 30) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Size, Industry, Role</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Purchase Intent</span>
                    <span className="font-bold text-slate-900">{lead.intentScore} / 40</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${(lead.intentScore / 40) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Pricing, Demo, Inquiry</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Engagement</span>
                    <span className="font-bold text-slate-900">{lead.engagementScore} / 30</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all"
                      style={{ width: `${(lead.engagementScore / 30) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Email, Web, Events</span>
                </div>
              </div>

              {/* Explanatory Reasons */}
              {breakdown && (
                <div className="text-xs space-y-1.5 pt-2 border-t border-slate-200 text-slate-600">
                  <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">
                    Scoring Rationale & Fact Log
                  </div>
                  <ul className="space-y-1 list-disc list-inside text-[11px]">
                    {breakdown.fitDetails.reasoning.map((r, i) => (
                      <li key={`fit-${i}`} className="text-slate-600">{r}</li>
                    ))}
                    {breakdown.intentDetails.reasoning.map((r, i) => (
                      <li key={`intent-${i}`} className="text-purple-700 font-medium">{r}</li>
                    ))}
                    {breakdown.engagementDetails.reasoning.map((r, i) => (
                      <li key={`eng-${i}`} className="text-slate-600">{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 2. REGULATORY CONSENT & GDPR/CCPA STATUS (Module 4) */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-900">Regulatory Consent Guard</span>
                </div>
                <Badge
                  variant={
                    lead.consentStatus === 'OPTED_IN'
                      ? 'success'
                      : lead.consentStatus === 'OPTED_OUT' || lead.consentStatus === 'WITHDRAWN'
                      ? 'danger'
                      : 'warning'
                  }
                  size="md"
                >
                  {lead.consentStatus}
                </Badge>
              </div>

              <div className="text-xs text-slate-500">
                {lead.consentStatus === 'OPTED_IN' ? (
                  <p className="text-emerald-700 font-medium">
                    Consent verified. Automated marketing and representative outreach permitted.
                  </p>
                ) : (
                  <p className="text-rose-700 font-medium">
                    Strict Regulatory Restriction: Automated communications & tasks are blocked for this lead.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-slate-500">Update Consent:</span>
                <button
                  onClick={() => handleConsentToggle('OPTED_IN')}
                  className={`px-2.5 py-1 text-xs rounded-md font-semibold border ${
                    lead.consentStatus === 'OPTED_IN'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Opted In
                </button>
                <button
                  onClick={() => handleConsentToggle('OPTED_OUT')}
                  className={`px-2.5 py-1 text-xs rounded-md font-semibold border ${
                    lead.consentStatus === 'OPTED_OUT'
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Opted Out
                </button>
                <button
                  onClick={() => handleConsentToggle('PENDING')}
                  className={`px-2.5 py-1 text-xs rounded-md font-semibold border ${
                    lead.consentStatus === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>

            {/* 3. AI STRATEGY & PITCH GENERATOR (Gemini API) */}
            <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-700" />
                  <span className="text-sm font-bold text-slate-900">
                    Gemini AI Executive Brief & Pitch Strategy
                  </span>
                </div>
                <button
                  onClick={handleGeneratePitch}
                  disabled={isGeneratingAi}
                  className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isGeneratingAi ? 'Analyzing...' : aiPitch ? 'Regenerate Brief' : 'Generate AI Brief'}
                </button>
              </div>

              {aiPitch ? (
                <div className="bg-white p-3.5 rounded-lg border border-purple-100 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans max-h-72 overflow-y-auto">
                  {aiPitch}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Generate an AI-powered sales pitch, email template, and pain point analysis tailored specifically to {company?.name}'s size, industry, and activity timeline.
                </p>
              )}
            </div>

            {/* 4. TERRITORY ROUTING & REP ASSIGNMENT (Module 6) */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-700" />
                  <span className="text-sm font-bold text-slate-900">Territory & Rep Routing</span>
                </div>
                <Badge variant={lead.routingStatus === 'ASSIGNED' ? 'success' : 'warning'}>
                  {lead.routingStatus}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Territory Boundary:</span>
                  <span className="font-bold text-slate-800">{lead.territory}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Product Specialization:</span>
                  <span className="font-bold text-slate-800">{lead.productInterest}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block font-medium">Assigned Representative:</span>
                  <span className="font-semibold text-slate-900">
                    {assignedRep ? `${assignedRep.name} (${assignedRep.email} • ${assignedRep.territory})` : 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Rep Reassignment */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <select
                  value={selectedRepId}
                  onChange={e => setSelectedRepId(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="">Select Sales Rep...</option>
                  {salesReps.map(rep => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name} ({rep.territory} • {rep.specialization}) - {rep.activeLeadsCount}/{rep.capacityLimit}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignRep}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
                >
                  Assign
                </button>
              </div>

              {assignMessage && (
                <div
                  className={`text-xs p-2 rounded-md ${
                    assignMessage.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {assignMessage.text}
                </div>
              )}
            </div>

            {/* 5. FOLLOW-UP TASKS (Module 7) */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-700" />
                  <span className="text-sm font-bold text-slate-900">Follow-up SLA Tasks</span>
                </div>
                <span className="text-xs text-slate-400">{leadTasks.length} Scheduled</span>
              </div>

              {leadTasks.length === 0 ? (
                <p className="text-xs text-slate-400">No active tasks for this lead.</p>
              ) : (
                <div className="space-y-2">
                  {leadTasks.map(t => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{t.title}</div>
                        <div className="text-[11px] text-slate-400">
                          Due: {new Date(t.dueDate).toLocaleDateString()} • Priority: {t.priority}
                        </div>
                      </div>
                      <Badge variant={t.status === 'COMPLETED' ? 'success' : 'info'}>
                        {t.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. CHRONOLOGICAL ACTIVITY AUDIT TRAIL */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Touchpoint Audit Trail</span>
                <span className="text-xs text-slate-400">{leadActivities.length} Events</span>
              </div>

              {leadActivities.length === 0 ? (
                <p className="text-xs text-slate-400">No activities recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {leadActivities.map(act => (
                    <div
                      key={act.id}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-800">{act.type}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(act.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-purple-700">
                          +{act.pointsContributed} pts
                        </span>
                        {act.isPostConversion && (
                          <div className="text-[10px] text-rose-600 font-semibold">Post-Conversion</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
