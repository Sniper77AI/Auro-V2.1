/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { FinancialTwin, SimulationResult } from "../types";
import { 
  TrendingUp, Award, Clock
} from "lucide-react";
import {
  calculateReadinessScore,
  calculateTotalAnnualIncome,
  calculateTotalAssets,
  calculateTotalLiabilities,
  calculateNetWorth,
  calculateMonthlyDebtPayments,
  calculateMonthlyGrossIncome,
  calculateMonthlySurplus,
  calculateDebtToIncomeRatio,
  calculateEmergencyFundMonths,
  calculateHighInterestDebt,
  calculateValueWeightedAssetGrowth,
  calculateProfileCompleteness,
  formatCurrency
} from "../utils/financialCalculations";
import { generateFinancialInsights } from "../utils/financialInsights";

interface CommandCenterProps {
  twin: FinancialTwin;
  savedSimulations: SimulationResult[];
  onOpenSimulator: (initialType?: any) => void;
  onOpenTwin: () => void;
}

export default function CommandCenter({ twin, savedSimulations, onOpenSimulator, onOpenTwin }: CommandCenterProps) {
  // Aggregate stats using central calculation engine
  const totalAnnualIncome = calculateTotalAnnualIncome(twin.incomes || []);
  const totalAssetsValue = calculateTotalAssets(twin.assets || []);
  const totalLiabilitiesValue = calculateTotalLiabilities(twin.liabilities || []);
  const netWorth = calculateNetWorth(twin.assets || [], twin.liabilities || []);

  const cashAssets = (twin.assets || []).filter(a => a.type === "cash").reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const highInterestLiabilities = calculateHighInterestDebt(twin.liabilities || [], 0.05); // Keeps 0.05 custom threshold for display indicators
  const totalMonthlyDebtPayments = calculateMonthlyDebtPayments(twin.liabilities || []);
  const monthlyGrossIncome = calculateMonthlyGrossIncome(twin.incomes || []);
  const debtToIncomeRatio = calculateDebtToIncomeRatio(twin.incomes || [], twin.liabilities || []);
  const averageGrowthRate = calculateValueWeightedAssetGrowth(twin.assets || []);
  const expensesRatio = calculateEmergencyFundMonths(twin.assets || [], twin.monthlyExpenses);
  const monthlySurplus = calculateMonthlySurplus(twin.incomes || [], twin.monthlyExpenses, twin.liabilities || []);

  // Compute readiness score and its details from the single source of truth
  const readinessResult = calculateReadinessScore(twin);
  const healthScore = readinessResult.score;
  const statusLabel = readinessResult.label;

  let statusColorClass = "text-emerald-700 border-emerald-200 bg-emerald-50";
  if (statusLabel === "Excellent") {
    statusColorClass = "text-emerald-700 border-emerald-200 bg-emerald-50";
  } else if (statusLabel === "Strong") {
    statusColorClass = "text-teal-700 border-teal-200 bg-teal-50";
  } else if (statusLabel === "Proceed Carefully") {
    statusColorClass = "text-amber-700 border-amber-200 bg-amber-50";
  } else {
    statusColorClass = "text-rose-700 border-rose-200 bg-rose-50";
  }

  // Chief of Staff priority engine logic
  let primaryActionTitle = "Maximize Compound Velocity";
  let primaryActionDesc = "Your wealth foundations look secure. Shift liquid reserves toward long-term tax-sheltered portfolios (Roth IRA/401k) to maximize annual compounding growth.";
  let priorityLevel: "low" | "medium" | "high" = "low";

  if (expensesRatio < 3) {
    primaryActionTitle = "Halt Discretionary Spending & Save Emergency Buffer";
    primaryActionDesc = `Your liquid cache (${formatCurrency(cashAssets)}) covers less than 3 months of basic expenses (${formatCurrency(twin.monthlyExpenses)}). Prioritize liquid compound cash flow.`;
    priorityLevel = "high";
  } else if (highInterestLiabilities > 10000) {
    primaryActionTitle = "Launch Private Debt Avalanche payoff";
    primaryActionDesc = `You hold ${formatCurrency(highInterestLiabilities)} of liabilities averaging over 5.0% interest APR. Prioritize surplus cash flows to trigger refinancing or avalanche schedules.`;
    priorityLevel = "high";
  } else if (debtToIncomeRatio > 36) {
    primaryActionTitle = "DTI Overhead Correction";
    primaryActionDesc = `Your Debt-to-Income ratio (${debtToIncomeRatio.toFixed(1)}%) exceeds the 36% systemic threshold. Avoid new physical asset leverage until current lines amortize.`;
    priorityLevel = "medium";
  }

  // Calculate profile completeness status for dynamic confidence assessment
  const profileCompleteness = calculateProfileCompleteness(twin);

  // Derive model recommendation confidence
  let confidencePct = Math.round(profileCompleteness * 0.8 + 12);
  const dataComplexityMod = Math.min(15, ((twin.incomes || []).length + (twin.assets || []).length + (twin.liabilities || []).length) * 2);
  confidencePct = Math.min(99, confidencePct + dataComplexityMod);
  if (profileCompleteness < 50) {
    confidencePct = Math.min(50, confidencePct - 15);
  } else if (profileCompleteness < 75) {
    confidencePct = Math.min(75, confidencePct - 5);
  }
  const confidenceLevel = confidencePct >= 80 ? "High" : confidencePct >= 55 ? "Medium" : "Low";

  // Dynamic explanation bullets based on user profile and decision state
  let reasons: string[] = [];
  if (expensesRatio < 3) {
    reasons = [
      `Liquid checking and cash reserves of ${formatCurrency(cashAssets)} cover less than 3 months of basic outflows`,
      "Protects regular household expenses from forced early liquidation penalties in long-term accounts",
      "Stabilizes fundamental household cash availability during general macroeconomic transitions",
      "Establishes a solid baseline emergency buffer before exposing surpluses to asset market valuation volatility"
    ];
  } else if (highInterestLiabilities > 10000) {
    reasons = [
      "Provides the highest guaranteed return currently available by bypassing standard interest rates",
      `Directly eliminates compounding interest charges on outstanding ${formatCurrency(highInterestLiabilities)} student / vehicle liabilities`,
      "Accelerates the overall timeline toward a debt-free calendar horizon",
      "Improves your financial readiness scores and reduces long-term debt-to-income overhead",
      "Reclaims active monthly cash flow margins for subsequently powering long-term index compounding"
    ];
  } else if (debtToIncomeRatio > 36) {
    reasons = [
      `Calibrates your total Debt-to-Income which sits at ${debtToIncomeRatio.toFixed(1)}%, bringing it back below prudent guidelines`,
      "Reduces structural overhead burdens, granting increased peace of mind and job flexibility",
      "Minimizes borrowing risk premiums when acquiring future primary real estate holdings",
      "Accelerates current loan payoff tracks to clear secondary monthly liability overhead"
    ];
  } else {
    reasons = [
      `Leverages and builds upon your resilient current emergency cushion of ${expensesRatio.toFixed(1)} months of coverage`,
      "Enables tax-advantaged compounding gains that grow protected from federal and state tax friction",
      `Improves historical yield trajectory on your existing idle checking capital of ${formatCurrency(cashAssets)}`,
      `Strengthens and preserves early-retirement tracks ahead of your current target retirement age of ${twin.retirementAge}`
    ];
  }

  // Opportunities and Risks cards generated dynamically from the Financial Twin profile
  const insightsResult = generateFinancialInsights(twin);
  const opportunities = insightsResult.opportunities;
  const risks = insightsResult.risks;

  // QA Check: temporary console logs only in development mode
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log("=== [QA CHECK] DEVELOPMENT MODE FINANCIAL ENGINE ===");
      console.log(`Annual Income:          ${totalAnnualIncome}`);
      console.log(`Net Worth:              ${netWorth}`);
      console.log(`Emergency Fund Months:  ${expensesRatio.toFixed(2)}`);
      console.log(`Debt-to-Income Ratio:   ${debtToIncomeRatio.toFixed(2)}%`);
      console.log(`Monthly Surplus:        ${monthlySurplus}`);
      console.log(`Readiness Score:        ${healthScore} (${statusLabel})`);
      console.log("====================================================");
    }
  }, [totalAnnualIncome, netWorth, expensesRatio, debtToIncomeRatio, monthlySurplus, healthScore, statusLabel]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-6" id="wealth-command-center">
      {/* DAILY FINANCIAL BRIEFING (CFO MEMO) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 font-sans relative overflow-hidden shadow-sm">
        {/* Elegant subtle gradient background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-200/25 to-emerald-200/25 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 gap-4 relative z-10">
          <div>
            <span className="text-[9px] font-mono text-teal-700 font-bold uppercase tracking-widest block">Daily Financial Briefing</span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
              {greeting}, Ahmad
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Here is your professional CFO summary for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="bg-teal-50 text-teal-850 text-[10px] font-mono px-2.5 py-1 rounded border border-teal-200/80 font-bold uppercase">
              Financial Outlook: Stable
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-1.5 text-slate-700 relative z-10">
          {/* RETIREMENT TRAJECTORY */}
          <div className="space-y-1.5 border-r border-slate-100 pr-2 last:border-0">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold leading-none tracking-wide">Retirement Trajectory</span>
            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
              You are currently on track to retire at age <strong className="text-teal-700 font-bold">{twin.retirementAge}</strong> with {expensesRatio.toFixed(1)} months of emergency buffer coverage.
            </p>
          </div>

          {/* STRONGEST GOAL */}
          <div className="space-y-1.5 border-r border-slate-100 pr-2 last:border-0">
            <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold leading-none tracking-wide">Strongest Goal</span>
            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
              <strong className="text-teal-700 font-bold">
                {(twin.liabilities || []).length > 0 ? "Accelerated Debt Freedom" : "Dream Home Down Payment"}
              </strong> is your most resilient financial milestone. Trajectory parameters remain steady.
            </p>
          </div>

          {/* BIGGEST RISK */}
          <div className="space-y-1.5 border-r border-slate-100 pr-2 last:border-0">
            <span className="text-[10px] font-mono text-rose-500 uppercase block font-bold leading-none tracking-wide">Biggest Identified Risk</span>
            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
              {expensesRatio < 3 ? (
                <>Liquid emergency assets covering <strong className="text-rose-600 font-bold">{expensesRatio.toFixed(1)} months</strong> of outflows represent a minor vulnerability index.</>
              ) : highInterestLiabilities > 10000 ? (
                <>Carrying <strong className="text-rose-600 font-bold">${highInterestLiabilities.toLocaleString()}</strong> of debts over 5.0% interest APR is a frictional drag on net worth compounding.</>
              ) : (
                <>Cash allocation is healthy. Consider checking other regional state bracket limits for tax efficiency drag.</>
              )}
            </p>
          </div>

          {/* HIGH-IMPACT OPPORTUNITY */}
          <div className="space-y-1.5 last:border-0">
            <span className="text-[10px] font-mono text-emerald-700 uppercase block font-bold leading-none tracking-wide">Highest Opportunity</span>
            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
              {highInterestLiabilities > 0 ? (
                <>Focusing on debt payoff could preserve up to <strong className="text-emerald-700 font-bold">$18,000</strong> in lifetime loan interest leak.</>
              ) : twin.taxState === "CA" ? (
                <>Simulating zero state-tax residence (e.g., Texas or Florida) shows up to <strong className="text-emerald-700 font-bold">$540,000</strong> in long-term cumulative gains.</>
              ) : (
                <>Reallocating liquid surpluses to a diversified Roth or market portfolio supports up to <strong className="text-emerald-700 font-bold">$45,000</strong> in tax-sheltered yield.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* HERO SIMULATOR SECTOR */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="space-y-1.5 max-w-2xl">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Simulate a Future Decision</h2>
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            See how a major life choice could affect your cash flow, debt, retirement timing, and long-term net worth.
          </p>
        </div>
        <button
          onClick={() => onOpenSimulator()}
          className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold px-5 py-3 rounded-xl cursor-pointer font-sans shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all shrink-0 active:translate-y-0"
        >
          Start a Simulation
        </button>
      </div>

      {/* SCORES AND HERO ACTIONS HEADER MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic score graphic card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm font-sans">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Financial Readiness Score</span>
              <Award className="w-4 h-4 text-teal-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 mt-1">Aura Readiness Score</h3>
          </div>

          <div className="my-6 flex justify-center items-center relative">
            {/* SVG custom gauge */}
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="#f1f5f9"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="url(#emerald-gradient)"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={402}
                strokeDashoffset={402 - (402 * healthScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="emerald-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0d9488" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center font-sans flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-slate-900 tracking-tighter block leading-none">{healthScore}</span>
              <span className="text-[8px] font-mono uppercase tracking-widest text-slate-400 block mt-1">READINESS</span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border mt-2 block font-sans ${statusColorClass}`}>
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              {readinessResult.explanation}
            </p>
          </div>
        </div>

        {/* Financial Insight & Recommendation Engine */}
        <div id="financial-insight-recommendation-engine" className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm font-sans">
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Financial Insight & Recommendation Engine</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-[10px] text-slate-500 font-mono tracking-tight mr-1 select-none">
                  Confidence: <span className={`font-semibold ${confidenceLevel === "High" ? "text-emerald-600" : confidenceLevel === "Medium" ? "text-teal-600" : "text-rose-600"}`}>{confidencePct}% ({confidenceLevel})</span>
                </span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded border capitalize ${priorityLevel === "high" ? "bg-rose-50 border-rose-200 text-rose-700 font-bold" : "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold"}`}>
                  {priorityLevel} priority
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">{primaryActionTitle}</h2>
              <p className="text-xs text-slate-550 leading-relaxed font-sans">
                {primaryActionDesc}
              </p>

              {/* WHY THE ENGINE RECOMMENDS THIS */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-3 space-y-2.5 shadow-inner">
                <h4 className="text-[10px] uppercase tracking-wider font-mono font-bold text-teal-850 select-none">Why the Decision Intelligence Engine Suggests This:</h4>
                <ul className="space-y-1.5 text-[11px] text-slate-600 leading-relaxed font-sans list-none pl-0">
                  {reasons.map((re, rIdx) => (
                    <li key={rIdx} className="flex items-start gap-2">
                      <span className="text-teal-600 font-bold select-none mt-0.5">•</span>
                      <span>{re}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <Clock className="w-4 h-4 text-teal-600 shrink-0" />
              <div>
                <span className="text-[9px] font-mono text-slate-400 uppercase block">Emergency Buffer</span>
                <span className="font-bold text-slate-800 block mt-0.5 font-mono">{expensesRatio.toFixed(1)} Months</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <TrendingUp className="w-4 h-4 text-teal-600 shrink-0" />
              <div>
                <span className="text-[9px] font-mono text-slate-400 uppercase block">Target growth track</span>
                <span className="font-bold text-slate-800 block mt-0.5 font-mono">{(averageGrowthRate * 100).toFixed(1)}% ARR</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RISKS AND OPPORTUNITIES BENTO SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OPPORTUNITIES */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
          <span className="text-[10px] font-mono text-teal-700 uppercase tracking-wider block font-bold">Proactive Opportunities</span>
          <div className="space-y-3">
            {opportunities.length === 0 ? (
              <div className="bg-slate-50/50 border border-slate-150 p-6 rounded-2xl text-center space-y-1">
                <p className="text-xs text-slate-700 font-bold">Optimized Status</p>
                <p className="text-[11px] text-slate-500 font-sans leading-relaxed">Your financial opportunities are fully optimized for now. Keep compounding!</p>
              </div>
            ) : (
              opportunities.map((opp, i) => (
                <div key={i} className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl space-y-2 hover:bg-white hover:border-slate-300 transition-all shadow-sm">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-bold text-slate-800">{opp.title}</h4>
                    <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-lg font-bold shrink-0">{opp.value}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{opp.desc}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RISKS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
          <span className="text-[10px] font-mono text-rose-600 uppercase tracking-wider block font-bold">Potential Risks</span>
          <div className="space-y-3">
            {risks.length === 0 ? (
              <div className="bg-emerald-50/30 border border-emerald-100 p-6 rounded-2xl text-center space-y-1">
                <p className="text-xs text-emerald-800 font-bold">Great job!</p>
                <p className="text-[11px] text-emerald-600 font-sans leading-relaxed">Great job — no significant financial risks were detected based on your current profile.</p>
              </div>
            ) : (
              risks.map((risk, i) => (
                <div key={i} className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl space-y-2 hover:bg-white hover:border-slate-300 transition-all shadow-sm">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-bold text-slate-800">{risk.title}</h4>
                    <span className="text-[9px] font-mono text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-lg font-bold shrink-0">{risk.impact}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{risk.desc}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
