/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FinancialTwin } from "../types";
import { User, Shield, Bell, Download, Check, ChevronDown, ChevronUp, Lock } from "lucide-react";

interface UnifiedSettingsProps {
  twin: FinancialTwin;
  onChangeTwin: (twin: FinancialTwin) => void;
}

export default function UnifiedSettings({ twin, onChangeTwin }: UnifiedSettingsProps) {
  const [profile, setProfile] = useState({
    firstName: "Sinior",
    lastName: "Bkk",
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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("Settings updated successfully.");
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
      <div>
        <span className="text-emerald-400 font-mono text-xs tracking-wider uppercase font-bold">My Platform Settings</span>
        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight mt-1">Platform Settings</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Customize your dashboard preferences, personal info, and manage your private data backups.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {saveStatus && (
          <div className="bg-emerald-950/25 border border-emerald-900/40 p-4 rounded-xl text-xs text-emerald-450 flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 shrink-0" /> {saveStatus}
          </div>
        )}

        {/* SECTION 1: PERSONAL SETTINGS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/60">
            <User className="text-emerald-405 w-4.5 h-4.5" />
            <h3 className="text-sm font-bold text-zinc-200">Personal Settings</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">First Name</label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-850 rounded p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">Last Name</label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-850 rounded p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">Email Address</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full bg-zinc-955 border border-zinc-850/60 rounded p-2.5 text-xs text-zinc-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">Phone Number</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-850 rounded p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">Home Country / Primary Location</label>
              <select
                value={twin.country}
                onChange={(e) => onChangeTwin({ ...twin, country: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-850 rounded p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block mb-1">Preferred Currency</label>
              <select
                value={profile.currency}
                onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-850 rounded p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/60">
            <Bell className="text-emerald-405 w-4.5 h-4.5" />
            <h3 className="text-sm font-bold text-zinc-200 font-sans">Preferences</h3>
          </div>

          <p className="text-[11px] text-zinc-400 font-sans">
            Choose what metrics and updates Aura should prioritize sending your way.
          </p>

          <div className="space-y-3.5 pt-1 text-xs">
            <div className="flex items-center justify-between p-1">
              <div className="space-y-0.5">
                <span className="text-zinc-250 font-medium font-sans">Milestone alert updates</span>
                <p className="text-[10px] text-zinc-505">Get informed when scenario runs push out or accelerate your future goals.</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.recalibrationAlerts}
                onChange={(e) => setNotifications({ ...notifications, recalibrationAlerts: e.target.checked })}
                className="accent-emerald-500 cursor-pointer h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between p-1">
              <div className="space-y-0.5">
                <span className="text-zinc-250 font-medium font-sans">Market growth warnings</span>
                <p className="text-[10px] text-zinc-505">Get notified when changing interest rates or inflation alter your target curves.</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.riskSignals}
                onChange={(e) => setNotifications({ ...notifications, riskSignals: e.target.checked })}
                className="accent-emerald-500 cursor-pointer h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between p-1">
              <div className="space-y-0.5">
                <span className="text-zinc-250 font-medium font-sans">Weekly coach summary</span>
                <p className="text-[10px] text-zinc-505">Receive a lightweight weekly briefing outlining next actionable steps.</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.weeklyBriefings}
                onChange={(e) => setNotifications({ ...notifications, weeklyBriefings: e.target.checked })}
                className="accent-emerald-500 cursor-pointer h-4 w-4"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: ADVANCED SETTINGS (COLLAPSED BY DEFAULT) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-850/20 transition-all cursor-pointer font-sans"
          >
            <div className="flex items-center gap-2">
              <Shield className="text-zinc-500 w-4.5 h-4.5" />
              <div>
                <h3 className="text-sm font-bold text-zinc-350">Advanced Settings</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Private backup tools and lock mechanisms</p>
              </div>
            </div>
            {isAdvancedExpanded ? (
              <ChevronUp className="w-5 h-5 text-zinc-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-500" />
            )}
          </button>

          {isAdvancedExpanded && (
            <div className="p-6 border-t border-zinc-805 bg-zinc-900/60 space-y-5">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300 font-semibold flex items-center gap-1.5 font-sans">
                    <Lock className="w-3.5 h-3.5 text-emerald-450" /> Strict On-Device Secrecy
                  </span>
                  <span className="text-emerald-450 font-bold bg-emerald-950/60 border border-emerald-900/50 px-2 py-0.5 rounded font-mono text-[9px] tracking-wider uppercase">ENFORCED</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal font-sans">
                  All personal data variables are stored locally inside your browser context with no external transmission.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2 font-sans">Local Security Filters</span>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-955 border border-zinc-850 text-xs text-zinc-300">
                    <span className="font-sans">Require immediate password verification on edit</span>
                    <input type="checkbox" defaultChecked className="accent-emerald-500 cursor-pointer h-4 w-4" />
                  </div>
                </div>

                <div className="border-t border-zinc-850/60 pt-4 space-y-2.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block font-sans">Offline Data Portability</span>
                  <p className="text-[11px] text-zinc-400 font-sans">
                    Export your complete financial twin profile into a secure, standard JSON state file on your device.
                  </p>
                  <button
                    type="button"
                    onClick={exportFinancialProfile}
                    className="w-full sm:w-auto bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-200 font-bold tracking-tight px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" /> Export Profile File (.json)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Submission Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-505 text-zinc-950 font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-emerald-900/10"
          >
            Save All Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
