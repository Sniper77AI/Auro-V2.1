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
  const totalAnnualIncome = (twin.incomes || []).reduce((acc, curr) => {
    return acc + (curr.frequency === "annual" ? curr.amount : curr.amount * 12);
  }, 0);

  const totalAssetsValue = (twin.assets || []).reduce((acc, curr) => acc + curr.amount, 0);
  const totalLiabilitiesValue = (twin.liabilities || []).reduce((acc, curr) => acc + curr.amount, 0);
  const netWorth = totalAssetsValue - totalLiabilitiesValue;

  const totalMonthlyDebtPayments = (twin.liabilities || []).reduce((acc, curr) => acc + curr.monthlyPayment, 0);
  const monthlyGrossIncome = totalAnnualIncome / 12;
  const debtToIncomeRatio = monthlyGrossIncome > 0 ? (totalMonthlyDebtPayments / monthlyGrossIncome) * 100 : 0;

  return (
    <div id="twin-configurator" className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm font-sans">
      {/* Top Banner Stat Segment */}
      <div className="bg-slate-50 p-6 border-b border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-teal-700 font-mono text-xs tracking-wider uppercase font-bold">Financial Profile Builder</span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">Build Your Financial Twin</h2>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Provide your details to construct your personalized digital twin. Understand the long-term consequences of major decisions before committing capital.
            </p>
            {syncingState && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs">
                {syncingState === "syncing" && (
                  <span className="text-amber-700 font-mono flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Saving...
                  </span>
                )}
                {syncingState === "synced" && (
                  <span className="text-emerald-700 font-mono flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold text-[8px] border border-emerald-500/40">✓</span>
                    Changes saved
                  </span>
                )}
                {syncingState === "error" && (
                  <span className="text-rose-700 font-mono flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
                    Could not save changes
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-4 self-stretch md:self-auto font-sans">
            <div className="bg-white border border-slate-200 p-3 rounded-xl text-left flex-1 md:flex-initial shadow-sm">
              <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Total Net Worth</span>
              <span className={`text-base font-extrabold font-mono tracking-tight block ${netWorth >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                ${netWorth.toLocaleString()}
              </span>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-xl text-left flex-1 md:flex-initial shadow-sm">
              <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Annual Income</span>
              <span className="text-base font-extrabold font-mono text-slate-800 tracking-tight block">
                ${totalAnnualIncome.toLocaleString()}
              </span>
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-xl text-left flex-1 md:flex-initial shadow-sm">
              <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Debt-to-Income</span>
              <span className={`text-base font-extrabold font-mono tracking-tight block ${debtToIncomeRatio < 35 ? "text-teal-600" : debtToIncomeRatio < 45 ? "text-amber-600" : "text-rose-600"}`}>
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

        return (
          <div className="bg-slate-50 border-b border-slate-200 divide-y divide-slate-100">
            <div className="px-6 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-mono rounded px-2.5 py-1 font-bold">
                  Step {stepNum} of 6
                </span>
                <span className="text-xs text-slate-600 select-none">
                  Profile Completeness: <strong className="text-teal-600 font-bold font-mono">{completionPercent}%</strong>
                </span>
              </div>
            </div>

            {/* Missing Information Panel */}
            <div className="px-6 py-3 bg-slate-100/40 font-sans">
              <div className="flex flex-col md:flex-row md:items-center gap-2.5 justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider shrink-0">Missing Information Audit:</span>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] select-none">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      {it.met ? (
                        <span className="text-emerald-600 font-bold block text-[11px]">✓</span>
                      ) : (
                        <span className="text-slate-300 font-bold block text-[11px]">□</span>
                      )}
                      <span className={it.met ? "text-slate-700 font-medium" : "text-slate-400"}>
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
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 text-xs px-4 pt-2 font-sans">
        <button
          onClick={() => setActiveTab("income")}
          className={`px-4 py-3 font-semibold border-b-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "income" ? "border-teal-600 text-teal-800 bg-white shadow-sm" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-mono shrink-0 ${activeTab === "income" ? "bg-teal-600 text-white font-black" : "bg-slate-200 text-slate-600"}`}>1</span>
          <span>Income Sources</span>
        </button>
        <button
          onClick={() => setActiveTab("savings")}
          className={`px-4 py-3 font-semibold border-b-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "savings" ? "border-teal-600 text-teal-800 bg-white shadow-sm" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-mono shrink-0 ${activeTab === "savings" ? "bg-teal-600 text-white font-black" : "bg-slate-200 text-slate-600"}`}>2</span>
          <span>Assets</span>
        </button>
        <button
          onClick={() => setActiveTab("debts")}
          className={`px-4 py-3 font-semibold border-b-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "debts" ? "border-teal-600 text-teal-800 bg-white shadow-sm" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-mono shrink-0 ${activeTab === "debts" ? "bg-teal-600 text-white font-black" : "bg-slate-200 text-slate-600"}`}>3</span>
          <span>Liabilities</span>
        </button>
        <button
          onClick={() => setActiveTab("family")}
          className={`px-4 py-3 font-semibold border-b-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "family" ? "border-teal-600 text-teal-800 bg-white shadow-sm" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-mono shrink-0 ${activeTab === "family" ? "bg-teal-600 text-white font-black" : "bg-slate-200 text-slate-600"}`}>4</span>
          <span>Do you support dependents?</span>
        </button>
        <button
          onClick={() => setActiveTab("retirement")}
          className={`px-4 py-3 font-semibold border-b-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "retirement" ? "border-teal-600 text-teal-800 bg-white shadow-sm" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-mono shrink-0 ${activeTab === "retirement" ? "bg-teal-600 text-white font-black" : "bg-slate-200 text-slate-600"}`}>5</span>
          <span>When do you want to retire?</span>
        </button>
        <button
          onClick={() => setActiveTab("risk")}
          className={`px-4 py-3 font-semibold border-b-2 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "risk" ? "border-teal-600 text-teal-800 bg-white shadow-sm" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-mono shrink-0 ${activeTab === "risk" ? "bg-teal-600 text-white font-black" : "bg-slate-200 text-slate-600"}`}>6</span>
          <span>What's your risk tolerance?</span>
        </button>
      </div>

      {/* Content Form container */}
      <div className="p-6 text-slate-800 bg-white">
        {/* TAB: FAMILY & DEPENDENTS */}
        {activeTab === "family" && (
          <div className="space-y-6 font-sans">
            <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-2xl flex items-start gap-3.5 shadow-sm">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-slate-500 text-xs font-bold block mb-1.5 uppercase tracking-wide">Do you support dependents?</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={twin.dependants}
                  onChange={(e) => handleUpdateGeneral("dependants", Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-mono text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all shadow-inner"
                />
                <span className="text-[10px] text-slate-400 mt-1.5 block">Number of children, relatives, or loved ones in your care.</span>
              </div>

              <div>
                <label className="text-slate-500 text-xs font-bold block mb-1.5 uppercase tracking-wide">How old are you?</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="18"
                    max="80"
                    value={twin.age}
                    onChange={(e) => handleUpdateGeneral("age", parseInt(e.target.value))}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                  <span className="font-mono text-sm bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 text-teal-700 font-bold min-w-[50px] text-center shadow-sm">
                    {twin.age}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1.5 block">Used to anchor your timeline projection models.</span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab("retirement")}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold tracking-tight text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer font-sans shadow-md"
              >
                Next question: Retirement timeline <ChevronRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* TAB: RETIREMENT GOALS */}
        {activeTab === "retirement" && (
          <div className="space-y-6 font-sans">
            <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-2xl flex items-start gap-3.5 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 border border-teal-200 font-mono text-sm font-bold">
                A
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Aura Onboarding Coach</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  "Thinking ahead is the key to building long-term wealth. At what age do you wish to achieve work flexibility or retire completely, and what level of monthly lifestyle spending do you want to sustain?"
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-slate-500 text-xs font-bold block mb-1.5 uppercase tracking-wide">When do you want to retire?</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="40"
                    max="90"
                    value={twin.retirementAge}
                    onChange={(e) => handleUpdateGeneral("retirementAge", parseInt(e.target.value))}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                  <span className="font-mono text-sm bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 text-teal-700 font-bold min-w-[50px] text-center shadow-sm">
                    {twin.retirementAge}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1.5 block">Your custom target age threshold.</span>
              </div>

              <div>
                <label className="text-slate-500 text-xs font-bold block mb-1.5 uppercase tracking-wide">What is your targeted monthly spending in retirement?</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold font-mono">$</span>
                  <input
                    type="number"
                    value={twin.monthlyExpenses}
                    onChange={(e) => handleUpdateGeneral("monthlyExpenses", Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-7 text-sm font-mono text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1.5 block">Calculated in today's dollars, representing your baseline lifestyle and hobby outlays.</span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab("risk")}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold tracking-tight text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer font-sans shadow-md"
              >
                Next question: Risk preferences <ChevronRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* TAB: RISK PREFERENCE */}
        {activeTab === "risk" && (
          <div className="space-y-6 font-sans">
            <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-2xl flex items-start gap-3.5 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 border border-teal-200 font-mono text-sm font-bold">
                A
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Aura Onboarding Coach</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  "Finally, let's align our growth trajectory models with your personal tolerance. How comfortable vary are you with standard stock market fluctuations?"
                </p>
              </div>
            </div>

            <div>
              <label className="text-slate-800 text-sm font-bold block mb-1.5 tracking-tight font-sans">Select your preferred growth model</label>
              <p className="text-[11px] text-slate-500 mb-4 font-sans leading-relaxed">This selection calibrates how Aura projects your multi-decade interest compounding and asset accumulation growth.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["conservative", "moderate", "aggressive"] as const).map((lvl) => {
                  const labels = {
                    conservative: { title: "Defensive Preservation", desc: "Focuses on capital protection with conservative compound metrics (e.g. 4-5% yields)." },
                    moderate: { title: "Balanced Trajectory", desc: "A robust blend of capital stability and general market indexes (e.g. 6-7% yields)." },
                    aggressive: { title: "Optimized Compounder", desc: "Maximizes long-term growth with global index funds (e.g. 8-10% volatility)." }
                  };
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleUpdateGeneral("riskTolerance", lvl)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                        twin.riskTolerance === lvl
                          ? "bg-teal-50/70 border-teal-500 text-teal-800 shadow-sm font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300 font-sans"
                      }`}
                    >
                      <span className="text-xs font-bold capitalize font-sans">{labels[lvl].title}</span>
                      <span className="text-[10px] text-slate-500 mt-2 font-sans normal-case leading-normal">{labels[lvl].desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold font-mono">ONBOARDING COMPLETED</span>
              <div className="bg-teal-50 border border-teal-100 text-teal-700 text-[11px] px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 shadow-sm">
                ✓ Dynamic models calculated instantly
              </div>
            </div>
          </div>
        )}        {/* TAB 2: INCOME */}
        {activeTab === "income" && (
          <div className="space-y-6">
            <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-2xl flex items-start gap-3.5 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 border border-teal-200 font-mono text-sm font-bold">
                A
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Aura Onboarding Coach</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  "First, tell me about your inflows. Do you earn an annual salary, self-employment income, business dividends, or have other cash infusions? Add them below so we can accurately gauge your baseline compounding energy."
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-xs font-mono font-bold text-slate-500 block mb-3">Add Custom Income Node</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="e.g. Primary Salary"
                  value={newInc.name}
                  onChange={(e) => setNewInc({ ...newInc, name: e.target.value })}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-sans focus:outline-none focus:border-teal-500"
                />
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newInc.amount}
                    onChange={(e) => setNewInc({ ...newInc, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 pl-6 text-xs text-slate-800 font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <select
                  value={newInc.type}
                  onChange={(e) => setNewInc({ ...newInc, type: e.target.value as any })}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-sans focus:outline-none focus:border-teal-500"
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
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all text-xs rounded-xl py-2 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Append Node
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-sans font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Source Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Annual Return</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(twin.incomes || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                        No financial inflows mapped to the twin. Add one above.
                      </td>
                    </tr>
                  ) : (
                    (twin.incomes || []).map((inc) => (
                      <tr key={inc.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="p-3">
                          <input
                            type="text"
                            value={inc.name}
                            onChange={(e) => handleEditIncome(inc.id, "name", e.target.value)}
                            className="bg-transparent text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-slate-50 transition-all py-1 px-1.5 rounded-lg w-full focus:outline-none font-semibold text-xs"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={inc.type}
                            onChange={(e) => handleEditIncome(inc.id, "type", e.target.value as any)}
                            className="bg-transparent text-slate-600 font-sans border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-slate-50 transition-all py-1 px-1.5 rounded-lg focus:outline-none cursor-pointer text-xs"
                          >
                            <option value="salary" className="bg-white text-slate-800">Salary</option>
                            <option value="bonus" className="bg-white text-slate-800">Bonus</option>
                            <option value="investment" className="bg-white text-slate-800">Investment</option>
                            <option value="business" className="bg-white text-slate-800">Business</option>
                            <option value="other" className="bg-white text-slate-800">Other Inflow</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="relative flex justify-end items-center text-right">
                            <span className="text-slate-400 mr-1 text-xs font-bold">$</span>
                            <input
                              type="number"
                              value={inc.amount}
                              onChange={(e) => handleEditIncome(inc.id, "amount", parseFloat(e.target.value) || 0)}
                              className="bg-transparent text-slate-850 font-mono text-right font-bold border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-slate-50 transition-all py-1 px-1 rounded-lg w-28 focus:outline-none text-xs"
                            />
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveIncome(inc.id)}
                            className="text-rose-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
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

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab("savings")}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold tracking-tight text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer font-sans shadow-md"
              >
                Next question: Assets & Savings <ChevronRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: SAVINGS & INVESTMENTS */}
        {activeTab === "savings" && (
          <div className="space-y-6">
            <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-2xl flex items-start gap-3.5 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 border border-teal-200 font-mono text-sm font-bold">
                A
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Aura Onboarding Coach</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  "Now let's map out your active resources. Do you hold liquid high-yield cash, retirement accounts like 401(k) / IRAs, a brokerage portfolio, or real estate equity? Let's chart your starting compound blocks."
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-xs font-mono font-bold text-slate-500 block mb-3">Add Custom Savings or Investment Balance</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="e.g. 401(k) retirement"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-sans focus:outline-none focus:border-teal-500"
                />
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    placeholder="Current Balance"
                    value={newAsset.amount}
                    onChange={(e) => setNewAsset({ ...newAsset, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 pl-6 text-xs text-slate-800 font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <select
                  value={newAsset.type}
                  onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value as any })}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-sans focus:outline-none focus:border-teal-500"
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
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-teal-500"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-400 font-bold">ARR</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAsset}
                    disabled={!newAsset.name}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-3 transition-all text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-sans font-semibold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Savings or Investment name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Annual growth %</th>
                    <th className="p-3 text-right">Current balance</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(twin.assets || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400 italic font-sans">
                        No accounts added yet. Let Aura know your savings above.
                      </td>
                    </tr>
                  ) : (
                    (twin.assets || []).map((ast) => (
                      <tr key={ast.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="p-3">
                          <input
                            type="text"
                            value={ast.name}
                            onChange={(e) => handleEditAsset(ast.id, "name", e.target.value)}
                            className="bg-transparent text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-slate-50 transition-all py-1 px-1.5 rounded-lg w-full focus:outline-none font-semibold text-xs"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={ast.type}
                            onChange={(e) => handleEditAsset(ast.id, "type", e.target.value as any)}
                            className="bg-transparent text-slate-600 font-sans border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-slate-50 transition-all py-1 px-1.5 rounded-lg focus:outline-none cursor-pointer text-xs"
                          >
                            <option value="cash" className="bg-white text-slate-800">Liquid Cash</option>
                            <option value="retirement" className="bg-white text-slate-800">Retirement Account</option>
                            <option value="brokerage" className="bg-white text-slate-800">Brokerage Portfolio</option>
                            <option value="real_estate" className="bg-white text-slate-800">Real Estate equity</option>
                            <option value="other" className="bg-white text-slate-800">Other Asset</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="relative flex justify-end items-center text-right font-mono text-emerald-600">
                            <input
                              type="number"
                              step="0.1"
                              value={Math.round(ast.annualGrowth * 1000) / 10}
                              onChange={(e) => handleEditAsset(ast.id, "annualGrowth", (parseFloat(e.target.value) || 0) / 100)}
                              className="bg-transparent text-emerald-600 font-mono text-right border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-slate-50 transition-all py-1 px-1 rounded-lg w-16 focus:outline-none text-xs"
                            />
                            <span className="text-emerald-600/80 ml-0.5 text-xs font-bold">%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="relative flex justify-end items-center text-right font-mono text-slate-800">
                            <span className="text-slate-400 mr-1 text-xs font-bold">$</span>
                            <input
                              type="number"
                              value={ast.amount}
                              onChange={(e) => handleEditAsset(ast.id, "amount", parseFloat(e.target.value) || 0)}
                              className="bg-transparent text-slate-850 font-mono text-right font-bold border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-slate-50 transition-all py-1 px-1 rounded-lg w-28 focus:outline-none text-xs"
                            />
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveAsset(ast.id)}
                            className="text-rose-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
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

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab("debts")}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold tracking-tight text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer font-sans shadow-md"
              >
                Next question: Debts & Liabilities <ChevronRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: DEBTS */}
        {activeTab === "debts" && (
          <div className="space-y-6">
            <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-2xl flex items-start gap-3.5 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 border border-teal-200 font-mono text-sm font-bold">
                A
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Aura Onboarding Coach</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  "Finally, let's identify any liabilities that could slow down your savings growth. Tell me about any student loans, vehicle financing, mortgages, or revolving credit card balance you carry."
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-xs font-mono font-bold text-slate-500 block mb-3">Add private debt or mortgage</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="e.g. Student loans"
                  value={newLiab.name}
                  onChange={(e) => setNewLiab({ ...newLiab, name: e.target.value })}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-sans focus:outline-none focus:border-teal-500"
                />
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    placeholder="Total Debt"
                    value={newLiab.amount}
                    onChange={(e) => setNewLiab({ ...newLiab, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 pl-6 text-xs text-slate-800 font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <select
                  value={newLiab.type}
                  onChange={(e) => setNewLiab({ ...newLiab, type: e.target.value as any })}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-sans focus:outline-none focus:border-teal-500"
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
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-teal-500"
                  />
                  <input
                    type="number"
                    placeholder="Min Monthly"
                    value={newLiab.monthlyPayment}
                    onChange={(e) => setNewLiab({ ...newLiab, monthlyPayment: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddLiability}
                    disabled={!newLiab.name}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-3 transition-all text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-sans border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-3">Debt or Account Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Interest Rate %</th>
                    <th className="p-3 text-right">Monthly Payment</th>
                    <th className="p-3 text-right">Total Amount Owed</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(twin.liabilities || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400 italic font-sans text-xs">
                        No debts added yet. Tell Aura if you have any loans or credits.
                      </td>
                    </tr>
                  ) : (
                    (twin.liabilities || []).map((lia) => (
                      <tr key={lia.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="p-3">
                          <input
                            type="text"
                            value={lia.name}
                            onChange={(e) => handleEditLiability(lia.id, "name", e.target.value)}
                            className="bg-transparent text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-slate-50 transition-all py-1 px-1.5 rounded-lg w-full focus:outline-none font-semibold text-xs"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={lia.type}
                            onChange={(e) => handleEditLiability(lia.id, "type", e.target.value as any)}
                            className="bg-transparent text-slate-600 font-sans border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-slate-50 transition-all py-1 px-1.5 rounded-lg focus:outline-none cursor-pointer text-xs"
                          >
                            <option value="student_loan" className="bg-white text-slate-800">Student Loan</option>
                            <option value="mortgage" className="bg-white text-slate-800">Mortgage</option>
                            <option value="auto_loan" className="bg-white text-slate-800">Vehicle Loan</option>
                            <option value="credit_card" className="bg-white text-slate-800">Credit Card</option>
                            <option value="other" className="bg-white text-slate-800">Other Liability</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="relative flex justify-end items-center text-right font-mono text-rose-600">
                            <input
                              type="number"
                              step="0.1"
                              value={Math.round(lia.interestRate * 1000) / 10}
                              onChange={(e) => handleEditLiability(lia.id, "interestRate", (parseFloat(e.target.value) || 0) / 100)}
                              className="bg-transparent text-rose-600 font-mono text-right border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-slate-50 transition-all py-1 px-1 rounded-lg w-16 focus:outline-none text-xs"
                            />
                            <span className="text-rose-600/80 ml-0.5 text-xs font-bold">%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="relative flex justify-end items-center text-right font-mono text-slate-700">
                            <span className="text-slate-400 mr-1 text-xs font-bold">$</span>
                            <input
                              type="number"
                              value={lia.monthlyPayment}
                              onChange={(e) => handleEditLiability(lia.id, "monthlyPayment", parseFloat(e.target.value) || 0)}
                              className="bg-transparent text-slate-700 font-mono text-right border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-slate-50 transition-all py-1 px-1 rounded-lg w-20 focus:outline-none text-xs"
                            />
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="relative flex justify-end items-center text-right font-mono text-slate-800">
                            <span className="text-slate-400 mr-1 text-xs font-bold">$</span>
                            <input
                              type="number"
                              value={lia.amount}
                              onChange={(e) => handleEditLiability(lia.id, "amount", parseFloat(e.target.value) || 0)}
                              className="bg-transparent text-slate-850 font-mono text-right font-bold border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-slate-50 transition-all py-1 px-1 rounded-lg w-28 focus:outline-none text-xs"
                            />
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLiability(lia.id)}
                            className="text-rose-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
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

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab("family")}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold tracking-tight text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer font-sans shadow-md"
              >
                Next question: Family & dependents <ChevronRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
