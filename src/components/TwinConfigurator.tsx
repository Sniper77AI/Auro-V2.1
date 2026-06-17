/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { FinancialTwin, IncomeSource, AssetItem, LiabilityItem } from "../types";
import { Plus, Trash2, ShieldAlert, DollarSign, Award, ArrowUpRight, Scale, Briefcase, ChevronRight, HelpCircle } from "lucide-react";
import { SupabaseService } from "../supabaseService";

interface TwinConfiguratorProps {
  twin: FinancialTwin;
  profileId: string;
  syncingState?: "synced" | "syncing" | "error";
  setSyncingState?: (state: "synced" | "syncing" | "error") => void;
  onChange: (updatedTwin: FinancialTwin, skipDbSave?: boolean) => void;
}

const US_STATES = [
  { code: "CA", name: "California (Prog. Tax to 13.3%)" },
  { code: "TX", name: "Texas (0.0% State Income Tax)" },
  { code: "NY", name: "New York (Prog. Tax to 10.9%)" },
  { code: "FL", name: "Florida (0.0% State Income Tax)" },
  { code: "IL", name: "Illinois (4.95% Flat State Tax)" },
  { code: "WA", name: "Washington (0.0% State Income Income Tax)" },
  { code: "MA", name: "Massachusetts (5.0% Flat State Tax)" },
  { code: "NV", name: "Nevada (0.0% State Income Tax)" },
  { code: "OH", name: "Ohio (Prog. Tax to 3.99%)" },
  { code: "NC", name: "North Carolina (4.5% Flat State Tax)" }
];

export default function TwinConfigurator({ twin, profileId, syncingState, setSyncingState, onChange }: TwinConfiguratorProps) {
  const [activeTab, setActiveTab ] = useState<"income" | "savings" | "debts" | "family" | "retirement" | "risk">("income");

  // Local state for adding entries easily
  const [newInc, setNewInc] = useState<Omit<IncomeSource, "id">>({
    name: "",
    amount: 50000,
    frequency: "annual",
    type: "salary"
  });

  const [newAsset, setNewAsset] = useState<Omit<AssetItem, "id">>({
    name: "",
    amount: 10000,
    type: "brokerage",
    annualGrowth: 0.07
  });

  const [newLiab, setNewLiab] = useState<Omit<LiabilityItem, "id">>({
    name: "",
    amount: 15000,
    interestRate: 0.06,
    monthlyPayment: 250,
    type: "student_loan"
  });

  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  const handleEditIncome = (id: string, field: keyof IncomeSource, value: any) => {
    const updatedIncomes = twin.incomes.map(inc => {
      if (inc.id === id) {
        return { ...inc, [field]: value };
      }
      return inc;
    });

    const updatedTwin = {
      ...twin,
      incomes: updatedIncomes
    };

    // 1. Instantly update local profile state
    onChange(updatedTwin, true);

    // 2. Debounce Database auto-save if configured
    if (!SupabaseService.isConfigured() || !id || id.startsWith("inc-")) return;

    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
    }

    setSyncingState?.("syncing");

    timeoutsRef.current[id] = setTimeout(async () => {
      try {
        await SupabaseService.updateIncomeSource(id, { [field]: value });
        await SupabaseService.updateFinancialTwinAggregates(profileId, updatedTwin);
        setSyncingState?.("synced");
      } catch (err) {
        console.error("Auto-save income failed:", err);
        setSyncingState?.("error");
      }
    }, 800);
  };

  const handleEditAsset = (id: string, field: keyof AssetItem, value: any) => {
    const updatedAssets = twin.assets.map(ast => {
      if (ast.id === id) {
        return { ...ast, [field]: value };
      }
      return ast;
    });

    const updatedTwin = {
      ...twin,
      assets: updatedAssets
    };

    // 1. Instantly update local profile state
    onChange(updatedTwin, true);

    // 2. Debounce Database auto-save
    if (!SupabaseService.isConfigured() || !id || id.startsWith("ast-")) return;

    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
    }

    setSyncingState?.("syncing");

    timeoutsRef.current[id] = setTimeout(async () => {
      try {
        await SupabaseService.updateAsset(id, { [field]: value });
        await SupabaseService.updateFinancialTwinAggregates(profileId, updatedTwin);
        setSyncingState?.("synced");
      } catch (err) {
        console.error("Auto-save asset failed:", err);
        setSyncingState?.("error");
      }
    }, 800);
  };

  const handleEditLiability = (id: string, field: keyof LiabilityItem, value: any) => {
    const updatedLiabs = twin.liabilities.map(lia => {
      if (lia.id === id) {
        return { ...lia, [field]: value };
      }
      return lia;
    });

    const updatedTwin = {
      ...twin,
      liabilities: updatedLiabs
    };

    // 1. Instantly update local profile state
    onChange(updatedTwin, true);

    // 2. Debounce Database auto-save
    if (!SupabaseService.isConfigured() || !id || id.startsWith("lia-")) return;

    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
    }

    setSyncingState?.("syncing");

    timeoutsRef.current[id] = setTimeout(async () => {
      try {
        await SupabaseService.updateLiability(id, { [field]: value });
        await SupabaseService.updateFinancialTwinAggregates(profileId, updatedTwin);
        setSyncingState?.("synced");
      } catch (err) {
        console.error("Auto-save liability failed:", err);
        setSyncingState?.("error");
      }
    }, 800);
  };

  // Action helpers
  const handleUpdateGeneral = (field: keyof FinancialTwin, value: any) => {
    onChange({
      ...twin,
      [field]: value
    });
  };

  const handleAddIncome = async () => {
    if (!newInc.name) return;
    setSyncingState?.("syncing");
    try {
      let newItem: IncomeSource;
      if (SupabaseService.isConfigured() && profileId) {
        const dbResult = await SupabaseService.insertIncomeSource(profileId, newInc);
        newItem = {
          id: dbResult.id,
          name: dbResult.income_name || dbResult.source_name,
          amount: Number(dbResult.current_value),
          frequency: dbResult.frequency,
          type: dbResult.income_type || dbResult.category
        };
      } else {
        newItem = {
          ...newInc,
          id: Math.random().toString(36).substring(2, 9)
        };
      }
      
      const updated = {
        ...twin,
        incomes: [...twin.incomes, newItem]
      };
      
      onChange(updated, true);
      
      if (SupabaseService.isConfigured() && profileId) {
        await SupabaseService.updateFinancialTwinAggregates(profileId, updated);
      }
      setSyncingState?.("synced");
    } catch (err) {
      console.error("Failed to add income:", err);
      setSyncingState?.("error");
    }
    setNewInc({ name: "", amount: 50000, frequency: "annual", type: "salary" });
  };

  const handleRemoveIncome = async (id: string) => {
    setSyncingState?.("syncing");
    try {
      if (SupabaseService.isConfigured() && !id.startsWith("inc-") && id.length > 10) {
        await SupabaseService.deleteIncomeSource(id);
      }
      
      const updated = {
        ...twin,
        incomes: twin.incomes.filter(i => i.id !== id)
      };
      
      onChange(updated, true);
      
      if (SupabaseService.isConfigured() && profileId) {
        await SupabaseService.updateFinancialTwinAggregates(profileId, updated);
      }
      setSyncingState?.("synced");
    } catch (err) {
      console.error("Failed to remove income:", err);
      setSyncingState?.("error");
    }
  };

  const handleAddAsset = async () => {
    if (!newAsset.name) return;
    setSyncingState?.("syncing");
    try {
      let newItem: AssetItem;
      if (SupabaseService.isConfigured() && profileId) {
        const dbResult = await SupabaseService.insertAsset(profileId, newAsset);
        newItem = {
          id: dbResult.id,
          name: dbResult.asset_name,
          amount: Number(dbResult.current_value),
          type: dbResult.asset_type,
          annualGrowth: Number(dbResult.growth_rate)
        };
      } else {
        newItem = {
          ...newAsset,
          id: Math.random().toString(36).substring(2, 9)
        };
      }
      
      const updated = {
        ...twin,
        assets: [...twin.assets, newItem]
      };
      
      onChange(updated, true);
      
      if (SupabaseService.isConfigured() && profileId) {
        await SupabaseService.updateFinancialTwinAggregates(profileId, updated);
      }
      setSyncingState?.("synced");
    } catch (err) {
      console.error("Failed to add asset:", err);
      setSyncingState?.("error");
    }
    setNewAsset({ name: "", amount: 10000, type: "brokerage", annualGrowth: 0.07 });
  };

  const handleRemoveAsset = async (id: string) => {
    setSyncingState?.("syncing");
    try {
      if (SupabaseService.isConfigured() && !id.startsWith("ast-") && id.length > 10) {
        await SupabaseService.deleteAsset(id);
      }
      
      const updated = {
        ...twin,
        assets: twin.assets.filter(a => a.id !== id)
      };
      
      onChange(updated, true);
      
      if (SupabaseService.isConfigured() && profileId) {
        await SupabaseService.updateFinancialTwinAggregates(profileId, updated);
      }
      setSyncingState?.("synced");
    } catch (err) {
      console.error("Failed to remove asset:", err);
      setSyncingState?.("error");
    }
  };

  const handleAddLiability = async () => {
    if (!newLiab.name) return;
    setSyncingState?.("syncing");
    try {
      let newItem: LiabilityItem;
      if (SupabaseService.isConfigured() && profileId) {
        const dbResult = await SupabaseService.insertLiability(profileId, newLiab);
        newItem = {
          id: dbResult.id,
          name: dbResult.liability_name,
          amount: Number(dbResult.current_balance),
          interestRate: Number(dbResult.interest_rate),
          monthlyPayment: Number(dbResult.monthly_payment),
          type: dbResult.liability_type
        };
      } else {
        newItem = {
          ...newLiab,
          id: Math.random().toString(36).substring(2, 9)
        };
      }
      
      const updated = {
        ...twin,
        liabilities: [...twin.liabilities, newItem]
      };
      
      onChange(updated, true);
      
      if (SupabaseService.isConfigured() && profileId) {
        await SupabaseService.updateFinancialTwinAggregates(profileId, updated);
      }
      setSyncingState?.("synced");
    } catch (err) {
      console.error("Failed to add liability:", err);
      setSyncingState?.("error");
    }
    setNewLiab({
      name: "",
      amount: 15000,
      interestRate: 0.06,
      monthlyPayment: 250,
      type: "student_loan"
    });
  };

  const handleRemoveLiability = async (id: string) => {
    setSyncingState?.("syncing");
    try {
      if (SupabaseService.isConfigured() && !id.startsWith("lia-") && id.length > 10) {
        await SupabaseService.deleteLiability(id);
      }
      
      const updated = {
        ...twin,
        liabilities: twin.liabilities.filter(l => l.id !== id)
      };
      
      onChange(updated, true);
      
      if (SupabaseService.isConfigured() && profileId) {
        await SupabaseService.updateFinancialTwinAggregates(profileId, updated);
      }
      setSyncingState?.("synced");
    } catch (err) {
      console.error("Failed to remove liability:", err);
      setSyncingState?.("error");
    }
  };

  // Aggregated summaries
  const totalAnnualIncome = twin.incomes.reduce((acc, curr) => {
    return acc + (curr.frequency === "annual" ? curr.amount : curr.amount * 12);
  }, 0);

  const totalAssetsValue = twin.assets.reduce((acc, curr) => acc + curr.amount, 0);
  const totalLiabilitiesValue = twin.liabilities.reduce((acc, curr) => acc + curr.amount, 0);
  const netWorth = totalAssetsValue - totalLiabilitiesValue;

  const totalMonthlyDebtPayments = twin.liabilities.reduce((acc, curr) => acc + curr.monthlyPayment, 0);
  const monthlyGrossIncome = totalAnnualIncome / 12;
  const debtToIncomeRatio = monthlyGrossIncome > 0 ? (totalMonthlyDebtPayments / monthlyGrossIncome) * 100 : 0;

  return (
    <div id="twin-configurator" className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl font-sans">
      {/* Top Banner Stat Segment */}
      <div className="bg-gradient-to-r from-emerald-950/30 via-zinc-900 to-zinc-900 p-6 border-b border-zinc-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-emerald-400 font-mono text-xs tracking-wider uppercase font-bold">Guided Coaching Onboarding</span>
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight mt-1">Onboard Your Financial Decision Coach</h2>
            <p className="text-xs text-zinc-400 mt-1 font-sans">
              To give you precise outcomes on high-impact lifestyle moves, please complete this friendly life-oriented questionnaire with Aura.
            </p>
            {syncingState && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs">
                {syncingState === "syncing" && (
                  <span className="text-amber-400 font-mono flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Saving changes to database...
                  </span>
                )}
                {syncingState === "synced" && (
                  <span className="text-emerald-400 font-mono flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[8px] border border-emerald-500/40">✓</span>
                    Synced to Supabase
                  </span>
                )}
                {syncingState === "error" && (
                  <span className="text-rose-400 font-mono flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
                    Save failed. Check connection.
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-4 self-stretch md:self-auto font-sans">
            <div className="bg-zinc-950/60 border border-zinc-805/80 p-3 rounded-lg text-left flex-1 md:flex-initial">
              <span className="text-[10px] uppercase font-mono text-zinc-500 block font-bold">Total Net Worth</span>
              <span className={`text-base font-bold font-mono tracking-tight block ${netWorth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                ${netWorth.toLocaleString()}
              </span>
            </div>
            <div className="bg-zinc-950/60 border border-zinc-805/80 p-3 rounded-lg text-left flex-1 md:flex-initial">
              <span className="text-[10px] uppercase font-mono text-zinc-500 block font-bold">Annual Income</span>
              <span className="text-base font-bold font-mono text-zinc-200 tracking-tight block">
                ${totalAnnualIncome.toLocaleString()}
              </span>
            </div>
            <div className="bg-zinc-950/60 border border-zinc-805/80 p-3 rounded-lg text-left flex-1 md:flex-initial">
              <span className="text-[10px] uppercase font-mono text-zinc-500 block font-bold">Debt-to-Income</span>
              <span className={`text-base font-bold font-mono tracking-tight block ${debtToIncomeRatio < 35 ? "text-teal-400" : debtToIncomeRatio < 45 ? "text-amber-400" : "text-rose-440"}`}>
                {debtToIncomeRatio.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Progress Tracking */}
      {(() => {
        const stepNum = activeTab === "income" ? 1 
                      : activeTab === "savings" ? 2 
                      : activeTab === "debts" ? 3 
                      : activeTab === "family" ? 4 
                      : activeTab === "retirement" ? 5 
                      : 6;
        
        // Calculate dynamic profile completeness based on actual stored profile attributes
        const hasIncomes = twin.incomes && twin.incomes.length > 0;
        const hasBasicSavings = twin.assets && twin.assets.some(a => a.type === "cash" && a.amount > 0);
        const hasInvestments = twin.assets && twin.assets.some(a => a.type === "brokerage" && a.amount > 0);
        const hasRetirement = twin.assets && twin.assets.some(a => a.type === "retirement" && a.amount > 0);
        const hasRealEstate = twin.assets && twin.assets.some(a => a.type === "real_estate" && a.amount > 0);
        const hasDebtInfo = twin.liabilities && twin.liabilities.length > 0;
        const hasCollegeSavings = (twin.assets && twin.assets.some(a => a.name.toLowerCase().includes("529") || a.name.toLowerCase().includes("college") || a.name.toLowerCase().includes("education"))) || (twin.dependants > 0);

        const items = [
          { label: "Income Sources", met: hasIncomes },
          { label: "Basic Savings", met: hasBasicSavings },
          { label: "Investment Accounts", met: hasInvestments },
          { label: "Retirement Accounts", met: hasRetirement },
          { label: "Real Estate Holdings", met: hasRealEstate },
          { label: "Detailed Debt Information", met: hasDebtInfo },
          { label: "College Savings Goals", met: hasCollegeSavings }
        ];

        const metCount = items.filter(it => it.met).length;
        const completionPercent = Math.round((metCount / items.length) * 100);
        const filled = Math.round((completionPercent / 100) * 15);
        const empty = 15 - filled;
        const pBar = "█".repeat(filled) + "░".repeat(empty);

        return (
          <div className="bg-zinc-950/60 border-b border-zinc-800/80 divide-y divide-zinc-850">
            <div className="px-6 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-900/40 text-[10px] font-mono rounded px-2.5 py-1 font-bold">
                  Step {stepNum} of 6
                </span>
                <span className="text-xs text-zinc-350 select-none">
                  Profile Completeness: <strong className="text-emerald-400 font-bold font-mono">{completionPercent}%</strong>
                </span>
              </div>
              
              <div className="flex items-center gap-3 self-stretch sm:self-auto">
                <span className="text-emerald-400 font-mono text-[11px] select-none tracking-normal leading-none font-bold">
                  {pBar}
                </span>
                <div className="w-24 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 shrink-0">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Missing Information Panel */}
            <div className="px-6 py-3 bg-zinc-950/40 font-sans">
              <div className="flex flex-col md:flex-row md:items-center gap-2.5 justify-between">
                <span className="text-[10px] font-mono text-zinc-450 uppercase font-bold tracking-wider shrink-0">Missing Information Audit:</span>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] select-none">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      {it.met ? (
                        <span className="text-emerald-400 font-bold block text-[11px]">✓</span>
                      ) : (
                        <span className="text-zinc-650 font-bold block text-[11px]">□</span>
                      )}
                      <span className={it.met ? "text-zinc-300 font-medium" : "text-zinc-550"}>
                        {it.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tabs styled as progressive coaching questions */}
      <div className="flex flex-wrap gap-1 border-b border-zinc-800 bg-zinc-900/60 text-xs px-4 pt-2 font-sans">
        <button
          onClick={() => setActiveTab("income")}
          className={`px-4 py-3 font-semibold border-b-2 rounded-t-md transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "income" ? "border-emerald-500 text-emerald-400 bg-zinc-950/40" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
        >
          <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-mono shrink-0 ${activeTab === "income" ? "bg-emerald-500 text-zinc-950 font-black" : "bg-zinc-800 text-zinc-400"}`}>1</span>
          <span>How much do you earn?</span>
        </button>
        <button
          onClick={() => setActiveTab("savings")}
          className={`px-4 py-3 font-semibold border-b-2 rounded-t-md transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "savings" ? "border-emerald-500 text-emerald-400 bg-zinc-950/40" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
        >
          <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-mono shrink-0 ${activeTab === "savings" ? "bg-emerald-500 text-zinc-950 font-black" : "bg-zinc-800 text-zinc-400"}`}>2</span>
          <span>Do you own assets?</span>
        </button>
        <button
          onClick={() => setActiveTab("debts")}
          className={`px-4 py-3 font-semibold border-b-2 rounded-t-md transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "debts" ? "border-emerald-500 text-emerald-400 bg-zinc-950/40" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
        >
          <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-mono shrink-0 ${activeTab === "debts" ? "bg-emerald-500 text-zinc-950 font-black" : "bg-zinc-800 text-zinc-400"}`}>3</span>
          <span>Do you carry any debt?</span>
        </button>
        <button
          onClick={() => setActiveTab("family")}
          className={`px-4 py-3 font-semibold border-b-2 rounded-t-md transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "family" ? "border-emerald-500 text-emerald-400 bg-zinc-950/40" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
        >
          <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-mono shrink-0 ${activeTab === "family" ? "bg-emerald-500 text-zinc-950 font-black" : "bg-zinc-800 text-zinc-400"}`}>4</span>
          <span>Do you support dependents?</span>
        </button>
        <button
          onClick={() => setActiveTab("retirement")}
          className={`px-4 py-3 font-semibold border-b-2 rounded-t-md transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "retirement" ? "border-emerald-500 text-emerald-400 bg-zinc-950/40" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
        >
          <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-mono shrink-0 ${activeTab === "retirement" ? "bg-emerald-500 text-zinc-950 font-black" : "bg-zinc-800 text-zinc-400"}`}>5</span>
          <span>When do you want to retire?</span>
        </button>
        <button
          onClick={() => setActiveTab("risk")}
          className={`px-4 py-3 font-semibold border-b-2 rounded-t-md transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "risk" ? "border-emerald-500 text-emerald-400 bg-zinc-950/40" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
        >
          <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-mono shrink-0 ${activeTab === "risk" ? "bg-emerald-500 text-zinc-950 font-black" : "bg-zinc-800 text-zinc-400"}`}>6</span>
          <span>What's your risk tolerance?</span>
        </button>
      </div>

      {/* Content Form container */}
      <div className="p-6 text-zinc-200">
        {/* TAB: FAMILY & DEPENDENTS */}
        {activeTab === "family" && (
          <div className="space-y-6 font-sans">
            <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-emerald-950/40 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-900/40 font-mono text-sm font-bold">
                A
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Aura Onboarding Coach</h4>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  "Let's adjust for your personal circumstances. To model your multi-decade trajectory and understand progressive state tax bracket impacts, I need to know your current age, state of residence, and any dependents you support."
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-zinc-400 text-xs font-semibold block mb-1.5 uppercase tracking-wide">Do you support dependents?</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={twin.dependants}
                  onChange={(e) => handleUpdateGeneral("dependants", Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-zinc-950 border border-zinc-805 rounded-lg p-2.5 text-sm font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-zinc-500 mt-1.5 block">Number of children, relatives, or loved ones in your care.</span>
              </div>

              <div>
                <label className="text-zinc-400 text-xs font-semibold block mb-1.5 uppercase tracking-wide">How old are you?</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="18"
                    max="80"
                    value={twin.age}
                    onChange={(e) => handleUpdateGeneral("age", parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <span className="font-mono text-sm bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800 text-emerald-400 font-bold min-w-[50px] text-center">
                    {twin.age}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 mt-1.5 block">Used to anchor your timeline projection models.</span>
              </div>

              <div>
                <label className="text-zinc-400 text-xs font-semibold block mb-1.5 uppercase tracking-wide">Which state do you call home?</label>
                <select
                  value={twin.taxState}
                  onChange={(e) => handleUpdateGeneral("taxState", e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-805 rounded-lg p-2.5 text-sm font-sans text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  {US_STATES.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-zinc-500 mt-1.5 block">Required to calculate regional state income tax offsets.</span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-850">
              <button
                type="button"
                onClick={() => setActiveTab("retirement")}
                className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-200 font-bold tracking-tight text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer font-sans"
              >
                Next question: Retirement timeline <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>
        )}

        {/* TAB: RETIREMENT GOALS */}
        {activeTab === "retirement" && (
          <div className="space-y-6 font-sans">
            <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-emerald-950/40 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-900/40 font-mono text-sm font-bold">
                A
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Aura Onboarding Coach</h4>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  "Thinking ahead is the key to building true compound velocity. At what age do you wish to achieve work flexibility or retire completely, and what level of monthly lifestyle spending do you want to sustain?"
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-zinc-400 text-xs font-semibold block mb-1.5 uppercase tracking-wide">When do you want to retire?</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="40"
                    max="90"
                    value={twin.retirementAge}
                    onChange={(e) => handleUpdateGeneral("retirementAge", parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <span className="font-mono text-sm bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800 text-teal-400 font-bold min-w-[50px] text-center">
                    {twin.retirementAge}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 mt-1.5 block">Your custom target age threshold.</span>
              </div>

              <div>
                <label className="text-zinc-400 text-xs font-semibold block mb-1.5 uppercase tracking-wide">What is your targeted monthly spending in retirement?</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-550 font-bold font-mono">$</span>
                  <input
                    type="number"
                    value={twin.monthlyExpenses}
                    onChange={(e) => handleUpdateGeneral("monthlyExpenses", Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-zinc-950 border border-zinc-805 rounded-lg p-2.5 pl-7 text-sm font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 mt-1.5 block">Calculated in today's dollars, representing your baseline lifestyle and hobby outlays.</span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-850">
              <button
                type="button"
                onClick={() => setActiveTab("risk")}
                className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-200 font-bold tracking-tight text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer font-sans"
              >
                Next question: Risk preferences <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>
        )}

        {/* TAB: RISK PREFERENCE */}
        {activeTab === "risk" && (
          <div className="space-y-6 font-sans">
            <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-emerald-950/40 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-900/40 font-mono text-sm font-bold">
                A
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Aura Onboarding Coach</h4>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  "Finally, let's align our growth trajectory models with your personal tolerance. How comfortable vary are you with standard stock market fluctuations?"
                </p>
              </div>
            </div>

            <div>
              <label className="text-zinc-400 text-sm font-bold block mb-1.5 tracking-tight font-sans">Select your preferred growth velocity</label>
              <p className="text-[11px] text-zinc-500 mb-4 font-sans leading-relaxed">This selection calibrates how Aura projects your multi-decade interest compounding and asset accumulation growth.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["conservative", "moderate", "aggressive"] as const).map((lvl) => {
                  const labels = {
                    conservative: { title: "Defensive Preservation", desc: "Focuses on capital protection with conservative compound metrics (e.g. 4-5% yields)." },
                    moderate: { title: "Balanced Trajectory", desc: "A robust blend of capital stability and general market indexes (e.g. 6-7% yields)." },
                    aggressive: { title: "Optimized Compounder", desc: "Maximizes compound velocity with global index funds (e.g. 8-10% volatility)." }
                  };
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleUpdateGeneral("riskTolerance", lvl)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                        twin.riskTolerance === lvl
                          ? "bg-emerald-950/30 border-emerald-500 text-emerald-400"
                          : "bg-zinc-950 border-zinc-800/80 text-zinc-450 hover:text-zinc-300 hover:border-zinc-700 font-sans"
                      }`}
                    >
                      <span className="text-xs font-bold capitalize font-sans">{labels[lvl].title}</span>
                      <span className="text-[10px] text-zinc-400 mt-2 font-sans normal-case leading-normal">{labels[lvl].desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-zinc-850">
              <span className="text-[10px] text-zinc-500 font-mono">ONBOARDING COMPLETED</span>
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
                ✓ Dynamic models calculated instantly
              </div>
            </div>
          </div>
        )}        {/* TAB 2: INCOME */}
        {activeTab === "income" && (
          <div className="space-y-6">
            <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-emerald-950/40 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-900/40 font-mono text-sm font-bold">
                A
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Aura Onboarding Coach</h4>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  "First, tell me about your inflows. Do you earn an annual salary, self-employment income, business dividends, or have other cash infusions? Add them below so we can accurately gauge your baseline compounding energy."
                </p>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4">
              <span className="text-xs font-mono font-bold text-zinc-300 block mb-3">Add Custom Income Node</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="e.g. Primary Salary"
                  value={newInc.name}
                  onChange={(e) => setNewInc({ ...newInc, name: e.target.value })}
                  className="bg-zinc-900 border border-zinc-800/60 rounded p-2 text-xs text-zinc-200 font-sans focus:outline-none focus:border-emerald-500"
                />
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-zinc-500 text-xs">$</span>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newInc.amount}
                    onChange={(e) => setNewInc({ ...newInc, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-800/60 rounded p-2 pl-6 text-xs text-zinc-200 font-mono focus:outline-none"
                  />
                </div>
                <select
                  value={newInc.type}
                  onChange={(e) => setNewInc({ ...newInc, type: e.target.value as any })}
                  className="bg-zinc-900 border border-zinc-800/60 rounded p-2 text-xs text-zinc-200 font-mono focus:outline-none"
                >
                  <option value="salary">Salary (W2)</option>
                  <option value="bonus">Bonus / Commission</option>
                  <option value="investment">Dividends / Yield</option>
                  <option value="business">Self-Employment</option>
                  <option value="other">Other Inflow</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddIncome}
                  disabled={!newInc.name}
                  className="bg-emerald-600 hover:bg-emerald-500 text-zinc-900 font-bold transition-all text-xs rounded py-2 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" /> Append Node
                </button>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 font-mono border-b border-zinc-800">
                  <tr>
                    <th className="p-3">Source Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Annual Return</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {twin.incomes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-zinc-500 italic">
                        No financial inflows mapped to the twin. Add one above.
                      </td>
                    </tr>
                  ) : (
                    twin.incomes.map((inc) => (
                      <tr key={inc.id} className="hover:bg-zinc-900/40">
                        <td className="p-3">
                          <input
                            type="text"
                            value={inc.name}
                            onChange={(e) => handleEditIncome(inc.id, "name", e.target.value)}
                            className="bg-transparent text-zinc-200 border-b border-transparent hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-950/60 transition-all py-1 px-1.5 rounded w-full focus:outline-none font-semibold text-xs"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={inc.type}
                            onChange={(e) => handleEditIncome(inc.id, "type", e.target.value as any)}
                            className="bg-transparent text-zinc-400 font-mono capitalize border-b border-transparent hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-950/60 transition-all py-1 px-1.5 rounded focus:outline-none cursor-pointer text-xs"
                          >
                            <option value="salary" className="bg-zinc-900 text-zinc-300">Salary</option>
                            <option value="bonus" className="bg-zinc-900 text-zinc-300">Bonus</option>
                            <option value="investment" className="bg-zinc-900 text-zinc-300">Investment</option>
                            <option value="business" className="bg-zinc-900 text-zinc-300">Business</option>
                            <option value="other" className="bg-zinc-905 text-zinc-300">Other Inflow</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="relative flex justify-end items-center text-right">
                            <span className="text-zinc-500 mr-1 text-xs">$</span>
                            <input
                              type="number"
                              value={inc.amount}
                              onChange={(e) => handleEditIncome(inc.id, "amount", parseFloat(e.target.value) || 0)}
                              className="bg-transparent text-zinc-200 font-mono text-right font-bold border-b border-transparent hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-950/60 transition-all py-1 px-1 rounded w-28 focus:outline-none text-xs"
                            />
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveIncome(inc.id)}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-zinc-950 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-850/45">
              <button
                type="button"
                onClick={() => setActiveTab("savings")}
                className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-200 font-bold tracking-tight text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer font-sans"
              >
                Next question: Assets & Savings <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: SAVINGS & INVESTMENTS */}
        {activeTab === "savings" && (
          <div className="space-y-6">
            <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-emerald-950/40 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-900/40 font-mono text-sm font-bold">
                A
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Aura Onboarding Coach</h4>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  "Now let's map out your active resources. Do you hold liquid high-yield cash, retirement accounts like 401(k) / IRAs, a brokerage portfolio, or real estate equity? Let's chart your starting compound blocks."
                </p>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4">
              <span className="text-xs font-mono font-bold text-zinc-300 block mb-3">Add Custom Savings or Investment Balance</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="e.g. 401(k) retirement"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="bg-zinc-900 border border-zinc-800/60 rounded p-2 text-xs text-zinc-200 font-sans focus:outline-none focus:border-emerald-500"
                />
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-zinc-500 text-xs">$</span>
                  <input
                    type="number"
                    placeholder="Current Balance"
                    value={newAsset.amount}
                    onChange={(e) => setNewAsset({ ...newAsset, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-800/60 rounded p-2 pl-6 text-xs text-zinc-200 font-mono focus:outline-none"
                  />
                </div>
                <select
                  value={newAsset.type}
                  onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value as any })}
                  className="bg-zinc-900 border border-zinc-800/60 rounded p-2 text-xs text-zinc-200 font-mono focus:outline-none"
                >
                  <option value="cash">Liquid Cash / HYSA</option>
                  <option value="retirement">Retirement Account (IRA/401k)</option>
                  <option value="brokerage">Brokerage Portfolio</option>
                  <option value="real_estate">Real Estate equity</option>
                  <option value="other">Other Asset</option>
                </select>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Growth (0.07)"
                      value={newAsset.annualGrowth}
                      onChange={(e) => setNewAsset({ ...newAsset, annualGrowth: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-zinc-900 border border-zinc-800/60 rounded p-2 text-xs text-zinc-200 font-mono focus:outline-none"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-zinc-500">ARR</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAsset}
                    disabled={!newAsset.name}
                    className="bg-emerald-600 hover:bg-emerald-500 text-zinc-900 font-bold px-3 transition-all text-xs rounded flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 font-sans border-b border-zinc-800 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-3">Savings or Investment name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Annual growth %</th>
                    <th className="p-3 text-right">Current balance</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {twin.assets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-zinc-500 italic font-sans">
                        No accounts added yet. Let Aura know your savings above.
                      </td>
                    </tr>
                  ) : (
                    twin.assets.map((ast) => (
                      <tr key={ast.id} className="hover:bg-zinc-900/40">
                        <td className="p-3">
                          <input
                            type="text"
                            value={ast.name}
                            onChange={(e) => handleEditAsset(ast.id, "name", e.target.value)}
                            className="bg-transparent text-zinc-200 border-b border-transparent hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-950/60 transition-all py-1 px-1.5 rounded w-full focus:outline-none font-semibold text-xs"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={ast.type}
                            onChange={(e) => handleEditAsset(ast.id, "type", e.target.value as any)}
                            className="bg-transparent text-zinc-400 font-mono capitalize border-b border-transparent hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-950/60 transition-all py-1 px-1.5 rounded focus:outline-none cursor-pointer text-xs"
                          >
                            <option value="cash" className="bg-zinc-900 text-zinc-300">Liquid Cash</option>
                            <option value="retirement" className="bg-zinc-900 text-zinc-300">Retirement Account</option>
                            <option value="brokerage" className="bg-zinc-900 text-zinc-300">Brokerage Portfolio</option>
                            <option value="real_estate" className="bg-zinc-900 text-zinc-300">Real Estate equity</option>
                            <option value="other" className="bg-zinc-905 text-zinc-300">Other Asset</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="relative flex justify-end items-center text-right font-mono text-emerald-400">
                            <input
                              type="number"
                              step="0.1"
                              value={Math.round(ast.annualGrowth * 1000) / 10}
                              onChange={(e) => handleEditAsset(ast.id, "annualGrowth", (parseFloat(e.target.value) || 0) / 100)}
                              className="bg-transparent text-emerald-400 font-mono text-right border-b border-transparent hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-950/60 transition-all py-1 px-1 rounded w-16 focus:outline-none text-xs"
                            />
                            <span className="text-emerald-500/80 ml-0.5 text-xs">%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="relative flex justify-end items-center text-right font-mono text-zinc-200">
                            <span className="text-zinc-500 mr-1 text-xs">$</span>
                            <input
                              type="number"
                              value={ast.amount}
                              onChange={(e) => handleEditAsset(ast.id, "amount", parseFloat(e.target.value) || 0)}
                              className="bg-transparent text-zinc-200 font-mono text-right font-bold border-b border-transparent hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-950/60 transition-all py-1 px-1 rounded w-28 focus:outline-none text-xs"
                            />
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveAsset(ast.id)}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-zinc-950 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-850/45">
              <button
                type="button"
                onClick={() => setActiveTab("debts")}
                className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-200 font-bold tracking-tight text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer font-sans"
              >
                Next question: Debts & Liabilities <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: DEBTS */}
        {activeTab === "debts" && (
          <div className="space-y-6">
            <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-emerald-950/40 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-900/40 font-mono text-sm font-bold">
                A
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Aura Onboarding Coach</h4>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  "Finally, let's identify any liabilities that could slow down your compound velocity. Tell me about any student loans, vehicle financing, mortgages, or revolving credit card balance you carry."
                </p>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4">
              <span className="text-xs font-mono font-bold text-zinc-300 block mb-3">Add private debt or mortgage</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="e.g. Student loans"
                  value={newLiab.name}
                  onChange={(e) => setNewLiab({ ...newLiab, name: e.target.value })}
                  className="bg-zinc-900 border border-zinc-800/60 rounded p-2 text-xs text-zinc-200 font-sans focus:outline-none focus:border-emerald-500"
                />
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-zinc-500 text-xs">$</span>
                  <input
                    type="number"
                    placeholder="Total Debt"
                    value={newLiab.amount}
                    onChange={(e) => setNewLiab({ ...newLiab, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-800/60 rounded p-2 pl-6 text-xs text-zinc-200 font-mono focus:outline-none"
                  />
                </div>
                <select
                  value={newLiab.type}
                  onChange={(e) => setNewLiab({ ...newLiab, type: e.target.value as any })}
                  className="bg-zinc-900 border border-zinc-800/60 rounded p-2 text-xs text-zinc-200 font-mono focus:outline-none"
                >
                  <option value="student_loan">Student Loan</option>
                  <option value="mortgage">Mortgage</option>
                  <option value="auto_loan">Vehicle Loan</option>
                  <option value="credit_card">Revolving Credit Card</option>
                  <option value="other">Other Liability</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Rate i.e. 0.05"
                    value={newLiab.interestRate}
                    onChange={(e) => setNewLiab({ ...newLiab, interestRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-800/60 rounded p-2 text-xs text-zinc-200 font-mono focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Min Monthly"
                    value={newLiab.monthlyPayment}
                    onChange={(e) => setNewLiab({ ...newLiab, monthlyPayment: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-800/60 rounded p-2 text-xs text-zinc-200 font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddLiability}
                    disabled={!newLiab.name}
                    className="bg-emerald-600 hover:bg-emerald-500 text-zinc-900 font-bold px-3 transition-all text-xs rounded flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 font-sans border-b border-zinc-800 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-3">Debt or Account Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Interest Rate %</th>
                    <th className="p-3 text-right">Monthly Payment</th>
                    <th className="p-3 text-right">Total Amount Owed</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {twin.liabilities.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-zinc-500 italic font-sans text-xs">
                        No debts added yet. Tell Aura if you have any loans or credits.
                      </td>
                    </tr>
                  ) : (
                    twin.liabilities.map((lia) => (
                      <tr key={lia.id} className="hover:bg-zinc-900/40">
                        <td className="p-3">
                          <input
                            type="text"
                            value={lia.name}
                            onChange={(e) => handleEditLiability(lia.id, "name", e.target.value)}
                            className="bg-transparent text-zinc-200 border-b border-transparent hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-950/60 transition-all py-1 px-1.5 rounded w-full focus:outline-none font-semibold text-xs"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={lia.type}
                            onChange={(e) => handleEditLiability(lia.id, "type", e.target.value as any)}
                            className="bg-transparent text-zinc-400 font-mono capitalize border-b border-transparent hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-950/60 transition-all py-1 px-1.5 rounded focus:outline-none cursor-pointer text-xs"
                          >
                            <option value="student_loan" className="bg-zinc-900 text-zinc-300">Student Loan</option>
                            <option value="mortgage" className="bg-zinc-900 text-zinc-300">Mortgage</option>
                            <option value="auto_loan" className="bg-zinc-900 text-zinc-300">Vehicle Loan</option>
                            <option value="credit_card" className="bg-zinc-900 text-zinc-300">Credit Card</option>
                            <option value="other" className="bg-zinc-905 text-zinc-300">Other Liability</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="relative flex justify-end items-center text-right font-mono text-rose-400">
                            <input
                              type="number"
                              step="0.1"
                              value={Math.round(lia.interestRate * 1000) / 10}
                              onChange={(e) => handleEditLiability(lia.id, "interestRate", (parseFloat(e.target.value) || 0) / 100)}
                              className="bg-transparent text-rose-400 font-mono text-right border-b border-transparent hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-950/60 transition-all py-1 px-1 rounded w-16 focus:outline-none text-xs"
                            />
                            <span className="text-rose-500/80 ml-0.5 text-xs">%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="relative flex justify-end items-center text-right font-mono text-zinc-350">
                            <span className="text-zinc-500 mr-1 text-xs">$</span>
                            <input
                              type="number"
                              value={lia.monthlyPayment}
                              onChange={(e) => handleEditLiability(lia.id, "monthlyPayment", parseFloat(e.target.value) || 0)}
                              className="bg-transparent text-zinc-350 font-mono text-right border-b border-transparent hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-950/60 transition-all py-1 px-1 rounded w-20 focus:outline-none text-xs"
                            />
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="relative flex justify-end items-center text-right font-mono text-zinc-200">
                            <span className="text-zinc-500 mr-1 text-xs">$</span>
                            <input
                              type="number"
                              value={lia.amount}
                              onChange={(e) => handleEditLiability(lia.id, "amount", parseFloat(e.target.value) || 0)}
                              className="bg-transparent text-zinc-200 font-mono text-right font-bold border-b border-transparent hover:border-zinc-700 focus:border-emerald-500 focus:bg-zinc-950/60 transition-all py-1 px-1 rounded w-28 focus:outline-none text-xs"
                            />
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLiability(lia.id)}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-zinc-950 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-850/45">
              <button
                type="button"
                onClick={() => setActiveTab("family")}
                className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-200 font-bold tracking-tight text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer font-sans"
              >
                Next question: Family & dependents <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
