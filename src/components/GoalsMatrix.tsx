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

interface GoalsMatrixProps {
  twin: FinancialTwin;
}

export default function GoalsMatrix({ twin }: GoalsMatrixProps) {
  const [goals, setGoals] = useState<GoalItem[]>([
    { id: "g-1", name: "Early Retirement Nest Egg", category: "retirement", targetAmount: 1800000, targetYear: 2054, currentSavings: 55000, priority: "essential" },
    { id: "g-2", name: "Dream Property Down Payment", category: "property", targetAmount: 120000, targetYear: 2030, currentSavings: 15000, priority: "important" },
    { id: "g-3", name: "Dependent College Trust (529)", category: "education", targetAmount: 150000, targetYear: 2040, currentSavings: 12000, priority: "flexible" },
    { id: "g-4", name: "Complete Student Debt Freedom", category: "debt_free", targetAmount: 15000, targetYear: 2028, currentSavings: 0, priority: "essential" }
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
      `Leverage Burden warning: Carrying $${totalLiabilities.toLocaleString()} of active liabilities while funding property down payments creates structural liquidity friction. Consider debt paydown optimization beforehand.`
    );
  }

  return (
    <div id="goals-matrix-page" className="space-y-6">
      {/* Page Header */}
      <div>
        <span className="text-emerald-400 font-mono text-xs tracking-wider uppercase font-bold">Goal Prioritization & Conflict Engine</span>
        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight mt-1">Multi-Timeline Goals Matrix</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Coordinate life milestones side-by-side. Aura's heuristic processor maps temporal correlations automatically.
        </p>
      </div>

      {/* CONFLICT DETECTOR PANEL */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-emerald-405" />
          <h3 className="text-sm font-bold text-zinc-200">Aura Goal Collisions & Tradeoffs</h3>
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
          className="bg-emerald-600 hover:bg-emerald-505 text-zinc-900 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" /> Append Goal
        </button>
      </div>

      {/* GOALS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((g) => {
          const percent = Math.min(100, Math.round((g.currentSavings / g.targetAmount) * 100));
          return (
            <div key={g.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-all">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">{g.category.replace("_", " ")}</span>
                    <h4 className="text-sm font-bold text-zinc-100 mt-1">{g.name}</h4>
                  </div>
                  <button
                    onClick={() => handleRemoveGoal(g.id)}
                    className="text-zinc-600 hover:text-rose-400 p-1 rounded transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress indicator */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-400">Progress: {percent}%</span>
                    <span className="text-zinc-200 font-bold">${g.currentSavings.toLocaleString()} / ${g.targetAmount.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${percent > 75 ? "bg-emerald-400" : percent > 40 ? "bg-teal-400" : "bg-zinc-600"}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono border-t border-zinc-800/40 pt-4 mt-6">
                <span className="text-zinc-500">Timeline Target Year: <strong className="text-zinc-200">{g.targetYear}</strong></span>
                <span className={`px-2 py-0.5 rounded uppercase ${g.priority === "essential" ? "bg-emerald-950/30 border border-emerald-900 text-emerald-400" : g.priority === "important" ? "bg-zinc-950 border border-zinc-850 text-zinc-300" : "bg-zinc-950 border border-zinc-900 text-zinc-500"}`}>
                  {g.priority}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
