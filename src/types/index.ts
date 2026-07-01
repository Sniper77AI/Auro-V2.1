/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// General Types for Financial Twin
export interface IncomeSource {
  id: string;
  name: string;
  amount: number; // annual
  frequency: "annual" | "monthly";
  type: "salary" | "bonus" | "investment" | "business" | "other";
}

export interface AssetItem {
  id: string;
  name: string;
  amount: number;
  type: "cash" | "retirement" | "brokerage" | "real_estate" | "other";
  annualGrowth: number; // multiplier i.e. 0.07 for 7%
}

export interface LiabilityItem {
  id: string;
  name: string;
  amount: number; // outstanding balance
  interestRate: number; // i.e. 0.05 for 5%
  monthlyPayment: number;
  type: "mortgage" | "student_loan" | "auto_loan" | "credit_card" | "other";
}

export interface FinancialTwin {
  age: number;
  monthlyExpenses: number;
  dependants: number;
  retirementAge: number;
  riskTolerance: "conservative" | "moderate" | "aggressive";
  taxState: string;
  country: string;
  incomes: IncomeSource[];
  assets: AssetItem[];
  liabilities: LiabilityItem[];
}

// Simulation Definitions
export type SimulationType =
  | "home_purchase"
  | "vehicle_purchase"
  | "career_change"
  | "retirement_planning"
  | "debt_optimization"
  | "college_funding"
  | "estate_legacy";

export interface SimulationParams {
  // Home purchase
  homePrice?: number;
  downPayment?: number;
  interestRate?: number;
  rentVsBuy?: "rent" | "buy";
  
  // Vehicle purchase
  vehiclePrice?: number;
  autoDownPayment?: number;
  vehicleType?: "gas" | "ev" | "hybrid";
  leaseVsBuy?: "lease" | "buy";
  condition?: "new" | "used";
  loanTermMonths?: number;

  // Career change
  newSalary?: number;
  relocationCost?: number;
  startupEquity?: number;
  startupSuccessProb?: number; // 0 to 1
  careerType?: "job_change" | "start_business";

  // Retirement planning
  targetRetirementAge?: number;
  desiredAnnualSpending?: number;

  // Debt Optimization
  focusStrategy?: "snowball" | "avalanche" | "invest_surplus" | "refinance";
  refinanceRate?: number;

  // College Funding
  childrenAges?: number[];
  annualCollegeCost?: number;
  fundingTargetPercent?: number;

  // Estate Legacy
  estatePreservationLevel?: "standard" | "high_protection";
  wealthTransferGoal?: number;
  useTrustStructure?: boolean;
}

export interface SimulationResult {
  id: string;
  type: SimulationType;
  timestamp: string;
  params: SimulationParams;
  projectedNetWorth30Y: number[]; // 30 annual coordinates
  projectedCashFlowDelta: number; // monthly cash flow impact (+ or -)
  lifetimeWealthImpact?: number; // cumulative net worth difference at 30Y
  aggressiveAssumptions?: boolean; // detected unrealistic/aggressive variables
  retirementReadinessShift: number; // change in retirement track in years (e.g. -3 means delays retirement by 3 years, +2 means ready 2 years earlier)
  decisionHealthScore: number; // 0 to 100 representing suitability
  riskScore: number; // 0 to 100
  confidenceScore: number; // 0 to 100
  keyAssumptions: string[];
  limitations: string[];
  alternativeScenarios: Array<{
    title: string;
    description: string;
    params: Partial<SimulationParams>;
  }>;
}

// Governance and Feedback Tracking
export interface GovernanceEvent {
  id: string;
  timestamp: string;
  type: "bias_flag" | "override_rate" | "dispute_filed" | "audit_exception" | "model_recalibration";
  severity: "low" | "medium" | "high";
  message: string;
  status: "active" | "under_review" | "resolved";
}

export interface FeedbackItem {
  id: string;
  simulationId: string;
  simulationType: SimulationType;
  experienceRating: "helpful" | "not_helpful";
  reason: string;
  textFeedback: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  source: string;
  status: "success" | "warning" | "violation";
  description: string;
}

// Structural Document Types for Deliverables Explorer
export interface ProductDeliverable {
  id: string;
  title: string;
  category: "Strategy" | "Architecture" | "governance" | "Simulation" | "Operations";
  description: string;
  icon: string;
  sections: Array<{
    title: string;
    content: string;
    bullets?: string[];
  }>;
}

export interface StateAssumption {
  state_code: string;
  state_name?: string;
  effective_tax_rate: number;
  property_tax_rate: number;
  cost_of_living_index: number;
  appreciation_rate: number;
}

