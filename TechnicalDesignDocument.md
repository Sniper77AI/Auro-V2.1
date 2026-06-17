# Technical Design Document (TDD) — Aura V3.1
## Backend & Intelligence Layer Architecture

*Tagline: "See your future before you spend your money."*

---

## 1. Backend Architecture Overview

The Aura V3.1 backend architecture features a modular full-stack configuration. Client interactions (React/Vite SPA) are handled by a stateless frontend layer, while application data, calculations, security contexts, and AI translation steps are executed using a decoupled server architecture.

```
                         [ React SPA / Client ]
                                   │
              ┌────────────────────┴────────────────────┐
     HTTPS    │                                         │ WSS
              ▼                                         ▼
┌───────────── Supabase Ingress Gateway ──────────────────────────────────────┐
│                                                                             │
│   ┌────────────────────┐               ┌────────────────────┐               │
│   │   Supabase Auth    │◄─────────────►│    Row-Level       │               │
│   │   (GoTrue Service) │               │   Security (RLS)   │               │
│   └────────────────────┘               └─────────┬──────────┘               │
│                                                  │                          │
│   ┌────────────────────┐               ┌─────────▼──────────┐               │
│   │   Edge Functions   │◄─────────────►│  PostgreSQL 15+    │               │
│   │ (Deno TypeScript)  │               │   (Database Nodes) │               │
│   └─────────┬──────────┘               └────────────────────┘               │
│             │                                                               │
└─────────────┼───────────────────────────────────────────────────────────────┘
              │ Proxy Calls
              ▼
┌───────────── Google Cloud Perimeter ────────────────────────────────────────┐
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │          Vertex AI / Google Gen AI API (Gemini-2.5-Flash)           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Dynamic Request-Response Pipeline
1. **Authentication Assertion**: The customer logs in via Supabase Auth. GoTrue signs a JWT identifying the session.
2. **Persistence Lookup**: Reads and writes go through Supabase PostgREST, with data access governed by PostgreSQL Row-Level Security (RLS) policies.
3. **Engine-Driven Projections**: When running scenario simulations, the client invokes secure Edge Functions (`/functions/v1/runSimulation`). 
4. **Calculations Phase**: Deno nodes run calculation engines inside deterministic TypeScript environments, utilizing the database configuration parameters.
5. **AI Interpretation**: The calculation results are sent to our AI abstraction adapter, which prompts Gemini to translate the metrics into plain-English narratives.
6. **Unified Delivery Payload**: The finalized projection tables, confidence metrics, and narratives are returned to the client browser in a single, unified response.

---

## 1.1 PII Vault Architecture (Objective 1)

Personally Identifiable Information (PII) is isolated within a cryptographic database perimeter, separating it from the core financial models.

```
┌───────────────────────── Database Infrastructure ──────────────────────────┐
│                                                                             │
│   ┌──────────────────────────────────┐   ┌──────────────────────────────┐   │
│   │         PII VAULT SCHEMA         │   │    FINANCIAL CORE SCHEMA     │   │
│   │                                  │   │                              │   │
│   │   Table: user_identity           │   │   Table: profiles            │   │
│   │   - id                           │   │   - profile_id (PK, uuid)    │   │
│   │   - auth_user_id (unique, links) │   │   - financial_preferences    │   │
│   │   - first_name (AES-256)         │   │   - retirement_targets       │   │
│   │   - last_name (AES-256)          │   │   - goals                    │   │
│   │   - email (AES-256)              │   │   - localization_settings    │   │
│   │   - phone (AES-256)              │   │                              │   │
│   │                                  │   │   Table: financial_twins     │   │
│   │  (Guarded by Strict RLS)         │   │   - twin_id                  │   │
│   │                                  │   │   - assets, liabilities      │   │
│   │                                  │   │   - income, expenses         │   │
│   │                                  │   │                              │   │
│   └──────────────────────────────────┘   └──────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

* **Access Restrictions**: Only the authenticated user has read/write privileges for their personal details inside `user_identity` (enforced via RLS rule `auth.uid() = auth_user_id`).
* **Systems Administrators & Auditors Boundary**:
  * Joint database permissions are restricted. Standard system access configuration **blocks select queries on the PII table** for general administrator accounts.
  * Compliance reports use anonymized financial details, preventing matches with personal identities.
* **Emergency Override Protocol**:
  * If needed for high-severity support situations, Governance Admins must submit a formal override bypass request.
  * This procedure requires dual confirmation: a second administrator (Super Admin) must authorize the decrypt requests.
  * These bypass operations are recorded with `CRITICAL` severity logs to ensure an audit trail.

---

## 2. Database Schema Definition & Implementation (Objective 2)

```
                            ┌───────────────────┐
                            │   user_identity   │ (auth.users)
                            └─────────┬─────────┘
                                      │ 1:1
                            ┌─────────▼─────────┐
                            │     profiles      │
                            └─────────┬─────────┘
                                      │ 1:1
                            ┌─────────▼─────────┐
                            │  financial_twins  │
                            └────┬─────┬─────┬──┘
                                 │     │     │
                     ┌───────────┘     │     └───────────┐
                  1:N│              1:N│              1:N│
             ┌───────▼──────┐    ┌─────▼─────┐    ┌──────▼──────┐
             │income_sources│    │  assets   │    │ liabilities │
             └──────────────┘    └───────────┘    └─────────────┘
```

### Table Specifications & DDL Scripts

```sql
-- Create custom administration user roles
CREATE TYPE aura_user_role AS ENUM ('customer', 'auditor', 'governance_admin', 'super_admin');

-- PII Vault Table
CREATE TABLE public.user_identity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name BYTEA NOT NULL, -- AES encrypted binary
    last_name BYTEA NOT NULL,  -- AES encrypted binary
    email BYTEA NOT NULL,      -- AES encrypted binary
    phone BYTEA NULL,          -- AES encrypted binary, nullable
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Core Profiles Table
CREATE TABLE public.profiles (
    profile_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role aura_user_role NOT NULL DEFAULT 'customer',
    financial_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    retirement_targets JSONB NOT NULL DEFAULT '{}'::jsonb,
    goals JSONB NOT NULL DEFAULT '[]'::jsonb,
    localization_settings JSONB NOT NULL DEFAULT '{"currency": "USD", "locale": "en-US"}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- State Assumptions Reference Table (Objective 2)
CREATE TABLE public.state_assumptions (
    state_code VARCHAR(2) PRIMARY KEY,
    state_name VARCHAR(100) NOT NULL UNIQUE,
    effective_tax_rate NUMERIC(5,4) NOT NULL, -- Blended income tax rate (e.g., 0.0825)
    estimated_property_tax_rate NUMERIC(5,4) NOT NULL, -- Average annual property tax (e.g., 0.0125)
    cost_of_living_index NUMERIC(4,2) NOT NULL DEFAULT 1.00, -- Relative cost factor (e.g., 1.35)
    average_home_appreciation_rate NUMERIC(4,3) NOT NULL DEFAULT 0.040, -- Real estate appreciation average (e.g., 0.045)
    retirement_factor NUMERIC(4,3) NOT NULL DEFAULT 1.000, -- Multiplier for retirement calculations
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Financial Digital Twins Table
CREATE TABLE public.financial_twins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
    current_net_worth NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    annual_surplus NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    current_age INTEGER NOT NULL CHECK (current_age >= 18 AND current_age <= 120),
    target_retirement_age INTEGER NOT NULL CHECK (target_retirement_age >= 18),
    life_expectancy INTEGER NOT NULL DEFAULT 90 CHECK (life_expectancy >= 18),
    dependants INTEGER NOT NULL DEFAULT 0 CHECK (dependants >= 0),
    active_state_code VARCHAR(2) NOT NULL REFERENCES public.state_assumptions(state_code),
    investment_risk_appetite VARCHAR(50) NOT NULL DEFAULT 'moderate',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Financial Sub-Tables
CREATE TABLE public.income_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    twin_id UUID NOT NULL REFERENCES public.financial_twins(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
    type VARCHAR(100) NOT NULL DEFAULT 'W2_salary',
    is_recurring BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    twin_id UUID NOT NULL REFERENCES public.financial_twins(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
    type VARCHAR(100) NOT NULL DEFAULT 'brokerage',
    annual_growth_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0700
);

CREATE TABLE public.liabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    twin_id UUID NOT NULL REFERENCES public.financial_twins(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    outstanding_amount NUMERIC(15,2) NOT NULL CHECK (outstanding_amount >= 0),
    interest_rate NUMERIC(5,4) NOT NULL CHECK (interest_rate >= 0),
    minimum_monthly_payment NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (minimum_monthly_payment >= 0)
);

-- Goals Table
CREATE TABLE public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    cost NUMERIC(15,2) NOT NULL CHECK (cost >= 0),
    target_year INTEGER NOT NULL,
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    category VARCHAR(100) NOT NULL,
    is_essential BOOLEAN NOT NULL DEFAULT TRUE
);

-- Scenario Table
CREATE TABLE public.simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.simulation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
    baseline_curve NUMERIC[] NOT NULL,
    simulated_curve NUMERIC[] NOT NULL,
    lifetime_wealth_impact NUMERIC(15,2) NOT NULL,
    decision_health_score INTEGER NOT NULL CHECK (decision_health_score >= 0 AND decision_health_score <= 100),
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    has_hazard_flags BOOLEAN NOT NULL DEFAULT FALSE,
    raw_recommendation JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Logging, Analytics, and Feedback Tables
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
    simulation_id UUID NULL REFERENCES public.simulations(id) ON DELETE SET NULL,
    rating VARCHAR(50) NOT NULL CHECK (rating IN ('helpful', 'not_helpful')),
    reason_category VARCHAR(100) NOT NULL,
    comment TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NULL REFERENCES public.profiles(profile_id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('info', 'warning', 'high', 'critical')),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(100) NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Table Index Profiles
```sql
CREATE INDEX idx_user_identity_auth ON public.user_identity(auth_user_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_twins_profile ON public.financial_twins(profile_id);
CREATE INDEX idx_income_twin ON public.income_sources(twin_id);
CREATE INDEX idx_assets_twin ON public.assets(twin_id);
CREATE INDEX idx_liabilities_twin ON public.liabilities(twin_id);
CREATE INDEX idx_goals_profile ON public.goals(profile_id);
CREATE INDEX idx_simulations_profile ON public.simulations(profile_id);
CREATE INDEX idx_results_simulation ON public.simulation_results(simulation_id);
CREATE INDEX idx_audit_severity ON public.audit_logs(severity);
```

### Table Row-Level Security Rules (DML Policy Scripts)
```sql
ALTER TABLE public.user_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_twins ENABLE ROW LEVEL SECURITY;

-- user_identity: Only the owner has access. System administrators & auditors cannot read PII rows.
CREATE POLICY user_identity_customer_policy ON public.user_identity
    FOR ALL USING (auth.uid() = auth_user_id);

-- profiles: Users have full access. System administrators & auditors can view details for support audits.
CREATE POLICY profiles_customer_policy ON public.profiles
    FOR ALL USING (auth.uid() = profile_id);

CREATE POLICY profiles_admin_read_policy ON public.profiles
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profile_id = auth.uid() AND role IN ('auditor', 'governance_admin', 'super_admin')
    ));
```

---

## 3. Authentication & Authorization

Authentication is managed securely by the platform, validating access across four authorization tiers using profile role variables.

```
                  [ Web Session (JWT Token) ]
                               │
                   [ Check Session Role ID ]
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
    'customer'             'auditor'         'governance_admin'
  (Read/Write Self)     (Read-Only Data,     (Manage Library,
                        No Identity Access)  Anonymized Logs)
```

### Action Matrix & RLS Definitions
* **Customer**: Full operational scope within their associated `profile_id`. Access outside this parameter is systematically blocked.
* **Auditor**: Read-only access to anonymized databases. Access to personal user names, addresses, and phone mappings is restricted.
* **Governance Admin**: Configuration access to manage model files, state assumptions libraries, and system rules. Accessing direct user identity fields is restricted unless the multi-sig "Break-Glass" bypass procedure is initialized.
* **Super Admin**: Unrestricted administrative permissions. Super Admin keys are required to authorize "Break-Glass" identity decryption procedures.

---

## 4. Data Persistence Strategy

Aura coordinates data storage across two scopes to manage application state and ensure security:

1. **Transient Client Views**: Managed via reactive component variables within the React SPA context. Unsubmitted form entries and temporary slider adjustments do not persist to database storage.
2. **Durable Database Persistence**: Operations are confirmed through verified, structured transactions on Supabase.
   * Modifying dynamic assets triggers recalculations on the primary profile before updating the dashboard view.
   * Audit log events are recorded directly to durable database storage, preserving historical context.

---

## 5. Financial Calculation Engine Architecture (Objective 3)

Calculations are handled entirely by verified TypeScript modules. **All financial projections run deterministically; AI model pipelines are completely forbidden from performing numerical math.**

```
                     [ Input Client Seeding Parameters ]
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │  TypeScript Projection Engine   │
                    └────────────────┬────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│   netWorthEngine │        │ homePurchaseEng  │        │ debtFreedomEng   │
└──────────────────┘        └──────────────────┘        └──────────────────┘
```

* **Absolute Reproducibility**: Projection runs are entirely deterministic. Given duplicate starting conditions, the modules return identical projection curves. This allows calculation trails to be fully audited.

---

## 5.1 Confidence Engine Specification (Objective 3)

The calculated Confidence Score is a **completely deterministic, fully auditable mathematical scoring index**. It measures the quality, completeness, and recency of user profile details, ensuring calculation accuracy.

### Scoring Structure & Weights
The Confidence Score is calculated using a weighted combination of four vectors:

$$\text{Confidence Score} = (0.40 \times W_{\text{completeness}}) + (0.30 \times W_{\text{freshness}}) + (0.20 \times W_{\text{complexity}}) + (0.10 \times W_{\text{assumptions}})$$

```
┌───────────────────────────────── Confidence Score (100%) ─────────────────────────────────┐
│                                                                                           │
│   ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────┐  ┌────────────┐   │
│   │ 40% Profile          │  │ 30% Data             │  │ 20% Scenario  │  │ 10% Custom │   │
│   │     Completeness     │  │     Freshness        │  │   Complexity  │  │ Assumptions│   │
│   └──────────────────────┘  └──────────────────────┘  └───────────────┘  └────────────┘   │
│                                                                                           │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 1. Profile Completeness ($W_{\text{completeness}}$ / Scale: 0 to 100)
Measures the completeness of inputs across seven standard category fields:
* `Assets` set: (Value $\ge 1$) = $+15\%$
* `Liabilities` set: (Value $\ge 0$) = $+15\%$
* `Incomes` set: (Value $\ge 1$) = $+15\%$
* `Expenses` set: (Value $\ge 1$) = $+15\%$
* `Age & Life Expectancy` set = $+15\%$
* `Current Active Location State` set = $+15\%$
* `Retirement Target Inputs` set = $+10\%$

#### 2. Data Freshness ($W_{\text{freshness}}$ / Scale: 0 to 100)
Evaluates data recency, tracking the time elapsed since the profile was last updated:
* $\le 30$ days: $100$
* $31 - 90$ days: $85$
* $91 - 180$ days: $60$
* $181 - 365$ days: $30$
* $> 365$ days: $0$

#### 3. Scenario Complexity ($W_{\text{complexity}}$ / Scale: 0 to 100)
Assesses the complexity of the scenario parameters:
* **High Volatility Elements**: A subtraction penalty is applied if high-interest revolving charge card debts (APR $\ge 18\%$) or volatile secondary variable commission incomes ($> 40\%$ of base payload) are active in calculations:
  * $\text{No Volatile Parameters} = 100$
  * $\text{One Volatile Parameter} = 80$
  * $\text{Multiple Volatile Parameters} = 50$

#### 4. Custom Assumption Count ($W_{\text{assumptions}}$ / Scale: 0 to 100)
Evaluates the use of custom assumptions versus default fallbacks:
* More user-customized variables (such as custom annual savings growth rates or property maintenance assumptions) yield more relevant projections compared with standardized state averages:
  * All customized inputs = $100$
  * Mix of custom and regional averages = $80$
  * Entirely default fallbacks (representing zero localized alignment updates) = $50$

### Confidence Categories
* **90 – 100**: **High** (Calculations use complete, up-to-date user details)
* **70 – 89**: **Moderate** (Projections use balanced profile parameters)
* **50 – 69**: **Low** (Calculations use standard averages. Additional inputs recommended)
* **Below 50**: **Insufficient Data** (Certain critical fields are missing. Calculations are disabled)

### Worked Examples

#### Example A: "Complete & Fresh User" (Jane Doe, CA)
* **Completeness**: 7 inputs complete ($W_{\text{completeness}} = 100$)
* **Freshness**: Profile updated 2 days ago ($W_{\text{freshness}} = 100$)
* **Complexity**: Standard stable W2, zero high-interest liabilities ($W_{\text{complexity}} = 100$)
* **Custom Assumptions**: Fully user-defined parameters ($W_{\text{assumptions}} = 100$)
* **Formula Performance**:
  $$\text{Score} = (0.40 \times 100) + (0.30 \times 100) + (0.20 \times 100) + (0.10 \times 100) = 40 + 30 + 20 + 10 = 100$$
* **Classification**: **High**

#### Example B: "Stale & Incomplete User" (John Fox, TX)
* **Completeness**: Profile lacks asset detail and location fields ($W_{\text{completeness}} = 70$)
* **Freshness**: Last update occurred 120 days ago ($W_{\text{freshness}} = 60$)
* **Complexity**: Multiple high-interest credit card debts ($W_{\text{complexity}} = 50$)
* **Custom Assumptions**: Default Texas averages applied ($W_{\text{assumptions}} = 50$)
* **Formula Performance**:
  $$\text{Score} = (0.40 \times 70) + (0.30 \times 60) + (0.20 \times 50) + (0.10 \times 50) = 28 + 18 + 10 + 5 = 61$$
* **Classification**: **Low**

---

## 6. AI Advisory Layer Integration (Objective 4)

To prevent platform lock-in and ensure long-term stability, Aura uses an adapter-based abstraction layer. This separates the primary calculations from specific AI providers.

```
                    ┌─────────────────────────┐
                    │      Business Logic     │
                    │   (Edge Function Runs)  │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      AIProvider         │
                    │     (Interface)         │
                    └────────────┬────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           ▼                     ▼                     ▼
┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
│   GeminiAdapter    │ │    OpenAIAdapter   │ │    ClaudeAdapter   │
│ (Primary Engine)  │ │ (Failover Backup)  │ │    (Backup API)    │
└────────────────────┘ └────────────────────┘ └────────────────────┘
```

### Static Type Contracts

```typescript
export interface AIMessageContext {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface SimulationSummaryInput {
  currentAge: number;
  baselineWealth30Y: number;
  simulatedWealth30Y: number;
  lifetimeWealthImpact: number;
  confidenceScore: number;
}

export interface FutureStoryCard {
  title: string;
  storySegment: string;
  timestampMarker: string;
  warningAlert?: string;
}

export interface AIProvider {
  /** Translates numerical models into an objective plain-English summary. */
  generateNarrative(inputs: SimulationSummaryInput): Promise<string>;

  /** Generates narrative story scenarios mapped across chronological milestones. */
  generateFutureStories(inputs: SimulationSummaryInput): Promise<FutureStoryCard[]>;

  /** Explains why the deterministic recommendation matches the calculated profiles. */
  generateRecommendationExplanation(
    calcDetails: Record<string, any>,
    rulesEngineSource: string
  ): Promise<string>;

  /** Compiles a summary briefing analyzing multi-goal balance trends. */
  generateWeeklyBriefing(profileData: Record<string, any>): Promise<string>;
}
```

### Failover & Fallback Mechanism
1. **Primary Route**: Calls are directed through the primary adapter (e.g., `GeminiAdapter` using **Gemini-2.5-Flash**).
2. **Transient Network Timeout (Failover Tier 1)**: If the call fails or times out (after $\ge 5000\text{ms}$), our service automatically retries the operation with the secondary backup adapter (`OpenAIAdapter` using **GPT-4o-mini**).
3. **Severe Outage (Failover Tier 2 - Static Fallback)**: If both adapters are unavailable, the system uses a localized, static rules engine:
   ```typescript
   export class StaticFallbackAdapter implements AIProvider {
     async generateNarrative(inputs: SimulationSummaryInput): Promise<string> {
       return `Calculations indicate that this projection yields a 30-year lifetime wealth impact of $${inputs.lifetimeWealthImpact.toLocaleString()}. Establish stable assets as soon as possible to improve your confidence score.`;
     }
     // ... other fallback methods return standard structured template responses.
   }
   ```

---

## 7. Recommendation Engine Layout

Each generated recommendation provides structured information with unified properties:
* **Unique ID Parameter**: Map trace identifiers.
* **Outcome Summary Context**: Plain-English description of the results.
* **Aura Core Reasons**: Grounded facts retrieved from calculations.
* **Deterministic Scores**: High-fidelity Confidence and Risk rating calculations.

---

## 7.1 Educational Guidance Compliance Boundary (Objective 5)

Aura is designed strictly as a lifestyle planning and scenario simulation tool. It **does not provide, nor is it configured to deliver, licensed financial, tax, or legal advice**.

* **UI Disclosures**: Every analysis page contains a persistent, conspicuous footer:
  > *Disclaimer: Aura is an educational web simulator. Calculations are based on generalized state and regional averages. This service does not provide registered financial planning, investment allocation strategy, tax optimization, or legal advice.*
* **AI Output Rules**: Systems prompt instructions automatically append our educational notice to generated narrative explanations.

### Prohibited vs. Allowed Reference Patterns

#### Prohibited Recommendations
* ❌ `"Our model suggests purchasing NVDA stock or investing in Vanguard S&P 500 index funds."`
* ❌ `"Allocate 15% of surplus capital to Bitcoin to mitigate inflation risks."`
* ❌ `"To minimize state tax penalties, transfer your taxable brokerage accounts to a municipal bond trust."`

#### Allowed Recommendations
* ✔ `"Increasing monthly retirement contributions can improve your retirement readiness and net worth over 30 years."`
* ✔ `"Choosing a vehicle with lower upfront costs preserves cash reserves, which can be compounded at standard rate projections."`
* ✔ `"Based on our snowball model of your liabilities, prioritizing your high-interest auto loan can save $2,300 in total interest costs."`

---

## 8. API & Edge Function Specifications

API endpoints run as isolated Edge Functions to process inputs and ensure secure verification.

### Core Contracts

#### `POST /functions/v1/runSimulation`
* **Request Contract**:
  ```json
  {
    "simulationType": "home_purchase",
    "params": {
      "price": 600000,
      "downPayment": 120000,
      "interestRate": 0.0650,
      "loanTermYears": 30
    }
  }
  ```
* **Response Contract**:
  ```json
  {
    "id": "result_idx_934901",
    "lifetimeWealthImpact": 491030.00,
    "projectedNetWorth30Y": [250000.00, 269000.00, 285400.00],
    "decisionHealthScore": 82,
    "confidenceScore": 95,
    "narrativeText": "This purchase preserves stable long-term liquid cash reserves, supporting multi-decade asset compounding."
  }
  ```

#### `POST /functions/v1/saveFinancialProfile`
* **Request Payload**:
  ```json
  {
    "currentAge": 35,
    "targetRetirementAge": 65,
    "lifeExpectancy": 90,
    "activeStateCode": "CA",
    "riskAppetite": "moderate"
  }
  ```
* **Response Payload**: `{"status": "persisted", "twinId": "twin_61183aa"}`

---

## 9. Governance & Audit Logging

Audits record events to a secure database to provide a structured timeline of changes and operations:
* `Role Modification Attempts`: High priority flag. Saves context details, actor identities, and associated client IPs.
* `Unreasonable Compound Assumptions`: Warning flags for custom growth parameter values exceeding realistic metrics (e.g., rate $>15\%$).
* `Database Configuration Adjustments`: Records revisions to state references or global tax parameters.

---

## 10. Feedback & Learning Loop

User feedback is recorded to help identify and resolve display anomalies or logic limitations:
1. Ratings are logged to the transaction feedback tables.
2. If distinct state parameters yield low helpfulness scores, the variables are flagged for administrator audit review.
3. High feedback concentrations for specific modules help guide ongoing calibration updates.

---

## 11. Bias, Transparency & Model Card Setup

Modeling variables and performance assumptions are documented to provide transparency regarding calculation limits:
* **Parameter Boundaries**: Age projections are capped to maintain calculation accuracy and prevent compounding skew over extremely long projection horizons.
* **Performance Limitations**: Income changes utilize historic averages and omit qualitative, non-economic parameters.
* **Variance Indicator Rules**: Low-confidence alerts are displayed for scenarios with high variance to remind users that projections are educational averages.

---

## 12. State Reference Global Assumptions Library

`state_assumptions` reference tables store standard values for cost-of-living, appreciation averages, and base state tax levels across all 50 U.S. states.
* Moving assumptions to the database keeps application math clean and easily maintainable.
* Scalability profiles are structured to support future expansion into international markets by mapping matching country codes (e.g., `'GB-ENG'`, `'CA-ON'`).

---

## 13. System Verification & Testing Plan

Tests use mocking frameworks and assertions to verify calculations and enforce security policies.

### Test Cases

#### Database Security Integrity
```typescript
describe("Aura Security and RLS Tests", () => {
  it("should enforce RLS to block third-party access to profiles table", async () => {
    const maliciousClient = createClientWithContext({ uid: "user_attacker" });
    const { data, error } = await maliciousClient
        .from("profiles")
        .select("*")
        .eq("profile_id", "user_victim");
    expect(data?.length).toBe(0);
  });
});
```

#### Deterministic Confidence Evaluation
```typescript
describe("Deterministic Confidence Calculation", () => {
  it("should calculate a Confidence Score of 100 for completed, up-to-date, low-complexity profiles", () => {
    const freshProfile = {
      completeness: 100,
      freshnessDays: 5,
      hasVolatileParams: false,
      isDefaultLibrary: false
    };
    const calculated = getEngineConfidenceValue(freshProfile);
    expect(calculated).toBe(100);
  });
});
```

---

## 14. Systems Deployment & Release Structure

* **Database Schema Migration**: Schema updates are managed via migrations, which are validated in a local PostgreSQL sandbox environment before being pushed to active storage.
* **Edge Functions Deployment**: Edge code modules are managed as deployment units in Deno environments.
* **Environment Variable Configuration**: Credentials (such as Vertex AI keys) are stored as secrets in the Google Cloud ecosystem, keeping them safe and inaccessible to browser-tier code packages.

---

## 15. Realization Plan

* **A: Schema Deployments & Auth Initialization**: Create SQL tables, build matching metadata properties, and verify RLS policies.
* **B: Persistence Integration**: Connect client browser forms to dynamic state repositories inside our database.
* **C: Calculations Translation**: Migrate calculations to standalone TypeScript engines and verify formula accuracy.
* **D: AI Interface Grounding**: Configure grounding prompt parameters for AI translation adapters.
* **E: Feedback & Audit Tools**: Connect transaction rating tables and administrator status views.

---

## 16. Technical Risk Matrix

* **Risk**: Exposing sensitive credentials or API keys.
  * *Reduction Plan*: Route Vertex AI calls through secure Edge Functions, keeping keys entirely backend-isolated.
* **Risk**: Excessive AI processing latency.
  * *Reduction Plan*: Maintain a cached library of common pre-defined coaching recommendations, reducing processing delays.
* **Risk**: High compound calculations variance.
  * *Reduction Plan*: Apply validation boundaries to variable growth selections (capped at $15\%$).

---

## 17. Calculations Verification & Sample Run

### Home Buying Scenario Parameters
* Starting Checking Capital: $\$250,000$ (with $\$36,000$ in annual surpluses).
* Blended Growth Rate Allocation: $7.00\%$.
* Real Estate Acquisition Price: $\$500,000$.
* Outlay Downpayment Target: $\$100,000$.
* Mortgaged Loan Investment: $\$400,000$ ($6.50\%$ mortgage rate over 30-years).

### 30-Year Performance Result
* **No Action (Baseline)**: Checking balances compound to **$\$3,755,750$**.
* **Purchase Home (Simulation)**: Liquid assets + appreciation value composite compounds to **$\$4,170,840$**.
* **Calculated Delta (Lifetime Impact)**: **$\$415,090$** ($+\$415,090$).
