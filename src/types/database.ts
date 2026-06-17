/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserIdentity {
  id: string; // UUID
  auth_user_id: string; // UUID
  first_name: string; // Encrypted in database, decrypted at service level
  last_name: string; // Encrypted in database, decrypted at service level
  email: string; // Encrypted in database, decrypted at service level
  phone?: string; // Optional, encrypted in database
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string; // UUID
  auth_user_id: string; // UUID
  display_name: string;
  state: string;
  country: string;
  currency: string;
  risk_preference: "conservative" | "moderate" | "aggressive";
  retirement_target_age: number;
  created_at: string;
  updated_at: string;
}

export interface FinancialTwin {
  id: string; // UUID
  profile_id: string; // UUID
  net_worth: number;
  monthly_income: number;
  monthly_expenses: number;
  financial_readiness_score: number; // 0 to 100
  plan_health: number; // 0 to 100
  profile_completeness: number; // 0 to 100
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string; // UUID
  profile_id: string; // UUID
  asset_type: "cash" | "retirement" | "brokerage" | "real_estate" | "other";
  asset_name: string;
  current_value: number;
  growth_rate: number; // float (e.g. 0.07)
  created_at: string;
}

export interface Liability {
  id: string; // UUID
  profile_id: string; // UUID
  liability_type: "mortgage" | "student_loan" | "auto_loan" | "credit_card" | "other";
  liability_name: string;
  current_balance: number;
  interest_rate: number; // float (e.g. 0.052)
  monthly_payment: number;
  created_at: string;
}

export interface Goal {
  id: string; // UUID
  profile_id: string; // UUID
  goal_type: string;
  goal_name: string;
  target_amount: number;
  target_date: string; // ISO string or simple date string
  current_progress: number;
  status: "active" | "achieved" | "deferred";
  created_at: string;
}

export interface StateAssumption {
  id: string; // UUID
  state_code: string; // varchar(2), e.g. "CA"
  state_name: string;
  effective_tax_rate: number; // e.g. 0.08
  property_tax_rate: number; // e.g. 0.0125
  cost_of_living_index: number; // e.g. 1.15
  appreciation_rate: number; // e.g. 0.035
  retirement_factor: number; // e.g. 1.0
  updated_at: string;
}

export interface UserRole {
  id: string; // UUID
  auth_user_id: string; // UUID
  role: "customer" | "auditor" | "governance_admin" | "super_admin";
  created_at: string;
}
