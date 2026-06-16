/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FinancialTwin } from "../types";
import { User, Shield, Bell, Download, MapPin, Globe, Check, AlertCircle } from "lucide-react";

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
    weeklyBreifings: false,
    biasChecks: true
  });

  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("Profile factors updated in metadata memory stores successfully.");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const exportFinancialLedger = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(twin, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "aura_financial_twin_ledger.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="unified-settings-page" className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-emerald-400 font-mono text-xs tracking-wider uppercase font-bold">Aura Core Parameters</span>
        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight mt-1">Platform Settings</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Manage local secure metadata layers, progressive residency states, secure tokens, and ledger extractions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: PROFILE AND DETAILS */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile} className="bg-zinc-900 border border-zinc-805 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-zinc-200 tracking-tight flex items-center gap-2">
              <User className="text-emerald-405 w-4.5 h-4.5" /> Profile Identity Matrix
            </h3>

            {saveStatus && (
              <div className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" /> {saveStatus}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-zinc-500 font-mono block mb-1">FIRST NAME</label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded p-2.5 text-xs text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-mono block mb-1">LAST NAME</label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded p-2.5 text-xs text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-mono block mb-1">EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full bg-zinc-950/40 border border-zinc-850/60 rounded p-2.5 text-xs text-zinc-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-mono block mb-1">SECURED TELEPHONY NUMBER</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded p-2.5 text-xs text-zinc-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-505 text-zinc-950 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all"
              >
                Save Profile Changes
              </button>
            </div>
          </form>

          {/* LOCALIZATION & GLOBALIZATION */}
          <div className="bg-zinc-900 border border-zinc-805 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-zinc-200 tracking-tight flex items-center gap-2">
              <Globe className="text-emerald-405 w-4.5 h-4.5" /> Globalization & Localization Core
            </h3>
            <p className="text-xs text-zinc-400">
              Configure jurisdiction indices to map real estate capital appreciation coefficients and local pension plans.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-zinc-500 font-mono block mb-1">CURRENT COUNTRY BOUNDARY</label>
                <select
                  value={twin.country}
                  onChange={(e) => onChangeTwin({ ...twin, country: e.target.value })}
                  className="w-full bg-zinc-955 border border-zinc-850 rounded p-2.5 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="United States">United States (Active 50 States)</option>
                  <option value="United Kingdom">United Kingdom (Phase 2 Roadmap)</option>
                  <option value="Canada">Canada (Phase 2 Roadmap)</option>
                  <option value="Australia">Australia (Phase 2 Roadmap)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-mono block mb-1">PREFERRED CURRENCY DENOMINATION</label>
                <select
                  value={profile.currency}
                  onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                  className="w-full bg-zinc-955 border border-zinc-850 rounded p-2.5 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="USD ($)">USD $ (United States Dollar)</option>
                  <option value="GBP (£)">GBP £ (British Pound Sterling)</option>
                  <option value="EUR (€)">EUR € (Euro Zone)</option>
                  <option value="AUD ($)">AUD $ (Australian Dollar)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SECURITY & INTELLIGENT DEFAULTS */}
        <div className="space-y-6">
          {/* CRITICAL SECURITY TOKEN */}
          <div className="bg-zinc-900 border border-zinc-805 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-zinc-200 tracking-tight flex items-center gap-2">
              <Shield className="text-emerald-405 w-4.5 h-4.5" /> Hardware Security Protocols
            </h3>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Strict PII Isolation</span>
                <span className="text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900 px-1.5 py-0.5 rounded font-mono text-[9px]">ENFORCED</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed leading-normal">
                All PII financial variables are stored locally inside the sandbox container with zero transmission pathways.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-[10px] text-zinc-550 block font-mono">AUTHORIZED BIOMETRICS SECURITY</label>
              <div className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-850">
                <span className="text-xs text-zinc-300">Strict Passkey Verification</span>
                <input type="checkbox" defaultChecked className="accent-emerald-500 cursor-pointer" />
              </div>
            </div>
          </div>

          {/* SYSTEM ALERTER PREFERENCES */}
          <div className="bg-zinc-900 border border-zinc-805 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-zinc-200 tracking-tight flex items-center gap-2">
              <Bell className="text-emerald-405 w-4.5 h-4.5" /> Recalibration Notifications
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Algorithmic recalculations</span>
                <input
                  type="checkbox"
                  checked={notifications.recalibrationAlerts}
                  onChange={(e) => setNotifications({ ...notifications, recalibrationAlerts: e.target.checked })}
                  className="accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Regional risk volatility alerts</span>
                <input
                  type="checkbox"
                  checked={notifications.riskSignals}
                  onChange={(e) => setNotifications({ ...notifications, riskSignals: e.target.checked })}
                  className="accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-300">Bias monitoring triggers</span>
                <input
                  type="checkbox"
                  checked={notifications.biasChecks}
                  onChange={(e) => setNotifications({ ...notifications, biasChecks: e.checked })}
                  className="accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* LEDGER EXPORT */}
          <div className="bg-zinc-900 border border-zinc-805 rounded-2xl p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-zinc-200 tracking-tight flex items-center gap-2">
              <Download className="text-emerald-405 w-4.5 h-4.5" /> Export Twin Ledger
            </h3>
            <p className="text-zinc-400">
              Download your complete digital financial twin profile schema as a lightweight, secure JSON document.
            </p>
            <button
              onClick={exportFinancialLedger}
              className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-200 font-bold tracking-tight py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" /> Export ledger card (.json)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
