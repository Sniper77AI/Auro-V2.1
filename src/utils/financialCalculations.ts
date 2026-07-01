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

// CONSTANTS FOR VEHICLE PURCHASE MODELING
export const DEPRECIATION_EV_NEW = 0.25;
export const DEPRECIATION_EV_USED = 0.15;
export const DEPRECIATION_HYBRID_NEW = 0.18;
export const DEPRECIATION_HYBRID_USED = 0.12;
export const DEPRECIATION_GAS_NEW = 0.20;
export const DEPRECIATION_GAS_USED = 0.13;

export const OP_COST_EV_MONTHLY = 120;
export const OP_COST_HYBRID_MONTHLY = 180;
export const OP_COST_GAS_MONTHLY = 250;
export const OP_COST_INSURANCE_MONTHLY = 150;

export const LEASE_FACTOR_MONTHLY = 0.013; // 1.3% of vehicle price as lease payment

export interface VehiclePurchaseInput {
  currentNetWorth: number;
  annualSurplus: number;
  averageGrowthRate: number;
  vehiclePrice: number;
  downPayment: number;
  vehicleType: "ev" | "hybrid" | "gas";
  condition: "new" | "used";
  leaseVsBuy: "lease" | "buy";
  interestRate: number;
  loanTermMonths: number;
  years?: number;
}

export interface VehiclePurchaseResult {
  baselineNetWorthProjection: number[];
  simulatedNetWorthProjection: number[];
  monthlyLoanPayment: number;
  monthlyLeasePayment: number;
  monthlyOperatingCost: number;
  monthlyInsuranceCost: number;
  monthlyTotalCost: number;
  projectedCashFlowDelta: number;
  lifetimeWealthImpact: number;
  remainingLoanBalanceByYear: number[];
  vehicleValueByYear: number[];
  assumptionsUsed: string[];
  depreciationRateUsed: number;
}

export function calculateVehicleLoanPayment(principal: number, annualRate: number, months: number): number {
  return calculateMonthlyLoanPayment(principal, annualRate, months);
}

export function calculateVehicleRemainingBalance(principal: number, annualRate: number, monthsElapsed: number, totalMonths: number): number {
  return calculateRemainingLoanBalance(principal, annualRate, monthsElapsed, totalMonths);
}

export function calculateVehicleDepreciation(vehiclePrice: number, vehicleType: "gas" | "ev" | "hybrid", condition: "new" | "used", year: number): number {
  const safePrice = safeNumber(vehiclePrice);
  const safeYear = safeNumber(year);
  if (safePrice <= 0 || safeYear <= 0) return safePrice;

  let rate = 0.15; // default fallback
  if (vehicleType === "ev") {
    rate = condition === "new" ? DEPRECIATION_EV_NEW : DEPRECIATION_EV_USED;
  } else if (vehicleType === "hybrid") {
    rate = condition === "new" ? DEPRECIATION_HYBRID_NEW : DEPRECIATION_HYBRID_USED;
  } else { // "gas"
    rate = condition === "new" ? DEPRECIATION_GAS_NEW : DEPRECIATION_GAS_USED;
  }

  const val = safePrice * Math.pow(1 - rate, safeYear);
  return Math.max(0, val);
}

export function calculateVehiclePurchaseScenario(input: VehiclePurchaseInput): VehiclePurchaseResult {
  const currentNetWorth = safeNumber(input.currentNetWorth);
  const annualSurplus = safeNumber(input.annualSurplus);
  const averageGrowthRate = safeNumber(input.averageGrowthRate);
  const vehiclePrice = safeNumber(input.vehiclePrice);
  const downPayment = safeNumber(input.downPayment);
  const vehicleType = input.vehicleType || "gas";
  const condition = input.condition || "new";
  const leaseVsBuy = input.leaseVsBuy || "buy";
  const interestRate = safeNumber(input.interestRate);
  const loanTermMonths = safeNumber(input.loanTermMonths, 60);
  const years = safeNumber(input.years, 30);

  const baselineNetWorthProjection: number[] = [];
  const simulatedNetWorthProjection: number[] = [];
  const remainingLoanBalanceByYear: number[] = [];
  const vehicleValueByYear: number[] = [];

  const loanAmount = leaseVsBuy === "buy" ? Math.max(0, vehiclePrice - downPayment) : 0;
  const monthlyLoanPayment = leaseVsBuy === "buy" ? calculateVehicleLoanPayment(loanAmount, interestRate, loanTermMonths) : 0;
  const monthlyLeasePayment = leaseVsBuy === "lease" ? vehiclePrice * LEASE_FACTOR_MONTHLY : 0;

  const monthlyOperatingCost = vehicleType === "ev" 
    ? OP_COST_EV_MONTHLY 
    : vehicleType === "hybrid" 
    ? OP_COST_HYBRID_MONTHLY 
    : OP_COST_GAS_MONTHLY;
  
  const monthlyInsuranceCost = OP_COST_INSURANCE_MONTHLY;

  const monthlyTotalCost = leaseVsBuy === "buy"
    ? monthlyLoanPayment + monthlyOperatingCost + monthlyInsuranceCost
    : monthlyLeasePayment + monthlyOperatingCost + monthlyInsuranceCost;

  const projectedCashFlowDelta = -monthlyTotalCost;

  let tempBaseline = currentNetWorth;
  let tempLiquidSimulated = currentNetWorth - downPayment;
  const monthlyGrowth = averageGrowthRate / 12;

  let rate = 0.15;
  if (vehicleType === "ev") {
    rate = condition === "new" ? DEPRECIATION_EV_NEW : DEPRECIATION_EV_USED;
  } else if (vehicleType === "hybrid") {
    rate = condition === "new" ? DEPRECIATION_HYBRID_NEW : DEPRECIATION_HYBRID_USED;
  } else {
    rate = condition === "new" ? DEPRECIATION_GAS_NEW : DEPRECIATION_GAS_USED;
  }

  for (let y = 1; y <= years; y++) {
    for (let m = 1; m <= 12; m++) {
      const monthIndex = (y - 1) * 12 + m;

      // Baseline monthly saving (can be negative if surplus is negative)
      const baselineMonthlySaving = annualSurplus / 12;
      tempBaseline = (tempBaseline + baselineMonthlySaving) * (1 + monthlyGrowth);

      // Simulated monthly saving
      let simCost = monthlyOperatingCost + monthlyInsuranceCost;
      if (leaseVsBuy === "buy") {
        if (monthIndex <= loanTermMonths) {
          simCost += monthlyLoanPayment;
        }
      } else {
        simCost += monthlyLeasePayment;
      }

      const simulatedMonthlySaving = (annualSurplus / 12) - simCost;
      tempLiquidSimulated = (tempLiquidSimulated + simulatedMonthlySaving) * (1 + monthlyGrowth);
    }

    const vehicleValue = leaseVsBuy === "buy" 
      ? calculateVehicleDepreciation(vehiclePrice, vehicleType, condition, y)
      : 0;
    
    const remainingLoan = leaseVsBuy === "buy"
      ? calculateVehicleRemainingBalance(loanAmount, interestRate, y * 12, loanTermMonths)
      : 0;

    const tempSimulated = tempLiquidSimulated + vehicleValue - remainingLoan;

    baselineNetWorthProjection.push(Math.round(tempBaseline));
    simulatedNetWorthProjection.push(Math.round(tempSimulated));
    remainingLoanBalanceByYear.push(Math.round(remainingLoan));
    vehicleValueByYear.push(Math.round(vehicleValue));
  }

  const finalSimulatedNW = simulatedNetWorthProjection[years - 1] || 0;
  const finalBaselineNW = baselineNetWorthProjection[years - 1] || 0;
  const lifetimeWealthImpact = finalSimulatedNW - finalBaselineNW;

  const conditionStr = condition === "new" ? "new" : "pre-owned";
  const typeStr = vehicleType === "ev" ? "electric" : vehicleType === "hybrid" ? "hybrid" : "gasoline";

  const assumptionsUsed = [
    `Assumes purchasing a ${conditionStr} ${typeStr} vehicle with a market price of ${formatCurrency(vehiclePrice)}.`,
    leaseVsBuy === "buy"
      ? `Standard buy financing with ${formatCurrency(downPayment)} down payment, loan principal ${formatCurrency(loanAmount)} over ${loanTermMonths} months at ${(interestRate * 100).toFixed(2)}% APR.`
      : `Lease estimate modeled continuously at ${(LEASE_FACTOR_MONTHLY * 100).toFixed(1)}% of vehicle value monthly (${formatCurrency(monthlyLeasePayment)}/month) with zero future vehicle equity.`,
    `Depreciation applied at ${(rate * 100).toFixed(1)}% annually for ${conditionStr} ${vehicleType.toUpperCase()} profile.`,
    `Monthly operating cost of ${formatCurrency(monthlyOperatingCost)} is applied based on standard fuel/charging estimates.`,
    `Monthly insurance and registration overhead is assumed at ${formatCurrency(monthlyInsuranceCost)}.`
  ];

  return {
    baselineNetWorthProjection,
    simulatedNetWorthProjection,
    monthlyLoanPayment,
    monthlyLeasePayment,
    monthlyOperatingCost,
    monthlyInsuranceCost,
    monthlyTotalCost,
    projectedCashFlowDelta,
    lifetimeWealthImpact,
    remainingLoanBalanceByYear,
    vehicleValueByYear,
    assumptionsUsed,
    depreciationRateUsed: rate
  };
}

export interface DebtPayoffMonth {
  month: number;
  balances: Record<string, number>;
  interestPaid: Record<string, number>;
  payments: Record<string, number>;
}

export interface DebtPayoffScheduleResult {
  schedule: DebtPayoffMonth[];
  paidOff: boolean;
  remainingBalance: number;
  debtFreeMonth: number | null;
  isNonAmortizing: boolean;
}

export function calculateMonthlyInterest(balance: number, annualRate: number): number {
  return safeNumber(balance) * (safeNumber(annualRate) / 12);
}

export function calculateDebtPayoffSchedule(
  liabilities: LiabilityItem[],
  strategy: "snowball" | "avalanche" | "invest_surplus" | "refinance",
  extraMonthlyPayment = 0,
  refinanceRate?: number
): DebtPayoffScheduleResult {
  const debts = (liabilities || [])
    .map((l) => ({
      id: l.id,
      name: l.name,
      balance: safeNumber(l.amount),
      interestRate: safeNumber(l.interestRate),
      minPayment: safeNumber(l.monthlyPayment),
      type: l.type,
    }))
    .filter((d) => d.balance > 0);

  if (strategy === "refinance" && refinanceRate !== undefined) {
    const refiRate = safeNumber(refinanceRate);
    for (const debt of debts) {
      if (debt.interestRate > refiRate) {
        debt.interestRate = refiRate;
      }
    }
  }

  const schedule: DebtPayoffMonth[] = [];
  let month = 0;
  const maxMonths = 360;
  let isNonAmortizing = false;

  while (month < maxMonths) {
    const activeDebts = debts.filter((d) => d.balance > 0);
    if (activeDebts.length === 0) {
      break;
    }

    month++;
    const monthBalances: Record<string, number> = {};
    const monthInterest: Record<string, number> = {};
    const monthPayments: Record<string, number> = {};

    // 1. Accrue monthly interest
    for (const debt of debts) {
      if (debt.balance > 0) {
        const interest = calculateMonthlyInterest(debt.balance, debt.interestRate);
        debt.balance += interest;
        monthInterest[debt.id] = interest;
      } else {
        monthInterest[debt.id] = 0;
      }
    }

    // Initialize payments
    for (const debt of debts) {
      monthPayments[debt.id] = 0;
    }

    // 2. Pay minimums
    const originalTotalMin = debts.reduce((sum, d) => sum + d.minPayment, 0);
    const isAccelerated = strategy === "avalanche" || strategy === "snowball" || strategy === "refinance";

    let totalPool = 0;
    if (isAccelerated) {
      totalPool = originalTotalMin + extraMonthlyPayment;
    } else {
      totalPool = debts.reduce((sum, d) => sum + (d.balance > 0 ? d.minPayment : 0), 0);
    }

    let remainingPool = totalPool;

    for (const debt of debts) {
      if (debt.balance > 0) {
        const minToPay = Math.min(debt.balance, debt.minPayment);
        debt.balance -= minToPay;
        monthPayments[debt.id] = minToPay;
        remainingPool -= minToPay;
      }
    }

    if (remainingPool < 0) {
      remainingPool = 0;
    }

    // 3. Extra payments & Roll over paid-off minimums
    if (isAccelerated && remainingPool > 0) {
      const sortedDebts = [...debts].filter((d) => d.balance > 0);
      if (strategy === "avalanche" || strategy === "refinance") {
        sortedDebts.sort((a, b) => b.interestRate - a.interestRate || b.balance - a.balance);
      } else if (strategy === "snowball") {
        sortedDebts.sort((a, b) => a.balance - b.balance || b.interestRate - a.interestRate);
      }

      for (const sDebt of sortedDebts) {
        if (remainingPool <= 0) break;
        const actualDebt = debts.find((d) => d.id === sDebt.id);
        if (actualDebt && actualDebt.balance > 0) {
          const extraPay = Math.min(actualDebt.balance, remainingPool);
          actualDebt.balance -= extraPay;
          monthPayments[sDebt.id] = (monthPayments[sDebt.id] || 0) + extraPay;
          remainingPool -= extraPay;
        }
      }
    }

    // Check if non-amortizing (payment < interest for any active debt)
    for (const debt of debts) {
      if (debt.balance > 0) {
        const interest = monthInterest[debt.id] || 0;
        const payment = monthPayments[debt.id] || 0;
        if (payment < interest) {
          isNonAmortizing = true;
        }
      }
    }

    // Store balances
    for (const debt of debts) {
      monthBalances[debt.id] = Math.round(debt.balance * 100) / 100;
    }

    schedule.push({
      month,
      balances: monthBalances,
      interestPaid: monthInterest,
      payments: monthPayments,
    });
  }

  const finalActiveDebts = debts.filter((d) => d.balance > 0);
  const paidOff = finalActiveDebts.length === 0;
  const remainingBalance = finalActiveDebts.reduce((sum, d) => sum + d.balance, 0);
  const debtFreeMonth = paidOff ? month : null;

  return {
    schedule,
    paidOff,
    remainingBalance: Math.round(remainingBalance * 100) / 100,
    debtFreeMonth,
    isNonAmortizing
  };
}

export function calculateTotalInterestPaid(schedule: DebtPayoffMonth[]): number {
  let total = 0;
  for (const m of schedule) {
    for (const key in m.interestPaid) {
      total += m.interestPaid[key];
    }
  }
  return total;
}

export function calculateDebtFreeMonth(schedule: DebtPayoffMonth[]): number | null {
  if (schedule.length === 0) return 0;
  const lastMonth = schedule[schedule.length - 1];
  const hasRemaining = Object.values(lastMonth.balances).some((b) => b > 0);
  return hasRemaining ? null : schedule.length;
}

export function calculateOptimizedDebtScenario(input: {
  twin: FinancialTwin;
  focusStrategy: "snowball" | "avalanche" | "invest_surplus" | "refinance";
  refinanceRate?: number;
  surplusAllocationPercent?: number;
}) {
  const { twin, focusStrategy, refinanceRate, surplusAllocationPercent = 50 } = input;
  const liabilities = twin.liabilities || [];
  const totalDebtBalance = liabilities.reduce((sum, l) => sum + safeNumber(l.amount), 0);
  const hasDebts = totalDebtBalance > 0;

  const monthlySurplus = calculateMonthlySurplus(twin.incomes, twin.monthlyExpenses, twin.liabilities);
  const isSurplusNegative = monthlySurplus < 0;

  // extraMonthlyPayment: 50% of monthlySurplus if positive, else 0
  const extraPaymentUsed = !isSurplusNegative ? (monthlySurplus * (safeNumber(surplusAllocationPercent) / 100)) : 0;

  // Current path payoff schedule (always invest_surplus with 0 extra, paying min payments)
  const currentResult = calculateDebtPayoffSchedule(liabilities, "invest_surplus", 0);
  const currentInterestPaid = calculateTotalInterestPaid(currentResult.schedule);
  const currentDebtFreeMonth = currentResult.debtFreeMonth;

  // Optimized path schedule (using selected strategy, extra payments, refinance rate)
  const optimizedResult = calculateDebtPayoffSchedule(
    liabilities,
    focusStrategy,
    extraPaymentUsed,
    refinanceRate
  );
  const optimizedInterestPaid = calculateTotalInterestPaid(optimizedResult.schedule);
  const optimizedDebtFreeMonth = optimizedResult.debtFreeMonth;

  const interestSaved = Math.max(0, currentInterestPaid - optimizedInterestPaid);
  
  // Only calculate monthsSaved when both paths have valid debt-free months.
  const monthsSaved = (currentDebtFreeMonth !== null && optimizedDebtFreeMonth !== null)
    ? Math.max(0, currentDebtFreeMonth - optimizedDebtFreeMonth)
    : 0;

  return {
    hasDebts,
    totalDebtBalance,
    monthlySurplus,
    extraPaymentUsed,
    currentSchedule: currentResult.schedule,
    optimizedSchedule: optimizedResult.schedule,
    currentInterestPaid,
    optimizedInterestPaid,
    currentDebtFreeMonth,
    optimizedDebtFreeMonth,
    currentPathPaidOff: currentResult.paidOff,
    optimizedPathPaidOff: optimizedResult.paidOff,
    currentRemainingBalance: currentResult.remainingBalance,
    optimizedRemainingBalance: optimizedResult.remainingBalance,
    isCurrentNonAmortizing: currentResult.isNonAmortizing,
    isOptimizedNonAmortizing: optimizedResult.isNonAmortizing,
    interestSaved,
    monthsSaved,
    isSurplusNegative
  };
}

/**
 * Sums all retirement assets for a list of assets.
 */
export function calculateRetirementAssets(assets: AssetItem[]): number {
  return (assets || [])
    .filter((a) => (a.type || "").toLowerCase() === "retirement")
    .reduce((total, asset) => total + safeNumber(asset.amount), 0);
}

/**
 * Computes annual savings capacity based on monthly surplus.
 */
export function calculateAnnualSavingsCapacity(twin: FinancialTwin): number {
  const monthlySurplus = calculateMonthlySurplus(twin.incomes, twin.monthlyExpenses, twin.liabilities);
  return Math.max(0, monthlySurplus * 12);
}

export const DEFAULT_RETIREMENT_SURPLUS_ALLOCATION = 0.50;
export const DEFAULT_RETIREMENT_GROWTH_FALLBACK = 0.06;

/**
 * Calculates value-weighted growth rate for retirement-only assets.
 */
export function calculateValueWeightedRetirementGrowthRate(assets: AssetItem[]): {
  growthRate: number;
  isFallback: boolean;
} {
  const retirementAssetsList = (assets || []).filter(
    (a) => (a.type || "").toLowerCase() === "retirement"
  );
  const totalRetirementAssets = retirementAssetsList.reduce(
    (sum, a) => sum + safeNumber(a.amount),
    0
  );

  if (totalRetirementAssets <= 0) {
    return {
      growthRate: DEFAULT_RETIREMENT_GROWTH_FALLBACK,
      isFallback: true
    };
  }

  const weightedSum = retirementAssetsList.reduce(
    (sum, a) => sum + safeNumber(a.amount) * safeNumber(a.annualGrowth),
    0
  );

  return {
    growthRate: weightedSum / totalRetirementAssets,
    isFallback: false
  };
}

interface RetirementProjectionInput {
  currentAge: number;
  targetRetirementAge: number;
  desiredAnnualSpending: number;
  retirementAssets: number;
  annualSavingsCapacity: number;
  contributionAllocationPercent: number;
  growthRate: number;
  inflationRate: number;
  withdrawalRate: number;
  years: number;
}

/**
 * Generates the baseline and simulated retirement projections.
 */
export function calculateRetirementProjection(input: RetirementProjectionInput) {
  const currentAge = safeNumber(input.currentAge);
  const targetRetirementAge = safeNumber(input.targetRetirementAge);
  const desiredAnnualSpending = safeNumber(input.desiredAnnualSpending);
  const retirementAssets = safeNumber(input.retirementAssets);
  const annualSavingsCapacity = safeNumber(input.annualSavingsCapacity);
  const allocationPercent = safeNumber(input.contributionAllocationPercent, 50);
  const growthRate = safeNumber(input.growthRate);
  const inflationRate = safeNumber(input.inflationRate);
  const years = safeNumber(input.years, 30);

  const annualContribution = annualSavingsCapacity * (allocationPercent / 100);

  const baselineNetWorthProjection: number[] = [];
  const simulatedNetWorthProjection: number[] = [];

  let tempBaseline = retirementAssets;
  let tempSimulated = retirementAssets;
  const ageDiff = Math.max(0, targetRetirementAge - currentAge);

  for (let i = 1; i <= years; i++) {
    // 1. Baseline projection: always accumulating, compounding existing assets and savings
    tempBaseline = (tempBaseline + annualContribution) * (1 + growthRate);
    baselineNetWorthProjection.push(Math.round(tempBaseline));

    // 2. Simulated projection: accumulation then drawdown
    // Consistent timing convention:
    // Drawdown begins immediately in the year the user reaches targetRetirementAge (i > ageDiff).
    // This avoids adding a retirement contribution after retirement begins, and ensures exactly
    // (targetRetirementAge - currentAge) years of accumulation.
    if (i > ageDiff) {
      const annualSpendingAdjusted = desiredAnnualSpending * Math.pow(1 + inflationRate, i);
      tempSimulated = Math.max(0, (tempSimulated - annualSpendingAdjusted) * (1 + growthRate * 0.7));
    } else {
      tempSimulated = (tempSimulated + annualContribution) * (1 + growthRate);
    }
    simulatedNetWorthProjection.push(Math.round(tempSimulated));
  }

  return {
    baselineNetWorthProjection,
    simulatedNetWorthProjection
  };
}

/**
 * Computes the retirement funding gap or surplus.
 */
export function calculateRetirementFundingGap(input: {
  currentAge: number;
  targetRetirementAge: number;
  desiredAnnualSpending: number;
  retirementAssets: number;
  annualSavingsCapacity: number;
  contributionAllocationPercent: number;
  growthRate: number;
  inflationRate: number;
  withdrawalRate: number;
}) {
  const currentAge = safeNumber(input.currentAge);
  const targetRetirementAge = safeNumber(input.targetRetirementAge);
  const desiredAnnualSpending = safeNumber(input.desiredAnnualSpending);
  const retirementAssets = safeNumber(input.retirementAssets);
  const annualSavingsCapacity = safeNumber(input.annualSavingsCapacity);
  const allocationPercent = safeNumber(input.contributionAllocationPercent, 50);
  const growthRate = safeNumber(input.growthRate);
  const inflationRate = safeNumber(input.inflationRate);
  const withdrawalRate = safeNumber(input.withdrawalRate, 0.04);

  const ageDiff = Math.max(0, targetRetirementAge - currentAge);
  const annualContribution = annualSavingsCapacity * (allocationPercent / 100);

  // Projected retirement assets at retirement age (accumulation only)
  let projectedAssetsAtRetirement = retirementAssets;
  for (let i = 1; i <= ageDiff; i++) {
    projectedAssetsAtRetirement = (projectedAssetsAtRetirement + annualContribution) * (1 + growthRate);
  }

  // Desired spending in future dollars adjusted for inflation at the point of retirement
  const adjustedAnnualSpending = desiredAnnualSpending * Math.pow(1 + inflationRate, ageDiff);

  // Nest egg required at retirement
  const targetNestEgg = calculateSafeWithdrawalTarget(adjustedAnnualSpending, withdrawalRate);

  const gap = targetNestEgg - projectedAssetsAtRetirement;

  return {
    projectedAssetsAtRetirement,
    targetNestEgg,
    gap: gap > 0 ? gap : 0,
    surplus: gap < 0 ? Math.abs(gap) : 0,
    adjustedAnnualSpending,
    annualContribution
  };
}

/**
 * Computes safe withdrawal target based on annual spending and withdrawal rate.
 */
export function calculateSafeWithdrawalTarget(annualSpending: number, withdrawalRate = 0.04): number {
  const rate = safeNumber(withdrawalRate, 0.04);
  return rate > 0 ? safeNumber(annualSpending) / rate : 0;
}

/**
 * Calculates years until college starts.
 */
export function calculateYearsUntilCollege(childAge: number, collegeStartAge = 18): number {
  return Math.max(0, safeNumber(collegeStartAge, 18) - safeNumber(childAge));
}

/**
 * Calculates the inflated college cost for a single year of college.
 */
export function calculateInflatedCollegeCost(
  annualCollegeCost: number,
  yearsUntilCollege: number,
  tuitionInflationRate: number
): number {
  return safeNumber(annualCollegeCost) * Math.pow(1 + safeNumber(tuitionInflationRate), safeNumber(yearsUntilCollege));
}

export interface CollegeRequiredSavingsInput {
  childrenAges: number[];
  annualCollegeCost: number;
  fundingTargetPercent: number;
  tuitionInflationRate: number;
  collegeSavingsGrowthRate: number;
  collegeStartAge: number;
  collegeDurationYears: number;
}

/**
 * Calculates required monthly savings to meet the college funding target.
 */
export function calculateRequiredMonthlyCollegeSavings(input: CollegeRequiredSavingsInput): {
  requiredMonthlySavings: number;
  totalInflatedTargetCost: number;
  yearsUntilFirstCollegeStart: number;
} {
  const childrenAges = input.childrenAges || [];
  const annualCollegeCost = safeNumber(input.annualCollegeCost, 35000);
  const fundingTargetPercent = safeNumber(input.fundingTargetPercent, 80);
  const tuitionInflationRate = safeNumber(input.tuitionInflationRate, 0.045);
  const collegeSavingsGrowthRate = safeNumber(input.collegeSavingsGrowthRate, 0.06);
  const collegeStartAge = safeNumber(input.collegeStartAge, 18);
  const collegeDurationYears = safeNumber(input.collegeDurationYears, 4);

  if (childrenAges.length === 0) {
    return {
      requiredMonthlySavings: 0,
      totalInflatedTargetCost: 0,
      yearsUntilFirstCollegeStart: 0
    };
  }

  // Calculate the total inflated cost to fund across all children
  let totalInflatedCostToFund = 0;
  let yearsUntilFirstCollegeStart = 999;

  childrenAges.forEach((age) => {
    const yearsUntilStart = calculateYearsUntilCollege(age, collegeStartAge);
    if (yearsUntilStart < yearsUntilFirstCollegeStart) {
      yearsUntilFirstCollegeStart = yearsUntilStart;
    }

    let childTotalCost = 0;
    for (let y = 0; y < collegeDurationYears; y++) {
      // Each college year has tuition inflated to the year it is incurred
      const inflatedCost = calculateInflatedCollegeCost(annualCollegeCost, yearsUntilStart + y, tuitionInflationRate);
      childTotalCost += inflatedCost;
    }

    totalInflatedCostToFund += childTotalCost * (fundingTargetPercent / 100);
  });

  if (yearsUntilFirstCollegeStart === 999) {
    yearsUntilFirstCollegeStart = 0;
  }

  // Sinking fund formula: Required Monthly Savings
  // P = TotalFundNeeded / [((1 + r/12)^n - 1) / (r/12)]
  // where n is the number of months until the first child starts college
  const months = Math.max(1, yearsUntilFirstCollegeStart * 12);
  const monthlyRate = collegeSavingsGrowthRate / 12;

  let requiredMonthlySavings = 0;
  if (monthlyRate > 0) {
    const compoundFactor = Math.pow(1 + monthlyRate, months) - 1;
    if (compoundFactor > 0) {
      requiredMonthlySavings = totalInflatedCostToFund / (compoundFactor / monthlyRate);
    } else {
      requiredMonthlySavings = totalInflatedCostToFund / months;
    }
  } else {
    requiredMonthlySavings = totalInflatedCostToFund / months;
  }

  return {
    requiredMonthlySavings: Math.round(requiredMonthlySavings),
    totalInflatedTargetCost: Math.round(totalInflatedCostToFund),
    yearsUntilFirstCollegeStart
  };
}

export interface CollegeFundingScenarioInput extends CollegeRequiredSavingsInput {
  currentNetWorth: number;
  annualSurplus: number;
  averageGrowthRate: number;
  years: number;
}

/**
 * Generates the baseline and simulated college projections.
 */
export function calculateCollegeFundingScenario(input: CollegeFundingScenarioInput) {
  const currentNetWorth = safeNumber(input.currentNetWorth);
  const annualSurplus = safeNumber(input.annualSurplus);
  const averageGrowthRate = safeNumber(input.averageGrowthRate, 0.06);
  const childrenAges = input.childrenAges || [];
  const annualCollegeCost = safeNumber(input.annualCollegeCost, 35000);
  const fundingTargetPercent = safeNumber(input.fundingTargetPercent, 80);
  const tuitionInflationRate = safeNumber(input.tuitionInflationRate, 0.045);
  const collegeStartAge = safeNumber(input.collegeStartAge, 18);
  const collegeDurationYears = safeNumber(input.collegeDurationYears, 4);
  const years = safeNumber(input.years, 30);

  const baselineNW: number[] = [];
  const simulatedNW: number[] = [];

  let tempBaseline = currentNetWorth;
  let tempSimulated = currentNetWorth;

  // Calculate the monthly college savings contribution based on the sinking fund requirement
  const savingsInfo = calculateRequiredMonthlyCollegeSavings(input);
  const monthlyContribution = savingsInfo.requiredMonthlySavings;
  const annualContribution = monthlyContribution * 12;

  for (let i = 1; i <= years; i++) {
    // 1. Baseline: Standard accumulation with annual surplus compounding at averageGrowthRate
    tempBaseline = (tempBaseline + annualSurplus) * (1 + averageGrowthRate);
    baselineNW.push(Math.round(tempBaseline));

    // 2. Simulated: Accumulation of surplus minus savings contribution, and deduction of tuition costs when children are in college
    let simulatedAnnualSurplusFlow = annualSurplus - annualContribution;

    // Calculate tuition deductions for this year
    let annualTuitionDeduction = 0;
    childrenAges.forEach((age) => {
      const childAgeInYear = age + i;
      const isCurrentlyInCollege = childAgeInYear >= collegeStartAge && childAgeInYear < (collegeStartAge + collegeDurationYears);

      if (isCurrentlyInCollege) {
        // Find how many years until this college year started
        const collegeYearIndex = childAgeInYear - collegeStartAge;
        const yearsSinceCurrent = (collegeStartAge - age) + collegeYearIndex;
        const inflatedTuitionForYear = calculateInflatedCollegeCost(annualCollegeCost, yearsSinceCurrent, tuitionInflationRate);
        annualTuitionDeduction += inflatedTuitionForYear * (fundingTargetPercent / 100);
      }
    });

    simulatedAnnualSurplusFlow -= annualTuitionDeduction;

    // Compound simulated net worth
    tempSimulated = (tempSimulated + simulatedAnnualSurplusFlow) * (1 + averageGrowthRate);
    simulatedNW.push(Math.round(tempSimulated));
  }

  return {
    baselineNW,
    simulatedNW,
    requiredMonthlySavings: savingsInfo.requiredMonthlySavings,
    totalInflatedTargetCost: savingsInfo.totalInflatedTargetCost,
    yearsUntilFirstCollegeStart: savingsInfo.yearsUntilFirstCollegeStart
  };
}

/**
 * Calculates current estate value as total assets minus total liabilities.
 */
export function calculateEstateValue(assets: AssetItem[], liabilities: LiabilityItem[]): number {
  return calculateNetWorth(assets, liabilities);
}

/**
 * Calculates estimated probate cost based on estate value and probate rate.
 */
export function calculateEstimatedProbateCost(estateValue: number, probateCostRate: number): number {
  return safeNumber(estateValue) * safeNumber(probateCostRate);
}

/**
 * Calculates trust maintenance costs over a horizon of years.
 */
export function calculateTrustMaintenanceCost(monthlyTrustCost: number, years: number): number {
  return safeNumber(monthlyTrustCost) * 12 * safeNumber(years);
}

export interface EstatePreservationScenarioInput {
  currentNetWorth: number;
  annualSurplus: number;
  averageGrowthRate: number;
  assets: AssetItem[];
  liabilities: LiabilityItem[];
  wealthTransferGoal: number;
  useTrustStructure: boolean;
  estatePreservationLevel: "standard" | "high_protection";
  probateCostRate: number;
  monthlyTrustCost: number;
  years: number;
  stateAssumption?: StateAssumption;
}

/**
 * Calculates the baseline and simulated estate preservation projection.
 */
export function calculateEstatePreservationScenario(input: EstatePreservationScenarioInput) {
  const currentNetWorth = safeNumber(input.currentNetWorth);
  const annualSurplus = safeNumber(input.annualSurplus);
  const averageGrowthRate = safeNumber(input.averageGrowthRate, 0.06);
  const assets = input.assets || [];
  const liabilities = input.liabilities || [];
  const useTrustStructure = !!input.useTrustStructure;
  const probateCostRate = safeNumber(input.probateCostRate, 0.045);
  const monthlyTrustCost = safeNumber(input.monthlyTrustCost, 40);
  const years = safeNumber(input.years, 30);

  const baselineNW: number[] = [];
  const simulatedNW: number[] = [];

  let tempBaseline = currentNetWorth;
  let tempSimulated = currentNetWorth;

  const monthlyTrustCostVal = useTrustStructure ? monthlyTrustCost : 0;
  const annualTrustCost = monthlyTrustCostVal * 12;

  // 1. Calculate baseline growth
  for (let i = 1; i <= years; i++) {
    tempBaseline = (tempBaseline + annualSurplus) * (1 + averageGrowthRate);
    baselineNW.push(Math.round(tempBaseline));
  }

  const projectedEstateValue = tempBaseline;

  // 2. Calculate current and future estate values
  let estimatedCurrentEstateValue = calculateEstateValue(assets, liabilities);
  if (estimatedCurrentEstateValue <= 0 && currentNetWorth > 0) {
    estimatedCurrentEstateValue = currentNetWorth;
  }
  estimatedCurrentEstateValue = Math.max(0, estimatedCurrentEstateValue);

  // 3. Probate cost on projected estate value without trust
  const estimatedProbateCost = calculateEstimatedProbateCost(projectedEstateValue, probateCostRate);

  // 4. Calculate simulated growth
  // If trust is used, we incur trust cost annually but avoid probate cost in the final year (representing the transfer)
  for (let i = 1; i <= years; i++) {
    const isFinalYear = i === years;
    const addedValue = (isFinalYear && useTrustStructure) ? estimatedProbateCost : 0;
    const simSurplus = annualSurplus - annualTrustCost;

    tempSimulated = (tempSimulated + simSurplus) * (1 + averageGrowthRate) + addedValue;
    simulatedNW.push(Math.round(tempSimulated));
  }

  const totalTrustCost = calculateTrustMaintenanceCost(monthlyTrustCostVal, years);
  const preservationBenefit = useTrustStructure ? Math.max(0, estimatedProbateCost - totalTrustCost) : 0;
  const lifetimeWealthImpact = tempSimulated - tempBaseline;

  return {
    baselineNW,
    simulatedNW,
    estimatedCurrentEstateValue,
    projectedEstateValue,
    estimatedProbateCost,
    totalTrustCost,
    preservationBenefit,
    lifetimeWealthImpact,
    projectedCashFlowDelta: -monthlyTrustCostVal
  };
}

/**
 * Calculates after-tax income.
 */
export function calculateAfterTaxIncome(annualIncome: number, effectiveTaxRate: number): number {
  return safeNumber(annualIncome) * (1 - safeNumber(effectiveTaxRate));
}

export interface CareerTransitionScenarioInput {
  currentAnnualIncome: number;
  newSalary: number;
  relocationCost: number;
  careerType: "job_change" | "start_business";
  startupEquity?: number;
  startupSuccessProb?: number;
  effectiveTaxRate: number;
  monthlyExpenses: number;
  monthlyDebtPayments: number;
  currentNetWorth: number;
  averageGrowthRate: number;
  years: number;
}

/**
 * Simulates a career and income transition.
 */
export function calculateCareerTransitionScenario(input: CareerTransitionScenarioInput) {
  const currentAnnualIncome = safeNumber(input.currentAnnualIncome);
  const newSalary = safeNumber(input.newSalary);
  const relocationCost = safeNumber(input.relocationCost);
  const careerType = input.careerType || "job_change";
  const effectiveTaxRate = safeNumber(input.effectiveTaxRate, 0.25);
  const monthlyExpenses = safeNumber(input.monthlyExpenses);
  const monthlyDebtPayments = safeNumber(input.monthlyDebtPayments);
  const currentNetWorth = safeNumber(input.currentNetWorth);
  const averageGrowthRate = safeNumber(input.averageGrowthRate, 0.06);
  const years = safeNumber(input.years, 30);

  const afterTaxCurrent = calculateAfterTaxIncome(currentAnnualIncome, effectiveTaxRate);
  const afterTaxNew = calculateAfterTaxIncome(newSalary, effectiveTaxRate);

  const currentAnnualSurplus = afterTaxCurrent - (monthlyExpenses + monthlyDebtPayments) * 12;
  const newAnnualSurplus = afterTaxNew - (monthlyExpenses + monthlyDebtPayments) * 12;

  const monthlyCashFlowChange = (afterTaxNew - afterTaxCurrent) / 12;

  // Calculate break-even months
  let breakEvenMonths = -1;
  if (monthlyCashFlowChange > 0) {
    breakEvenMonths = Math.ceil(relocationCost / monthlyCashFlowChange);
  }

  // Baseline net worth growth
  const baselineNW: number[] = [];
  let tempBaseline = currentNetWorth;
  for (let i = 1; i <= years; i++) {
    tempBaseline = (tempBaseline + currentAnnualSurplus) * (1 + averageGrowthRate);
    baselineNW.push(Math.round(tempBaseline));
  }

  // Simulated net worth growth
  const simulatedNW: number[] = [];
  let tempSimulated = currentNetWorth - relocationCost;
  for (let i = 1; i <= years; i++) {
    tempSimulated = (tempSimulated + newAnnualSurplus) * (1 + averageGrowthRate);
    simulatedNW.push(Math.round(tempSimulated));
  }

  let lifetimeWealthImpact = tempSimulated - tempBaseline;

  // Credibility cap / compression for Career & Income Change only (+/- $2,000,000)
  const maxImpact = 2000000;
  let isCapped = false;
  if (lifetimeWealthImpact > maxImpact) {
    lifetimeWealthImpact = maxImpact;
    isCapped = true;
  } else if (lifetimeWealthImpact < -maxImpact) {
    lifetimeWealthImpact = -maxImpact;
    isCapped = true;
  }

  return {
    afterTaxCurrent,
    afterTaxNew,
    relocationCost,
    monthlyCashFlowChange,
    breakEvenMonths,
    lifetimeWealthImpact,
    baselineNW,
    simulatedNW,
    isCapped
  };
}


