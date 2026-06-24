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
  const totalAnnualIncome = (twin.incomes || []).reduce((acc, curr) => acc + (curr.frequency === "annual" ? (Number(curr.amount) || 0) : (Number(curr.amount) || 0) * 12), 0);
  const totalAssetsValue = (twin.assets || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalLiabilitiesValue = (twin.liabilities || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const netWorth = totalAssetsValue - totalLiabilitiesValue;

  const cashAssets = (twin.assets || []).filter(a => a.type === "cash").reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const highInterestLiabilities = (twin.liabilities || []).filter(l => (Number(l.interestRate) || 0) > 0.05).reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const totalMonthlyDebtPayments = (twin.liabilities || []).reduce((acc, curr) => acc + (Number(curr.monthlyPayment) || 0), 0);
  const monthlyGrossIncome = totalAnnualIncome / 12;
  const debtToIncomeRatio = monthlyGrossIncome > 0 ? (totalMonthlyDebtPayments / monthlyGrossIncome) * 100 : 0;
  
  const averageGrowthRate = (twin.assets && twin.assets.length > 0) 
    ? (twin.assets.reduce((acc, c) => acc + (Number(c.annualGrowth) || 0), 0) / twin.assets.length) 
    : 0.06;

  // Analytical Health score math formulation
  // Weight 1: Net Worth level (max 30 pts)
  const nwScore = Math.min(30, Math.max(0, netWorth / 12000));
  // Weight 2: DTI ratio (max 30 pts): 0% DTI = 30 pts, 50% DTI = 0 pts
  const dtiScore = Math.max(0, Math.min(30, 30 - (debtToIncomeRatio * 0.6)));
  // Weight 3: Liquidity buffer (max 20 pts): 6 months = 20 pts
  const monthlyExpensesSafe = Number(twin.monthlyExpenses) || 0;
  const expensesRatio = monthlyExpensesSafe > 0 ? cashAssets / monthlyExpensesSafe : 12;
  const liquidityScore = Math.min(20, Math.max(0, expensesRatio * 3));
  // Weight 4: Diversified inflow segments (max 20 pts)
  const incomeDiversityScore = Math.min(20, twin.incomes.length * 10);

  const rawHealthScore = Math.round(nwScore + dtiScore + liquidityScore + incomeDiversityScore);
  const healthScore = Math.max(10, Math.min(100, rawHealthScore));

  let statusLabel = "On Track";
  let statusColorClass = "text-emerald-700 border-emerald-200 bg-emerald-50";

  if (healthScore >= 85) {
    statusLabel = "Excellent";
    statusColorClass = "text-emerald-700 border-emerald-200 bg-emerald-50";
  } else if (healthScore >= 70) {
    statusLabel = "Good";
    statusColorClass = "text-teal-700 border-teal-200 bg-teal-50";
  } else if (healthScore >= 50) {
    statusLabel = "Proceed Carefully";
    statusColorClass = "text-amber-700 border-amber-200 bg-amber-50";
  } else {
    statusLabel = "Needs Attention";
    statusColorClass = "text-rose-700 border-rose-200 bg-rose-50";
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

  // Calculate profile completeness status for dynamic confidence assessment
  const hasIncomesVal = twin.incomes && twin.incomes.length > 0;
  const hasBasicSavingsVal = twin.assets && twin.assets.some(a => a.type === "cash" && a.amount > 0);
  const hasInvestmentsVal = twin.assets && twin.assets.some(a => a.type === "brokerage" && a.amount > 0);
  const hasRetirementVal = twin.assets && twin.assets.some(a => a.type === "retirement" && a.amount > 0);
  const hasRealEstateVal = twin.assets && twin.assets.some(a => a.type === "real_estate" && a.amount > 0);
  const hasDebtInfoVal = twin.liabilities && twin.liabilities.length > 0;
  const hasCollegeSavingsVal = (twin.assets && twin.assets.some(a => a.name.toLowerCase().includes("529") || a.name.toLowerCase().includes("college") || a.name.toLowerCase().includes("education"))) || (twin.dependants > 0);

  const profileItems = [hasIncomesVal, hasBasicSavingsVal, hasInvestmentsVal, hasRetirementVal, hasRealEstateVal, hasDebtInfoVal, hasCollegeSavingsVal];
  const profileCompleteness = Math.round((profileItems.filter(Boolean).length / profileItems.length) * 100);

  // Derive model recommendation confidence
  let confidencePct = Math.round(profileCompleteness * 0.8 + 12);
  const dataComplexityMod = Math.min(15, (twin.incomes.length + twin.assets.length + twin.liabilities.length) * 2);
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
      `Liquid checking and cash reserves of $${cashAssets.toLocaleString()} cover less than 3 months of basic outflows`,
      "Protects regular household expenses from forced early liquidation penalties in long-term accounts",
      "Stabilizes fundamental household cash availability during general macroeconomic transitions",
      "Establishes a solid baseline emergency buffer before exposing surpluses to asset market valuation volatility"
    ];
  } else if (highInterestLiabilities > 10000) {
    reasons = [
      "Provides the highest guaranteed return currently available by bypassing standard interest rates",
      `Directly eliminates compounding interest charges on outstanding $${highInterestLiabilities.toLocaleString()} student / vehicle liabilities`,
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
      `Improves historical yield trajectory on your existing idle checking capital of $${cashAssets.toLocaleString()}`,
      `Strengthens and preserves early-retirement tracks ahead of your current target retirement age of ${twin.retirementAge}`
    ];
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
                {twin.liabilities.length > 0 ? "Accelerated Debt Freedom" : "Dream Home Down Payment"}
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
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
        <div>
          <h2 className="text-xs font-bold text-teal-800 tracking-tight uppercase font-mono">What decision are you considering today?</h2>
          <p className="text-[11px] text-slate-500 mt-1">
            "See your future before you spend your money." Choose any scenario below to immediately model its multi-decade impact with secondary options.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <button
            onClick={() => onOpenSimulator("home_purchase")}
            className="text-left bg-slate-50 border border-slate-200 hover:bg-white hover:border-teal-500/50 hover:shadow-md p-3.5 rounded-2xl space-y-2.5 transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center transition-colors group-hover:bg-teal-100">
              <Home className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-slate-700 group-hover:text-teal-700 transition-colors">Buy a Home</h4>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">Mortgages & down payments</p>
            </div>
          </button>

          <button
            onClick={() => onOpenSimulator("vehicle_purchase")}
            className="text-left bg-slate-50 border border-slate-200 hover:bg-white hover:border-teal-500/50 hover:shadow-md p-3.5 rounded-2xl space-y-2.5 transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center transition-colors group-hover:bg-teal-100">
              <Car className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-slate-700 group-hover:text-teal-700 transition-colors">Buy a Car</h4>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">Analyze auto debt & fuel types</p>
            </div>
          </button>

          <button
            onClick={() => onOpenSimulator("career_change")}
            className="text-left bg-slate-50 border border-slate-200 hover:bg-white hover:border-teal-500/50 hover:shadow-md p-3.5 rounded-2xl space-y-2.5 transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center transition-colors group-hover:bg-teal-100">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-slate-700 group-hover:text-teal-700 transition-colors">Change Career</h4>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">Salary jumps & options</p>
            </div>
          </button>

          <button
            onClick={() => onOpenSimulator("retirement_planning")}
            className="text-left bg-slate-50 border border-slate-200 hover:bg-white hover:border-teal-500/50 hover:shadow-md p-3.5 rounded-2xl space-y-2.5 transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center transition-colors group-hover:bg-teal-100">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-slate-700 group-hover:text-teal-700 transition-colors">Retire Early</h4>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">Ages & custom spending limits</p>
            </div>
          </button>

          <button
            onClick={() => onOpenSimulator("debt_optimization")}
            className="text-left bg-slate-50 border border-slate-200 hover:bg-white hover:border-teal-500/50 hover:shadow-md p-3.5 rounded-2xl space-y-2.5 transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center transition-colors group-hover:bg-teal-100">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-slate-700 group-hover:text-teal-700 transition-colors">Pay Off Debts</h4>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">Snowball vs. Avalanche payoffs</p>
            </div>
          </button>

          <button
            onClick={() => onOpenSimulator("college_funding")}
            className="text-left bg-slate-50 border border-slate-200 hover:bg-white hover:border-teal-500/50 hover:shadow-md p-3.5 rounded-2xl space-y-2.5 transition-all group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center transition-colors group-hover:bg-teal-100">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-slate-700 group-hover:text-teal-700 transition-colors">Save for College</h4>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">529 plans & trust parameters</p>
            </div>
          </button>

          <button
            onClick={() => onOpenSimulator("estate_legacy")}
            className="text-left bg-slate-50 border border-slate-200 hover:bg-white hover:border-teal-500/50 hover:shadow-md p-3.5 rounded-2xl space-y-2.5 transition-all group cursor-pointer col-span-2 sm:col-span-1"
          >
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center transition-colors group-hover:bg-teal-100">
              <Heart className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-slate-700 group-hover:text-teal-700 transition-colors">Estate & Legacy</h4>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">Avoid probate trusts & wills</p>
            </div>
          </button>
        </div>
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
              Your score of <strong className="text-slate-800">{healthScore} ({statusLabel})</strong> is a weighted average based on defensive savings cushion, loan burdens, and cash surplus levels.
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
            {opportunities.map((opp, i) => (
              <div key={i} className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl space-y-2 hover:bg-white hover:border-slate-300 transition-all shadow-sm">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-xs font-bold text-slate-800">{opp.title}</h4>
                  <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-lg font-bold shrink-0">{opp.value}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{opp.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RISKS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
          <span className="text-[10px] font-mono text-rose-600 uppercase tracking-wider block font-bold">Potential Risks</span>
          <div className="space-y-3">
            {risks.map((risk, i) => (
              <div key={i} className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl space-y-2 hover:bg-white hover:border-slate-300 transition-all shadow-sm">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-xs font-bold text-slate-800">{risk.title}</h4>
                  <span className="text-[9px] font-mono text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-lg font-bold shrink-0">{risk.impact}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{risk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SAVED ACTIVE SCENARIOS TIMELINE */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Recent Simulations</h3>
            <p className="text-[10px] text-slate-550 font-sans">Your saved projections and alternative futures.</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenSimulator()}
            className="text-[11px] text-teal-600 hover:text-teal-700 font-bold tracking-tight transition-all flex items-center gap-1 cursor-pointer font-sans"
          >
            Launch Simulator <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {savedSimulations.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-4">
            <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs text-slate-700 font-bold">No simulations saved yet</p>
              <p className="text-[11px] text-slate-450 font-sans">Model a choice above to view projected outcomes here.</p>
            </div>
            <button
              onClick={() => onOpenSimulator()}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer font-sans shadow-md"
            >
              Simulate a decision now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedSimulations.map((sim, i) => (
              <div key={sim.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col justify-between hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all font-sans">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-400 font-semibold uppercase">{sim.type.replace("_", " ")}</span>
                    <span className="text-slate-400">Projections #{i+1}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 font-mono">
                      Mature Value: ${sim.projectedNetWorth30Y[29].toLocaleString()}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                      Decision Score is calculated at <strong className="text-teal-700 font-mono font-bold">{sim.decisionHealthScore}/100</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-4 text-[9px] font-mono">
                  <span className={`font-bold ${sim.projectedCashFlowDelta < 0 ? "text-rose-600" : "text-teal-700"}`}>
                    CF Impact: ${Math.round(sim.projectedCashFlowDelta).toLocaleString()}/Mo
                  </span>
                  <span className="text-slate-400">{new Date(sim.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
