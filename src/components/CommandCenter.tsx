/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { FinancialTwin, SimulationResult } from "../types";
import { 
  ShieldAlert, Sparkles, TrendingUp, HelpCircle, 
  Settings, ArrowUpRight, CheckCircle2, AlertTriangle, 
  ChevronRight, Calendar, DollarSign, Award, Clock,
  Home, Car, Briefcase, GraduationCap, Heart
} from "lucide-react";

interface CommandCenterProps {
  twin: FinancialTwin;
  savedSimulations: SimulationResult[];
  onOpenSimulator: (initialType?: any) => void;
  onOpenTwin: () => void;
}

export default function CommandCenter({ twin, savedSimulations, onOpenSimulator, onOpenTwin }: CommandCenterProps) {
  // Aggregate stats
  const totalAnnualIncome = twin.incomes.reduce((acc, curr) => acc + (curr.frequency === "annual" ? curr.amount : curr.amount * 12), 0);
  const totalAssetsValue = twin.assets.reduce((acc, curr) => acc + curr.amount, 0);
  const totalLiabilitiesValue = twin.liabilities.reduce((acc, curr) => acc + curr.amount, 0);
  const netWorth = totalAssetsValue - totalLiabilitiesValue;

  const cashAssets = twin.assets.filter(a => a.type === "cash").reduce((acc, c) => acc + c.amount, 0);
  const highInterestLiabilities = twin.liabilities.filter(l => l.interestRate > 0.05).reduce((acc, c) => acc + c.amount, 0);
  const totalMonthlyDebtPayments = twin.liabilities.reduce((acc, curr) => acc + curr.monthlyPayment, 0);
  const monthlyGrossIncome = totalAnnualIncome / 12;
  const debtToIncomeRatio = monthlyGrossIncome > 0 ? (totalMonthlyDebtPayments / monthlyGrossIncome) * 100 : 0;
  
  const averageGrowthRate = twin.assets.length > 0 
    ? twin.assets.reduce((acc, c) => acc + c.annualGrowth, 0) / twin.assets.length 
    : 0.06;

  // Analytical Health score math formulation
  // Weight 1: Net Worth level (max 30 pts)
  const nwScore = Math.min(30, Math.max(0, netWorth / 12000));
  // Weight 2: DTI ratio (max 30 pts): 0% DTI = 30 pts, 50% DTI = 0 pts
  const dtiScore = Math.max(0, Math.min(30, 30 - (debtToIncomeRatio * 0.6)));
  // Weight 3: Liquidity buffer (max 20 pts): 6 months = 20 pts
  const expensesRatio = twin.monthlyExpenses > 0 ? cashAssets / twin.monthlyExpenses : 12;
  const liquidityScore = Math.min(20, Math.max(0, expensesRatio * 3));
  // Weight 4: Diversified inflow segments (max 20 pts)
  const incomeDiversityScore = Math.min(20, twin.incomes.length * 10);

  const rawHealthScore = Math.round(nwScore + dtiScore + liquidityScore + incomeDiversityScore);
  const healthScore = Math.max(10, Math.min(100, rawHealthScore));

  let statusLabel = "On Track";
  let statusColorClass = "text-emerald-400 border-emerald-900/40 bg-emerald-950/25";

  if (healthScore >= 85) {
    statusLabel = "Excellent";
    statusColorClass = "text-emerald-400 border-emerald-900/40 bg-emerald-950/25";
  } else if (healthScore >= 70) {
    statusLabel = "Good";
    statusColorClass = "text-teal-400 border-teal-900/40 bg-teal-950/25";
  } else if (healthScore >= 50) {
    statusLabel = "Proceed Carefully";
    statusColorClass = "text-amber-500 border-amber-900/40 bg-amber-950/25";
  } else {
    statusLabel = "Needs Attention";
    statusColorClass = "text-rose-450 border-rose-900/40 bg-rose-950/25";
  }

  // Chief of Staff priority engine logic
  let primaryActionTitle = "Maximize Compound Velocity";
  let primaryActionDesc = "Your wealth foundations look secure. Shift liquid reserves toward long-term tax-sheltered portfolios (Roth IRA/401k) to maximize annual compounding growth.";
  let priorityLevel: "low" | "medium" | "high" = "low";

  if (expensesRatio < 3) {
    primaryActionTitle = "Halt Discretionary Spending & Save Emergency Buffer";
    primaryActionDesc = `Your liquid cache ($${cashAssets.toLocaleString()}) covers less than 3 months of basic expenses ($${twin.monthlyExpenses.toLocaleString()}). Prioritize liquid compound cash flow.`;
    priorityLevel = "high";
  } else if (highInterestLiabilities > 10000) {
    primaryActionTitle = "Launch Private Debt Avalanche payoff";
    primaryActionDesc = `You hold $${highInterestLiabilities.toLocaleString()} of liabilities averaging over 5.0% interest APR. Prioritize surplus cash flows to trigger refinancing or avalanche schedules.`;
    priorityLevel = "high";
  } else if (debtToIncomeRatio > 36) {
    primaryActionTitle = "DTI Overhead Correction";
    primaryActionDesc = `Your Debt-to-Income ratio (${debtToIncomeRatio.toFixed(1)}%) exceeds the 36% systemic threshold. Avoid new physical asset leverage until current lines amortize.`;
    priorityLevel = "medium";
  }

  // Opportunities and Risks cards
  const opportunities = [
    {
      title: "Increase Retirement Savings",
      value: "Expected Yield: +$45,000",
      desc: "By setting up tax-advantaged accounts like a Roth IRA, your money can grow completely tax-free. Under your current plan, this could yield up to $45,000 more when you reach retirement."
    },
    {
      title: "Could Moving Save You Taxes?",
      value: "State Offset: Max 13%",
      desc: `You reside in ${twin.taxState}. Moving to a state with zero income tax (like Texas or Florida) could automatically keep up to $5,400 per year in your pocket, significantly speeding up your financial milestones.`
    }
  ];

  const risks = [
    {
      title: "Too Much Cash Sitting Idle",
      impact: "Caution Check",
      desc: expensesRatio < 4 
        ? "Your emergency savings cushion is currently thin. A sudden job change or unexpected expense could force you onto high-interest loans unless you save a larger buffer."
        : "You have built up an excellent cash reserve! However, keeping too much money in low-interest savings accounts actually loses value over time due to inflation. Moving a portion to secure investments will put your money to work."
    },
    {
      title: "Depending on a Single Income",
      impact: "Safety Risk",
      desc: twin.incomes.length <= 1 
        ? "Relying on a single salary can be vulnerable if unexpected events arise. Developing side projects or alternative consulting income would protect you from total income loss."
        : "Great! You have multiple stable sources of income, which greatly insulates your household from financial risk."
    }
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-6" id="wealth-command-center">
      {/* DAILY FINANCIAL BRIEFING (CFO MEMO) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 font-sans relative overflow-hidden">
        {/* Elegant subtle gradient background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800/65 pb-4 gap-4">
          <div>
            <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-widest block">Daily Financial Briefing</span>
            <h2 className="text-xl font-bold tracking-tight text-white mt-1">
              {greeting}, Ahmad
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Here is your professional CFO summary for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="bg-emerald-950/40 text-emerald-400 text-[10px] font-mono px-2.5 py-1 rounded border border-emerald-900/40 font-semibold uppercase">
              Financial Outlook: Stable
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-1.5 text-zinc-300">
          {/* RETIREMENT TRAJECTORY */}
          <div className="space-y-1.5 border-r border-zinc-800/40 pr-2 last:border-0">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block font-bold leading-none tracking-wide">Retirement Trajectory</span>
            <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
              You are currently on track to retire at age <strong className="text-emerald-400">{twin.retirementAge}</strong> with {expensesRatio.toFixed(1)} months of emergency buffer coverage.
            </p>
          </div>

          {/* STRONGEST GOAL */}
          <div className="space-y-1.5 border-r border-zinc-800/40 pr-2 last:border-0">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block font-bold leading-none tracking-wide">Strongest Goal</span>
            <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
              <strong className="text-teal-400">
                {twin.liabilities.length > 0 ? "Accelerated Debt Freedom" : "Dream Home Down Payment"}
              </strong> is your most resilient financial milestone. Trajectory parameters remain steady.
            </p>
          </div>

          {/* BIGGEST RISK */}
          <div className="space-y-1.5 border-r border-zinc-800/40 pr-2 last:border-0">
            <span className="text-[10px] font-mono text-rose-450 uppercase block font-bold leading-none tracking-wide">Biggest Identified Risk</span>
            <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
              {expensesRatio < 3 ? (
                <>Liquid emergency assets covering <strong className="text-rose-400">{expensesRatio.toFixed(1)} months</strong> of outflows represent a minor vulnerability index.</>
              ) : highInterestLiabilities > 10000 ? (
                <>Carrying <strong className="text-rose-400">${highInterestLiabilities.toLocaleString()}</strong> of debts over 5.0% interest APR is a frictional drag on net worth compounding.</>
              ) : (
                <>Cash allocation is healthy. Consider checking other regional state bracket limits for tax efficiency drag.</>
              )}
            </p>
          </div>

          {/* HIGH-IMPACT OPPORTUNITY */}
          <div className="space-y-1.5 last:border-0">
            <span className="text-[10px] font-mono text-emerald-400 uppercase block font-bold leading-none tracking-wide">Highest Opportunity</span>
            <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
              {highInterestLiabilities > 0 ? (
                <>Focusing on debt payoff could preserve up to <strong className="text-emerald-450">$18,000</strong> in lifetime loan interest leak.</>
              ) : twin.taxState === "CA" ? (
                <>Simulating zero state-tax residence (e.g., Texas or Florida) shows up to <strong className="text-emerald-450">$540,000</strong> in long-term cumulative gains.</>
              ) : (
                <>Reallocating liquid surpluses to a diversified Roth or market portfolio supports up to <strong className="text-emerald-450">$45,000</strong> in tax-sheltered yield.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* HERO SIMULATOR SECTOR */}
      <div className="bg-zinc-900 border border-zinc-805/90 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-200 tracking-tight uppercase font-mono text-emerald-420">What decision are you considering today?</h2>
          <p className="text-[11px] text-zinc-400 mt-1">
            "See your future before you spend your money." Choose any scenario below to immediately model its multi-decade impact with secondary options.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <button
            onClick={() => onOpenSimulator("home_purchase")}
            className="text-left bg-zinc-950 border border-zinc-850 hover:bg-zinc-900/60 hover:border-emerald-500/50 p-3.5 rounded-xl space-y-2.5 transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-950/40 text-emerald-400 flex items-center justify-center">
              <Home className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-zinc-350 group-hover:text-emerald-400 transition-colors">Buy a Home</h4>
              <p className="text-[9px] text-zinc-500 mt-0.5 leading-snug">Mortgages & down payments</p>
            </div>
          </button>

          <button
            onClick={() => onOpenSimulator("vehicle_purchase")}
            className="text-left bg-zinc-950 border border-zinc-850 hover:bg-zinc-900/60 hover:border-emerald-500/50 p-3.5 rounded-xl space-y-2.5 transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-950/40 text-emerald-400 flex items-center justify-center">
              <Car className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-zinc-350 group-hover:text-emerald-400 transition-colors">Buy a Car</h4>
              <p className="text-[9px] text-zinc-500 mt-0.5 leading-snug">Analyze auto debt & fuel types</p>
            </div>
          </button>

          <button
            onClick={() => onOpenSimulator("career_change")}
            className="text-left bg-zinc-950 border border-zinc-850 hover:bg-zinc-900/60 hover:border-emerald-500/50 p-3.5 rounded-xl space-y-2.5 transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-950/40 text-emerald-400 flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-zinc-350 group-hover:text-emerald-400 transition-colors">Change Career</h4>
              <p className="text-[9px] text-zinc-500 mt-0.5 leading-snug">Salary jumps & options</p>
            </div>
          </button>

          <button
            onClick={() => onOpenSimulator("retirement_planning")}
            className="text-left bg-zinc-950 border border-zinc-850 hover:bg-zinc-900/60 hover:border-emerald-500/50 p-3.5 rounded-xl space-y-2.5 transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-950/40 text-emerald-400 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-zinc-350 group-hover:text-emerald-400 transition-colors">Retire Early</h4>
              <p className="text-[9px] text-zinc-500 mt-0.5 leading-snug">Ages & custom spending limits</p>
            </div>
          </button>

          <button
            onClick={() => onOpenSimulator("debt_optimization")}
            className="text-left bg-zinc-950 border border-zinc-850 hover:bg-zinc-900/60 hover:border-emerald-500/50 p-3.5 rounded-xl space-y-2.5 transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-950/40 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-zinc-350 group-hover:text-emerald-400 transition-colors">Pay Off Debts</h4>
              <p className="text-[9px] text-zinc-500 mt-0.5 leading-snug">Snowball vs. Avalanche payoffs</p>
            </div>
          </button>

          <button
            onClick={() => onOpenSimulator("college_funding")}
            className="text-left bg-zinc-950 border border-zinc-850 hover:bg-zinc-900/60 hover:border-emerald-500/50 p-3.5 rounded-xl space-y-2.5 transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-950/40 text-emerald-400 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-zinc-350 group-hover:text-emerald-400 transition-colors">Save for College</h4>
              <p className="text-[9px] text-zinc-500 mt-0.5 leading-snug">529 plans & trust parameters</p>
            </div>
          </button>

          <button
            onClick={() => onOpenSimulator("estate_legacy")}
            className="text-left bg-zinc-950 border border-zinc-850 hover:bg-zinc-900/60 hover:border-emerald-500/50 p-3.5 rounded-xl space-y-2.5 transition-all group cursor-pointer col-span-2 sm:col-span-1"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-950/40 text-emerald-400 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-zinc-350 group-hover:text-emerald-400 transition-colors">Estate & Legacy</h4>
              <p className="text-[9px] text-zinc-500 mt-0.5 leading-snug">Avoid probate trusts & wills</p>
            </div>
          </button>
        </div>
      </div>

      {/* SCORES AND HERO ACTIONS HEADER MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic score graphic card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between glow-subtle font-sans">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Financial Readiness Score</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-zinc-400 mt-1">Aura Readiness Score</h3>
          </div>

          <div className="my-6 flex justify-center items-center relative">
            {/* SVG custom gauge */}
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="#18181b"
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
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center font-sans flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white tracking-tighter block leading-none">{healthScore}</span>
              <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-500 block mt-1">READINESS</span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border mt-2 block font-sans ${statusColorClass}`}>
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-zinc-800/40">
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Your score of <strong className="text-zinc-100">{healthScore} ({statusLabel})</strong> is a weighted average based on defensive savings cushion, loan burdens, and cash surplus levels.
            </p>
          </div>
        </div>

        {/* Dynamic CPO Command Center Hero Card */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between font-sans">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-zinc-450 uppercase tracking-wider font-bold">Aura's Suggested Next Step</span>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded border capitalize ${priorityLevel === "high" ? "bg-rose-950/20 border-rose-500/60 text-rose-455 font-bold" : "bg-emerald-950/20 border-emerald-500/60 text-emerald-455"}`}>
                {priorityLevel} priority
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-zinc-101 tracking-tight">{primaryActionTitle}</h2>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                {primaryActionDesc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-4 border-t border-zinc-800/40 text-xs">
            <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-900">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[9px] font-mono text-zinc-505 uppercase block">Emergency Buffer</span>
                <span className="font-bold text-zinc-200 block mt-0.5 font-mono">{expensesRatio.toFixed(1)} Months</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-900">
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[9px] font-mono text-zinc-505 uppercase block">Target growth track</span>
                <span className="font-bold text-zinc-200 block mt-0.5 font-mono">{(averageGrowthRate * 100).toFixed(1)}% ARR</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RISKS AND OPPORTUNITIES BENTO SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OPPORTUNITIES */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">Proactive Opportunities</span>
          <div className="space-y-3">
            {opportunities.map((opp, i) => (
              <div key={i} className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl space-y-2 hover:border-zinc-800 transition-all">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-xs font-bold text-zinc-200">{opp.title}</h4>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-1.5 py-0.5 rounded shrink-0">{opp.value}</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{opp.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RISKS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <span className="text-[10px] font-mono text-rose-450 uppercase tracking-wider block font-bold">Potential Risks</span>
          <div className="space-y-3">
            {risks.map((risk, i) => (
              <div key={i} className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl space-y-2 hover:border-zinc-800 transition-all">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-xs font-bold text-zinc-200">{risk.title}</h4>
                  <span className="text-[9px] font-mono text-rose-450 bg-rose-95/35 border border-rose-900/60 px-1.5 py-0.5 rounded shrink-0">{risk.impact}</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{risk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SAVED ACTIVE SCENARIOS TIMELINE */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-200">Recent Simulations</h3>
            <p className="text-[10px] text-zinc-500 font-sans">Your saved projections and alternative futures.</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenSimulator()}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold tracking-tight transition-all flex items-center gap-1 cursor-pointer font-sans"
          >
            Launch Simulator <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {savedSimulations.length === 0 ? (
          <div className="bg-zinc-950/60 border border-zinc-850 rounded-xl p-8 text-center space-y-4">
            <ShieldAlert className="w-8 h-8 text-zinc-650 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs text-zinc-350 font-bold">No simulations saved yet</p>
              <p className="text-[11px] text-zinc-500 font-sans">Model a choice above to view projected outcomes here.</p>
            </div>
            <button
              onClick={() => onOpenSimulator()}
              className="bg-emerald-600 hover:bg-emerald-505 text-zinc-950 text-xs font-bold px-4 py-2 hover:scale-[1.01] transition-all rounded-lg cursor-pointer font-sans shadow-md"
            >
              Simulate a decision now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedSimulations.map((sim, i) => (
              <div key={sim.id} className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between hover:border-zinc-800 transition-all font-sans">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-zinc-500 uppercase">{sim.type.replace("_", " ")}</span>
                    <span className="text-zinc-600">Projections #{i+1}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100 font-mono">
                      Mature Value: ${sim.projectedNetWorth30Y[29].toLocaleString()}
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-normal">
                      Decision Score is calculated at <strong className="text-emerald-400 font-mono font-bold">{sim.decisionHealthScore}/100</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-zinc-900 pt-3 mt-4 text-[9px] font-mono">
                  <span className={`font-bold ${sim.projectedCashFlowDelta < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    CF Impact: ${Math.round(sim.projectedCashFlowDelta).toLocaleString()}/Mo
                  </span>
                  <span className="text-zinc-500">{new Date(sim.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
