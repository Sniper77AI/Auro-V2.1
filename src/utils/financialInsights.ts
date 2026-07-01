/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinancialTwin } from "../types";
import {
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
  calculateProfileCompleteness,
  formatCurrency
} from "./financialCalculations";

export interface FinancialInsight {
  id: string;
  title: string;
  description: string;
  severity: "High" | "Medium" | "Low";
  category: string;
  confidence: number;
  estimatedImpact: string;
  action: string;
  
  // Aliases for compatibility with the existing render loops in CommandCenter
  value?: string;
  desc?: string;
  impact?: string;
}

/**
 * Dynamically analyzes the Financial Twin profile and yields tailored financial
 * opportunities and risks with zero hardcoding or self-contradictions.
 */
export function generateFinancialInsights(twin: FinancialTwin) {
  const incomes = twin.incomes || [];
  const assets = twin.assets || [];
  const liabilities = twin.liabilities || [];
  const monthlyExpenses = twin.monthlyExpenses || 0;

  const totalAnnualIncome = calculateTotalAnnualIncome(incomes);
  const totalAssets = calculateTotalAssets(assets);
  const totalLiabilities = calculateTotalLiabilities(liabilities);
  const netWorth = calculateNetWorth(assets, liabilities);
  const monthlyGross = calculateMonthlyGrossIncome(incomes);
  const monthlySurplus = calculateMonthlySurplus(incomes, monthlyExpenses, liabilities);
  const dti = calculateDebtToIncomeRatio(incomes, liabilities);
  const emergencyMonths = calculateEmergencyFundMonths(assets, monthlyExpenses);
  const highInterestDebtAmount = calculateHighInterestDebt(liabilities, 0.05); // liabilities with rate >= 5%
  const highInterestDebt8 = calculateHighInterestDebt(liabilities, 0.08); // liabilities with rate >= 8%
  const completeness = calculateProfileCompleteness(twin);

  const cashAssets = assets
    .filter((a) => (a.type || "").toLowerCase() === "cash")
    .reduce((total, asset) => total + (asset.amount || 0), 0);

  const retirementAssets = assets
    .filter((a) => (a.type || "").toLowerCase() === "retirement")
    .reduce((total, asset) => total + (asset.amount || 0), 0);

  const isDev = process.env.NODE_ENV !== "production";
  const rulesLogged: string[] = [];

  const rawOpportunities: FinancialInsight[] = [];
  const rawRisks: FinancialInsight[] = [];

  // ==========================================
  // OPPORTUNITIES RULES
  // ==========================================

  // Rule 1: High State Tax Optimization
  const highTaxStates = ["CA", "NY", "NJ", "MA", "OR", "MN", "IL", "HI", "DC", "MD"];
  const activeState = (twin.taxState || "").trim().toUpperCase();
  if (highTaxStates.includes(activeState) && totalAnnualIncome > 60000) {
    const estimatedSavings = Math.round(totalAnnualIncome * 0.07);
    rulesLogged.push(`Opportunity Trigger: High State Tax. User resides in high-tax state ${activeState}.`);
    
    const itemConfidence = Math.min(99, Math.max(30, Math.round(completeness * 0.8 + 20)));
    const valStr = `State Offset: ~${formatCurrency(estimatedSavings)}/Yr`;
    const descStr = `You reside in ${activeState}. Relocating or establishing residency in a zero-income tax state (like Texas or Florida) could automatically keep up to ${formatCurrency(estimatedSavings)} per year of compounding surplus in your pocket.`;
    
    rawOpportunities.push({
      id: "state_tax_opt",
      title: "Residency Tax Optimization",
      description: descStr,
      severity: "Medium",
      category: "Tax Optimization",
      confidence: itemConfidence,
      estimatedImpact: valStr,
      action: "Simulate a career relocation scenario to compute tax-saving trajectories.",
      value: valStr,
      desc: descStr
    });
  }

  // Rule 2: Increase Retirement Savings
  // Benchmark: Retirement assets should be at least 25% of annual income, or under $20,000
  const targetRetirement = totalAnnualIncome * 0.25;
  if (totalAnnualIncome > 0 && (retirementAssets < targetRetirement || retirementAssets < 20000)) {
    rulesLogged.push(`Opportunity Trigger: Low Retirement Savings. Retirement assets ${formatCurrency(retirementAssets)} are below target ${formatCurrency(Math.max(20000, targetRetirement))}.`);
    
    const itemConfidence = Math.min(99, Math.max(30, Math.round(completeness * 0.8 + 15)));
    const estimatedFutureYield = Math.round(Math.max(45000, totalAnnualIncome * 0.4));
    const valStr = `Expected Yield: +${formatCurrency(estimatedFutureYield)}`;
    const descStr = `Your retirement holdings (${formatCurrency(retirementAssets)}) are below recommended benchmarks. Maxing out a tax-advantaged account like a Roth IRA can bypass state and federal tax friction, potentially yielding an additional ${formatCurrency(estimatedFutureYield)} by retirement age.`;
    
    rawOpportunities.push({
      id: "retirement_savings_opt",
      title: "Increase Retirement Contributions",
      description: descStr,
      severity: retirementAssets === 0 ? "High" : "Medium",
      category: "Retirement Savings",
      confidence: itemConfidence,
      estimatedImpact: valStr,
      action: "Increase monthly contributions to tax-sheltered accounts.",
      value: valStr,
      desc: descStr
    });
  }

  // Rule 3: High Interest Debt Avalanche Opportunity
  if (highInterestDebtAmount > 4000) {
    rulesLogged.push(`Opportunity Trigger: High Interest Debt Avalanche. User carries ${formatCurrency(highInterestDebtAmount)} of debt above 5%.`);
    
    const itemConfidence = Math.min(99, Math.max(30, Math.round(completeness * 0.85 + 15)));
    const estimatedInterestAvoided = Math.round(highInterestDebtAmount * 0.08 * 3); // 3-year simple interest savings
    const valStr = `Interest Saved: ~${formatCurrency(estimatedInterestAvoided)}`;
    const descStr = `You carry ${formatCurrency(highInterestDebtAmount)} of student or vehicle liabilities over 5% interest. Refinancing or prioritizing active monthly cash surplus to target the highest interest rates first can bypass compounding drag.`;
    
    rawOpportunities.push({
      id: "debt_avalanche_opt",
      title: "Accelerated Debt Avalanche Payoff",
      description: descStr,
      severity: "High",
      category: "Debt Optimization",
      confidence: itemConfidence,
      estimatedImpact: valStr,
      action: "Simulate a debt consolidation or refinancing path.",
      value: valStr,
      desc: descStr
    });
  }

  // Rule 4: Optimize Excess Cash (Too much sitting idle)
  // Trigger: emergency months > 6 AND cash assets > $20,000
  if (emergencyMonths > 6 && cashAssets > 20000) {
    const excessCash = Math.round(cashAssets - (monthlyExpenses * 6));
    if (excessCash > 10000) {
      rulesLogged.push(`Opportunity Trigger: Excess Cash Idle. Cash Assets: ${formatCurrency(cashAssets)}, Emergency Months: ${emergencyMonths.toFixed(1)}. Excess Cash: ${formatCurrency(excessCash)}.`);
      
      const itemConfidence = Math.min(99, Math.max(30, Math.round(completeness * 0.8 + 20)));
      const estimatedYieldGain = Math.round(excessCash * 0.05); // 5% yield gain
      const valStr = `Yield Gain: +${formatCurrency(estimatedYieldGain)}/Yr`;
      const descStr = `Your emergency savings cushion of ${emergencyMonths.toFixed(1)} months is exceptional. However, keeping ${formatCurrency(excessCash)} of excess liquid cash in standard savings accounts loses purchasing power to inflation. Redirecting this surplus can yield +${formatCurrency(estimatedYieldGain)}/Yr.`;
      
      rawOpportunities.push({
        id: "excess_cash_opt",
        title: "Optimize Excess Idle Cash",
        description: descStr,
        severity: "Medium",
        category: "Wealth Accumulation",
        confidence: itemConfidence,
        estimatedImpact: valStr,
        action: "Transfer excess cash to high-yield savings (HYSA) or low-risk index funds.",
        value: valStr,
        desc: descStr
      });
    }
  }

  // Rule 5: Establish College 529 Trust
  if (twin.dependants > 0 && !assets.some(a => (a.name || "").toLowerCase().includes("529") || (a.name || "").toLowerCase().includes("college"))) {
    rulesLogged.push(`Opportunity Trigger: College Trust. User has dependants but no designated 529 asset.`);
    
    const itemConfidence = Math.round(completeness * 0.7 + 30);
    const valStr = "Tax-Free Growth Option";
    const descStr = `With ${twin.dependants} dependants in your household, starting a tax-sheltered 529 education trust allows investment compounding to bypass state and federal capital gains taxes, fully optimizing future college tuition costs.`;
    
    rawOpportunities.push({
      id: "college_529_opt",
      title: "Establish College 529 Trust",
      description: descStr,
      severity: "Low",
      category: "College Savings",
      confidence: itemConfidence,
      estimatedImpact: valStr,
      action: "Launch a college funding scenario to compare trust vs. taxable account trajectories.",
      value: valStr,
      desc: descStr
    });
  }

  // Rule 6: Estate Trust & Living Will
  if (netWorth > 100000) {
    rulesLogged.push(`Opportunity Trigger: Estate trust planning. Net Worth is substantial: ${formatCurrency(netWorth)}.`);
    
    const itemConfidence = Math.round(completeness * 0.75 + 20);
    const valStr = "Probate Protection";
    const descStr = `Your growing net worth of ${formatCurrency(netWorth)} makes you a prime candidate to establish a revocable living trust. A trust bypasses probate friction, preserves asset privacy, and structures seamless wealth transfer.`;
    
    rawOpportunities.push({
      id: "estate_trust_opt",
      title: "Draft Revocable Living Trust & Will",
      description: descStr,
      severity: "Low",
      category: "Estate Planning",
      confidence: itemConfidence,
      estimatedImpact: valStr,
      action: "Review trust planning options or run an estate legacy simulation.",
      value: valStr,
      desc: descStr
    });
  }


  // ==========================================
  // RISKS RULES
  // ==========================================

  // Rule 1: Cash Flow Outflow Deficit Risk
  if (monthlySurplus < 0) {
    rulesLogged.push(`Risk Trigger: Cash Flow Deficit. Surplus is negative: ${formatCurrency(monthlySurplus)}.`);
    
    const itemConfidence = Math.min(99, Math.max(30, Math.round(completeness * 0.9 + 10)));
    const descStr = `Your regular household outflows and debt payments exceed your gross income by ${formatCurrency(Math.abs(monthlySurplus))}/month. Running an active monthly deficit represents a significant risk of debt accumulation.`;
    
    rawRisks.push({
      id: "cash_flow_deficit_risk",
      title: "Structural Cash Flow Deficit",
      description: descStr,
      severity: "High",
      category: "Cash Flow Stability",
      confidence: itemConfidence,
      estimatedImpact: "High Risk",
      action: "Analyze expenses or simulate a career salary jump scenario.",
      impact: "High Risk",
      desc: descStr
    });
  }

  // Rule 2: Critically Low Emergency Buffer
  if (monthlyExpenses > 0 && emergencyMonths < 3) {
    rulesLogged.push(`Risk Trigger: Low Emergency Buffer. Emergency reserve months: ${emergencyMonths.toFixed(1)} months.`);
    
    const itemConfidence = Math.min(99, Math.max(30, Math.round(completeness * 0.85 + 15)));
    const descStr = `Your cash assets (${formatCurrency(cashAssets)}) cover only ${emergencyMonths.toFixed(1)} months of basic expenses. Sudden income disruption could force liquidation of retirement accounts or costly borrowing.`;
    
    rawRisks.push({
      id: "low_emergency_buffer_risk",
      title: "Critically Low Emergency Buffer",
      description: descStr,
      severity: "High",
      category: "Liquidity Safety",
      confidence: itemConfidence,
      estimatedImpact: "High Risk",
      action: "Prioritize emergency savings buffer above all non-critical goals.",
      impact: "High Risk",
      desc: descStr
    });
  }

  // Rule 3: High Debt-to-Income Ratio
  if (dti > 36) {
    rulesLogged.push(`Risk Trigger: High DTI. Ratio: ${dti.toFixed(1)}%.`);
    
    const itemConfidence = Math.min(99, Math.max(30, Math.round(completeness * 0.85 + 15)));
    const severityLabel = dti > 45 ? "High" : "Medium";
    const descStr = `Your Debt-to-Income ratio sits at ${dti.toFixed(1)}%, exceeding the prudent 36% limit. This high fixed overhead restricts cash flow flexibility and creates severe friction for future home purchases.`;
    
    rawRisks.push({
      id: "high_dti_risk",
      title: "High Debt-to-Income Ratio",
      description: descStr,
      severity: severityLabel,
      category: "Debt Leverage",
      confidence: itemConfidence,
      estimatedImpact: severityLabel === "High" ? "High Risk" : "Caution Check",
      action: "Halt any new debt-financed acquisitions and run refinancing schedules.",
      impact: severityLabel === "High" ? "High Risk" : "Caution Check",
      desc: descStr
    });
  }

  // Rule 4: High Interest Debt Burden
  if (highInterestDebt8 > 2000) {
    rulesLogged.push(`Risk Trigger: High Interest Debt Drag. Amount above 8%: ${formatCurrency(highInterestDebt8)}.`);
    
    const itemConfidence = Math.min(99, Math.max(30, Math.round(completeness * 0.9 + 10)));
    const descStr = `You carry ${formatCurrency(highInterestDebt8)} of active student, car, or credit card liabilities over 8% interest. This compounding interest actively drains your monthly wealth-building capacity.`;
    
    rawRisks.push({
      id: "high_interest_debt_drag_risk",
      title: "High-Interest Debt Drag",
      description: descStr,
      severity: "High",
      category: "Debt Leverage",
      confidence: itemConfidence,
      estimatedImpact: "High Risk",
      action: "Implement a debt payoff avalanche targeting liabilities over 8.0%.",
      impact: "High Risk",
      desc: descStr
    });
  }

  // Rule 5: Single Income Stream Dependency
  if (incomes.length === 1 && totalAnnualIncome > 0) {
    rulesLogged.push(`Risk Trigger: Single Income Stream. Streams: ${incomes.length}.`);
    
    const itemConfidence = Math.round(completeness * 0.7 + 30);
    const descStr = "Household cash flow is entirely dependent on a single active income source. Unexpected employment disruptions represent a total loss of inflow, creating critical security risk.";
    
    rawRisks.push({
      id: "single_income_risk",
      title: "Single Income Stream Exposure",
      description: descStr,
      severity: "Medium",
      category: "Income Security",
      confidence: itemConfidence,
      estimatedImpact: "Caution Check",
      action: "Build side consulting, alternative projects, or save a wider emergency cushion.",
      impact: "Caution Check",
      desc: descStr
    });
  }

  // Rule 6: Incomplete Financial Profile Accuracy
  if (completeness < 50) {
    rulesLogged.push(`Risk Trigger: Incomplete Profile. Completeness: ${completeness}%.`);
    
    const itemConfidence = 95;
    const descStr = `Your financial profile is only ${completeness}% complete. Missing details regarding assets, liabilities, and monthly expense parameters heavily reduce your simulation accuracy.`;
    
    rawRisks.push({
      id: "incomplete_profile_risk",
      title: "Incomplete Financial Profile",
      description: descStr,
      severity: "Low",
      category: "Data Integrity",
      confidence: itemConfidence,
      estimatedImpact: "Caution Check",
      action: "Fully populate incomes, cash savings, brokerage and debts inside your Financial Twin.",
      impact: "Caution Check",
      desc: descStr
    });
  }


  // ==========================================
  // CONTRADICTION REMOVAL & MUTUAL EXCLUSIVITY
  // ==========================================
  
  // 1. Emergency Fund logic: 
  // - Critically Low Emergency Buffer risk triggers when emergencyMonths < 3.
  // - Optimize Excess Cash opportunity triggers when emergencyMonths > 6.
  // These are naturally disjoint!

  // 2. High Interest Debt payoff:
  // If rawRisks includes "High-Interest Debt Drag" (over 8%), we do not duplicate it as an opportunity "Accelerated Debt Avalanche Payoff".
  const hasHighInterestDebtRisk = rawRisks.some(r => r.id === "high_interest_debt_drag_risk");
  let filteredOpportunities = rawOpportunities;
  if (hasHighInterestDebtRisk) {
    filteredOpportunities = rawOpportunities.filter(o => o.id !== "debt_avalanche_opt");
  }


  // ==========================================
  // PRIORITY SORTING AND TOP 2 CARD SELECTION
  // ==========================================
  const severityScore = { High: 3, Medium: 2, Low: 1 };

  // Sort opportunities by severity (highest first), then by confidence (highest first)
  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
    const diff = severityScore[b.severity] - severityScore[a.severity];
    if (diff !== 0) return diff;
    return b.confidence - a.confidence;
  });

  // Sort risks by severity (highest first), then by confidence (highest first)
  const sortedRisks = [...rawRisks].sort((a, b) => {
    const diff = severityScore[b.severity] - severityScore[a.severity];
    if (diff !== 0) return diff;
    return b.confidence - a.confidence;
  });

  // Limit to maximum 2 items
  const finalOpportunities = sortedOpportunities.slice(0, 2);
  const finalRisks = sortedRisks.slice(0, 2);


  // ==========================================
  // DEV LOGGING OF TRIGGERED RULES
  // ==========================================
  if (isDev) {
    console.log("=== [FINANCIAL INSIGHTS ENGINE - DEVELOPMENT DIAGNOSTIC LOGS] ===");
    console.log(`Financial Twin State: State=${activeState || "N/A"}, Age=${twin.age || 35}, Dependants=${twin.dependants}`);
    console.log(`Annual Income: ${totalAnnualIncome}, Cash Assets: ${cashAssets}, Net Worth: ${netWorth}`);
    console.log(`Emergency Cushion Months: ${emergencyMonths.toFixed(2)}, DTI: ${dti.toFixed(2)}%, Monthly Surplus: ${monthlySurplus}`);
    console.log(`Triggered Rules List:`);
    rulesLogged.forEach(rule => console.log(` - ${rule}`));
    console.log(`Final Selected Opportunities (Max 2):`);
    finalOpportunities.forEach(opp => console.log(` - [${opp.severity}] ${opp.title} (${opp.estimatedImpact})`));
    console.log(`Final Selected Risks (Max 2):`);
    finalRisks.forEach(risk => console.log(` - [${risk.severity}] ${risk.title} (${risk.estimatedImpact})`));
    console.log("================================================================");
  }

  // Create summary text
  let summaryText = "";
  if (finalRisks.length > 0) {
    summaryText = `We detected ${finalRisks.length} dynamic risk factors in your financial twin profile, primarily concerning ${finalRisks.map(r => r.category).join(" and ")}. Resolving these is highly critical.`;
  } else {
    summaryText = "Great job — no significant financial risks were detected based on your current profile. Your position remains strong and resilient.";
  }

  return {
    opportunities: finalOpportunities,
    risks: finalRisks,
    summary: summaryText
  };
}
