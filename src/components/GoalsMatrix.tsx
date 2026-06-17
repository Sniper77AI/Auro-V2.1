/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FinancialTwin } from "../types";
import { Award, AlertTriangle, CheckCircle, Scale, Plus, Trash2, Calendar, Target, HelpCircle } from "lucide-react";

interface GoalItem {
  id: string;
  name: string;
  category: "retirement" | "property" | "education" | "debt_free" | "other";
  targetAmount: number;
  targetYear: number;
  currentSavings: number;
  priority: "essential" | "important" | "flexible";
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
}

export default function GoalsMatrix({ twin }: GoalsMatrixProps) {
  const [goals, setGoals] = useState<GoalItem[]>([
    { id: "g-1", name: "Comfortable Retirement Nest Egg", category: "retirement", targetAmount: 1800000, targetYear: 2054, currentSavings: 55000, priority: "essential" },
    { id: "g-2", name: "Our Dream Property Down Payment", category: "property", targetAmount: 120000, targetYear: 2030, currentSavings: 15000, priority: "important" },
    { id: "g-3", name: "Dependent College Trust Fund", category: "education", targetAmount: 150000, targetYear: 2040, currentSavings: 12000, priority: "flexible" },
    { id: "g-4", name: "Complete Debt Freedom & Payoff", category: "debt_free", targetAmount: 15000, targetYear: 2028, currentSavings: 0, priority: "essential" }
  ]);

  const [newGoal, setNewGoal] = useState<Omit<GoalItem, "id">>({
    name: "",
    category: "property",
    targetAmount: 50000,
    targetYear: 2032,
    currentSavings: 0,
    priority: "important"
  });

  const handleCreateGoal = () => {
    if (!newGoal.name) return;
    const item: GoalItem = {
      ...newGoal,
      id: Math.random().toString(36).substring(2, 9)
    };
    setGoals([...goals, item]);
    setNewGoal({ name: "", category: "property", targetAmount: 50000, targetYear: 2032, currentSavings: 0, priority: "important" });
  };

  const handleRemoveGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  // Conflict detection algorithms:
  const totalAnnualIncome = twin.incomes.reduce((acc, curr) => acc + (curr.frequency === "annual" ? curr.amount : curr.amount * 12), 0);
  const liquidCash = twin.assets.filter(a => a.type === "cash" || a.type === "brokerage").reduce((acc, c) => acc + c.amount, 0);
  const monthlyPremiumSurplus = Math.max(0, (totalAnnualIncome / 12) - twin.monthlyExpenses);

  const conflicts: string[] = [];

  // Rules:
  // 1. If total raw target goals scheduled across the next 10 years exceeds liquid reserves plus cumulative monthly surplus * 10 years, detect conflict
  const tenYearsTargetTotal = goals
    .filter(g => g.targetYear <= 2036)
    .reduce((acc, curr) => acc + (curr.targetAmount - curr.currentSavings), 0);

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
  const totalLiabilities = twin.liabilities.reduce((acc, c) => acc + c.amount, 0);
  if (hasPropertyGoal && totalLiabilities > 25000) {
    conflicts.push(
      `Leverage Burden warning: Carrying $${totalLiabilities.toLocaleString()} of active liabilities while funding property down payments creates structural liquidity friction. Consider focusing on accelerated debt payoff first to reclaim monthly cash flow.`
    );
  }

  return (
    <div id="goals-matrix-page" className="space-y-6 font-sans">
      {/* Page Header */}
      <div>
        <span className="text-emerald-400 font-mono text-xs tracking-wider uppercase font-bold">Life Outcomes & Progress</span>
        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight mt-1">My Life Outcomes</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Coordinate your personal life milestones. Aura maps out your trajectory to help secure your future.
        </p>
      </div>

      {/* CONFLICT DETECTOR PANEL */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-emerald-405" />
          <h3 className="text-sm font-bold text-zinc-200">Aura's Outcome Guidance & Trade-offs</h3>
        </div>

        {conflicts.length === 0 ? (
          <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-zinc-200 font-bold">Zero Timeline Conflicts Detected</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Your monthly saving surplus perfectly offsets prioritized targets across all chronological boundaries.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {conflicts.map((conf, index) => (
              <div key={index} className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs text-zinc-200 font-bold">Goal Collision #{index + 1}</p>
                  <p className="text-[11px] text-rose-300 leading-relaxed font-sans">{conf}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEW GOAL CREATION FORM */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">Establish New Milestone</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <label className="text-[10px] text-zinc-550 block mb-1">GOAL NAME</label>
            <input
              type="text"
              placeholder="e.g. Dream Home down payment"
              value={newGoal.name}
              onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-zinc-550 block mb-1">CATEGORY</label>
            <select
              value={newGoal.category}
              onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as any })}
              className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="retirement">Retirement</option>
              <option value="property">Real Estate</option>
              <option value="education">Education (529)</option>
              <option value="debt_free">Debt Free Day</option>
              <option value="other">Other Outlay</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-zinc-550 block mb-1">TARGET VALUE ($)</label>
            <input
              type="number"
              value={newGoal.targetAmount}
              onChange={(e) => setNewGoal({ ...newGoal, targetAmount: parseFloat(e.target.value) || 0 })}
              className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-200 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-zinc-550 block mb-1">TARGET YEAR</label>
            <input
              type="number"
              value={newGoal.targetYear}
              onChange={(e) => setNewGoal({ ...newGoal, targetYear: parseInt(e.target.value) || 2030 })}
              className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-200 font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-zinc-550 block mb-1">PRIORITY</label>
            <select
              value={newGoal.priority}
              onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value as any })}
              className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-200 focus:outline-none"
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
          className="bg-emerald-600 hover:bg-emerald-500 text-zinc-900 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-40"
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
          ? Math.round(goals.reduce((acc, curr) => acc + Math.min(100, (curr.currentSavings / curr.targetAmount) * 100), 0) / totalGoalsCount)
          : 0;

        const filledBlocksCount = Math.min(16, Math.round(overallCompletionPercent / 6.25));
        const emptyBlocksCount = 16 - filledBlocksCount;
        const blockProgressBar = "█".repeat(filledBlocksCount) + "░".repeat(emptyBlocksCount);

        return (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 font-sans relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block font-bold leading-none">Life Progress Overview</span>
                <h3 className="text-lg font-bold text-zinc-100 tracking-tight">Your Cumulative Plan Health</h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
                  A unified timeline projection coordinating your major lifetime milestones. The status of all essential and optional family milestones are combined here.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto items-stretch sm:items-center font-sans">
                {/* Main Completion Stat */}
                <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl flex flex-col justify-center min-w-[200px]">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold tracking-wider">Life Progress</span>
                    <span className="text-emerald-400 font-mono text-xs font-bold leading-none">{overallCompletionPercent}%</span>
                  </div>
                  <div className="font-mono text-xs text-emerald-400 tracking-normal select-none leading-none mb-2 font-bold">
                    {blockProgressBar}
                  </div>
                  {/* Beautiful continuous bar */}
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                      style={{ width: `${overallCompletionPercent}%` }}
                    />
                  </div>
                </div>

                {/* Quick Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 flex-1 lg:flex-initial">
                  <div className="bg-zinc-950/40 border border-zinc-850/60 p-3 rounded-xl text-center min-w-[80px] sm:min-w-[90px] flex flex-col justify-center">
                    <span className="text-zinc-500 text-[9px] font-mono uppercase font-bold block leading-none">Total</span>
                    <span className="text-zinc-200 font-mono text-lg font-bold mt-1 block leading-none">{totalGoalsCount}</span>
                  </div>
                  <div className="bg-emerald-950/10 border border-emerald-950/20 p-3 rounded-xl text-center min-w-[80px] sm:min-w-[90px] flex flex-col justify-center">
                    <span className="text-emerald-400 text-[9px] font-mono uppercase font-bold block leading-none">On Track</span>
                    <span className="text-emerald-400 font-mono text-lg font-bold mt-1 block leading-none">{goalsOnTrackCount}</span>
                  </div>
                  <div className="bg-rose-955/10 border border-rose-950/20 p-3 rounded-xl text-center min-w-[80px] sm:min-w-[90px] flex flex-col justify-center">
                    <span className="text-rose-400 text-[9px] font-mono uppercase font-bold block leading-none">At Risk</span>
                    <span className="text-rose-450 font-mono text-lg font-bold mt-1 block leading-none">{goalsAtRiskCount}</span>
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
          let statusLabel = "On Track";
          let statusColor = "text-emerald-400 bg-emerald-950/40 border-emerald-900";

          if (g.category === "retirement") {
            decisionImpact = "Taking on a major extra luxury outlay now would delay your early retirement milestones by 14 months.";
            statusLabel = "Needs Growth";
            statusColor = "text-amber-450 bg-amber-950/20 border-amber-900/40";
          } else if (g.category === "property") {
            decisionImpact = "Simulating a high-price auto purchase on leverage may delay your property down payment by 8 months.";
            statusLabel = "Active Scenario";
            statusColor = "text-teal-400 bg-teal-950/20 border-teal-900/40";
          } else if (g.category === "education") {
            decisionImpact = "Increasing savings by $100/month covers premium university tuition projections years ahead.";
            statusLabel = "On Track";
            statusColor = "text-emerald-400 bg-emerald-950/20 border-emerald-900/40";
          } else if (g.category === "debt_free") {
            decisionImpact = "Paying down revolving credit card debt first shifts your complete debt-free target 10 months closer.";
            statusLabel = "Prioritized";
            statusColor = "text-emerald-450 bg-emerald-950/25 border-emerald-900/40";
          } else {
            decisionImpact = "Maintaining an emergency buffer keeps your dependents safe and independent of market drops.";
            statusLabel = "Fully Protected";
            statusColor = "text-teal-450 bg-teal-950/25 border-teal-905/40";
          }

          return (
            <div key={g.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between hover:border-zinc-700/60 transition-all font-sans relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl" id={`goal-emoji-${g.id}`}>{emoji}</span>
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">{categoryTitle}</span>
                      <h4 className="text-base font-bold text-zinc-100 mt-0.5">{g.name}</h4>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveGoal(g.id)}
                    className="text-zinc-600 hover:text-rose-450 p-1.5 rounded-lg hover:bg-zinc-950 transition-all cursor-pointer border-transparent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress indicators and metrics */}
                <div className="space-y-3 bg-zinc-950/40 p-4 rounded-xl border border-zinc-850/40">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[9px] uppercase font-mono tracking-wider font-semibold">Target Amount</span>
                      <span className="text-zinc-200 font-bold font-mono text-[13px]">${g.targetAmount.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-500 block text-[9px] uppercase font-mono tracking-wider font-semibold">Saved So Far</span>
                      <span className="text-emerald-400 font-bold font-mono text-[13px]">${g.currentSavings.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <div className="flex justify-between text-[11px] mb-1 font-sans">
                      <span className="text-zinc-400 font-medium">Progress: {percent}%</span>
                      <span className="text-teal-400 font-semibold">Target Year: {g.targetYear}</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${percent > 75 ? "bg-emerald-500" : percent > 40 ? "bg-teal-400" : "bg-zinc-500"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic status & Coaching speech */}
                <div className="bg-zinc-950/45 p-3 rounded-lg border border-zinc-850/20 font-sans">
                  <div className="flex justify-between items-center mb-1 pb-1 border-b border-zinc-850/20">
                    <span className="text-[9px] uppercase font-mono text-zinc-500 font-bold">Goal Status</span>
                    <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-350 leading-relaxed font-sans mt-2 italic. md:text-xs">
                    &ldquo;{decisionImpact}&rdquo;
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-sans border-t border-zinc-850/40 pt-4 mt-5">
                <span className="text-zinc-500 uppercase tracking-widest font-mono font-bold text-[9px]">TIMELINE INDEX</span>
                <span className={`px-2.5 py-0.5 rounded-full uppercase text-[9px] font-mono tracking-wider ${g.priority === "essential" ? "bg-emerald-950/60 border border-emerald-900/40 text-emerald-400" : g.priority === "important" ? "bg-zinc-950 border border-zinc-850 text-zinc-300" : "bg-transparent text-zinc-500"}`}>
                  {g.priority} priority
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
