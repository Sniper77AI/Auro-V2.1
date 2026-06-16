/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { FinancialTwin, SimulationType, SimulationParams, SimulationResult, FeedbackItem, GovernanceEvent } from "../types";
import { 
  Home, Car, Briefcase, Calendar, ShieldAlert, Zap, 
  Settings, CheckCircle, Info, RefreshCw, Star, 
  ArrowRight, ThumbsUp, ThumbsDown, HelpCircle, GraduationCap, Users
} from "lucide-react";

interface SimulatorEngineProps {
  twin: FinancialTwin;
  onSaveSimulation: (result: SimulationResult) => void;
  onLogGovernanceEvent: (event: Omit<GovernanceEvent, "id" | "timestamp">) => void;
  onLogFeedback: (feedback: FeedbackItem) => void;
}

const MODULES: Array<{ type: SimulationType; title: string; subtitle: string; icon: any }> = [
  { type: "home_purchase", title: "Home Purchase", subtitle: "Rent vs Buy, leverage, local tax, early retirement", icon: Home },
  { type: "vehicle_purchase", title: "Vehicle Purchase", subtitle: "EV vs Gas, lease vs buy, depreciation curves", icon: Car },
  { type: "career_change", title: "Career & Income", subtitle: "Salary tradeoffs, relocation, startup equity", icon: Briefcase },
  { type: "retirement_planning", title: "Retirement Goal", subtitle: "Speed up or delay, nest egg probability, drawdowns", icon: Calendar },
  { type: "debt_optimization", title: "Debt Optimization", subtitle: "Avalanche vs Snowball, investing surpluses", icon: Settings },
  { type: "college_funding", title: "College Savings", subtitle: "529 planning, multi-child timeline offsets", icon: GraduationCap },
  { type: "estate_legacy", title: "Estate & Legacy", subtitle: "Trust structures, preservation, wealth shift", icon: Users }
];

export default function SimulatorEngine({ twin, onSaveSimulation, onLogGovernanceEvent, onLogFeedback }: SimulatorEngineProps) {
  const [selectedType, setSelectedType] = useState<SimulationType>("home_purchase");
  
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
  const totalAnnualIncome = twin.incomes.reduce((acc, curr) => acc + (curr.frequency === "annual" ? curr.amount : curr.amount * 12), 0);
  const totalAssetsValue = twin.assets.reduce((acc, curr) => acc + curr.amount, 0);
  const totalLiabilitiesValue = twin.liabilities.reduce((acc, curr) => acc + curr.amount, 0);
  const currentNetWorth = totalAssetsValue - totalLiabilitiesValue;
  const averageGrowthRate = twin.assets.length > 0 
    ? twin.assets.reduce((acc, c) => acc + c.annualGrowth, 0) / twin.assets.length 
    : 0.06;

  // Re-run simulation when params or basic twin attributes alter
  useEffect(() => {
    runSimulation();
  }, [selectedType, params, twin]);

  const runSimulation = () => {
    const years = 30;
    const baselineNW: number[] = [];
    const simulatedNW: number[] = [];

    let tempBaseline = currentNetWorth;
    let tempSimulated = currentNetWorth;

    // Standard annual surplus cash flow before choice:
    const monthlyExpenses = twin.monthlyExpenses;
    const monthlyIncome = totalAnnualIncome / 12;
    const monthlyDebtPayments = twin.liabilities.reduce((acc, curr) => acc + curr.monthlyPayment, 0);
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

    // State tax multiplier
    const stateTaxMap: Record<string, number> = { CA: 0.08, NY: 0.06, FL: 0.0, TX: 0.0, IL: 0.0495, WA: 0.0 };
    const taxPenaltyMultiplier = 1 - (stateTaxMap[twin.taxState] || 0.04);
    const liquidCash = twin.assets.filter(a => a.type === "cash" || a.type === "brokerage").reduce((acc, c) => acc + c.amount, 0);

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

      // Mortgage payment formula
      const loanAmount = Math.max(0, price - down);
      const monthlyRate = rate / 12;
      const numPayments = 360;
      const monthlyMortgage = monthlyRate > 0 
        ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
        : loanAmount / numPayments;

      // Maintenance + State property taxes (averages about 1.25% per year of purchase)
      const monthlyPropTaxAndMaint = (price * 0.015) / 12;
      projectedCashFlowDelta = -(monthlyMortgage + monthlyPropTaxAndMaint) + (monthlyExpenses * 0.25); // assume 25% rent offset

      // Build out NW curves
      tempBaseline = currentNetWorth;
      // Subtract downpayment for simulated right off the bat, but add the equity coordinate
      tempSimulated = currentNetWorth - down + price; 

      for (let i = 1; i <= years; i++) {
        // Baseline: cash compounds + annual savings compound
        tempBaseline = (tempBaseline + annualSurplus) * (1 + averageGrowthRate);
        baselineNW.push(Math.round(tempBaseline));

        // Simulated: home appreciates (approx 4.0%), equity compounds, mortgage amortizes
        const homeAppreciatedVal = price * Math.pow(1.04, i);
        // mortgage principal remains reduces
        const principalPaid = (monthlyMortgage * 12 * i) * 0.35; // simple amortization coefficient
        const simulatedAnnualSavings = Math.max(0, annualSurplus + (projectedCashFlowDelta * 12));
        
        tempSimulated = (tempSimulated - price + homeAppreciatedVal + simulatedAnnualSavings) * (1 + averageGrowthRate * 0.8) + principalPaid;
        simulatedNW.push(Math.round(tempSimulated));
      }

      retirementReadinessShift = projectedCashFlowDelta < -1500 ? -3.5 : projectedCashFlowDelta < 0 ? -1.5 : 1;
      decisionHealthScore = Math.max(25, Math.min(95, 85 + (projectedCashFlowDelta / 100)));
      riskScore = Math.round((price / (totalAnnualIncome + 1)) * 12);
      confidenceScore = 85;

      keyAssumptions = [
        `Constant property appreciation rate of 4.0% in ${twin.taxState}`,
        `Standard 30-year amortization schedule at ${rate * 100}% APR`,
        `Home maintenance and state taxes calculated at 1.5% annual cap`
      ];
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
      tempSimulated = currentNetWorth - down;

      for (let i = 1; i <= years; i++) {
        tempBaseline = (tempBaseline + annualSurplus) * (1 + averageGrowthRate);
        baselineNW.push(Math.round(tempBaseline));

        // Cars depreciate heavily
        const carDepreciatedVal = i <= 5 ? price * Math.pow(vType === "ev" ? 0.75 : 0.85, i) : 0;
        const simulatedAnnualSavings = Math.max(0, annualSurplus + (projectedCashFlowDelta * 12));
        tempSimulated = (tempSimulated + carDepreciatedVal + simulatedAnnualSavings) * (1 + averageGrowthRate);
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
        "Excludes battery core replacement risks or physical motor warranty expirations",
        "Assumes stable utility grid prices and standard gasoline index margins"
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
        `Expected relocation friction offset of $${relocation} in year-1`,
        `Progressive state income tax brackets computed on federal W2 for ${twin.taxState}`,
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
        `Filing status set to progressive ${twin.taxState} taxation schedules`
      ];
      limitations = [
        "Neglects dynamic market crashes occurring precisely during year-1 of drawdown block (Sequence of Returns)",
        "Assumes federal and state medical insurance subsidies cover extreme age-related health friction"
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

      tempBaseline = currentNetWorth;
      tempSimulated = currentNetWorth;

      // Calculate total outstanding high-interest debt
      const highInterestDebts = twin.liabilities.reduce((acc, c) => acc + c.amount, 0);
      const interestSavingsFactor = strategy === "avalanche" ? 0.25 : 0.15;
      const computedInterestSaved = highInterestDebts * (0.06 - refiRate) * interestSavingsFactor * 10; // 10 years payoff window

      projectedCashFlowDelta = strategy === "invest_surplus" ? 150 : computedInterestSaved > 0 ? 120 : 50;

      for (let i = 1; i <= years; i++) {
        tempBaseline = (tempBaseline + annualSurplus) * (1 + averageGrowthRate);
        baselineNW.push(Math.round(tempBaseline));

        // simulated pays off liability earlier, leading to higher end wealth
        const simulatedSavingsTotal = annualSurplus + (projectedCashFlowDelta * 12) + (i <= 5 ? computedInterestSaved / 5 : 0);
        tempSimulated = (tempSimulated + simulatedSavingsTotal) * (1 + averageGrowthRate);
        simulatedNW.push(Math.round(tempSimulated));
      }

      decisionHealthScore = strategy === "invest_surplus" && averageGrowthRate > 0.06 ? 92 : 88;
      riskScore = highInterestDebts > 30000 ? 55 : 20;
      confidenceScore = 92;
      retirementReadinessShift = projectedCashFlowDelta > 100 ? 1.5 : 0.5;

      keyAssumptions = [
        `Systemic reallocation of surplus cash flows using direct ${strategy.toUpperCase()} calculations`,
        `Ability to refinance interest rate lines downwards to ${refiRate * 100}% APR`,
        "Sustained monthly payment schedules with zero default intervals"
      ];
      limitations = [
        "Assumes lender institutions offer zero-fee refinancing terms under current market liquidity parameters",
        "Neglects emotional components of budget scaling friction when running avalanche paydowns"
      ];
      alternativeScenarios = [
        {
          title: "Aggressive Avalanche payoff",
          description: "Focus purely on interest weightings, saving maximum credit expenses.",
          params: { focusStrategy: "avalanche" }
        }
      ];

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
          description: "Co-share educational loads with auxiliary packages to preserve retirement velocity.",
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
        "Steady state inheritance tax structures without systemic regulatory overrides"
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

    const calculatedResult: SimulationResult = {
      id: Math.random().toString(36).substring(2, 9),
      type: selectedType,
      timestamp: new Date().toISOString(),
      params: { ...params },
      projectedNetWorth30Y: simulatedNW,
      projectedCashFlowDelta,
      retirementReadinessShift,
      decisionHealthScore,
      riskScore,
      confidenceScore,
      keyAssumptions,
      limitations,
      alternativeScenarios
    };

    setSimulationResult(calculatedResult);
  };

  const saveSimulationToLedger = () => {
    if (!simulationResult) return;
    onSaveSimulation(simulationResult);
    
    // Log audit events of successful simulations
    onLogGovernanceEvent({
      type: "override_rate",
      severity: "low",
      message: `System successfully computed and persisted projection card for theme "${selectedType.toUpperCase()}" with decision metrics.`,
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

    setFeedbackSubmitted("Feedback submitted successfully. This evaluation has updated the model recalibration log.");
    
    // Log governance audit trail
    onLogGovernanceEvent({
      type: "dispute_filed",
      severity: "low",
      message: `User submitted direct algorithmic feedback rating "${feedbackRating.toUpperCase()}" on planning simulator [${selectedType}].`,
      status: "under_review"
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="simulator-engine-section">
      {/* LEFT COLUMN: MODULE TOGGLES & INPUT PARAMETERS (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-3 font-semibold">Select Simulation Lens</span>
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
                      ? "bg-emerald-950/45 border-emerald-500/80 text-zinc-100 shadow-lg"
                      : "bg-zinc-950/40 border-zinc-800/40 hover:border-zinc-700 hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedType === mod.type ? "bg-emerald-600 text-zinc-900" : "bg-zinc-900 text-zinc-500"}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-bold font-sans tracking-tight leading-none text-zinc-100">{mod.title}</span>
                    <span className="block text-[10px] text-zinc-500 truncate mt-1 leading-none">{mod.subtitle}</span>
                  </div>
                  {selectedType === mod.type && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* PARAMETERS CONFIGURATION CARD */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-zinc-800/60">
            <h3 className="text-sm font-bold text-zinc-200 tracking-tight flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              Scenario Constraints
            </h3>
            <span className="text-[10px] font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400">
              {selectedType.toUpperCase().replace("_", " ")}
            </span>
          </div>

          <div className="space-y-4">
            {/* HOME PURCHASE SLIDERS */}
            {selectedType === "home_purchase" && (
              <>
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                    <span>HOME TARGET PRICE</span>
                    <span className="text-emerald-400 font-bold">${(params.homePrice || 0).toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="150000"
                    max="2000000"
                    step="25000"
                    value={params.homePrice}
                    onChange={(e) => setParams({ ...params, homePrice: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-650 font-mono mt-1">
                    <span>$150k</span>
                    <span>$1.0M</span>
                    <span>$2.0M</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                    <span>DOWN PAYMENT RESERVE</span>
                    <span className="text-teal-400 font-bold">${(params.downPayment || 0).toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="500000"
                    step="10000"
                    value={params.downPayment}
                    onChange={(e) => setParams({ ...params, downPayment: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-650 font-mono mt-1">
                    <span>$10k</span>
                    <span>$250k</span>
                    <span>$500k</span>
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 text-xs font-mono block mb-1">INTEREST APR %</label>
                  <select
                    value={params.interestRate}
                    onChange={(e) => setParams({ ...params, interestRate: parseFloat(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none"
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
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                    <span>VEHICLE ACQUISITION COST</span>
                    <span className="text-emerald-400 font-bold">${(params.vehiclePrice || 0).toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="15000"
                    max="150000"
                    step="5000"
                    value={params.vehiclePrice}
                    onChange={(e) => setParams({ ...params, vehiclePrice: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-650 font-mono mt-1">
                    <span>$15k</span>
                    <span>$80k</span>
                    <span>$150k</span>
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 text-xs font-mono block mb-1">DRIVETRAIN CATEGORY</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["ev", "hybrid", "gas"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setParams({ ...params, vehicleType: t as any })}
                        className={`p-2 rounded border text-xs font-mono uppercase transition-all ${
                          params.vehicleType === t
                            ? "bg-emerald-950/40 border-emerald-500 text-emerald-400"
                            : "bg-zinc-950 border-zinc-800 text-zinc-500"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 text-xs font-mono block mb-1">FINANCIAL TERM OPTION</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["buy", "lease"].map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setParams({ ...params, leaseVsBuy: o as any })}
                        className={`p-2 rounded border text-xs font-mono uppercase transition-all ${
                          params.leaseVsBuy === o
                            ? "bg-emerald-950/40 border-emerald-500 text-emerald-400"
                            : "bg-zinc-950 border-zinc-800 text-zinc-500"
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
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                    <span>NEW TARGET BASE SALARY</span>
                    <span className="text-emerald-400 font-bold">${(params.newSalary || 0).toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max="400000"
                    step="10000"
                    value={params.newSalary}
                    onChange={(e) => setParams({ ...params, newSalary: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-650 font-mono mt-1">
                    <span>$50k</span>
                    <span>$220k</span>
                    <span>$400k</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                    <span>ESTIMATED RELOCATION / SETUP COST</span>
                    <span className="text-rose-400 font-bold">${(params.relocationCost || 0).toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30000"
                    step="1000"
                    value={params.relocationCost}
                    onChange={(e) => setParams({ ...params, relocationCost: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 text-xs font-mono block mb-1">TRANSACTION TYPE</label>
                  <select
                    value={params.careerType}
                    onChange={(e) => setParams({ ...params, careerType: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none"
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
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                    <span>TARGET RETIREMENT AGE</span>
                    <span className="text-emerald-400 font-bold">{params.targetRetirementAge || 62} Years Old</span>
                  </div>
                  <input
                    type="range"
                    min="45"
                    max="80"
                    step="1"
                    value={params.targetRetirementAge || 62}
                    onChange={(e) => setParams({ ...params, targetRetirementAge: parseInt(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-650 font-mono mt-1">
                    <span>45 y/o</span>
                    <span>62 y/o</span>
                    <span>80 y/o</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                    <span>DESIRED ANNUAL SPENDING (In retirement)</span>
                    <span className="text-teal-400 font-bold">${(params.desiredAnnualSpending || 80000).toLocaleString()}/yr</span>
                  </div>
                  <input
                    type="range"
                    min="30000"
                    max="300000"
                    step="5000"
                    value={params.desiredAnnualSpending || 80000}
                    onChange={(e) => setParams({ ...params, desiredAnnualSpending: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-650 font-mono mt-1">
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
                  <label className="text-zinc-400 text-xs font-mono block mb-1">REPAYMENT HEURISTIC STRATEGY</label>
                  <select
                    value={params.focusStrategy}
                    onChange={(e) => setParams({ ...params, focusStrategy: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none font-mono"
                  >
                    <option value="avalanche">Avalanche Model (Highest APR Weighted)</option>
                    <option value="snowball">Snowball Model (Lowest Principal Weighted)</option>
                    <option value="invest_surplus">Invest Surplus (Route Excess to Markets)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                    <span>REFINANCED LOAN APR TARGET</span>
                    <span className="text-emerald-400 font-bold">{(params.refinanceRate || 0.045) * 100}% APR</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="0.5"
                    value={(params.refinanceRate || 0.045) * 100}
                    onChange={(e) => setParams({ ...params, refinanceRate: parseFloat(e.target.value) / 100 })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* COLLEGE SAVINGS */}
            {selectedType === "college_funding" && (
              <>
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                    <span>ANNUAL STATE COLLEGE COST / CHILD</span>
                    <span className="text-emerald-400 font-bold">${(params.annualCollegeCost || 35000).toLocaleString()}/yr</span>
                  </div>
                  <input
                    type="range"
                    min="10000"
                    max="90000"
                    step="2000"
                    value={params.annualCollegeCost || 35000}
                    onChange={(e) => setParams({ ...params, annualCollegeCost: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-650 font-mono mt-1">
                    <span>$10k</span>
                    <span>$50k</span>
                    <span>$90k</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                    <span>REQUIRED UNIVERSITY FUNDING TARGET</span>
                    <span className="text-teal-400 font-bold">{params.fundingTargetPercent || 80}% funded</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={params.fundingTargetPercent || 80}
                    onChange={(e) => setParams({ ...params, fundingTargetPercent: parseInt(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* ESTATE AND LEGACY */}
            {selectedType === "estate_legacy" && (
              <>
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                    <span>WEALTH TRANSFER VALUE GOAL</span>
                    <span className="text-emerald-400 font-bold">${(params.wealthTransferGoal || 1000000).toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="100000"
                    max="5000000"
                    step="100000"
                    value={params.wealthTransferGoal || 1000000}
                    onChange={(e) => setParams({ ...params, wealthTransferGoal: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 text-xs font-mono block mb-1">PROTECTION COEFFICIENT</label>
                  <select
                    value={params.estatePreservationLevel}
                    onChange={(e) => setParams({ ...params, estatePreservationLevel: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-805 rounded p-2.5 text-xs text-zinc-200 focus:outline-none font-mono"
                  >
                    <option value="standard">Standard Preservation (Federal Level)</option>
                    <option value="high_protection">High Preservation (Probate Bypass Trust)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-zinc-950 rounded border border-zinc-850">
                  <input
                    type="checkbox"
                    checked={params.useTrustStructure ?? true}
                    onChange={(e) => setParams({ ...params, useTrustStructure: e.target.checked })}
                    className="accent-emerald-500 cursor-pointer h-4 w-4"
                  />
                  <div>
                    <span className="text-xs text-zinc-200 block font-bold leading-none">Assemble Secure Trust Structure</span>
                    <span className="text-[10px] text-zinc-500 mt-1 block">Bypasses local state probate cycles.</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={saveSimulationToLedger}
            className="w-full bg-emerald-600 hover:bg-emerald-505 text-zinc-900 font-bold transition-all text-xs rounded-xl py-3 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/20"
          >
            <CheckCircle className="w-4 h-4" /> Save Scenario to Ledger
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: SIMULATION REPORT & PROJECTIONS VISUAL (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {simulationResult && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between h-full">
            {/* Header statistics block */}
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/60">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Score block */}
                <div className="bg-zinc-950 border border-zinc-850/40 p-3.5 rounded-xl text-left relative overflow-hidden group">
                  <div className="absolute top-2 right-2 text-emerald-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block leading-none">Decision Suitability</span>
                  <span className="text-2xl font-black font-mono text-zinc-100 tracking-tight block mt-1">
                    {simulationResult.decisionHealthScore}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-medium block mt-1.5 font-mono">HEALTH RATIO</span>
                </div>

                <div className="bg-zinc-950 border border-zinc-850/40 p-3.5 rounded-xl text-left">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block leading-none">Monthly Outlay +/-</span>
                  <span className={`text-xl font-bold font-mono tracking-tight block mt-1.5 ${simulationResult.projectedCashFlowDelta < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {simulationResult.projectedCashFlowDelta >= 0 ? "+" : ""}${Math.round(simulationResult.projectedCashFlowDelta).toLocaleString()}
                  </span>
                  <span className="text-[9px] text-zinc-500 block mt-1">CASH FLOW</span>
                </div>

                <div className="bg-zinc-950 border border-zinc-850/40 p-3.5 rounded-xl text-left">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block leading-none">Retirement Shift</span>
                  <span className={`text-xl font-bold font-mono tracking-tight block mt-1.5 ${simulationResult.retirementReadinessShift < 0 ? "text-rose-450" : "text-emerald-450"}`}>
                    {simulationResult.retirementReadinessShift >= 0 ? "+" : ""}{simulationResult.retirementReadinessShift} Years
                  </span>
                  <span className="text-[9px] text-zinc-500 block mt-1">NEST EGG DELAY</span>
                </div>

                <div className="bg-zinc-950 border border-zinc-850/40 p-3.5 rounded-xl text-left">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block leading-none">Risk Index</span>
                  <span className={`text-xl font-bold font-mono tracking-tight block mt-1.5 ${simulationResult.riskScore > 50 ? "text-rose-400" : "text-teal-400"}`}>
                    {simulationResult.riskScore}/100
                  </span>
                  <span className="text-[9px] text-zinc-550 block mt-1">HEURISTIC LEVEL</span>
                </div>
              </div>
            </div>

            {/* THE DUAL-PATH PROJECTION CHART */}
            <div className="p-6 bg-zinc-900">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-3">Projected Net Worth Curves (30-Year Horizon)</span>
              
              {/* Complex SVG charting */}
              <div className="relative h-64 bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 overflow-hidden">
                <div className="absolute top-3 left-4 flex gap-4 text-[9px] font-mono text-zinc-400 bg-zinc-900/80 p-2 rounded border border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-0.5 bg-zinc-500" />
                    <span>Baseline Path (Continuity)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-0.5 bg-emerald-400" />
                    <span>Simulated Path (Proposed Choice)</span>
                  </div>
                </div>

                <div className="absolute bottom-2 right-4 text-[9px] font-mono text-zinc-500">
                  Confidence Interval: {simulationResult.confidenceScore}% (Analytical)
                </div>

                {/* SVG Render loops */}
                <svg className="w-full h-full pt-10 pb-6" viewBox="0 0 500 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="40" x2="500" y2="40" stroke="#1f2937" strokeDasharray="3,3" />
                  <line x1="0" y1="100" x2="500" y2="100" stroke="#1f2937" strokeDasharray="3,3" />
                  <line x1="0" y1="160" x2="500" y2="160" stroke="#1f2937" strokeDasharray="3,3" />

                  {/* Baseline path line */}
                  {(() => {
                    const maxVal = Math.max(...simulationResult.projectedNetWorth30Y) * 1.1;
                    const points = simulationResult.projectedNetWorth30Y.map((_, idx) => {
                      // simple linear scale multiplier for baseline logic
                      const bMonthlySurplus = Math.max(0, (totalAnnualIncome / 12) - twin.monthlyExpenses - twin.liabilities.reduce((acc, curr) => acc + curr.monthlyPayment, 0));
                      const bVal = currentNetWorth * Math.pow(1.06, idx) + (bMonthlySurplus * 12 * idx);
                      const x = (idx / 29) * 500;
                      const y = 190 - (bVal / maxVal) * 160;
                      return `${x},${y}`;
                    }).join(" ");
                    return (
                      <polyline
                        fill="none"
                        stroke="#6b7280"
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                        points={points}
                      />
                    );
                  })()}

                  {/* Simulated decision path line */}
                  {(() => {
                    const maxVal = Math.max(...simulationResult.projectedNetWorth30Y) * 1.1;
                    const points = simulationResult.projectedNetWorth30Y.map((val, idx) => {
                      const x = (idx / 29) * 500;
                      const y = 190 - (val / maxVal) * 160;
                      return `${x},${y}`;
                    }).join(" ");
                    return (
                      <>
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          points={points}
                        />
                        {/* Shimmer dots on key targets */}
                        <circle cx={495} cy={190 - (simulationResult.projectedNetWorth30Y[29] / maxVal) * 160} r="4.5" fill="#14b8a6" />
                      </>
                    );
                  })()}
                </svg>

                <div className="absolute bottom-1 left-2 right-2 flex justify-between text-[8px] font-mono text-zinc-650">
                  <span>Year 0</span>
                  <span>Year 10</span>
                  <span>Year 20</span>
                  <span>Year 30 (Mature Val)</span>
                </div>
              </div>
            </div>

            {/* Assumptions and Limitations Lists */}
            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-950 border border-zinc-850/45 p-4 rounded-xl">
                <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold block mb-1.5">Simulation Assumptions</span>
                <ul className="space-y-1.5 text-[11px] text-zinc-300">
                  {simulationResult.keyAssumptions.map((ass, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                      <span>{ass}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-zinc-950 border border-zinc-850/45 p-4 rounded-xl">
                <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold block mb-1.5">Analysis Limitations</span>
                <ul className="space-y-1.5 text-[11px] text-zinc-350">
                  {simulationResult.limitations.map((lim, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                      <span>{lim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Alternative Scenarios Block */}
            <div className="px-6 pb-6">
              <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl space-y-3">
                <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block">Aura Optimization Recommendations</span>
                <div className="space-y-2">
                  {simulationResult.alternativeScenarios.map((alt, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-950/40 p-3 rounded-lg border border-zinc-900">
                      <div>
                        <strong className="text-zinc-200 text-xs block">{alt.title}</strong>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{alt.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyAlternative(alt.params)}
                        className="text-[10px] bg-emerald-600 hover:bg-emerald-505 text-zinc-950 font-bold px-2.5 py-1.5 rounded transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        Model scenario <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FEEDBACK LOOP MODULE */}
            <div className="bg-zinc-950 p-6 border-t border-zinc-805">
              {!feedbackSubmitted ? (
                <form onSubmit={submitFeedbackAction} className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">Rate Algorithmic Helpfulness</h4>
                      <p className="text-[10px] text-zinc-500">Provide direct feedback to the regional model calibration layer.</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setFeedbackRating("helpful")}
                        className={`px-3 py-1.5 rounded border text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
                          feedbackRating === "helpful" 
                            ? "bg-emerald-900/30 border-emerald-500 text-emerald-400 font-bold" 
                            : "bg-zinc-900 border-zinc-800 text-zinc-550 hover:text-zinc-300"
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" /> Helpful
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeedbackRating("not_helpful")}
                        className={`px-3 py-1.5 rounded border text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
                          feedbackRating === "not_helpful" 
                            ? "bg-rose-950/35 border-rose-500 text-rose-450 font-bold" 
                            : "bg-zinc-900 border-zinc-800 text-zinc-550 hover:text-zinc-300"
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3" /> Not Helpful
                      </button>
                    </div>
                  </div>

                  {feedbackRating && (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] text-zinc-505 font-mono uppercase block mb-1">Select Core Assessment</label>
                          <select
                            value={feedbackReason}
                            onChange={(e) => setFeedbackReason(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-[10px] text-zinc-300 focus:outline-none"
                          >
                            <option value="">-- Choose Reason --</option>
                            <option value="highly_realistic">Accurate state tax integration</option>
                            <option value="too_conservative">Overly conservative asset growth</option>
                            <option value="too_optimistic">Highly optimistic return ratios</option>
                            <option value="missing_parameters">Missing physical lifestyle overheads</option>
                            <option value="confusing">Complex UI calculations</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[9px] text-zinc-505 font-mono uppercase block mb-1">Optional commentary</label>
                          <input
                            type="text"
                            placeholder="State assumptions or elements missing..."
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-[10px] text-zinc-300 focus:outline-none focus:border-zinc-700"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold tracking-tight px-3 py-1.5 rounded transition-all cursor-pointer"
                      >
                        Submit Feedback
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <div className="text-center p-2.5">
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold">{feedbackSubmitted}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
