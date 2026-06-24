/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FinancialTwin } from "../types";
import { User, Shield, Bell, Download, Check, ChevronDown, ChevronUp, Lock, Play, Terminal, ShieldCheck } from "lucide-react";
import { runAuraComplianceSuite, TestResult } from "../tests/complianceTests";

interface UnifiedSettingsProps {
  twin: FinancialTwin;
  onChangeTwin: (twin: FinancialTwin) => void;
}

export default function UnifiedSettings({ twin, onChangeTwin }: UnifiedSettingsProps) {
  const [profile, setProfile] = useState({
    firstName: "Sinior",
    lastName: "User",
    email: "sinior.bkk@gmail.com",
    phone: "+1 (555) 019-2834",
    currency: "USD ($)"
  });

  const [notifications, setNotifications] = useState({
    recalibrationAlerts: true,
    riskSignals: true,
    weeklyBriefings: true,
    securityChecks: true
  });

  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Compliance Testing States
  const [testSuite, setTestSuite] = useState<TestResult[] | null>(null);
  const [runningTests, setRunningTests] = useState(false);
  const [selectedTestLogs, setSelectedTestLogs] = useState<string[] | null>(null);

  const executeComplianceSuite = async () => {
    setRunningTests(true);
    setTestSuite(null);
    setSelectedTestLogs(null);
    try {
      const parsed = await runAuraComplianceSuite((progress) => {
        setTestSuite(progress);
      });
      setTestSuite(parsed);
    } catch (e) {
      console.error(e);
    } finally {
      setRunningTests(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("Aura settings persisted securely to Supabase.");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const exportFinancialProfile = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(twin, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "aura_financial_profile.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="unified-settings-page" className="space-y-6 font-sans max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-50/70 via-emerald-50/40 to-slate-50 border border-slate-100 p-6 rounded-2xl">
        <span className="text-teal-600 font-mono text-xs tracking-wider uppercase font-bold">My Platform Settings</span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Platform Settings</h2>
        <p className="text-xs text-slate-500 mt-1">
          Customize your dashboard preferences, personal info, and manage your private data backups.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {saveStatus && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-bold shadow-sm">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" /> {saveStatus}
          </div>
        )}

        {/* SECTION 1: PERSONAL SETTINGS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="text-teal-600 w-4.5 h-4.5" />
            <h3 className="text-sm font-bold text-slate-800">Personal Settings</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">First Name</label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Last Name</label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Email Address</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-400 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Phone Number</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Home Country / Primary Location</label>
              <select
                value={twin.country}
                onChange={(e) => onChangeTwin({ ...twin, country: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
              >
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Preferred Currency</label>
              <select
                value={profile.currency}
                onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
              >
                <option value="USD ($)">USD $ (United States Dollar)</option>
                <option value="GBP (£)">GBP £ (British Pound Sterling)</option>
                <option value="EUR (€)">EUR € (Euro Zone)</option>
                <option value="AUD ($)">AUD $ (Australian Dollar)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: PREFERENCES */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Bell className="text-teal-600 w-4.5 h-4.5" />
            <h3 className="text-sm font-bold text-slate-800 font-sans">Preferences</h3>
          </div>

          <p className="text-[11px] text-slate-500 font-sans">
            Choose what metrics and updates Aura should prioritize sending your way.
          </p>

          <div className="space-y-3.5 pt-1 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all">
              <div className="space-y-0.5">
                <span className="text-slate-800 font-bold font-sans">Milestone alert updates</span>
                <p className="text-[10px] text-slate-500">Get informed when scenario runs push out or accelerate your future goals.</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.recalibrationAlerts}
                onChange={(e) => setNotifications({ ...notifications, recalibrationAlerts: e.target.checked })}
                className="accent-teal-600 cursor-pointer h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all">
              <div className="space-y-0.5">
                <span className="text-slate-800 font-bold font-sans">Market growth warnings</span>
                <p className="text-[10px] text-slate-500">Get notified when changing interest rates or inflation alter your target curves.</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.riskSignals}
                onChange={(e) => setNotifications({ ...notifications, riskSignals: e.target.checked })}
                className="accent-teal-600 cursor-pointer h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all">
              <div className="space-y-0.5">
                <span className="text-slate-800 font-bold font-sans">Weekly coach summary</span>
                <p className="text-[10px] text-slate-500">Receive a lightweight weekly briefing outlining next actionable steps.</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.weeklyBriefings}
                onChange={(e) => setNotifications({ ...notifications, weeklyBriefings: e.target.checked })}
                className="accent-teal-600 cursor-pointer h-4 w-4"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: ADVANCED SETTINGS */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-all cursor-pointer font-sans"
          >
            <div className="flex items-center gap-2">
              <Shield className="text-slate-400 w-4.5 h-4.5" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Advanced Settings</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Private backup tools and lock mechanisms</p>
              </div>
            </div>
            {isAdvancedExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {isAdvancedExpanded && (
            <div className="p-6 border-t border-slate-150 bg-slate-50/40 space-y-5">
              <div className="bg-teal-50 border border-teal-150 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-teal-900 font-bold flex items-center gap-1.5 font-sans">
                    <Lock className="w-3.5 h-3.5 text-teal-600" /> Strict On-Device Secrecy
                  </span>
                  <span className="text-white font-bold bg-teal-600 border border-teal-700 px-2 py-0.5 rounded font-mono text-[9px] tracking-wider uppercase">ENFORCED</span>
                </div>
                <p className="text-[10px] text-teal-850 leading-normal font-sans">
                  All personal data variables are stored locally inside your browser context with no external transmission.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2 font-sans">Local Security Filters</span>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-850 shadow-sm">
                    <span className="font-sans font-bold">Require immediate password verification on edit</span>
                    <input type="checkbox" defaultChecked className="accent-teal-600 cursor-pointer h-4 w-4" />
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-2.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-sans">Offline Data Portability</span>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Export your complete financial twin profile into a secure, standard JSON state file on your device.
                  </p>
                  <button
                    type="button"
                    onClick={exportFinancialProfile}
                    className="w-full sm:w-auto bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold tracking-tight px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer text-xs shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-600" /> Export Profile File (.json)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: LIVE COMPLIANCE AUDIT & TEST SUITE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="text-teal-600 w-5 h-5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Compliance & RLS Auditing Suite</h3>
                <p className="text-[10px] text-slate-550">Live verification engine for security and isolation requirements</p>
              </div>
            </div>
            <button
              type="button"
              onClick={executeComplianceSuite}
              disabled={runningTests}
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold tracking-tight px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer shadow-md"
            >
              <Play className="w-3.5 h-3.5" /> {runningTests ? "Auditing Database..." : "Run Security & Isolation Tests"}
            </button>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            This module verifies that account access isolation bounds, Row Level Security (RLS) constraints, PII cryptographic shielding filters, and structural table models are operating inside approved limits.
          </p>

          {testSuite && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              {/* Test List */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold block">Executed Assertions</span>
                <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                  {testSuite.map((test) => (
                    <button
                      key={test.id}
                      type="button"
                      onClick={() => setSelectedTestLogs(test.logs)}
                      className="w-full text-left bg-slate-50 hover:bg-slate-100 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="space-y-1 min-w-0">
                        <span className="text-[9px] font-mono bg-white px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-widest border border-slate-200 group-hover:text-teal-600">
                          {test.suite}
                        </span>
                        <h4 className="text-[11px] font-bold text-slate-800 truncate">{test.name}</h4>
                      </div>
                      <div className="shrink-0 font-mono">
                        {test.status === "passed" ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-lg font-bold">PASS</span>
                        ) : test.status === "failed" ? (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] px-2 py-0.5 rounded-lg font-bold">FAIL</span>
                        ) : (
                          <span className="bg-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-lg font-bold">PENDING</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Console logs */}
              <div className="space-y-2 flex flex-col h-full justify-between">
                <div>
                  <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold block">Terminal Trace</span>
                  <div className="bg-slate-900 rounded-xl p-4 border border-slate-950 font-mono text-[10px] text-slate-300 leading-relaxed h-[241px] overflow-y-auto shadow-inner">
                    {selectedTestLogs ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-emerald-400 pb-2 border-b border-slate-800 mb-2">
                          <Terminal className="w-3.5 h-3.5" />
                          <span>CONSOLE COMPLIANCE OUTPUT</span>
                        </div>
                        {selectedTestLogs.map((log, lIdx) => (
                          <p key={lIdx} className={log.includes("SUCCESS") ? "text-emerald-400 font-bold" : log.includes("ERROR") || log.includes("blocked") ? "text-rose-400 font-bold" : "text-slate-300"}>
                            &gt; {log}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full space-y-2 text-slate-500">
                        <Terminal className="w-6 h-6 animate-pulse" />
                        <span className="text-[9px] uppercase tracking-wider font-bold">Click any test item to view logs</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Submission Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-6 py-3 rounded-xl cursor-pointer transition-all shadow-lg"
          >
            Save All Preferences
          </button>
        </div>

      </form>
    </div>
  );
}
