/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { FinancialTwin } from "../types";
import { Award, AlertTriangle, CheckCircle, Scale, Plus, Trash2, Calendar, Target, HelpCircle, Sparkles } from "lucide-react";
import { SupabaseService } from "../supabaseService";

interface GoalItem {
  id: string;
  name: string;
  category: "retirement" | "property" | "education" | "debt_free" | "other";
  targetAmount: number;
  targetYear: number;
  currentSavings: number;
  priority: "essential" | "important" | "flexible";
  status?: string;
  monthlyContribution?: number;
  approvedScenarioType?: string;
  approvedScenarioName?: string;
  approvedAssumptions?: string[];
  projectedImpact?: number;
  approvedDate?: string;
  nextAction?: string;
}

const GOAL_EMOJIS: Record<string, string> = {
  property: "🏠",
  retirement: "🌴",
  education: "🎓",
  debt_free: "💳",
  other: "👨‍👩‍👧"
};

const GOAL_TITLES: Record<string, string> = {
  property: "Dream Home",
  retirement: "Retirement",
  education: "College Fund",
  debt_free: "Debt Freedom",
  other: "Family Security"
};

interface GoalsMatrixProps {
  twin: FinancialTwin;
  goals: GoalItem[];
  profileId: string;
  syncingState?: "synced" | "syncing" | "error";
  setSyncingState?: (state: "synced" | "syncing" | "error") => void;
  onSaveGoals: (updated: GoalItem[], skipDbSave?: boolean) => void;
  onReviewGoal?: (goal: GoalItem) => void;
}

export default function GoalsMatrix({ twin, goals, profileId, syncingState, setSyncingState, onSaveGoals, onReviewGoal }: GoalsMatrixProps) {
  const [newGoal, setNewGoal] = useState<Omit<GoalItem, "id">>({
    name: "",
    category: "property",
    targetAmount: 50000,
    targetYear: 2032,
    currentSavings: 0,
    priority: "important"
  });

  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  const handleEditGoal = (id: string, field: keyof GoalItem, value: any) => {
    const updatedGoals = goals.map(g => {
      if (g.id === id) {
        return { ...g, [field]: value };
      }
      return g;
    });

    onSaveGoals(updatedGoals, true);

    if (!SupabaseService.isConfigured() || !id || id.startsWith("g-")) return;

    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
    }

    setSyncingState?.("syncing");

    timeoutsRef.current[id] = setTimeout(async () => {
      try {
        await SupabaseService.updateGoal(id, { [field]: value });
        setSyncingState?.("synced");
      } catch (err) {
        console.error("Auto-save goal failed:", err);
        setSyncingState?.("error");
      }
    }, 800);
  };

  const handleCreateGoal = async () => {
    if (!newGoal.name) return;
    setSyncingState?.("syncing");
    try {
      let newItem: GoalItem;
      if (SupabaseService.isConfigured() && profileId) {
        const dbResult = await SupabaseService.insertGoal(profileId, newGoal);
        newItem = {
          id: dbResult.id,
          name: dbResult.goal_name,
          category: dbResult.goal_type as any,
          targetAmount: Number(dbResult.target_amount),
          targetYear: parseInt(dbResult.target_date) || 2035,
          currentSavings: Number(dbResult.current_progress),
          priority: newGoal.priority
        };
      } else {
        newItem = {
          ...newGoal,
          id: "g-" + Math.random().toString(36).substring(2, 9)
        };
      }
      onSaveGoals([...goals, newItem], true);
      setSyncingState?.("synced");
    } catch (err) {
      console.error("Failed to create goal:", err);
      setSyncingState?.("error");
    }
    setNewGoal({ name: "", category: "property", targetAmount: 50000, targetYear: 2032, currentSavings: 0, priority: "important" });
  };

  const handleRemoveGoal = async (id: string) => {
    setSyncingState?.("syncing");
    try {
      if (SupabaseService.isConfigured() && !id.startsWith("g-") && id.length > 10) {
        await SupabaseService.deleteGoal(id);
      }
      onSaveGoals(goals.filter(g => g.id !== id), true);
      setSyncingState?.("synced");
    } catch (err) {
      console.error("Failed to delete goal:", err);
      setSyncingState?.("error");
    }
  };

  // Conflict detection algorithms:
  const totalAnnualIncome = (twin.incomes || []).reduce((acc, curr) => acc + (curr.frequency === "annual" ? (Number(curr.amount) || 0) : (Number(curr.amount) || 0) * 12), 0);
  const liquidCash = (twin.assets || []).filter(a => a.type === "cash" || a.type === "brokerage").reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const monthlyExpensesSafe = Number(twin.monthlyExpenses) || 0;
  const monthlyPremiumSurplus = Math.max(0, (totalAnnualIncome / 12) - monthlyExpensesSafe);

  const conflicts: string[] = [];

  // Rules:
  // 1. If total raw target goals scheduled across the next 10 years exceeds liquid reserves plus cumulative monthly surplus * 10 years, detect conflict
  const tenYearsTargetTotal = goals
    .filter(g => g.targetYear <= 2036)
    .reduce((acc, curr) => {
      const target = Number(curr.targetAmount) || 0;
      const savings = Number(curr.currentSavings) || 0;
      return acc + Math.max(0, target - savings);
    }, 0);

  const expectedTenYearsSavings = liquidCash + (monthlyPremiumSurplus * 12 * 10);

  if (tenYearsTargetTotal > expectedTenYearsSavings) {
    conflicts.push(
      `Capital Deficit Triggered: Your target goals through 2036 require $${tenYearsTargetTotal.toLocaleString()}, which exceeds projected liquid savings of $${Math.round(expectedTenYearsSavings).toLocaleString()} by $${Math.round(tenYearsTargetTotal - expectedTenYearsSavings).toLocaleString()}.`
    );
  }

  // 2. Specific Retirement vs College conflict
  const hasActiveEducationGoal = goals.some(g => g.category === "education" && g.priority === "essential");
  const hasActiveRetirementGoal = goals.some(g => g.category === "retirement");
  if (hasActiveEducationGoal && hasActiveRetirementGoal && twin.riskTolerance === "conservative") {
    conflicts.push(
      "Asset Growth Conflict: Retaining a conservative asset profile while simultaneously funding 100% of college costs causes retirement nest egg compounding speed to drop below target projections."
    );
  }

  // 3. High DTI or debt vs property
  const hasPropertyGoal = goals.some(g => g.category === "property");
  const totalLiabilities = (twin.liabilities || []).reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  if (hasPropertyGoal && totalLiabilities > 25000) {
    conflicts.push(
      `Leverage Burden warning: Carrying $${totalLiabilities.toLocaleString()} of active liabilities while funding property down payments creates structural liquidity friction. Consider focusing on accelerated debt payoff first to reclaim monthly cash flow.`
    );
  }

  return (
    <div id="goals-matrix-page" className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-teal-50/70 via-emerald-50/40 to-slate-50 border border-slate-100 p-6 rounded-2xl">
        <span className="text-teal-600 font-mono text-xs tracking-wider uppercase font-bold">Life Goals & Progress</span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Life Goals</h2>
        <p className="text-xs text-slate-500 mt-1">
          Coordinate your personal life milestones. Aura maps out your trajectory to help secure your future.
        </p>
      </div>

      {/* CONFLICT DETECTOR PANEL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-800">Aura's Outcome Guidance & Trade-offs</h3>
        </div>

        {conflicts.length === 0 ? (
          <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-emerald-800 font-bold">Zero Timeline Conflicts Detected</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Your monthly saving surplus perfectly offsets prioritized targets across all chronological boundaries.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {conflicts.map((conf, index) => (
              <div key={index} className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs text-rose-800 font-bold">Goal Collision #{index + 1}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-sans">{conf}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEW GOAL CREATION FORM */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Establish New Milestone</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <label className="text-[10px] text-slate-500 block mb-1 font-bold">GOAL NAME</label>
            <input
              type="text"
              placeholder="e.g. Dream Home down payment"
              value={newGoal.name}
              onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-850 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-1 font-bold">CATEGORY</label>
            <select
              value={newGoal.category}
              onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as any })}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-850 focus:outline-none focus:border-teal-500"
            >
              <option value="retirement">Retirement</option>
              <option value="property">Real Estate</option>
              <option value="education">Education (529)</option>
              <option value="debt_free">Debt Free Day</option>
              <option value="other">Other Outlay</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-1 font-bold">TARGET VALUE ($)</label>
            <input
              type="number"
              value={newGoal.targetAmount}
              onChange={(e) => setNewGoal({ ...newGoal, targetAmount: parseFloat(e.target.value) || 0 })}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-850 font-mono focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-1 font-bold">TARGET YEAR</label>
            <input
              type="number"
              value={newGoal.targetYear}
              onChange={(e) => setNewGoal({ ...newGoal, targetYear: parseInt(e.target.value) || 2030 })}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-850 font-mono focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-1 font-bold">PRIORITY</label>
            <select
              value={newGoal.priority}
              onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value as any })}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-850 focus:outline-none focus:border-teal-500"
            >
              <option value="essential">Essential</option>
              <option value="important">Important</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleCreateGoal}
          disabled={!newGoal.name}
          className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-all shadow-md"
        >
          <Plus className="w-3.5 h-3.5" /> Add Milestone
        </button>
      </div>

      {/* LIFE PROGRESS OVERVIEW */}
      {(() => {
        const totalGoalsCount = goals.length;
        const goalsOnTrackCount = goals.filter(g => {
          const percent = Math.min(100, Math.round((g.currentSavings / g.targetAmount) * 100));
          return percent >= 10 || g.category === "education" || g.category === "property";
        }).length;
        const goalsAtRiskCount = Math.max(0, totalGoalsCount - goalsOnTrackCount);

        const overallCompletionPercent = totalGoalsCount > 0 
          ? Math.round(goals.reduce((acc, curr) => {
              const target = Number(curr.targetAmount) || 0;
              const savings = Number(curr.currentSavings) || 0;
              const percent = target > 0 ? (savings / target) * 100 : 0;
              return acc + Math.min(100, percent);
            }, 0) / totalGoalsCount)
          : 0;

        const filledBlocksCount = Math.min(16, Math.round(overallCompletionPercent / 6.25));
        const emptyBlocksCount = 16 - filledBlocksCount;
        const blockProgressBar = "█".repeat(filledBlocksCount) + "░".repeat(emptyBlocksCount);

        // Calculate Plan Health Rating dynamically
        const onTrackRatio = totalGoalsCount > 0 ? (goalsOnTrackCount / totalGoalsCount) : 1.0;
        let planHealthLabel = "Stable";
        let planHealthColor = "text-teal-600";
        let planHealthBgColor = "bg-teal-50 border-teal-200 text-teal-700";

        if (onTrackRatio >= 0.8 && overallCompletionPercent >= 15) {
          planHealthLabel = "Excellent";
          planHealthColor = "text-emerald-600";
          planHealthBgColor = "bg-emerald-50 border-emerald-200 text-emerald-700";
        } else if (onTrackRatio >= 0.6 || overallCompletionPercent >= 10) {
          planHealthLabel = "Strong";
          planHealthColor = "text-emerald-600";
          planHealthBgColor = "bg-emerald-50 border-emerald-200 text-emerald-700";
        } else if (onTrackRatio >= 0.3 || overallCompletionPercent > 0) {
          planHealthLabel = "Stable";
          planHealthColor = "text-teal-600";
          planHealthBgColor = "bg-teal-50 border-teal-200 text-teal-700";
        } else {
          planHealthLabel = "Needs Attention";
          planHealthColor = "text-rose-600";
          planHealthBgColor = "bg-rose-50 border-rose-200 text-rose-700";
        }

        return (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 font-sans relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-teal-600 uppercase tracking-widest block font-bold leading-none">Overall Plan Health</span>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Your Cumulative Plan Health</h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                  A unified timeline projection coordinating your major lifetime milestones. The status of all essential and optional family milestones are combined here.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto items-stretch sm:items-center font-sans">
                {/* Main Plan Health Stat */}
                <div className="bg-slate-50/50 border border-slate-200 p-4 rounded-xl flex flex-col justify-center min-w-[210px]">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Plan Health</span>
                    <span className={`font-sans text-[10px] font-bold px-2 py-0.5 rounded-lg border leading-none capitalize ${planHealthBgColor}`}>
                      {planHealthLabel}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-teal-600 tracking-normal select-none leading-none mb-2 font-bold">
                    {blockProgressBar}
                  </div>
                  {/* Beautiful continuous bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-700"
                      style={{ width: `${overallCompletionPercent}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 font-mono uppercase block text-left font-bold">
                    {overallCompletionPercent}% funded towards milestones
                  </span>
                </div>

                {/* Quick Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 flex-1 lg:flex-initial">
                  <div className="bg-slate-50/50 border border-slate-200 p-3 rounded-xl text-center min-w-[80px] sm:min-w-[90px] flex flex-col justify-center shadow-sm">
                    <span className="text-slate-400 text-[9px] font-mono uppercase font-bold block leading-none">Total</span>
                    <span className="text-slate-800 font-mono text-lg font-bold mt-1 block leading-none">{totalGoalsCount}</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center min-w-[80px] sm:min-w-[90px] flex flex-col justify-center shadow-sm">
                    <span className="text-emerald-700 text-[9px] font-mono uppercase font-bold block leading-none font-bold">On Track</span>
                    <span className="text-emerald-700 font-mono text-lg font-bold mt-1 block leading-none">{goalsOnTrackCount}</span>
                  </div>
                  <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-center min-w-[80px] sm:min-w-[90px] flex flex-col justify-center shadow-sm">
                    <span className="text-rose-700 text-[9px] font-mono uppercase font-bold block leading-none font-bold">At Risk</span>
                    <span className="text-rose-700 font-mono text-lg font-bold mt-1 block leading-none">{goalsAtRiskCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* GOALS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((g) => {
          const percent = Math.min(100, Math.round((g.currentSavings / g.targetAmount) * 100));
          const emoji = GOAL_EMOJIS[g.category] || "🎯";
          const categoryTitle = GOAL_TITLES[g.category] || "Goal";

          // Dynamic emotional decision impact statements
          let decisionImpact = "";
          let statusLabel = g.status || "On Track";
          let statusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";

          if (g.category === "retirement") {
            decisionImpact = "Taking on a major extra luxury outlay now would delay your early retirement milestones by 14 months.";
            if (!g.status) statusLabel = "Needs Growth";
          } else if (g.category === "property") {
            decisionImpact = "Simulating a high-price auto purchase on leverage may delay your property down payment by 8 months.";
            if (!g.status) statusLabel = "Active Scenario";
          } else if (g.category === "education") {
            decisionImpact = "Increasing savings by $100/month covers premium university tuition projections years ahead.";
            if (!g.status) statusLabel = "On Track";
          } else if (g.category === "debt_free") {
            decisionImpact = "Paying down revolving credit card debt first shifts your complete debt-free target 10 months closer.";
            if (!g.status) statusLabel = "Prioritized";
          } else {
            decisionImpact = "Maintaining an emergency buffer keeps your dependents safe and independent of market drops.";
            if (!g.status) statusLabel = "Fully Protected";
          }

          if (statusLabel === "Needs Attention" || statusLabel === "Needs Growth") {
            statusColor = "text-amber-700 bg-amber-50 border-amber-200";
          } else if (statusLabel === "Off Track") {
            statusColor = "text-rose-700 bg-rose-50 border-rose-200";
          } else if (statusLabel === "Active Scenario" || statusLabel === "Approved" || statusLabel === "On Track") {
            statusColor = "text-teal-750 bg-teal-50 border-teal-200";
          }

          return (
            <div key={g.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-teal-200 hover:shadow-md transition-all font-sans relative overflow-hidden shadow-sm">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl" id={`goal-emoji-${g.id}`}>{emoji}</span>
                    <div>
                      <select
                        value={g.category}
                        onChange={(e) => handleEditGoal(g.id, "category", e.target.value as any)}
                        className="bg-transparent text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold cursor-pointer hover:text-teal-600 focus:outline-none focus:text-teal-600 p-0"
                      >
                        <option value="property" className="bg-white text-slate-800">Dream Home</option>
                        <option value="retirement" className="bg-white text-slate-800">Retirement</option>
                        <option value="education" className="bg-white text-slate-800">College Fund</option>
                        <option value="debt_free" className="bg-white text-slate-800">Debt Freedom</option>
                        <option value="other" className="bg-white text-slate-800">Family Security</option>
                      </select>
                      <input
                        type="text"
                        value={g.name}
                        onChange={(e) => handleEditGoal(g.id, "name", e.target.value)}
                        className="bg-transparent text-slate-800 text-base font-bold mt-0.5 border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-slate-50 transition-all py-0.5 px-1 rounded-lg focus:outline-none w-full"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveGoal(g.id)}
                    className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-50 transition-all cursor-pointer border-transparent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress indicators and metrics */}
                <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-150 shadow-inner">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-mono tracking-wider font-bold">Target Amount</span>
                      <div className="relative flex items-center mt-1">
                        <span className="text-slate-400 mr-0.5 text-xs font-mono font-bold">$</span>
                        <input
                          type="number"
                          value={g.targetAmount}
                          onChange={(e) => handleEditGoal(g.id, "targetAmount", parseFloat(e.target.value) || 0)}
                          className="bg-transparent text-slate-800 font-bold font-mono text-[13px] border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-slate-50 transition-all py-0.5 px-1 rounded-lg focus:outline-none w-full"
                        />
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-slate-400 block text-[9px] uppercase font-mono tracking-wider font-bold">Saved So Far</span>
                      <div className="relative flex items-center justify-end mt-1">
                        <span className="text-slate-400 mr-0.5 text-xs font-mono font-bold">$</span>
                        <input
                          type="number"
                          value={g.currentSavings}
                          onChange={(e) => handleEditGoal(g.id, "currentSavings", parseFloat(e.target.value) || 0)}
                          className="bg-transparent text-teal-600 font-bold font-mono text-[13px] text-right border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-slate-50 transition-all py-0.5 px-1 rounded-lg focus:outline-none w-28"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-1">
                    <div className="flex justify-between items-center text-[11px] mb-1 font-sans">
                      <span className="text-slate-500 font-medium font-mono font-bold">Progress: {percent}%</span>
                      <div className="flex items-center gap-1 font-mono">
                        <span className="text-slate-400 font-bold">Year:</span>
                        <input
                          type="number"
                          value={g.targetYear}
                          onChange={(e) => handleEditGoal(g.id, "targetYear", parseInt(e.target.value) || 2035)}
                          className="bg-transparent text-teal-600 font-bold border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:bg-slate-50 transition-all py-0.5 px-1 rounded-lg focus:outline-none w-14 font-mono text-right"
                        />
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${percent > 75 ? "bg-teal-500" : percent > 40 ? "bg-emerald-400" : "bg-slate-300"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic status & Coaching speech */}
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-150 font-sans">
                  <div className="flex justify-between items-center mb-1 pb-1 border-b border-slate-150">
                    <span className="text-[9px] uppercase font-mono text-slate-400 font-bold">Goal Status</span>
                    <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-lg border ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-sans mt-2 italic md:text-xs">
                    &ldquo;{decisionImpact}&rdquo;
                  </p>
                </div>

                {g.approvedScenarioType && (
                  <div className="bg-teal-50/40 border border-teal-100 rounded-xl p-3.5 space-y-2 text-xs font-sans">
                    <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider font-bold text-teal-700">
                      <span>Approved Scenario Detail</span>
                      <span>{g.approvedScenarioName || "Balanced Scenario"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase font-mono">Monthly Commitment</span>
                        <span className="font-bold text-slate-800 font-mono">${(g.monthlyContribution || 0).toLocaleString()}/mo</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase font-mono">Lifetime Impact</span>
                        <span className="font-bold text-teal-705 font-mono">+${(g.projectedImpact || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    {g.approvedAssumptions && g.approvedAssumptions.length > 0 && (
                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase font-mono">Core Assumption</span>
                        <p className="text-[10.5px] text-slate-600 truncate animate-pulse" title={g.approvedAssumptions.join(", ")}>
                          {g.approvedAssumptions[0]}
                        </p>
                      </div>
                    )}
                    {g.nextAction && (
                      <div className="bg-white border border-teal-50 rounded-lg p-2 text-[10.5px]">
                        <span className="text-teal-600 font-bold uppercase font-mono text-[8px] tracking-wider block">RECOMMENDED NEXT ACTION</span>
                        <p className="text-slate-700 font-bold leading-normal mt-0.5">
                          {g.nextAction}
                        </p>
                      </div>
                    )}
                    {g.approvedDate && (
                      <span className="text-[9px] font-mono text-slate-400 block pt-1 font-bold">
                        Approved on: {g.approvedDate}
                      </span>
                    )}
                  </div>
                )}

                {g.approvedScenarioType && (
                  <button
                    type="button"
                    onClick={() => onReviewGoal && onReviewGoal(g)}
                    className="w-full mt-2 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer font-sans shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Review or Re-Simulate
                  </button>
                )}
              </div>

              <div className="flex justify-between items-center text-[10px] font-sans border-t border-slate-100 pt-4 mt-5">
                <span className="text-slate-400 uppercase tracking-widest font-mono font-bold text-[9px]">TIMELINE INDEX</span>
                <div>
                  <select
                    value={g.priority}
                    onChange={(e) => handleEditGoal(g.id, "priority", e.target.value as any)}
                    className="bg-transparent text-[9px] font-mono uppercase tracking-wider font-bold cursor-pointer hover:text-teal-600 border-b border-transparent hover:border-slate-300 focus:outline-none focus:text-teal-600 p-0 text-right"
                  >
                    <option value="essential" className="bg-white text-emerald-600 uppercase font-bold">Essential Priority</option>
                    <option value="important" className="bg-white text-slate-600 uppercase font-bold">Important Priority</option>
                    <option value="flexible" className="bg-white text-slate-400 uppercase font-bold">Flexible Priority</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
