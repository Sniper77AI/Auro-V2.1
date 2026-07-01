/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinancialTwin, IncomeSource, AssetItem, LiabilityItem, StateAssumption } from "../types";

/**
 * Ensures a value is a valid finite number, otherwise returns the fallback.
 */
export function safeNumber(value: any, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Restricts a value within a specified range.
 */
export function clamp(value: number, min: number, max: number): number {
  const safeVal = safeNumber(value);
  return Math.min(max, Math.max(min, safeVal));
}

/**
 * Formats a number as USD currency.
 */
export function formatCurrency(value: number): string {
  const safeVal = safeNumber(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(safeVal);
}

/**
 * Formats a decimal number as a percentage (e.g. 0.052 -> "5.2%").
 */
export function formatPercent(value: number): string {
  const safeVal = safeNumber(value);
  return `${(safeVal * 100).toFixed(1)}%`;
}

/**
 * Computes total annual income from a list of income sources.
 */
export function calculateTotalAnnualIncome(incomes: IncomeSource[]): number {
  return (incomes || []).reduce((total, source) => {
    const amount = safeNumber(source.amount);
    const multiplier = source.frequency === "monthly" ? 12 : 1;
    return total + amount * multiplier;
  }, 0);
}

/**
 * Computes total assets value from a list of assets.
 */
export function calculateTotalAssets(assets: AssetItem[]): number {
  return (assets || []).reduce((total, asset) => total + safeNumber(asset.amount), 0);
}

/**
 * Computes total liabilities value from a list of liabilities.
 */
export function calculateTotalLiabilities(liabilities: LiabilityItem[]): number {
  return (liabilities || []).reduce((total, liability) => total + safeNumber(liability.amount), 0);
}

/**
 * Computes net worth.
 */
export function calculateNetWorth(assets: AssetItem[], liabilities: LiabilityItem[]): number {
  return calculateTotalAssets(assets) - calculateTotalLiabilities(liabilities);
}

/**
 * Computes monthly debt payments.
 */
export function calculateMonthlyDebtPayments(liabilities: LiabilityItem[]): number {
  return (liabilities || []).reduce((total, liability) => total + safeNumber(liability.monthlyPayment), 0);
}

/**
 * Computes monthly gross income.
 */
export function calculateMonthlyGrossIncome(incomes: IncomeSource[]): number {
  return calculateTotalAnnualIncome(incomes) / 12;
}

/**
 * Computes monthly surplus. Negative surplus (deficit) is preserved.
 */
export function calculateMonthlySurplus(incomes: IncomeSource[], monthlyExpenses: number, liabilities: LiabilityItem[]): number {
  const monthlyGross = calculateMonthlyGrossIncome(incomes);
  const totalDebt = calculateMonthlyDebtPayments(liabilities);
  return monthlyGross - safeNumber(monthlyExpenses) - totalDebt;
}

/**
 * Computes Debt-to-Income (DTI) ratio as a percentage (e.g., 36%).
 */
export function calculateDebtToIncomeRatio(incomes: IncomeSource[], liabilities: LiabilityItem[]): number {
  const monthlyGross = calculateMonthlyGrossIncome(incomes);
  if (monthlyGross <= 0) return 0;
  const totalMonthlyDebt = calculateMonthlyDebtPayments(liabilities);
  return (totalMonthlyDebt / monthlyGross) * 100;
}

/**
 * Computes the number of months the cash assets can cover monthly expenses.
 */
export function calculateEmergencyFundMonths(assets: AssetItem[], monthlyExpenses: number): number {
  const cashAssets = (assets || [])
    .filter((a) => (a.type || "").toLowerCase() === "cash")
    .reduce((total, asset) => total + safeNumber(asset.amount), 0);
  const safeExpenses = safeNumber(monthlyExpenses);
  if (safeExpenses <= 0) return 12; // Standard safety maximum fallback when expenses are zero
  return cashAssets / safeExpenses;
}

/**
 * Sums up liabilities exceeding a specific interest threshold.
 */
export function calculateHighInterestDebt(liabilities: LiabilityItem[], threshold = 0.08): number {
  return (liabilities || [])
    .filter((l) => safeNumber(l.interestRate) >= threshold)
    .reduce((total, liability) => total + safeNumber(liability.amount), 0);
}

/**
 * Computes value-weighted asset growth rate (e.g. 0.065 for 6.5%).
 */
export function calculateValueWeightedAssetGrowth(assets: AssetItem[]): number {
  const validAssets = (assets || []).filter((a) => safeNumber(a.amount) > 0);
  if (validAssets.length === 0) return 0.06; // Standard 6% default fallback if no assets exist
  const totalAmount = validAssets.reduce((total, asset) => total + safeNumber(asset.amount), 0);
  if (totalAmount <= 0) return 0.06;
  const weightedGrowthSum = validAssets.reduce(
    (sum, asset) => sum + safeNumber(asset.amount) * safeNumber(asset.annualGrowth),
    0
  );
  return weightedGrowthSum / totalAmount;
}

/**
 * Evaluates profile completeness as a percentage (0 to 100).
 */
export function calculateProfileCompleteness(twin: FinancialTwin): number {
  if (!twin) return 0;
  const hasIncomesVal = twin.incomes && twin.incomes.length > 0;
  const hasBasicSavingsVal = twin.assets && twin.assets.some((a) => (a.type || "").toLowerCase() === "cash" && safeNumber(a.amount) > 0);
  const hasInvestmentsVal = twin.assets && twin.assets.some((a) => (a.type || "").toLowerCase() === "brokerage" && safeNumber(a.amount) > 0);
  const hasRetirementVal = twin.assets && twin.assets.some((a) => (a.type || "").toLowerCase() === "retirement" && safeNumber(a.amount) > 0);
  const hasRealEstateVal = twin.assets && twin.assets.some((a) => (a.type || "").toLowerCase() === "real_estate" && safeNumber(a.amount) > 0);
  const hasCollegeSavingsVal =
    (twin.assets &&
      twin.assets.some(
        (a) =>
          (a.name || "").toLowerCase().includes("529") ||
          (a.name || "").toLowerCase().includes("college") ||
          (a.name || "").toLowerCase().includes("education")
      )) ||
    safeNumber(twin.dependants) > 0;

  const profileItems = [
    hasIncomesVal,
    hasBasicSavingsVal,
    hasInvestmentsVal,
    hasRetirementVal,
    hasRealEstateVal,
    hasCollegeSavingsVal,
  ];
  return Math.round((profileItems.filter(Boolean).length / profileItems.length) * 100);
}

export interface ScoreFactor {
  name: string;
  score: number;
  maxScore: number;
  impact: "positive" | "negative" | "neutral";
  description: string;
}

export interface ReadinessResult {
  score: number;
  label: "High Risk" | "Needs Attention" | "Proceed Carefully" | "Strong" | "Excellent";
  explanation: string;
  factors: ScoreFactor[];
}

/**
 * Calculates a comprehensive weighted readiness score between 0 and 100.
 */
export function calculateReadinessScore(twin: FinancialTwin): ReadinessResult {
  const incomes = twin.incomes || [];
  const assets = twin.assets || [];
  const liabilities = twin.liabilities || [];
  const monthlyExpenses = safeNumber(twin.monthlyExpenses);

  const annualIncome = calculateTotalAnnualIncome(incomes);
  const monthlyGross = calculateMonthlyGrossIncome(incomes);
  const netWorth = calculateNetWorth(assets, liabilities);
  const emergencyMonths = calculateEmergencyFundMonths(assets, monthlyExpenses);
  const dti = calculateDebtToIncomeRatio(incomes, liabilities);
  const highInterestDebt = calculateHighInterestDebt(liabilities, 0.08);
  const monthlySurplus = calculateMonthlySurplus(incomes, monthlyExpenses, liabilities);
  const completeness = calculateProfileCompleteness(twin);

  // 1. Emergency Fund Cushion (Max 20 points)
  // 6 months of reserves = full 20 points.
  let emergencyScore = 0;
  let emergencyDescription = "";
  let emergencyImpact: "positive" | "negative" | "neutral" = "negative";

  if (monthlyExpenses <= 0) {
    emergencyScore = 0; // zero or missing expenses gets 0 points (treated as incomplete)
    emergencyDescription = "Monthly expenses are not defined or set to zero. Please enter your estimated monthly expenses to evaluate your emergency reserve cushion.";
    emergencyImpact = "neutral";
  } else {
    emergencyScore = clamp((emergencyMonths / 6) * 20, 0, 20);
    emergencyDescription = `Your liquid cash covers ${emergencyMonths.toFixed(1)} months of expenses. Prudent guidelines recommend a 6-month buffer.`;
    emergencyImpact = emergencyMonths >= 6 ? "positive" : emergencyMonths >= 3 ? "neutral" : "negative";
  }

  const emergencyFactor: ScoreFactor = {
    name: "Emergency Reserve Months",
    score: Math.round(emergencyScore),
    maxScore: 20,
    impact: emergencyImpact,
    description: emergencyDescription,
  };

  // 2. Monthly Cash Surplus (Max 20 points)
  // Surplus percentage of 20% or more gets full 20 points. Deficits get 0 points.
  const surplusPercent = monthlyGross > 0 ? monthlySurplus / monthlyGross : 0;
  const surplusScore = clamp(surplusPercent > 0 ? (surplusPercent / 0.20) * 20 : 0, 0, 20);
  const surplusFactor: ScoreFactor = {
    name: "Cash Flow Surplus Ratio",
    score: Math.round(surplusScore),
    maxScore: 20,
    impact: surplusPercent >= 0.15 ? "positive" : surplusPercent > 0 ? "neutral" : "negative",
    description: `Your monthly surplus is ${formatCurrency(monthlySurplus)} (${(surplusPercent * 100).toFixed(1)}% of gross). Saving 20% or more builds wealth rapidly.`,
  };

  // 3. Debt-to-Income Ratio (Max 20 points)
  // 0% DTI = 20 pts, >= 40% DTI = 0 pts.
  let dtiScore = 20;
  const totalMonthlyDebt = calculateMonthlyDebtPayments(liabilities);
  if (monthlyGross <= 0) {
    if (totalMonthlyDebt > 0) {
      dtiScore = 0; // No income plus debt payments receives 0 points
    } else {
      dtiScore = 10; // No income and no debt receives a neutral partial score
    }
  } else if (dti > 0) {
    dtiScore = clamp(20 - (dti / 40) * 20, 0, 20);
  }
  const dtiFactor: ScoreFactor = {
    name: "Debt-to-Income (DTI) Leverage",
    score: Math.round(dtiScore),
    maxScore: 20,
    impact: monthlyGross <= 0 ? (totalMonthlyDebt > 0 ? "negative" : "neutral") : (dti <= 20 ? "positive" : dti <= 36 ? "neutral" : "negative"),
    description: monthlyGross <= 0 
      ? (totalMonthlyDebt > 0 
        ? `You have monthly debt payments of ${formatCurrency(totalMonthlyDebt)} but no reported income, resulting in extreme leverage risk.`
        : "No active monthly income was reported to calculate a Debt-to-Income ratio.")
      : `Your Debt-to-Income ratio sits at ${dti.toFixed(1)}%. Keeping this below 36% ensures systemic borrowing resilience.`,
  };

  // 4. High-Interest Debt Burden (Max 15 points)
  // $0 high interest = 15 pts, >= $20,000 = 0 pts.
  const highInterestScore = clamp(15 * (1 - highInterestDebt / 20000), 0, 15);
  const highInterestFactor: ScoreFactor = {
    name: "High-Interest Liability Exposure",
    score: Math.round(highInterestScore),
    maxScore: 15,
    impact: highInterestDebt === 0 ? "positive" : highInterestDebt < 5000 ? "neutral" : "negative",
    description: highInterestDebt === 0
      ? "Outstanding high-interest debts are zero. Excellent systemic cost protection!"
      : `You carry ${formatCurrency(highInterestDebt)} of debt at or above 8% interest, creating a financial drag.`,
  };

  // 5. Net Worth Position (Max 10 points)
  // Net worth >= annual income gets 10 points. Net worth <= 0 gets 0 points.
  const targetNW = Math.max(50000, annualIncome);
  const nwScore = clamp(netWorth > 0 ? (netWorth / targetNW) * 10 : 0, 0, 10);
  const nwFactor: ScoreFactor = {
    name: "Net Worth Progress",
    score: Math.round(nwScore),
    maxScore: 10,
    impact: netWorth > annualIncome ? "positive" : netWorth > 0 ? "neutral" : "negative",
    description: `Net worth is ${formatCurrency(netWorth)}. Achieving a net worth exceeding annual income is a key compound milestone.`,
  };

  // 6. Retirement Asset Progress (Max 10 points)
  // Retirement assets >= annualIncome * 0.25 (minimum $20,000) gets 10 points.
  const retirementAssets = assets
    .filter((a) => (a.type || "").toLowerCase() === "retirement")
    .reduce((total, asset) => total + safeNumber(asset.amount), 0);
  const targetRetirement = Math.max(20000, annualIncome * 0.25);
  const retirementScore = clamp(retirementAssets > 0 ? (retirementAssets / targetRetirement) * 10 : 0, 0, 10);
  const retirementFactor: ScoreFactor = {
    name: "Retirement Compounding Progress",
    score: Math.round(retirementScore),
    maxScore: 10,
    impact: retirementAssets >= targetRetirement ? "positive" : retirementAssets > 0 ? "neutral" : "negative",
    description: `Retirement savings total ${formatCurrency(retirementAssets)}. Consistent tax-sheltered contributions compound dramatically over time.`,
  };

  // 7. Profile Completeness (Max 5 points)
  const completenessScore = (completeness / 100) * 5;
  const completenessFactor: ScoreFactor = {
    name: "Aura Profile Completeness",
    score: Math.round(completenessScore),
    maxScore: 5,
    impact: completeness >= 80 ? "positive" : completeness >= 50 ? "neutral" : "negative",
    description: `Your profile details are ${completeness}% complete. Fully populated variables generate deeper analytical modeling accuracy.`,
  };

  // Final Sum & Clamping
  const totalScore = Math.round(
    emergencyScore +
    surplusScore +
    dtiScore +
    highInterestScore +
    nwScore +
    retirementScore +
    completenessScore
  );
  const finalScore = clamp(totalScore, 0, 100);

  // Label Mapping
  // 0–39: High Risk
  // 40–59: Needs Attention
  // 60–74: Proceed Carefully
  // 75–89: Strong
  // 90–100: Excellent
  let label: "High Risk" | "Needs Attention" | "Proceed Carefully" | "Strong" | "Excellent" = "Needs Attention";
  if (finalScore >= 90) {
    label = "Excellent";
  } else if (finalScore >= 75) {
    label = "Strong";
  } else if (finalScore >= 60) {
    label = "Proceed Carefully";
  } else if (finalScore >= 40) {
    label = "Needs Attention";
  } else {
    label = "High Risk";
  }

  // User-facing general explanation context builder
  let explanation = "";
  if (finalScore >= 90) {
    explanation = "Your financial position is outstanding. You have a robust liquidity cushion, low-to-no debt burden, a strong savings rate, and compounding assets that create immense compound momentum.";
  } else if (finalScore >= 75) {
    explanation = "Your financial readiness is strong. Most core indicators are healthy, though small adjustments to investment allocations or accelerated debt payoffs can push you into optimal status.";
  } else if (finalScore >= 60) {
    explanation = "Your financial track is reasonably secure, but requires cautious navigation. Addressing secondary debt exposure, boosting your cash surplus, or expanding your liquid buffer will elevate your readiness.";
  } else if (finalScore >= 40) {
    explanation = "Several areas of your financial profile require attention. High leverage ratios, low liquidity reserves, or limited cash surplus create high exposure to adverse market adjustments.";
  } else {
    explanation = "Your financial track shows critical vulnerabilities. Focus strictly on building a basic emergency reserve and aggressively amortizing high-interest liabilities before committing capital to long-term goals.";
  }

  return {
    score: finalScore,
    label,
    explanation,
    factors: [
      emergencyFactor,
      surplusFactor,
      dtiFactor,
      highInterestFactor,
      nwFactor,
      retirementFactor,
      completenessFactor,
    ],
  };
}

// CONSTANTS FOR HOME PURCHASE MODELING
export const DEFAULT_HOME_MAINTENANCE_RATE = 0.01; // 1.0%
export const DEFAULT_RENT_TO_PRICE_RATIO = 0.048;  // 4.8%

/**
 * Calculates the monthly loan payment using standard amortization.
 */
export function calculateMonthlyLoanPayment(principal: number, annualRate: number, months: number): number {
  const safeP = safeNumber(principal);
  const safeRate = safeNumber(annualRate);
  const safeMonths = safeNumber(months);
  if (safeP <= 0 || safeMonths <= 0) return 0;
  if (safeRate <= 0) return safeP / safeMonths;
  const r = safeRate / 12;
  return (safeP * r * Math.pow(1 + r, safeMonths)) / (Math.pow(1 + r, safeMonths) - 1);
}

/**
 * Calculates the remaining loan balance at a given month of an amortizing loan.
 */
export function calculateRemainingLoanBalance(principal: number, annualRate: number, monthsElapsed: number, totalMonths: number): number {
  const safeP = safeNumber(principal);
  const safeRate = safeNumber(annualRate);
  const safePms = safeNumber(monthsElapsed);
  const safeTot = safeNumber(totalMonths);
  if (safeP <= 0) return 0;
  if (safePms >= safeTot) return 0;
  if (safePms <= 0) return safeP;
  if (safeRate <= 0) {
    return Math.max(0, safeP * (1 - safePms / safeTot));
  }
  const r = safeRate / 12;
  const numerator = Math.pow(1 + r, safeTot) - Math.pow(1 + r, safePms);
  const denominator = Math.pow(1 + r, safeTot) - 1;
  return Math.max(0, safeP * (numerator / denominator));
}

/**
 * Helper to calculate a 30-year amortized mortgage payment.
 */
export function calculateMortgagePayment(homePrice: number, downPayment: number, annualRate: number, loanYears = 30): number {
  const principal = Math.max(0, safeNumber(homePrice) - safeNumber(downPayment));
  return calculateMonthlyLoanPayment(principal, annualRate, loanYears * 12);
}

export interface HomePurchaseInput {
  currentNetWorth: number;
  annualSurplus: number;
  averageGrowthRate: number;
  homePrice: number;
  downPayment: number;
  interestRate: number;
  years?: number;
  stateAssumption: StateAssumption;
  currentMonthlyRent?: number;
}

export interface HomePurchaseResult {
  baselineNetWorthProjection: number[];
  simulatedNetWorthProjection: number[];
  monthlyMortgage: number;
  monthlyPropertyTax: number;
  monthlyMaintenance: number;
  monthlyHomeCost: number;
  monthlyRentAssumption: number;
  projectedCashFlowDelta: number;
  lifetimeWealthImpact: number;
  remainingMortgageByYear: number[];
  propertyValueByYear: number[];
  assumptionsUsed: string[];
}

/**
 * Builds the comprehensive 30-year home purchase simulation.
 */
export function calculateHomePurchaseScenario(input: HomePurchaseInput): HomePurchaseResult {
  const currentNetWorth = safeNumber(input.currentNetWorth);
  const annualSurplus = safeNumber(input.annualSurplus);
  const averageGrowthRate = safeNumber(input.averageGrowthRate);
  const homePrice = safeNumber(input.homePrice);
  const downPayment = safeNumber(input.downPayment);
  const interestRate = safeNumber(input.interestRate);
  const years = safeNumber(input.years, 30);
  const stateAssumption = input.stateAssumption;
  const currentMonthlyRent = safeNumber(input.currentMonthlyRent);

  const baselineNetWorthProjection: number[] = [];
  const simulatedNetWorthProjection: number[] = [];
  const remainingMortgageByYear: number[] = [];
  const propertyValueByYear: number[] = [];

  const loanAmount = Math.max(0, homePrice - downPayment);
  const monthlyMortgage = calculateMortgagePayment(homePrice, downPayment, interestRate, years);
  const monthlyPropertyTax = (homePrice * safeNumber(stateAssumption.property_tax_rate)) / 12;
  const monthlyMaintenance = (homePrice * DEFAULT_HOME_MAINTENANCE_RATE) / 12;
  const monthlyHomeCost = monthlyMortgage + monthlyPropertyTax + monthlyMaintenance;

  const monthlyRentAssumption = currentMonthlyRent > 0
    ? currentMonthlyRent
    : (homePrice * DEFAULT_RENT_TO_PRICE_RATIO) / 12;

  const projectedCashFlowDelta = monthlyRentAssumption - monthlyHomeCost;

  let tempBaseline = currentNetWorth;
  let tempLiquidSimulated = currentNetWorth - downPayment;

  for (let t = 1; t <= years; t++) {
    // Baseline: cash compounds + annual savings compound
    tempBaseline = (tempBaseline + annualSurplus) * (1 + averageGrowthRate);
    baselineNetWorthProjection.push(Math.round(tempBaseline));

    // Simulated: home appreciates, mortgage pays down, savings compound
    const propertyValue = homePrice * Math.pow(1 + safeNumber(stateAssumption.appreciation_rate), t);
    const remainingMortgage = calculateRemainingLoanBalance(loanAmount, interestRate, t * 12, years * 12);

    propertyValueByYear.push(Math.round(propertyValue));
    remainingMortgageByYear.push(Math.round(remainingMortgage));

    const simulatedAnnualSavings = annualSurplus + (projectedCashFlowDelta * 12);
    
    // Compound only liquid portion (which can go negative if expenses exceed income)
    tempLiquidSimulated = (tempLiquidSimulated + simulatedAnnualSavings) * (1 + averageGrowthRate);

    const tempSimulated = tempLiquidSimulated + propertyValue - remainingMortgage;
    simulatedNetWorthProjection.push(Math.round(tempSimulated));
  }

  const finalSimulatedNW = simulatedNetWorthProjection[years - 1] || 0;
  const finalBaselineNW = baselineNetWorthProjection[years - 1] || 0;
  let lifetimeWealthImpact = finalSimulatedNW - finalBaselineNW;

  let compressed = false;
  if (Math.abs(lifetimeWealthImpact) > 5000000) {
    compressed = true;
    if (lifetimeWealthImpact > 5000000) {
      const excess = lifetimeWealthImpact - 5000000;
      lifetimeWealthImpact = 5000000 + Math.log10(excess) * 150000;
    } else {
      const excess = -5000000 - lifetimeWealthImpact;
      lifetimeWealthImpact = -5000000 - Math.log10(excess) * 150000;
    }
  }

  const rentDisclosedStr = currentMonthlyRent > 0
    ? `Rent comparison uses your reported monthly rent of ${formatCurrency(currentMonthlyRent)}.`
    : `Rent estimate uses ${(DEFAULT_RENT_TO_PRICE_RATIO * 100).toFixed(1)}% annual rent-to-price ratio because no current rent was provided.`;

  const assumptionsUsed = [
    `Property tax uses ${stateAssumption.state_code} state assumption of ${(safeNumber(stateAssumption.property_tax_rate) * 100).toFixed(2)}%.`,
    `Maintenance uses ${(DEFAULT_HOME_MAINTENANCE_RATE * 100).toFixed(1)}% of home value annually.`,
    `Home appreciation uses ${stateAssumption.state_code} state assumption of ${(safeNumber(stateAssumption.appreciation_rate) * 100).toFixed(1)}%.`,
    rentDisclosedStr,
    `Standard 30-year amortization schedule at ${(interestRate * 100).toFixed(2)}% APR.`,
  ];

  if (compressed) {
    assumptionsUsed.push("Lifetime wealth impact has been compressed using a credibility safeguard to prevent multi-million mathematical outlier tail scenarios.");
  }

  return {
    baselineNetWorthProjection,
    simulatedNetWorthProjection,
    monthlyMortgage,
    monthlyPropertyTax,
    monthlyMaintenance,
    monthlyHomeCost,
    monthlyRentAssumption,
    projectedCashFlowDelta,
    lifetimeWealthImpact,
    remainingMortgageByYear,
    propertyValueByYear,
    assumptionsUsed
  };
}
