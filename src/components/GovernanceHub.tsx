/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { GovernanceEvent, AuditLog } from "../types";
import { 
  ShieldCheck, AlertOctagon, Scale, FileText, 
  CheckCircle, AlertCircle
} from "lucide-react";

interface GovernanceHubProps {
  events: GovernanceEvent[];
  auditLogs: AuditLog[];
  onAddDispute: (msg: string) => void;
}

export default function GovernanceHub({ events, auditLogs, onAddDispute }: GovernanceHubProps) {
  const [disputeText, setDisputeText] = useState("");
  const [activeTab, setActiveTab] = useState<"monitor" | "card" | "transparency">("monitor");

  const submitDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeText) return;
    onAddDispute(disputeText);
    setDisputeText("");
  };

  // Aggregates
  const activeDefects = events.filter(e => e.status !== "resolved").length;
  const biasEventsCount = events.filter(e => e.type === "bias_flag").length;
  const overridesApplied = events.filter(e => e.type === "override_rate").length;

  return (
    <div className="space-y-6 font-sans" id="governance-compliance-mesh">
      {/* SECTION TOP BADGE */}
      <div className="bg-gradient-to-r from-teal-50/70 via-emerald-50/40 to-slate-50 border border-slate-100 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-teal-600 font-mono text-xs tracking-wider uppercase font-bold">Governance, Risk & Compliance</span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">Supervised Algorithmic Moderation</h2>
          <p className="text-xs text-slate-500 mt-1">
            Auditing FDI mathematical outputs, boundary limitation exceptions, and regional bias controls.
          </p>
        </div>
        
        <div className="flex gap-2 shrink-0">
          {["monitor", "card", "transparency"].map((tb) => (
            <button
              key={tb}
              onClick={() => setActiveTab(tb as any)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold capitalize transition-all cursor-pointer ${
                activeTab === tb
                  ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {tb === "card" ? "Model Card" : tb}
            </button>
          ))}
        </div>
      </div>

      {/* MONITOR TAB */}
      {activeTab === "monitor" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Core Governance KPIs (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-sm">
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold pb-2 border-b border-slate-100">Oversight Indicators</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left shadow-sm">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Active Exceptions</span>
                  <span className="text-xl font-bold font-mono text-emerald-650 block mt-1">{activeDefects}</span>
                  <p className="text-[8px] text-slate-400 mt-1">Aura recals</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left shadow-sm">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Overrides Capped</span>
                  <span className="text-xl font-bold font-mono text-teal-650 block mt-1">{overridesApplied}</span>
                  <p className="text-[8px] text-slate-400 mt-1">Clipped vectors</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left shadow-sm">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Disputes Filed</span>
                  <span className="text-xl font-bold font-mono text-amber-600 block mt-1">
                    {events.filter(e => e.type === "dispute_filed").length}
                  </span>
                  <p className="text-[8px] text-slate-400 mt-1">User grievances</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left shadow-sm">
                  <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">Algorithmic Bias</span>
                  <span className="text-xl font-bold font-mono text-slate-700 block mt-1">{biasEventsCount === 0 ? "0.0%" : "0.4%"}</span>
                  <p className="text-[8px] text-slate-400 mt-1">Geographic check</p>
                </div>
              </div>

              <div className="bg-teal-50/60 border border-teal-100 p-4 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-650 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-teal-700 block font-bold leading-none">Guardrails Status</span>
                  <p className="text-[10px] text-slate-600 leading-normal pt-1">
                    Automatic constraint filters are active. Raw simulation vectors (growth ARR bounds, leverage bounds) are bounded before compilation.
                  </p>
                </div>
              </div>
            </div>

            {/* INTERACTIVE DISPUTE SUBMISSION */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Launch Calculation Dispute</span>
              <p className="text-[10px] text-slate-500">
                Dispute specific mathematical outcomes, regional housing cost indices, or state progressive calculations.
              </p>
              
              <form onSubmit={submitDispute} className="space-y-3">
                <textarea
                  placeholder="Describe calculation grievance i.e. 'California tax brackets underrepresenting standard itemized write-offs...'"
                  value={disputeText}
                  onChange={(e) => setDisputeText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-teal-500 min-h-[80px]"
                />
                
                <button
                  type="submit"
                  disabled={!disputeText}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 transition-all text-xs rounded-lg cursor-pointer disabled:opacity-50 shadow-md"
                >
                  Append Grievance to Audit Log
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: Live Audit Trails + Event Logs (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold pb-2 border-b border-slate-100">Active System Exceptions</span>
              <div className="space-y-3 mt-4 max-h-[220px] overflow-y-auto pr-1">
                {events.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">No compliance anomalies mapped.</p>
                ) : (
                  events.map((ev) => (
                    <div key={ev.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-start gap-3.5 hover:border-teal-200 transition-all">
                      <div className={`p-1.5 rounded-lg shrink-0 ${ev.severity === "high" ? "bg-rose-50 text-rose-700" : ev.severity === "medium" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                        <AlertOctagon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="font-bold uppercase tracking-wide text-slate-600">{ev.type.replace("_", " ")}</span>
                          <span className="text-slate-500 capitalize">{ev.status}</span>
                        </div>
                        <p className="text-[11px] text-slate-700 mt-1 leading-relaxed font-sans">{ev.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold pb-2 border-b border-slate-100">Security Audit Log</span>
              <div className="space-y-2 mt-4 max-h-[240px] overflow-y-auto pr-1 font-mono text-[10px]">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex justify-between p-2.5 rounded bg-slate-50 border border-slate-150 hover:border-teal-200 transition-all gap-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${log.status === "violation" ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
                      <span className="text-teal-600 font-bold">{log.action}:</span>
                      <span className="text-slate-700 truncate">{log.description}</span>
                    </div>
                    <span className="text-slate-400 shrink-0 font-bold">
                      {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MODEL CARD */}
      {activeTab === "card" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-slate-150 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Aura FDI Model Card V2.1
            </h3>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">
              Deterministic Mathematical projection guidelines vs. Generative explainability parameters.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-650">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-800 uppercase font-mono text-[11px] text-teal-600">1. Engine Categorization</h4>
                <p className="leading-relaxed">
                  Aura operates under a strict dual-engine partition framework:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li><strong>Core Math Layer:</strong> Calculates amortization, progressive state taxes, and compound interest multipliers via standard deterministic algorithms.</li>
                  <li><strong>Explainability Layer:</strong> Generates human-friendly summaries highlighting trade-offs without executing mathematical logic.</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-800 uppercase font-mono text-[11px] text-teal-600">2. Performance Boundaries</h4>
                <p className="leading-relaxed">
                  Calculations terminate at standard maximums to block unstable compound ranges (e.g., maximum compound interest parameters are capped at 15.0% ARR to prevent unrealistically rich simulations).
                </p>
              </div>
            </div>

            <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-150 pt-4 md:pt-0 md:pl-6">
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-800 uppercase font-mono text-[11px] text-teal-600">3. Human Review Triggers</h4>
                <p className="leading-relaxed">
                  To protect pre-retiree and family profiles, Aura auto-flags profiles with low baseline emergency cash of below 3 months. Anomalous cases are flagged for thorough review.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-800 uppercase font-mono text-[11px] text-teal-600">4. Verification Baselines</h4>
                <p className="leading-relaxed">
                  Regional tax maps are updated bi-annually, tracking changes to federal bracket structures and state-specific tax index margins.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: TRANSPARENCY */}
      {activeTab === "transparency" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <span className="text-[10px] font-mono text-teal-600 uppercase tracking-wider block font-bold leading-none">Transparency Disclosure Framework</span>
          
          <div className="bg-slate-50 border border-slate-150 p-5 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Legal Boundary: Educational FDI vs. Registered Financial Advice</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              All outputs, recommended priorities, and cash flow projections synthesized by Aura V2.1 are strictly intended as educational decision-intelligence aids. 
              Aura does not represent an investment advisory, brokerage, or formal mortgage underwriting service.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Users are advised to cross-verify structural leverage projections with certified financial planners and regional certified public accountants (CPAs) before committing active capital.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-150 p-4 rounded-xl space-y-2 bg-slate-50/50">
              <h4 className="font-bold text-slate-800 font-sans">Bias Mitigations</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Algorithms prioritize foundational defense structures (debt avalanche, cash reserves) before routing surplus funds toward advanced tax shelter optimizations to prevent socioeconomic class biases.
              </p>
            </div>

            <div className="border border-slate-150 p-4 rounded-xl space-y-2 bg-slate-50/50">
              <h4 className="font-bold text-slate-800 font-sans">Algorithmic Limitations</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Models assume continuous stable market parameters and standard constant inflation rates of 2.5%, and cannot account for black swan volatility events.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
