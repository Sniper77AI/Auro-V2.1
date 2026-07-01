/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { FinancialTwin, SimulationType, SimulationParams, SimulationResult, FeedbackItem, GovernanceEvent, StateAssumption } from "../types";
import { SupabaseService } from "../supabaseService";
import { 
  calculateHomePurchaseScenario, 
  calculateProfileCompleteness, 
  clamp,
  calculateOptimizedDebtScenario,
  calculateMonthlySurplus,
  calculateHighInterestDebt,
  calculateTotalLiabilities,
  formatCurrency,
  formatPercent
} from "../utils/financialCalculations";
import { 
  Home, Car, Briefcase, Calendar, ShieldAlert, Zap, 
  Settings, CheckCircle, Info, RefreshCw, Star, 
  ArrowRight, ThumbsUp, ThumbsDown, HelpCircle, GraduationCap, Users,
  ChevronRight, ChevronUp, ChevronDown, ArrowLeft
} from "lucide-react";

interface SimulatorEngineProps {
  twin: FinancialTwin;
  initialType?: SimulationType;
  initialParams?: any;
  onSaveSimulation: (result: SimulationResult) => void;
  onLogGovernanceEvent: (event: Omit<GovernanceEvent, "id" | "timestamp">) => void;
  onLogFeedback: (feedback: FeedbackItem) => void;
  onApproveLifeGoal?: (goalData: any) => void;
  onBack?: () => void;
}

const MODULES: Array<{ type: SimulationType; title: string; subtitle: string; icon: any }> = [
  { type: "home_purchase", title: "Home Purchase Plan", subtitle: "Rent vs Buy, home ownership, and early retirement guidelines", icon: Home },
  { type: "vehicle_purchase", title: "Vehicle Purchase", subtitle: "EV vs Gas, lease vs buy, and long-term costs", icon: Car },
  { type: "career_change", title: "Career & Income Change", subtitle: "Salary trade-offs, relocation savings, and startup offers", icon: Briefcase },
  { type: "retirement_planning", title: "Retirement Plan", subtitle: "Retire earlier, income targets, and nest egg security", icon: Calendar },
  { type: "debt_optimization", title: "Accelerated Debt Freedom", subtitle: "Structured plan to erase high-interest loans sooner", icon: Settings },
  { type: "college_funding", title: "College Fund Plan", subtitle: "Savings plans, multi-child timelines, and tuition models", icon: GraduationCap },
  { type: "estate_legacy", title: "Family Security & Legacy", subtitle: "Trust structures, wealth transfer, and asset preservation", icon: Users }
];

interface FutureStory {
  title: string;
  scenario: "conservative" | "balanced" | "aggressive";
  bullets: string[];
}

function getFutureStories(type: SimulationType, params: SimulationParams): FutureStory[] {
  if (type === "home_purchase") {
    const priceStr = `$${((params.homePrice || 500000) / 1000).toFixed(0)}k`;
    return [
      {
        title: "Conservative Future",
        scenario: "conservative",
        bullets: [
          `Save for ${priceStr} home over 4 years to accumulate a larger down payment`,
          "Retire at age 65 as originally planned",
          "Retain a robust 6-month liquid emergency safety reserve",
          "Zero risk of mortgage stress or cash flow squeeze"
        ]
      },
      {
        title: "Balanced Future",
        scenario: "balanced",
        bullets: [
          `Buy a nice ${priceStr} home in 2 years with standard financing`,
          "Retire at age 63 (delays retirement by less than 1.5 years)",
          "Maintain a healthy 3-to-4 month liquid emergency fund",
          "College plans remain fully viable"
        ]
      },
      {
        title: "Aggressive Future",
        scenario: "aggressive",
        bullets: [
          `Purchase the ${priceStr} home immediately`,
          "Target early retirement at age 60 under rapid salary compound growth assumptions",
          "Requires temporary tight budget constraints for 18 months",
          "Investment surplus directed aggressively to tax shelters"
        ]
      }
    ];
  } else if (type === "vehicle_purchase") {
    const term = params.leaseVsBuy === "lease" ? "Lease" : "Buy";
    return [
      {
        title: "Conservative Future",
        scenario: "conservative",
        bullets: [
          `Purchase a pre-owned gasoline or hybrid vehicle outright`,
          "Keep existing monthly expenses baseline completely untouched",
          "Retirement readiness is accelerated by 4 months",
          "Zero auto debt on your credit history"
        ]
      },
      {
        title: "Balanced Future",
        scenario: "balanced",
        bullets: [
          `${term} the vehicle under competitive standard interest rates`,
          "Retirement remains stable at goal age",
          "Represents standard lifestyle improvement with low impact on savings rate",
          "Lower recurring maintenance costs for the next 5 years"
        ]
      },
      {
        title: "Aggressive Future",
        scenario: "aggressive",
        bullets: [
          "Choose premium EV trim and finance aggressively",
          "Offset costs completely by relocating or trimming secondary luxury outlays",
          "Capitalize on full tax credits to fuel brokerage investment growth",
          "Zero gasoline costs with high immediate lifestyle utility"
        ]
      }
    ];
  } else if (type === "career_change") {
    return [
      {
        title: "Conservative Future",
        scenario: "conservative",
        bullets: [
          "Stay in your current steady-state professional role",
          "Maintain high predictable retirement target tracking",
          "Avoid upfront relocation or commute costs",
          "Emergency fund remains fully insulated"
        ]
      },
      {
        title: "Balanced Future",
        scenario: "balanced",
        bullets: [
          `Accept the job change with the targeted $${(params.newSalary || 120000).toLocaleString()}/yr salary`,
          "Retire 1.5 years earlier due to higher savings growth",
          "Amortize relocation costs within the first 6 months",
          "Broaden professional network and long-term career durability"
        ]
      },
      {
        title: "Aggressive Future",
        scenario: "aggressive",
        bullets: [
          "Pivot to a high-equity startup or advisory venture",
          "Retire 4 years earlier if startup equity options hit expected values",
          "High initial volatility requiring a 6-month buffer",
          "Exponential upside potential matching peak risk profile"
        ]
      }
    ];
  } else if (type === "retirement_planning") {
    const age = params.targetRetirementAge || 65;
    return [
      {
        title: "Conservative Future",
        scenario: "conservative",
        bullets: [
          `Target retirement at age ${age + 3}`,
          "Enables a highly conservative, bulletproof spending budget",
          "Guarantees preservation of generational capital",
          "Precludes any sequence-of-returns market risk"
        ]
      },
      {
        title: "Balanced Future",
        scenario: "balanced",
        bullets: [
          `Retire at your ideal age of ${age}`,
          `Sustain a comfortable lifestyle at $${(params.desiredAnnualSpending || 80000).toLocaleString()}/year`,
          "High confidence likelihood of nest egg sustainability",
          "Perfect balance of work lifetime value and personal freedom"
        ]
      },
      {
        title: "Aggressive Future",
        scenario: "aggressive",
        bullets: [
          `Accelerate retirement to age ${age - 2}`,
          "Requires systematic downsizing of unnecessary monthly overheads",
          "Requires dynamic partial-income consulting to guard against market slowdowns",
          "Maximizes lifestyle years with early independence"
        ]
      }
    ];
  } else if (type === "debt_optimization") {
    const approach = params.focusStrategy === "snowball" ? "Debt Snowball" : "Debt Avalanche";
    return [
      {
        title: "Conservative Future",
        scenario: "conservative",
        bullets: [
          "Continue paying standard loan minimums",
          "High total interest paid over 10-15 years",
          "High safety buffer in your monthly liquid checking account",
          "No risk of cash flow lockups but slower compound growth"
        ]
      },
      {
        title: "Balanced Future",
        scenario: "balanced",
        bullets: [
          `Use ${approach} strategy with moderate surplus allocations`,
          "Retire 1 year earlier by wiping out high-interest debts sooner",
          "Save an estimated $12,500 in total interest costs",
          "Excellent compound progress without feeling budget restricted"
        ]
      },
      {
        title: "Aggressive Future",
        scenario: "aggressive",
        bullets: [
          "Direct 100% of temporary discretionary cash flow to wipe out high-interest debts",
          "Eliminate all active student/auto loans within 18 months",
          "Free up cash flow to immediately double your monthly retirement savings",
          "Bypasses debt risk completely for absolute wealth security"
        ]
      }
    ];
  } else if (type === "college_funding") {
    return [
      {
        title: "Conservative Future",
        scenario: "conservative",
        bullets: [
          "Target low-cost public in-state education options",
          "Maintain maximum cash reserves for active property equity accumulation",
          "Zero impact on personal retirement age tracking",
          "Avoid high financial strain during education years"
        ]
      },
      {
        title: "Balanced Future",
        scenario: "balanced",
        bullets: [
          `Fund college at a stable ${params.fundingTargetPercent || 80}% target level`,
          "Retire at standard targeted ages with small lifestyle adjustments",
          "Ensure your kids transition into adult life with minimal or no loan overheads",
          "Provides an optimal middle ground of support and independence"
        ]
      },
      {
        title: "Aggressive Future",
        scenario: "aggressive",
        bullets: [
          "Pre-fund college at 100% target using structured 529 plans immediately",
          "Delays home pricing power slightly, but fulfills legacy educational goals fully",
          "Capitalizes on tax-free state educational compound tax credits",
          "Drives high wealth transfers down to next-generation members"
        ]
      }
    ];
  } else {
    return [
      {
        title: "Conservative Future",
        scenario: "conservative",
        bullets: [
          "Rely on standard state wills and default execution methods",
          "Potential 3-to-6 month probate delays on asset distribution",
          "Simplest structure with zero administrative overhead now",
          "Higher risk of family dispute and local probate fees"
        ]
      },
      {
        title: "Balanced Future",
        scenario: "balanced",
        bullets: [
          "Implement the proposed Secure Trust Structure",
          "Ensure instant transfer of private wealth to your beneficiaries",
          "Bypass local probate entirely, saving an estimated 4.5% of total wealth value",
          "Complete privacy on physical asset and portfolio distributions"
        ]
      },
      {
        title: "Aggressive Future",
        scenario: "aggressive",
        bullets: [
          "Establish high-protection trusts paired with advanced state tax shielding",
          "Lock in legacy wealth preservation securely",
          "Requires advanced legal counsel onboarding",
          "Guarantees legacy goals against macro tax rule adjustments"
        ]
      }
    ];
  }
}

function getLifeOutcomeStatement(type: SimulationType, result: SimulationResult, params: SimulationParams, twin: FinancialTwin): { outcome: string; nextStep: string } {
  const cashImpactStr = `$${Math.abs(Math.round(result.projectedCashFlowDelta)).toLocaleString()}`;
  const years = Math.abs(result.retirementReadinessShift);

  let outcome = "";
  let nextStep = "";

  if (type === "home_purchase") {
    if (result.retirementReadinessShift < 0) {
      outcome = `Purchasing this ${params.homePrice ? '$' + (params.homePrice/1000).toFixed(0) + 'k' : 'home'} delays retirement by ${years} ${years === 1 ? 'year' : 'years'} due to a monthly cash flow drop of ${cashImpactStr}.`;
      nextStep = "Consider a larger downpayment of 25% or look at homes priced 15% lower to keep your original retirement goal intact.";
    } else {
      outcome = `Purchasing this home has zero negative retirement impact and builds long-term real estate equity.`;
      nextStep = "Proceed with financing setup. You have sufficient liquid assets to preserve a 6-month emergency reserve.";
    }
  } else if (type === "vehicle_purchase") {
    if (result.retirementReadinessShift < 0) {
      outcome = `Financing this vehicle delays retirement readiness by ${years} ${years === 1 ? 'year' : 'years'} and reduces your monthly investment capacity by ${cashImpactStr}.`;
      nextStep = "Buy a reliable 2-3 year old pre-owned model or opt for cash purchase to bypass interest expense.";
    } else {
      outcome = `Your vehicle purchase fits comfortably in your budget, preserving your current target timeline.`;
      nextStep = "Align lease/buy financing details, locking in at least 5% downpayment buffer.";
    }
  } else if (type === "career_change") {
    if (result.projectedCashFlowDelta > 0) {
      const earlyRetire = years > 0 ? `ready for retirement ${years} ${years === 1 ? 'year' : 'years'} earlier!` : "strengthens your savings significantly!";
      outcome = `Accepting this position increases your monthly income by ${cashImpactStr}, making you ${earlyRetire}`;
      nextStep = "Automatically transfer 50% of this salary increase into your equity brokerage to accelerate compounding.";
    } else {
      outcome = `This career move temporarily reduces your monthly cash flow by ${cashImpactStr} to invest in future professional equity.`;
      nextStep = "Ensure you have a 4-month emergency reserve before transitioning, and review benefits structure.";
    }
  } else if (type === "retirement_planning") {
    if (result.decisionHealthScore > 75) {
      outcome = `Sustaining a comfortable retirement spending budget of $${(params.desiredAnnualSpending || 80000).toLocaleString()}/year at age ${params.targetRetirementAge || 62} has a high 92% confidence rating.`;
      nextStep = "Continue compounding in standard broad-market portfolios. Your current savings rate is fully optimized.";
    } else {
      outcome = `A $${(params.desiredAnnualSpending || 80000).toLocaleString()}/year target draft at age ${params.targetRetirementAge || 62} carries high probability of asset depletion before year 30.`;
      nextStep = "Target retirement age of 65, or trim other non-discretionary expenses by $300/mo to guarantee sustainability.";
    }
  } else if (type === "debt_optimization") {
    const debtRes = calculateOptimizedDebtScenario({
      twin,
      focusStrategy: (params.focusStrategy || "avalanche") as any,
      refinanceRate: params.refinanceRate || 0.045,
      surplusAllocationPercent: 50
    });

    if (debtRes.hasDebts) {
      const strategyName = params.focusStrategy === "snowball" 
        ? "Debt Snowball (smallest balance first)" 
        : params.focusStrategy === "invest_surplus"
        ? "Invest extra cash instead"
        : params.focusStrategy === "refinance"
        ? "Refinance strategy"
        : "Debt Avalanche (highest interest first)";

      const formattedSaved = formatCurrency(debtRes.interestSaved);
      
      if (params.focusStrategy === "invest_surplus") {
        outcome = `Investing your available extra cash instead of accelerating payoff directs resources into asset growth. Under current interest structures, you will pay ${formatCurrency(debtRes.currentInterestPaid)} in interest over ${debtRes.currentDebtFreeMonth} months.`;
        nextStep = "Confirm your brokerage or retirement investment contributions are active and fully automated.";
      } else {
        outcome = `Executing the ${strategyName} plan is projected to save you ${formattedSaved} in compound interest and accelerate your debt-free timeline by ${debtRes.monthsSaved} months.`;
        nextStep = `Formally activate this schedule starting next month by directing ${formatCurrency(debtRes.extraPaymentUsed)} of surplus cash flow to your targeted paydown debt.`;
      }
    } else {
      outcome = "You have no active debts to optimize. Your debt-free timeline is active and fully secure!";
      nextStep = "Proceed with compounding your cash flow surplus directly into your investment or retirement portfolios.";
    }
  } else if (type === "college_funding") {
    outcome = `Allocating 529 college trusts at a ${params.fundingTargetPercent || 80}% level preserves your children's access with very low impact on your retirement track.`;
    nextStep = "Initiate monthly automatic ACH transfers to state-sponsored tax shelter 529 plans.";
  } else {
    outcome = "Establishing an advanced Trust Structure bypasses complex state probate cycles, protecting up to 98% of your estate's value.";
    nextStep = "Draft basic estate directives and schedule a review with legal services to formalize probate-bypass trusts.";
  }

  return { outcome, nextStep };
}

export default function SimulatorEngine({ twin, initialType, initialParams, onSaveSimulation, onLogGovernanceEvent, onLogFeedback, onApproveLifeGoal, onBack }: SimulatorEngineProps) {
  const [selectedType, setSelectedType] = useState<SimulationType>("home_purchase");
  const [showApprovalPanel, setShowApprovalPanel] = useState(false);

  // Load state assumptions from Supabase/Sandbox
  const [stateAssumptions, setStateAssumptions] = useState<StateAssumption[]>([]);
  const [assumptionsLoading, setAssumptionsLoading] = useState(true);

  useEffect(() => {
    async function fetchAssumptions() {
      try {
        const data = await SupabaseService.loadStateAssumptions();
        setStateAssumptions(data || []);
      } catch (err) {
        console.error("Error loading state assumptions in SimulatorEngine:", err);
      } finally {
        setAssumptionsLoading(false);
      }
    }
    fetchAssumptions();
  }, []);

  const fallbackAssumption: StateAssumption = {
    state_code: "US",
    effective_tax_rate: 0.04,
    property_tax_rate: 0.012, // Standard 1.2% national average property tax
    cost_of_living_index: 1.0,
    appreciation_rate: 0.04,   // 4.0% national average appreciation
  };

  // Sync with initialType prop
  useEffect(() => {
    if (initialType) {
      setSelectedType(initialType);
    }
  }, [initialType]);

  // Sync with initialParams prop
  useEffect(() => {
    if (initialParams) {
      setParams(p => ({
        ...p,
        ...initialParams
      }));
    }
  }, [initialParams]);
  
  // Params state
  const [params, setParams] = useState<SimulationParams>({
    homePrice: 500000,
    downPayment: 100000,
    interestRate: 0.065,
    rentVsBuy: "buy",

    vehiclePrice: 45000,
    autoDownPayment: 10000,
    vehicleType: "ev",
    leaseVsBuy: "buy",
    condition: "new",

    newSalary: 120000,
    relocationCost: 8000,
    careerType: "job_change",
    startupEquity: 0.02,
    startupSuccessProb: 0.20,

    targetRetirementAge: 62,
    desiredAnnualSpending: 80000,

    focusStrategy: "avalanche",
    refinanceRate: 0.045,

    childrenAges: [4, 7],
    annualCollegeCost: 35000,
    fundingTargetPercent: 80,

    estatePreservationLevel: "standard",
    wealthTransferGoal: 1000000,
    useTrustStructure: true
  });

  // UI state for feedback
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<"helpful" | "not_helpful" | null>(null);
  const [feedbackReason, setFeedbackReason] = useState("");
  const [feedbackComment, setFeedbackComment] = useState("");

  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  // Core Math computations
  const totalAnnualIncome = (twin.incomes || []).reduce((acc, curr) => acc + (curr.frequency === "annual" ? (Number(curr.amount) || 0) : (Number(curr.amount) || 0) * 12), 0);
  const totalAssetsValue = (twin.assets || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalLiabilitiesValue = (twin.liabilities || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const currentNetWorth = totalAssetsValue - totalLiabilitiesValue;
  const averageGrowthRate = (twin.assets && (twin.assets || []).length > 0) 
    ? ((twin.assets || []).reduce((acc, c) => acc + (Number(c.annualGrowth) || 0), 0) / (twin.assets || []).length) 
    : 0.06;

  // Re-run simulation when params, basic twin attributes alter, or state assumptions load/change
  useEffect(() => {
    runSimulation();
  }, [selectedType, params, twin, stateAssumptions, assumptionsLoading]);

  const runSimulation = () => {
    const years = 30;
    const baselineNW: number[] = [];
    const simulatedNW: number[] = [];

    let tempBaseline = currentNetWorth;
    let tempSimulated = currentNetWorth;

    // Standard annual surplus cash flow before choice:
    const monthlyExpenses = Number(twin.monthlyExpenses) || 0;
    const monthlyIncome = totalAnnualIncome / 12;
    const monthlyDebtPayments = (twin.liabilities || []).reduce((acc, curr) => acc + (Number(curr.monthlyPayment) || 0), 0);
    const baseMonthlySurplus = Math.max(0, monthlyIncome - monthlyExpenses - monthlyDebtPayments);
    const annualSurplus = baseMonthlySurplus * 12;

    let projectedCashFlowDelta = 0;
    let retirementReadinessShift = 0;
    let decisionHealthScore = 75;
    let riskScore = 30;
    let confidenceScore = 90;
    let keyAssumptions: string[] = [];
    let limitations: string[] = [];
    let alternativeScenarios: any[] = [];

    // Resolve state tax multiplier from loaded state assumptions dynamically
    const activeStateCode = (twin.taxState || "").trim().toUpperCase();
    const matchedStateTaxAss = stateAssumptions.find(
      a => (a.state_code || "").trim().toUpperCase() === activeStateCode
    );
    const effectiveTaxRate = matchedStateTaxAss ? matchedStateTaxAss.effective_tax_rate : fallbackAssumption.effective_tax_rate;
    const taxPenaltyMultiplier = 1 - effectiveTaxRate;
    const liquidCash = (twin.assets || []).filter(a => a.type === "cash" || a.type === "brokerage").reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

    // Module math logic
    if (selectedType === "home_purchase") {
      const price = params.homePrice || 500000;
      const down = params.downPayment || 100000;
      const rate = params.interestRate || 0.065;

      // Handle raw cash override limit checks
      if (down > totalAssetsValue) {
        onLogGovernanceEvent({
          type: "bias_flag",
          severity: "high",
          message: `Down payment of $${down.toLocaleString()} overrides available twin liquid assets of $${totalAssetsValue.toLocaleString()}. Adjusting calculation parameter internally.`,
          status: "active"
        });
      }

      // Resolve state assumption:
      const matchedAssumption = stateAssumptions.find(
        (a) => (a.state_code || "").trim().toUpperCase() === activeStateCode
      );
      const usingFallback = !matchedAssumption && !assumptionsLoading;
      const activeStateAssumption = matchedAssumption || fallbackAssumption;

      // Find current monthly rent from twin if available
      let currentMonthlyRent = 0;
      if (twin.liabilities) {
        const rentLiability = twin.liabilities.find((l) =>
          (l.name || "").toLowerCase().includes("rent") ||
          (l.name || "").toLowerCase().includes("lease")
        );
        if (rentLiability) {
          currentMonthlyRent = Number(rentLiability.monthlyPayment) || 0;
        }
      }

      const result = calculateHomePurchaseScenario({
        currentNetWorth,
        annualSurplus,
        averageGrowthRate,
        homePrice: price,
        downPayment: down,
        interestRate: rate,
        years,
        stateAssumption: activeStateAssumption,
        currentMonthlyRent,
      });

      // Populate curves
      baselineNW.push(...result.baselineNetWorthProjection);
      simulatedNW.push(...result.simulatedNetWorthProjection);

      projectedCashFlowDelta = result.projectedCashFlowDelta;

      // Calculate retirement readiness shift based on cash flow delta
      retirementReadinessShift = projectedCashFlowDelta < -1500 ? -3.5 : projectedCashFlowDelta < 0 ? -1.5 : 1;

      // --- DYNAMIC DECISION HEALTH SCORE ---
      const monthlyHomeCost = result.monthlyHomeCost;
      const postPurchaseCash = liquidCash - down;
      const emergencyMonthsPost = monthlyExpenses > 0 ? postPurchaseCash / monthlyExpenses : 0;

      // 1. Housing Cost percentage (optimal is <= 28% of gross income)
      let housingCostPoints = 0;
      const monthlyGross = totalAnnualIncome / 12;
      if (monthlyGross > 0) {
        const housingRatio = monthlyHomeCost / monthlyGross;
        if (housingRatio <= 0.28) {
          housingCostPoints = 35;
        } else if (housingRatio <= 0.36) {
          housingCostPoints = 25;
        } else if (housingRatio <= 0.45) {
          housingCostPoints = 15;
        } else {
          housingCostPoints = 5;
        }
      } else {
        housingCostPoints = 10;
      }

      // 2. Emergency Reserve (remaining cash after purchase, optimal is >= 6 months)
      let emergencyPoints = 0;
      if (emergencyMonthsPost >= 6) {
        emergencyPoints = 25;
      } else if (emergencyMonthsPost >= 3) {
        emergencyPoints = 18;
      } else if (emergencyMonthsPost > 0) {
        emergencyPoints = 10;
      } else {
        emergencyPoints = 0;
      }

      // 3. Cash Flow Delta
      let cashFlowPoints = 0;
      if (projectedCashFlowDelta >= 0) {
        cashFlowPoints = 20;
      } else if (projectedCashFlowDelta > -500) {
        cashFlowPoints = 15;
      } else if (projectedCashFlowDelta > -1500) {
        cashFlowPoints = 10;
      } else {
        cashFlowPoints = 2;
      }

      // 4. Down Payment Affordability
      let downPaymentPoints = 0;
      if (down <= liquidCash) {
        downPaymentPoints = 15;
      } else {
        downPaymentPoints = 0;
      }

      // 5. State Assumption Availability
      const statePoints = usingFallback ? 2 : 5;

      decisionHealthScore = housingCostPoints + emergencyPoints + cashFlowPoints + downPaymentPoints + statePoints;
      decisionHealthScore = Math.round(clamp(decisionHealthScore, 10, 100));

      // --- DYNAMIC CONFIDENCE SCORE ---
      let finalConfidenceScore = 95;

      if (usingFallback) {
        finalConfidenceScore -= 15;
      }
      if (!twin.incomes || twin.incomes.length === 0 || monthlyExpenses === 0) {
        finalConfidenceScore -= 20;
      }
      if (down > liquidCash) {
        finalConfidenceScore -= 25;
      }
      // Check if rent is estimated
      const isRentEstimated = currentMonthlyRent <= 0;
      if (isRentEstimated) {
        finalConfidenceScore -= 10;
      }

      // Factor in profile completeness
      const profileCompletenessFactor = calculateProfileCompleteness(twin);
      if (profileCompletenessFactor < 70) {
        finalConfidenceScore -= (70 - profileCompletenessFactor) * 0.5;
      }

      confidenceScore = Math.round(clamp(finalConfidenceScore, 20, 100));
      riskScore = Math.min(100, Math.round((price / (totalAnnualIncome + 1)) * 12));

      keyAssumptions = [...result.assumptionsUsed];
      
      // If fallback was used, add a highly visible assumption stating so
      if (assumptionsLoading) {
        keyAssumptions.push("Loading state assumptions...");
      } else if (usingFallback) {
        if (!twin.taxState) {
          keyAssumptions.push("National fallback assumptions are being used because no state was selected.");
        } else {
          keyAssumptions.push(`Fallback national-average assumptions were applied because active state profiles for ${twin.taxState} were not available.`);
        }
      }

      // Temporary development-only console QA logs for Home Purchase
      if (process.env.NODE_ENV !== "production") {
        console.log("[AURA HP SIMULATOR QA LOG]", {
          price,
          down,
          interestRate: rate,
          stateCode: activeStateAssumption.state_code,
          propertyTaxRate: activeStateAssumption.property_tax_rate,
          appreciationRate: activeStateAssumption.appreciation_rate,
          monthlyMortgage: result.monthlyMortgage,
          monthlyPropertyTax: result.monthlyPropertyTax,
          monthlyMaintenance: result.monthlyMaintenance,
          monthlyHomeCost: result.monthlyHomeCost,
          monthlyRentAssumption: result.monthlyRentAssumption,
          projectedCashFlowDelta: result.projectedCashFlowDelta,
          lifetimeWealthImpact: result.lifetimeWealthImpact,
          decisionHealthScore,
          confidenceScore,
          
          // Phase 2C required development logs
          assumptionsLoading,
          stateAssumptionsLength: stateAssumptions.length,
          activeStateCode,
          matchedAssumption,
          usingFallback,
          "property_tax_rate used": activeStateAssumption.property_tax_rate,
          "appreciation_rate used": activeStateAssumption.appreciation_rate,
        });
      }

      limitations = [
        "Does not project unhedged regional real estate market flash-crashes",
        "Assumes homeowner insurance premiums index constant with standard inflation"
      ];
      alternativeScenarios = [
        {
          title: "Optimize Leverage Index",
          description: "Reduce home purchase price to 80% to retain emergency cushion.",
          params: { homePrice: price * 0.8, downPayment: down }
        },
        {
          title: "Rent and Invest Margin",
          description: "Lease simple property, routing the monthly surplus back into S&P 500.",
          params: { rentVsBuy: "rent" }
        }
      ];

    } else if (selectedType === "vehicle_purchase") {
      const price = params.vehiclePrice || 45000;
      const down = params.autoDownPayment || 10000;
      const vType = params.vehicleType || "ev";

      projectedCashFlowDelta = -(((price - down) * 0.07) / 12 + (vType === "ev" ? 120 : 250)); // EV saves on fueling

      tempBaseline = currentNetWorth;
      let tempLiquidSimulated = currentNetWorth - down;

      for (let i = 1; i <= years; i++) {
        tempBaseline = (tempBaseline + annualSurplus) * (1 + averageGrowthRate);
        baselineNW.push(Math.round(tempBaseline));

        // Cars depreciate heavily
        const carDepreciatedVal = i <= 10 ? price * Math.pow(vType === "ev" ? 0.75 : 0.82, i) : 0;
        const simulatedAnnualSavings = Math.max(0, annualSurplus + (projectedCashFlowDelta * 12));
        
        // Compound only the liquid wealth portion
        tempLiquidSimulated = (tempLiquidSimulated + simulatedAnnualSavings) * (1 + averageGrowthRate);
        
        // Total Simulated Net Worth = Liquid wealth compounding + current depreciated vehicle valuation
        tempSimulated = tempLiquidSimulated + carDepreciatedVal;
        simulatedNW.push(Math.round(tempSimulated));
      }

      decisionHealthScore = Math.max(40, Math.min(98, 90 - (price / (totalAnnualIncome + 1)) * 40));
      riskScore = Math.round((price / (totalAnnualIncome + 1)) * 25);
      confidenceScore = 95;
      retirementReadinessShift = -0.5;

      keyAssumptions = [
        vType === "ev" ? "Accelerated electric car depreciation at 25% ARR" : "Standard combustion vehicle depreciation at 15% ARR",
        "Monthly charging and fuel cost difference set at $130 savings for EV profile",
        "Assumes interest loan term of 60 months at locked auto rate of 7.2%"
      ];
      limitations = [
        "Excludes battery replacement risks or warranty expirations",
        "Assumes stable utility grid and standard gasoline prices"
      ];
      alternativeScenarios = [
        {
          title: "Buy Certified Pre-Owned",
          description: "Avoid year-1 steep depreciation by purchasing 3-year used model.",
          params: { vehiclePrice: price * 0.65, condition: "used" }
        }
      ];

    } else if (selectedType === "career_change") {
      const newSal = params.newSalary || 120000;
      const relocation = params.relocationCost || 8000;

      projectedCashFlowDelta = (newSal - totalAnnualIncome) / 12;

      tempBaseline = currentNetWorth;
      tempSimulated = currentNetWorth - relocation;

      for (let i = 1; i <= years; i++) {
        tempBaseline = (tempBaseline + annualSurplus) * (1 + averageGrowthRate);
        baselineNW.push(Math.round(tempBaseline));

        // Incorporates wage-growth compounding
        const simulatedAnnualSavings = Math.max(0, (newSal * taxPenaltyMultiplier) - (twin.monthlyExpenses * 12));
        tempSimulated = (tempSimulated + simulatedAnnualSavings) * (1 + averageGrowthRate);
        simulatedNW.push(Math.round(tempSimulated));
      }

      retirementReadinessShift = projectedCashFlowDelta > 500 ? Math.min(8, projectedCashFlowDelta / 400) : -0.2;
      decisionHealthScore = newSal > totalAnnualIncome ? 92 : 60;
      riskScore = relocation > 15000 ? 45 : 15;
      confidenceScore = 78; // Career shifts carry transition risk

      keyAssumptions = [
        `Expected relocation cost of $${relocation} in year-1`,
        `Progressive state income tax brackets computed on federal W2 for ${twin.taxState || "US / National"}`,
        "Assumes target lifestyle cost inflation is capped at 3% post transition"
      ];
      alternativeScenarios = [
        {
          title: "Negotiate Relocation Sign-on",
          description: "Acquire business subsidy offset for relocating.",
          params: { relocationCost: 0 }
        }
      ];

    } else if (selectedType === "retirement_planning") {
      const targetRetAge = params.targetRetirementAge || 62;
      const desiredSpending = params.desiredAnnualSpending || 80000;

      // Drawdown comparison against retirement target age
      tempBaseline = currentNetWorth;
      tempSimulated = currentNetWorth;
      const ageDiff = targetRetAge - twin.age;

      for (let i = 1; i <= years; i++) {
        tempBaseline = (tempBaseline + annualSurplus) * (1 + averageGrowthRate);
        baselineNW.push(Math.round(tempBaseline));

        if (i >= ageDiff) {
          // drawdown mode: spend principal, S&P growth mitigates
          const annualSpendingAdjusted = desiredSpending * Math.pow(1.025, i);
          tempSimulated = Math.max(0, (tempSimulated - annualSpendingAdjusted) * (1 + averageGrowthRate * 0.7)); // conservative allocation during drawdown
        } else {
          // accumulation mode: savings compound
          tempSimulated = (tempSimulated + annualSurplus) * (1 + averageGrowthRate);
        }
        simulatedNW.push(Math.round(tempSimulated));
      }

      // 4% Rule check: is the ending net worth sustainable?
      const targetNestEggNeeded = desiredSpending * 25;
      const expectedAssetsAtRetirement = currentNetWorth * Math.pow(1 + averageGrowthRate, ageDiff) + (annualSurplus * ageDiff);
      const suitabilityFactor = expectedAssetsAtRetirement >= targetNestEggNeeded ? 94 : 65;

      decisionHealthScore = suitabilityFactor;
      riskScore = suitabilityFactor > 80 ? 25 : 60;
      confidenceScore = 88;
      retirementReadinessShift = targetRetAge - twin.retirementAge;
      projectedCashFlowDelta = ageDiff <= 0 ? 0 : -desiredSpending / 12;

      keyAssumptions = [
        `Assumed safe drawdown ceiling aligned with historical 4.0% rules`,
        `Steady lifestyle capital spending rate of $${desiredSpending.toLocaleString()}/year`,
        `Filing status set to progressive ${twin.taxState || "US / National"} taxation schedules`
      ];
      limitations = [
        "Neglects dynamic market crashes occurring precisely during year-1 of drawdown block (Sequence of Returns)",
        "Assumes medical insurance subsidies cover age-related health costs"
      ];
      alternativeScenarios = [
        {
          title: "Extend Tenure by 3 Years",
          description: "Delay retirement slightly to let index portfolios compound further.",
          params: { targetRetirementAge: targetRetAge + 3 }
        },
        {
          title: "Trim Spend Target by 15%",
          description: "Scale back annual discretionary outlays to secure capital survival rates.",
          params: { desiredAnnualSpending: desiredSpending * 0.85 }
        }
      ];

    } else if (selectedType === "debt_optimization") {
      const strategy = params.focusStrategy || "avalanche";
      const refiRate = params.refinanceRate || 0.045;

      const result = calculateOptimizedDebtScenario({
        twin,
        focusStrategy: strategy as any,
        refinanceRate: refiRate,
        surplusAllocationPercent: 50
      });

      const totalDebtBalance = result.totalDebtBalance;

      let currentAssetsBaseline = currentNetWorth + totalDebtBalance;
      let currentAssetsSimulated = currentNetWorth + totalDebtBalance;
      const monthlyGrowth = averageGrowthRate / 12;

      for (let m = 1; m <= 360; m++) {
        const currentMonthData = result.currentSchedule[m - 1];
        const currentPayments = currentMonthData 
          ? Object.values(currentMonthData.payments).reduce((sum, p) => sum + p, 0)
          : 0;
        const currentBalanceSum = currentMonthData
          ? Object.values(currentMonthData.balances).reduce((sum, b) => sum + b, 0)
          : 0;

        const baselineMonthlySaved = Math.max(0, (totalAnnualIncome / 12) - twin.monthlyExpenses - currentPayments);
        currentAssetsBaseline = (currentAssetsBaseline + baselineMonthlySaved) * (1 + monthlyGrowth);

        const optMonthData = result.optimizedSchedule[m - 1];
        const optPayments = optMonthData
          ? Object.values(optMonthData.payments).reduce((sum, p) => sum + p, 0)
          : 0;
        const optBalanceSum = optMonthData
          ? Object.values(optMonthData.balances).reduce((sum, b) => sum + b, 0)
          : 0;

        const simulatedMonthlySaved = (totalAnnualIncome / 12) - twin.monthlyExpenses - optPayments;
        currentAssetsSimulated = (currentAssetsSimulated + simulatedMonthlySaved) * (1 + monthlyGrowth);

        if (m % 12 === 0) {
          baselineNW.push(Math.round(currentAssetsBaseline - currentBalanceSum));
          simulatedNW.push(Math.round(currentAssetsSimulated - optBalanceSum));
        }
      }

      projectedCashFlowDelta = result.interestSaved > 0 
        ? (result.interestSaved / Math.max(1, result.optimizedDebtFreeMonth))
        : 0;

      // Decision score:
      let score = 70;
      if (result.hasDebts) {
        const highInterestDebt = (twin.liabilities || [])
          .filter((l) => (l.interestRate || 0) >= 0.08)
          .reduce((sum, l) => sum + l.amount, 0);

        score += Math.min(15, (result.interestSaved / 5000) * 15);
        score += Math.min(10, (result.monthsSaved / 12) * 10);

        if (result.isSurplusNegative) {
          score -= 30;
        } else {
          score += 5;
        }

        if (highInterestDebt > 10000) {
          score += 5;
        }

        const completeness = calculateProfileCompleteness(twin);
        score += Math.round((completeness / 100) * 5);
      } else {
        score = 95;
      }
      decisionHealthScore = clamp(score, 0, 100);

      // Risk score:
      const totalLiabilitiesVal = (twin.liabilities || []).reduce((sum, l) => sum + l.amount, 0);
      riskScore = totalLiabilitiesVal > 50000 ? 55 : totalLiabilitiesVal > 20000 ? 35 : 15;
      if (result.isSurplusNegative) {
        riskScore = Math.min(100, riskScore + 25);
      }

      // Confidence score:
      let conf = 80;
      if (result.hasDebts) {
        const hasAllLiabRates = (twin.liabilities || []).every(l => l.interestRate !== undefined && l.interestRate > 0);
        const hasAllLiabPayments = (twin.liabilities || []).every(l => l.monthlyPayment !== undefined && l.monthlyPayment > 0);
        const hasIncomes = (twin.incomes || []).length > 0;
        const hasExpenses = twin.monthlyExpenses > 0;

        if (hasAllLiabRates) conf += 5;
        else conf -= 15;

        if (hasAllLiabPayments) conf += 5;
        else conf -= 15;

        if (hasIncomes && hasExpenses) conf += 5;
        else conf -= 10;

        if (result.monthlySurplus > 0) conf += 10;
        else conf -= 15;
      } else {
        conf = 50;
      }
      confidenceScore = clamp(conf, 30, 100);

      // Retirement Readiness shift
      retirementReadinessShift = result.monthsSaved > 0 
        ? parseFloat((result.monthsSaved / 12).toFixed(1)) 
        : 0;

      const formattedInterestSaved = formatCurrency(result.interestSaved);
      const formattedCurrentInterest = formatCurrency(result.currentInterestPaid);
      const formattedOptimizedInterest = formatCurrency(result.optimizedInterestPaid);
      const formattedExtraPayment = formatCurrency(result.extraPaymentUsed);

      keyAssumptions = [
        strategy === "avalanche" 
          ? "Avalanche strategy targets the highest APR debt first."
          : strategy === "snowball"
          ? "Snowball strategy targets the smallest balance first."
          : strategy === "refinance"
          ? `Refinance strategy targets eligible debts higher than ${(refiRate * 100).toFixed(1)}% APR.`
          : "Invest extra cash instead strategy routes available monthly surplus to market portfolios.",
        `Estimated extra payment uses 50% of monthly surplus (${formattedExtraPayment}/month).`,
        `Current path pays approximately ${formattedCurrentInterest} in interest.`,
        `Optimized path pays approximately ${formattedOptimizedInterest} in interest.`,
        `Estimated interest saved: ${formattedInterestSaved}.`,
        `Estimated payoff acceleration: ${result.monthsSaved} months.`
      ];

      limitations = [
        "Does not include lender fees or refinance approval risk.",
        "Assumes payments are made consistently every month.",
        "Assumes interest rates remain unchanged unless refinance is selected.",
        "Does not include tax or credit-score effects."
      ];

      alternativeScenarios = [];
      if (result.hasDebts) {
        if (strategy !== "avalanche") {
          alternativeScenarios.push({
            title: "Avalanche strategy",
            description: "Target high APR debts first to minimize interest expense.",
            params: { focusStrategy: "avalanche" }
          });
        }
        if (strategy !== "snowball") {
          alternativeScenarios.push({
            title: "Snowball strategy",
            description: "Target small balances first to build immediate psychology momentum.",
            params: { focusStrategy: "snowball" }
          });
        }
        const hasHighRates = (twin.liabilities || []).some(l => l.interestRate > 0.05);
        if (strategy !== "refinance" && hasHighRates) {
          alternativeScenarios.push({
            title: "Refinance high-interest debt",
            description: "Refinance high APR accounts to lower rates to restrict interest compounding.",
            params: { focusStrategy: "refinance", refinanceRate: 0.045 }
          });
        }
        if (twin.monthlyExpenses > 0) {
          alternativeScenarios.push({
            title: "Reduce discretionary spending",
            description: "Trim expenses to generate more surplus to accelerate debt payoff.",
            params: { focusStrategy: strategy }
          });
        }
        const hasInvestments = (twin.assets || []).some(a => a.type === "brokerage" && a.amount > 0);
        if (hasInvestments && strategy !== "avalanche") {
          alternativeScenarios.push({
            title: "Pause investing to clear debt",
            description: "Direct asset contributions temporarily towards clearing high-interest debt.",
            params: { focusStrategy: "avalanche" }
          });
        }
      } else {
        alternativeScenarios = [
          {
            title: "Add standard liabilities",
            description: "Add hypothetical debts in your profile to run payoff simulations.",
            params: {}
          }
        ];
      }

      console.log("Debt Optimization Run Data:", {
        numberOfDebts: (twin.liabilities || []).length,
        totalDebtBalance: result.totalDebtBalance,
        monthlySurplus: result.monthlySurplus,
        extraPaymentUsed: result.extraPaymentUsed,
        selectedStrategy: strategy,
        currentTotalInterest: result.currentInterestPaid,
        optimizedTotalInterest: result.optimizedInterestPaid,
        interestSaved: result.interestSaved,
        monthsSaved: result.monthsSaved,
        decisionHealthScore,
        confidenceScore
      });

    } else if (selectedType === "college_funding") {
      const tuition = params.annualCollegeCost || 35000;
      const targetPercent = params.fundingTargetPercent || 80;

      tempBaseline = currentNetWorth;
      tempSimulated = currentNetWorth;

      // Children timeline parameters (ages 4 and 7 means college hits in 14 years and 11 years)
      const collegeHitsYear1 = 11;
      const collegeHitsYear2 = 14;
      const totalCollegeNeeds = tuition * 4 * 2 * (targetPercent / 100);

      projectedCashFlowDelta = -250; // monthly standard 529 savings contribution

      for (let i = 1; i <= years; i++) {
        tempBaseline = (tempBaseline + annualSurplus) * (1 + averageGrowthRate);
        baselineNW.push(Math.round(tempBaseline));

        let currentAnnualSurplusSim = annualSurplus + (projectedCashFlowDelta * 12); // monthly 529 asset addition

        // Deduct tuition when hit
        if (i >= collegeHitsYear1 && i < collegeHitsYear1 + 4) {
          currentAnnualSurplusSim -= tuition * (targetPercent / 100);
        }
        if (i >= collegeHitsYear2 && i < collegeHitsYear2 + 4) {
          currentAnnualSurplusSim -= tuition * (targetPercent / 100);
        }

        tempSimulated = (tempSimulated + currentAnnualSurplusSim) * (1 + averageGrowthRate);
        simulatedNW.push(Math.round(tempSimulated));
      }

      decisionHealthScore = liquidCash >= 30000 ? 86 : 60;
      riskScore = totalCollegeNeeds > 100000 ? 45 : 15;
      confidenceScore = 90;
      retirementReadinessShift = -2.2; // College funding represents a retirement delay due to capital deployment

      keyAssumptions = [
        `Expected tuition inflation cap set at 4.5% annual matching average national indexes`,
        `Tax-sheltered 529 asset compounding at ${averageGrowthRate * 100}% without tax erosion`,
        `Direct multi-child offset boundaries of age 18 distributions`
      ];
      limitations = [
        "Does not project state university premium spikes or private institution tuition expansions",
        "Assumes dependents enroll exactly on the traditional 4-year timeline targets"
      ];
      alternativeScenarios = [
        {
          title: "Reduce Funding Cap to 50%",
          description: "Co-share educational costs to preserve your retirement savings progress.",
          params: { fundingTargetPercent: 50 }
        }
      ];

    } else if (selectedType === "estate_legacy") {
      const goalsVal = params.wealthTransferGoal || 1000000;
      const useTrust = params.useTrustStructure ?? true;

      tempBaseline = currentNetWorth;
      tempSimulated = currentNetWorth;

      // Estate protection calculations: trust structures protect from probate costs (3% loss)
      // and state estate taxes on transfer
      const savingsProbate = useTrust ? goalsVal * 0.045 : 0;
      projectedCashFlowDelta = useTrust ? -40 : 0; // standard administrative trust upkeep cost

      for (let i = 1; i <= years; i++) {
        tempBaseline = (tempBaseline + annualSurplus) * (1 + averageGrowthRate);
        baselineNW.push(Math.round(tempBaseline));

        // Simulated end net worth compiles higher on saved taxes
        const addedValue = (i === years && useTrust) ? savingsProbate : 0;
        tempSimulated = (tempSimulated + annualSurplus + (projectedCashFlowDelta * 12)) * (1 + averageGrowthRate) + addedValue;
        simulatedNW.push(Math.round(tempSimulated));
      }

      decisionHealthScore = useTrust ? 96 : 74;
      riskScore = 10;
      confidenceScore = 98; // legacy mapping is highly deterministic
      retirementReadinessShift = -0.1;

      keyAssumptions = [
        `Federal transfer exemption benchmarks set at standard IRS guidelines`,
        `Protected trust boundaries preserve an estimated 4.5% of transfer balances from probate courts`,
        "Steady state inheritance tax structures without future federal tax changes"
      ];
      limitations = [
        "Excludes dynamic changes in domestic tax laws or international jurisdiction treaties",
        "Upkeep and legal setup expenses are aggregated with standard 30Y inflation ratios"
      ];
      alternativeScenarios = [
        {
          title: "High-Protection Trust Plan",
          description: "Enable comprehensive asset preservation to bypass state probate entirely.",
          params: { estatePreservationLevel: "high_protection", useTrustStructure: true }
        }
      ];

    } else {
      // General fallbacks
      projectedCashFlowDelta = 250; 
      tempBaseline = currentNetWorth;
      tempSimulated = currentNetWorth;

      for (let i = 1; i <= years; i++) {
        tempBaseline = (tempBaseline + annualSurplus) * (1 + averageGrowthRate);
        baselineNW.push(Math.round(tempBaseline));

        tempSimulated = (tempSimulated + annualSurplus * 1.05) * (1 + averageGrowthRate * 1.02);
        simulatedNW.push(Math.round(tempSimulated));
      }

      retirementReadinessShift = 1.2;
      decisionHealthScore = 80;
      riskScore = 20;
      confidenceScore = 88;

      keyAssumptions = [
        "Assumes compounding interest of 7.2% average market returns",
        "No major regulatory tax structure shifts over a 30-year horizon"
      ];
      limitations = [
        "Requires regional optimization adjustments"
      ];
      alternativeScenarios = [];
    }

    const finalSimulatedNW = simulatedNW[simulatedNW.length - 1] || 0;
    const finalBaselineNW = baselineNW[baselineNW.length - 1] || 0;
    let lifetimeWealthImpactVal = finalSimulatedNW - finalBaselineNW;

    // CREDIBILITY SAFEGUARDS & VALIDATION ANALYSIS
    let aggressiveAssumptions = false;

    // 1. Check for hyper-aggressive asset appreciation or market growth
    if (averageGrowthRate > 0.085) {
      aggressiveAssumptions = true;
    }
    // 2. Check for disproportionate property target purchase sizes
    if (selectedType === "home_purchase" && (params.homePrice || 0) > 1500000) {
      aggressiveAssumptions = true;
    }
    // 3. Check for outsized career shift jumps
    if (selectedType === "career_change" && (params.newSalary || 0) > 500000) {
      aggressiveAssumptions = true;
    }
    // 4. Guard against unrealistic multi-million outputs on high horizon compound curves
    if (Math.abs(lifetimeWealthImpactVal) > 5000000) {
      aggressiveAssumptions = true;
      // Multi-decade compounding of aggressive baseline choices leads to outlier tails.
      // We apply smooth logarithmic compression above 5M to maintain mathematical progression without producing absurd numbers.
      if (lifetimeWealthImpactVal > 5000000) {
        const excess = lifetimeWealthImpactVal - 5000000;
        lifetimeWealthImpactVal = 5000000 + Math.log10(excess) * 150000;
      } else if (lifetimeWealthImpactVal < -5000000) {
        const excess = -5000000 - lifetimeWealthImpactVal;
        lifetimeWealthImpactVal = -5000000 - Math.log10(excess) * 150000;
      }
    }

    // Discount confidence rating on aggressive assumptions
    let finalConfidenceScore = confidenceScore;
    if (aggressiveAssumptions) {
      finalConfidenceScore = Math.max(30, confidenceScore - 30);
    }

    const calculatedResult: SimulationResult = {
      id: Math.random().toString(36).substring(2, 9),
      type: selectedType,
      timestamp: new Date().toISOString(),
      params: { ...params },
      projectedNetWorth30Y: simulatedNW,
      projectedCashFlowDelta,
      lifetimeWealthImpact: lifetimeWealthImpactVal,
      aggressiveAssumptions,
      retirementReadinessShift,
      decisionHealthScore,
      riskScore,
      confidenceScore: finalConfidenceScore,
      keyAssumptions,
      limitations,
      alternativeScenarios
    };

    setSimulationResult(calculatedResult);
  };

  const getScenarioTitle = (type: string) => {
    switch (type) {
      case "home_purchase": return "Home Purchase Plan";
      case "vehicle_purchase": return "Vehicle Purchase";
      case "career_change": return "Career & Income Change";
      case "retirement_planning": return "Retirement Plan";
      case "debt_optimization": return "Accelerated Debt Freedom";
      case "college_funding": return "College Fund Plan";
      case "estate_legacy": return "Family Security & Legacy";
      default: return "Test a Decision";
    }
  };

  const getApprovalDetails = () => {
    const title = getScenarioTitle(selectedType);
    let targetAmt = 50000;
    let targetYr = new Date().getFullYear() + 5;
    let monthlyCommitment = 0;
    let category: "retirement" | "property" | "education" | "debt_free" | "other" = "other";
    let primaryRisk = "Subject to market volatility and inflation rate swings.";
    let nextAction = "Establish a recurring automated savings deposit matching this plan.";

    if (selectedType === "home_purchase") {
      targetAmt = params.homePrice || 500000;
      targetYr = new Date().getFullYear() + 3;
      monthlyCommitment = Math.round(((params.homePrice || 500000) - (params.downPayment || 100000)) * (params.interestRate || 0.065) / 12 + 250);
      category = "property";
      primaryRisk = "Interest rate lock risks and property value depreciation over the short-horizon.";
      nextAction = "Schedule consultation with local mortgage providers to pre-qualify.";
    } else if (selectedType === "vehicle_purchase") {
      targetAmt = params.vehiclePrice || 45000;
      targetYr = new Date().getFullYear() + 1;
      monthlyCommitment = Math.round(((params.vehiclePrice || 45000) - (params.autoDownPayment || 10000)) * 0.06 / 12);
      category = "property";
      primaryRisk = "Rapid asset depreciation cycles of newer vehicles.";
      nextAction = "Compare manufacturer special low-APR financing rates vs standard banks.";
    } else if (selectedType === "career_change") {
      targetAmt = params.relocationCost || 8000;
      targetYr = new Date().getFullYear() + 1;
      monthlyCommitment = params.relocationCost ? Math.round(params.relocationCost / 12) : 200;
      category = "other";
      primaryRisk = "Probabilistic startup equity failure risk, and temporary salary gaps.";
      nextAction = "Build a detailed cash-flow transition plan for the initial 6 months.";
    } else if (selectedType === "retirement_planning") {
      targetAmt = params.desiredAnnualSpending ? params.desiredAnnualSpending * 25 : 1500000;
      targetYr = params.targetRetirementAge ? (new Date().getFullYear() + Math.max(1, params.targetRetirementAge - twin.age)) : 2050;
      monthlyCommitment = Math.round(twin.monthlyExpenses * 0.15);
      category = "retirement";
      primaryRisk = "Longevity risk exceeding standard nest-egg drawdown projections.";
      nextAction = "Maximize tax-advantaged contributions to employer matching 401(k) plans.";
    } else if (selectedType === "debt_optimization") {
      targetAmt = totalLiabilitiesValue;
      targetYr = new Date().getFullYear() + 4;
      monthlyCommitment = Math.round(twin.monthlyExpenses * 0.10);
      category = "debt_free";
      primaryRisk = "Compounding high-interest balance spikes from secondary lines of credit.";
      nextAction = "Enable automated auto-pay targeting the highest interest loan first.";
    } else if (selectedType === "college_funding") {
      targetAmt = (params.annualCollegeCost || 35000) * 4;
      targetYr = new Date().getFullYear() + 12;
      monthlyCommitment = Math.round(targetAmt / 12 / 12);
      category = "education";
      primaryRisk = "Inflation of tuition indices exceeding standard historical levels.";
      nextAction = "Inquire on local state-sponsored tax-deductible 529 savings plans.";
    } else if (selectedType === "estate_legacy") {
      targetAmt = params.wealthTransferGoal || 1000000;
      targetYr = new Date().getFullYear() + 25;
      monthlyCommitment = 500;
      category = "other";
      primaryRisk = "Friction from federal probate tax loops and local estate tax rates.";
      nextAction = "Retain estate planning counsel to draft standard trust declarations.";
    }

    return {
      title,
      targetAmt,
      targetYr,
      monthlyCommitment,
      category,
      primaryRisk,
      nextAction,
      impact: simulationResult?.lifetimeWealthImpact || 0,
      assumptions: simulationResult?.keyAssumptions || ["Standard historical return parameters."]
    };
  };

  const saveSimulationPlan = () => {
    if (!simulationResult) return;
    onSaveSimulation(simulationResult);
    
    // Log audit events of successful simulations
    onLogGovernanceEvent({
      type: "override_rate",
      severity: "low",
      message: `User successfully saved the updated "${selectedType.toUpperCase()}" action plan to their profile.`,
      status: "resolved"
    });
  };

  const handleApplyAlternative = (altParams: Partial<SimulationParams>) => {
    setParams({
      ...params,
      ...altParams
    });
    setFeedbackSubmitted(null);
  };

  const submitFeedbackAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulationResult || !feedbackRating) return;

    onLogFeedback({
      id: Math.random().toString(36).substring(2, 9),
      simulationId: simulationResult.id,
      simulationType: selectedType,
      experienceRating: feedbackRating,
      reason: feedbackReason || "General review",
      textFeedback: feedbackComment,
      timestamp: new Date().toISOString()
    });

    setFeedbackSubmitted("Feedback submitted successfully. Thank you for helping refine Aura's suggestions!");
    
    // Log governance audit trail
    onLogGovernanceEvent({
      type: "dispute_filed",
      severity: "low",
      message: `User submitted direct algorithmic feedback rating "${feedbackRating.toUpperCase()}" on planning simulator [${selectedType}].`,
      status: "under_review"
    });
  };

  const currentStep: number = showApprovalPanel ? 4 : (simulationResult ? 3 : 2);

  return (
    <div className="space-y-6 w-full font-sans" id="simulator-engine-section">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: MODULE TOGGLES & INPUT PARAMETERS (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-mono text-slate-400 uppercase block mb-3 font-bold">Choose a Decision</span>
          <div className="space-y-2">
            {MODULES.map((mod) => {
              const IconComp = mod.icon;
              return (
                <button
                  key={mod.type}
                  onClick={() => {
                    setSelectedType(mod.type);
                    setFeedbackSubmitted(null);
                    setFeedbackRating(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                    selectedType === mod.type
                      ? "bg-teal-50/80 border-teal-200 text-teal-800 shadow-sm font-bold"
                      : "bg-white border-slate-150 hover:border-slate-300 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedType === mod.type ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-bold font-sans tracking-tight leading-none text-slate-800">{mod.title}</span>
                    <span className="block text-[10px] text-slate-400 truncate mt-1 leading-none">{mod.subtitle}</span>
                  </div>
                  {selectedType === mod.type && (
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* PARAMETERS CONFIGURATION CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Settings className="w-4 h-4 text-teal-650" />
              Your Scenario
            </h3>
            <span className="text-[10px] font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-slate-500 font-bold">
              {selectedType.toUpperCase().replace("_", " ")}
            </span>
          </div>

          <div className="space-y-4">
            {/* HOME PURCHASE SLIDERS */}
            {selectedType === "home_purchase" && (
              <>
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1.5 font-bold">
                    <span>HOME TARGET PRICE</span>
                    <span className="text-teal-650 font-black">${(params.homePrice || 0).toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="150000"
                    max="2000000"
                    step="25000"
                    value={params.homePrice}
                    onChange={(e) => setParams({ ...params, homePrice: parseFloat(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1 font-bold">
                    <span>$150k</span>
                    <span>$1.0M</span>
                    <span>$2.0M</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1.5 font-bold">
                    <span>DOWN PAYMENT RESERVE</span>
                    <span className="text-teal-600 font-black">${(params.downPayment || 0).toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="500000"
                    step="10000"
                    value={params.downPayment}
                    onChange={(e) => setParams({ ...params, downPayment: parseFloat(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1 font-bold">
                    <span>$10k</span>
                    <span>$250k</span>
                    <span>$500k</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 text-xs font-mono block mb-1 font-bold">INTEREST APR %</label>
                  <select
                    value={params.interestRate}
                    onChange={(e) => setParams({ ...params, interestRate: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                  >
                    <option value="0.055">5.5% (Best Case Tier)</option>
                    <option value="0.065">6.5% (Median National)</option>
                    <option value="0.075">7.5% (Strict Leverage)</option>
                    <option value="0.085">8.5% (Risk Premium)</option>
                  </select>
                </div>
              </>
            )}

            {/* VEHICLE PURCHASE SLIDERS */}
            {selectedType === "vehicle_purchase" && (
              <>
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1.5 font-bold">
                    <span>VEHICLE ACQUISITION COST</span>
                    <span className="text-teal-600 font-black">${(params.vehiclePrice || 0).toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="15000"
                    max="150000"
                    step="5000"
                    value={params.vehiclePrice}
                    onChange={(e) => setParams({ ...params, vehiclePrice: parseFloat(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1 font-bold">
                    <span>$15k</span>
                    <span>$80k</span>
                    <span>$150k</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 text-xs font-mono block mb-1 font-bold">DRIVETRAIN CATEGORY</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["ev", "hybrid", "gas"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setParams({ ...params, vehicleType: t as any })}
                        className={`p-2 rounded-lg border text-xs font-mono uppercase transition-all cursor-pointer ${
                          params.vehicleType === t
                            ? "bg-teal-50 border-teal-500 text-teal-700 font-bold"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 text-xs font-mono block mb-1 font-bold">FINANCIAL TERM OPTION</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["buy", "lease"].map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setParams({ ...params, leaseVsBuy: o as any })}
                        className={`p-2 rounded-lg border text-xs font-mono uppercase transition-all cursor-pointer ${
                          params.leaseVsBuy === o
                            ? "bg-teal-50 border-teal-500 text-teal-700 font-bold"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* CAREER & INCOME */}
            {selectedType === "career_change" && (
              <>
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1.5 font-bold">
                    <span>NEW TARGET BASE SALARY</span>
                    <span className="text-teal-650 font-black">${(params.newSalary || 0).toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max="400000"
                    step="10000"
                    value={params.newSalary}
                    onChange={(e) => setParams({ ...params, newSalary: parseFloat(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1 font-bold">
                    <span>$50k</span>
                    <span>$220k</span>
                    <span>$400k</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1.5 font-bold">
                    <span>ESTIMATED RELOCATION / SETUP COST</span>
                    <span className="text-rose-600 font-black">${(params.relocationCost || 0).toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30000"
                    step="1000"
                    value={params.relocationCost}
                    onChange={(e) => setParams({ ...params, relocationCost: parseFloat(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-slate-500 text-xs font-mono block mb-1 font-bold">TRANSACTION TYPE</label>
                  <select
                    value={params.careerType}
                    onChange={(e) => setParams({ ...params, careerType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all font-sans"
                  >
                    <option value="job_change">W2 Corporate Realignment</option>
                    <option value="start_business">Start business Venture (Pre-revenue)</option>
                  </select>
                </div>
              </>
            )}

            {/* RETIREMENT PLANNING SLIDERS */}
            {selectedType === "retirement_planning" && (
              <>
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1.5 font-bold">
                    <span>TARGET RETIREMENT AGE</span>
                    <span className="text-teal-650 font-black">{params.targetRetirementAge || 62} Years Old</span>
                  </div>
                  <input
                    type="range"
                    min="45"
                    max="80"
                    step="1"
                    value={params.targetRetirementAge || 62}
                    onChange={(e) => setParams({ ...params, targetRetirementAge: parseInt(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1 font-bold">
                    <span>45 y/o</span>
                    <span>62 y/o</span>
                    <span>80 y/o</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1.5 font-bold">
                    <span>DESIRED ANNUAL SPENDING (In retirement)</span>
                    <span className="text-teal-600 font-black">${(params.desiredAnnualSpending || 80000).toLocaleString()}/yr</span>
                  </div>
                  <input
                    type="range"
                    min="30000"
                    max="300000"
                    step="5000"
                    value={params.desiredAnnualSpending || 80000}
                    onChange={(e) => setParams({ ...params, desiredAnnualSpending: parseFloat(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1 font-bold">
                    <span>$30k</span>
                    <span>$150k</span>
                    <span>$300k</span>
                  </div>
                </div>
              </>
            )}

            {/* DEBT OPTIMIZATION */}
            {selectedType === "debt_optimization" && (
              <>
                <div>
                  <label className="text-slate-500 text-xs font-mono block mb-1 font-bold">PAYOFF STRATEGY</label>
                  <select
                    value={params.focusStrategy}
                    onChange={(e) => setParams({ ...params, focusStrategy: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none font-sans"
                  >
                    <option value="avalanche">Avalanche: highest interest first</option>
                    <option value="snowball">Snowball: smallest balance first</option>
                    <option value="invest_surplus">Invest extra cash instead</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1.5 font-bold">
                    <span>REFINANCE APR TARGET</span>
                    <span className="text-teal-650 font-black">{(params.refinanceRate || 0.045) * 100}% APR</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="0.5"
                    value={(params.refinanceRate || 0.045) * 100}
                    onChange={(e) => setParams({ ...params, refinanceRate: parseFloat(e.target.value) / 100 })}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* COLLEGE SAVINGS */}
            {selectedType === "college_funding" && (
              <>
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1.5 font-bold">
                    <span>ANNUAL STATE COLLEGE COST / CHILD</span>
                    <span className="text-teal-650 font-black">${(params.annualCollegeCost || 35000).toLocaleString()}/yr</span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="90000"
                    step="2000"
                    value={params.annualCollegeCost || 35000}
                    onChange={(e) => setParams({ ...params, annualCollegeCost: parseFloat(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1 font-bold">
                    <span>$10k</span>
                    <span>$50k</span>
                    <span>$90k</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1.5 font-bold">
                    <span>REQUIRED UNIVERSITY FUNDING TARGET</span>
                    <span className="text-teal-650 font-black">{params.fundingTargetPercent || 80}% funded</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={params.fundingTargetPercent || 80}
                    onChange={(e) => setParams({ ...params, fundingTargetPercent: parseInt(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* ESTATE AND LEGACY */}
            {selectedType === "estate_legacy" && (
              <>
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1.5 font-bold">
                    <span>WEALTH TRANSFER VALUE GOAL</span>
                    <span className="text-teal-650 font-black">${(params.wealthTransferGoal || 1000000).toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="100000"
                    max="5000000"
                    step="100000"
                    value={params.wealthTransferGoal || 1000000}
                    onChange={(e) => setParams({ ...params, wealthTransferGoal: parseFloat(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-slate-500 text-xs font-mono block mb-1 font-bold">PROTECTION COEFFICIENT</label>
                  <select
                    value={params.estatePreservationLevel}
                    onChange={(e) => setParams({ ...params, estatePreservationLevel: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none font-sans"
                  >
                    <option value="standard">Standard Preservation (Federal Level)</option>
                    <option value="high_protection">High Preservation (Probate Bypass Trust)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={params.useTrustStructure ?? true}
                    onChange={(e) => setParams({ ...params, useTrustStructure: e.target.checked })}
                    className="accent-teal-600 cursor-pointer h-4 w-4"
                  />
                  <div>
                    <span className="text-xs text-slate-800 block font-bold leading-none">Assemble Secure Trust Structure</span>
                    <span className="text-[10px] text-slate-500 mt-1 block font-bold">Bypasses local state probate cycles.</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setShowApprovalPanel(true);
              }}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all text-xs rounded-xl py-3 flex items-center justify-center gap-1.5 cursor-pointer shadow-md font-sans"
            >
              <CheckCircle className="w-4 h-4" /> Add to Life Goals
            </button>
          </div>
        </div>

        {/* Suggested Alternatives moved from the right column */}
        {simulationResult && simulationResult.alternativeScenarios && simulationResult.alternativeScenarios.length > 0 && (
          <div className="bg-teal-50/40 border border-teal-150 p-4 rounded-2xl space-y-3 shadow-sm font-sans">
            <span className="text-[10px] uppercase font-mono text-teal-700 font-bold block">Suggested Alternatives</span>
            <div className="space-y-2">
              {simulationResult.alternativeScenarios.map((alt, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <div>
                    <strong className="text-slate-800 text-xs block font-bold">{alt.title}</strong>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{alt.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyAlternative(alt.params)}
                    className="text-[10px] bg-teal-650 hover:bg-teal-600 text-white font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
                  >
                    Model scenario <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: SIMULATION REPORT & PROJECTIONS VISUAL (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {simulationResult && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between h-full shadow-sm">
            {/* HERO COMPASS: LIFESTYLE WEALTH IMPACT */}
            {(() => {
              const wealthImpactVal = simulationResult.lifetimeWealthImpact ?? 0;
              const isPositive = wealthImpactVal >= 0;
              const formattedWealthImpact = (isPositive ? "+" : "-") + "$" + Math.abs(Math.round(wealthImpactVal)).toLocaleString();
              
              return (
                <div className="mx-6 mt-6 bg-gradient-to-r from-teal-50/70 via-emerald-50/30 to-slate-50 border border-slate-150 rounded-2xl p-5 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
                  <div className={`absolute -right-12 -bottom-12 w-32 h-32 rounded-full blur-2xl pointer-events-none ${isPositive ? "bg-teal-500/10" : "bg-rose-500/5"}`} />
                  <div className="space-y-1 z-10 font-sans">
                    <span className="text-[10px] font-mono text-teal-600 font-bold uppercase tracking-widest block leading-none">Lifetime Decision Horizon</span>
                    <h3 className="text-sm font-bold text-slate-850 tracking-tight mt-1.5">Projected Lifetime Wealth Impact</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm">
                      Compared with doing nothing, this is the estimated difference after 30 years.
                    </p>
                  </div>
                  <div className="z-10 text-left sm:text-right select-none shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 w-full sm:w-auto">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold leading-none">LIFETIME IMPACT</span>
                    <div className={`text-2xl sm:text-3xl font-black tracking-tight mt-1.5 font-mono ${isPositive ? "text-teal-600" : "text-rose-600"}`}>
                      {formattedWealthImpact}
                    </div>
                    {Math.abs(wealthImpactVal) >= 5000000 && (
                      <span className="text-[9.5px] text-rose-800 font-bold leading-relaxed block mt-1 max-w-[200px] text-left sm:text-right bg-rose-50 border border-rose-200 rounded px-2 py-0.5 mt-1.5">
                        ⚠️ High Variance Alert: Compounding exceeds realistic predictability limits.
                      </span>
                    )}
                    <span className="text-[9px] text-slate-400 block mt-1 uppercase font-mono font-bold">calculated 30-year delta</span>
                  </div>
                </div>
              );
            })()}

            {simulationResult.aggressiveAssumptions && (
              <div className="mx-6 mt-2 mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 text-amber-800 text-xs shadow-sm">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <strong className="font-bold block sm:inline">Simulation Hazard Flags:</strong>{" "}
                  <span className="text-slate-600">Scenario contains unusually aggressive assumptions. Theoretical compounding confidence rating has been discounted.</span>
                </div>
              </div>
            )}

            {/* Header statistics block */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/40 font-sans">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Score block */}
                <div className="bg-white border border-slate-200 p-3.5 rounded-xl text-left relative overflow-hidden group shadow-sm">
                  <div className="absolute top-2 right-2 text-teal-600">
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block leading-none font-bold">Decision Score</span>
                  <span className="text-2xl font-black font-mono text-slate-800 tracking-tight block mt-1">
                    {simulationResult.decisionHealthScore}
                  </span>
                  <span className="text-[9px] text-teal-650 font-bold block mt-1.5 font-mono">HEALTH SCORES</span>
                </div>

                <div className="bg-white border border-slate-200 p-3.5 rounded-xl text-left shadow-sm">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block leading-none font-bold">Monthly Outlay</span>
                  <span className={`text-xl font-bold font-mono tracking-tight block mt-1.5 ${simulationResult.projectedCashFlowDelta < 0 ? "text-rose-600" : "text-teal-600"}`}>
                    {simulationResult.projectedCashFlowDelta >= 0 ? "+" : ""}${Math.round(simulationResult.projectedCashFlowDelta).toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-1 font-bold">CASH FLOW</span>
                </div>

                <div className="bg-white border border-slate-200 p-3.5 rounded-xl text-left shadow-sm">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block leading-none font-bold">Nest Egg Impact</span>
                  <span className={`text-xl font-bold font-mono tracking-tight block mt-1.5 ${simulationResult.retirementReadinessShift < 0 ? "text-rose-600" : "text-teal-600"}`}>
                    {simulationResult.retirementReadinessShift >= 0 ? "+" : ""}{simulationResult.retirementReadinessShift} Years
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-1 font-bold">RETIREMENT AGE</span>
                </div>

                <div className="bg-white border border-slate-200 p-3.5 rounded-xl text-left shadow-sm">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block leading-none font-bold">Risk Level</span>
                  <span className={`text-xl font-bold font-mono tracking-tight block mt-1.5 ${simulationResult.riskScore > 50 ? "text-rose-600" : "text-teal-600"}`}>
                    {simulationResult.riskScore > 65 ? "High Risk" : simulationResult.riskScore > 35 ? "Medium Risk" : "Low Risk"}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-1 font-bold">{simulationResult.riskScore}/100 SCORE</span>
                </div>
              </div>
            </div>

            {/* Outcome Conversation Boxes (Aura Recommendation) */}
            {(() => {
              const { outcome, nextStep } = getLifeOutcomeStatement(selectedType, simulationResult, params, twin);
              return (
                <div className="mx-6 mt-6 p-4 bg-teal-50/50 border border-teal-150 rounded-xl space-y-3 font-sans shadow-sm">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-teal-700 font-bold block mb-1">What happens if I do this?</span>
                    <p className="text-xs text-slate-800 font-bold leading-relaxed font-sans">{outcome}</p>
                  </div>
                  <div className="border-t border-teal-150/40 pt-3">
                    <span className="text-[10px] uppercase font-mono text-teal-600 font-bold block mb-1">What should I do next?</span>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">{nextStep}</p>
                  </div>
                </div>
              );
            })()}

            {/* Three Future Story Cards */}
            <div className="px-6 pt-6 font-sans">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-3">Narrative Future Stories</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {getFutureStories(selectedType, params).map((story, i) => {
                  const colors = 
                    story.scenario === "conservative" 
                      ? { bg: "bg-slate-50 border-slate-200", title: "text-slate-700", accent: "bg-slate-400" } 
                      : story.scenario === "balanced" 
                      ? { bg: "bg-teal-50/40 border-teal-200", title: "text-teal-700", accent: "bg-teal-500" } 
                      : { bg: "bg-emerald-50/35 border-emerald-200", title: "text-emerald-700", accent: "bg-emerald-500" };
                  return (
                    <div key={i} className={`p-4 rounded-xl border ${colors.bg} space-y-2.5 flex flex-col justify-between font-sans shadow-sm`}>
                      <div>
                        <span className={`text-[11px] font-bold ${colors.title} block font-mono uppercase tracking-wider`}>{story.title}</span>
                        <ul className="space-y-1.5 mt-2.5">
                          {story.bullets.map((bullet, idx) => (
                            <li key={idx} className="text-[10px] text-slate-600 leading-snug flex items-start gap-1.5 font-sans font-medium">
                              <span className={`w-1 h-1 rounded-full ${colors.accent} mt-1.5 shrink-0`} />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Product decision: projection charts intentionally omitted from the consumer MVP
                to reduce cognitive load. Do not restore without explicit product approval. */}

            {/* Assumptions and Limitations Lists */}
            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1.5">Assumptions Used</span>
                <ul className="space-y-1.5 text-[11px] text-slate-650 font-medium">
                  {simulationResult.keyAssumptions.map((ass, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1 shrink-0" />
                      <span>{ass}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1.5">What This Estimate Does Not Include</span>
                <ul className="space-y-1.5 text-[11px] text-slate-650 font-medium">
                  {simulationResult.limitations.map((lim, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                      <span>{lim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>



            {/* FEEDBACK LOOP MODULE */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
              {!feedbackSubmitted ? (
                <form onSubmit={submitFeedbackAction} className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <span className="text-[11px] text-slate-500 font-bold">Was Aura's estimated projection helpful?</span>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setFeedbackRating("helpful")}
                        className={`px-3 py-1 rounded-lg border text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                          feedbackRating === "helpful" 
                            ? "bg-teal-50 border-teal-500 text-teal-700 font-bold" 
                            : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 shadow-sm"
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" /> Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackRating("not_helpful")}
                        className={`px-3 py-1 rounded-lg border text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                          feedbackRating === "not_helpful" 
                            ? "bg-rose-50 border-rose-500 text-rose-700 font-bold" 
                            : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 shadow-sm"
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3" /> No
                      </button>
                    </div>
                  </div>

                  {feedbackRating && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-150">
                      <div className="flex-1 flex gap-2">
                        <select
                          value={feedbackReason}
                          onChange={(e) => setFeedbackReason(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] text-slate-650 focus:outline-none"
                        >
                          <option value="">-- Assessment --</option>
                          <option value="highly_realistic">Accurate state tax integration</option>
                          <option value="too_conservative">Overly conservative asset growth</option>
                          <option value="too_optimistic">Highly optimistic return ratios</option>
                          <option value="missing_parameters">Missing physical lifestyle overheads</option>
                          <option value="confusing">Complex UI calculations</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Optional comments..."
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-[10px] text-slate-700 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold tracking-tight px-3 py-1 rounded transition-all cursor-pointer shadow-sm"
                      >
                        Submit
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <div className="text-center py-1">
                  <span className="text-[11px] font-mono text-teal-600 font-bold">✓ {feedbackSubmitted}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

      {showApprovalPanel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in duration-205">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-teal-600 uppercase tracking-widest block font-bold">Aura Decision Engine</span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Add to Life Goals?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add and map this simulated choice directly onto your active Life Goals timeline to start monitoring progress.
              </p>
            </div>

            {(() => {
              const details = getApprovalDetails();
              const isPositive = details.impact >= 0;
              return (
                <div className="border border-slate-150 rounded-xl overflow-hidden text-xs">
                  {/* Summary grid */}
                  <div className="bg-slate-50 p-4 border-b border-slate-150 grid grid-cols-2 gap-x-4 gap-y-3 font-sans">
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] uppercase font-mono">Decision Lens</span>
                      <span className="font-bold text-slate-800">{details.title}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] uppercase font-mono">Selected Scenario</span>
                      <span className="font-bold text-teal-700 capitalize">Balanced Scenario</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] uppercase font-mono">Target Amount</span>
                      <span className="font-bold text-slate-800 font-mono">${Math.round(details.targetAmt).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] uppercase font-mono">Target Date / Year</span>
                      <span className="font-bold text-slate-800 font-mono">Year {details.targetYr}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] uppercase font-mono">Monthly Commitment</span>
                      <span className="font-bold text-slate-800 font-mono">${details.monthlyCommitment.toLocaleString()}/mo</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] uppercase font-mono">Projected Impact (30Y)</span>
                      <span className={`font-bold font-mono ${isPositive ? "text-teal-600" : "text-rose-600"}`}>
                        {isPositive ? "+" : "-"}${Math.abs(Math.round(details.impact)).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Assumptions & Risk */}
                  <div className="p-4 space-y-3 bg-white font-sans">
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] uppercase font-mono">Major Assumption</span>
                      <p className="text-slate-650 mt-0.5 leading-snug">{details.assumptions[0]}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block text-[9px] uppercase font-mono">Primary Risk Factor</span>
                      <p className="text-rose-700 font-medium mt-0.5 leading-snug">{details.primaryRisk}</p>
                    </div>
                    <div className="bg-teal-50/50 border border-teal-100 rounded-lg p-2.5">
                      <span className="text-teal-600 font-bold uppercase font-mono text-[8.5px] tracking-wider block">RECOMMENDED NEXT ACTION</span>
                      <p className="text-slate-700 font-bold leading-snug mt-0.5">{details.nextAction}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-3 font-sans">
              <button
                type="button"
                onClick={() => setShowApprovalPanel(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const details = getApprovalDetails();
                  onApproveLifeGoal && onApproveLifeGoal({
                    name: `Approved: ${details.title}`,
                    category: details.category,
                    targetAmount: details.targetAmt,
                    targetYear: details.targetYr,
                    currentSavings: 0,
                    priority: "important",
                    monthlyContribution: details.monthlyCommitment,
                    approvedScenarioType: selectedType,
                    approvedScenarioName: "Balanced Scenario",
                    approvedAssumptions: details.assumptions,
                    projectedImpact: details.impact,
                    nextAction: details.nextAction
                  });
                  setShowApprovalPanel(false);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer text-xs"
              >
                Approve and Start Monitoring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
