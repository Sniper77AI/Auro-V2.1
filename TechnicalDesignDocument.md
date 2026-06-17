# Aura V3 — Technical Design Document (TDD)
## Backend & Intelligence Layer Architecture

*Tagline: "See your future before you spend your money."*

---

## 1. Backend Architecture Overview

The Aura V3 backend architecture is engineered around **Supabase (PostgreSQL + PostgREST)**, utilizing a secure, decoupled full-stack architecture design. This architecture separates interactive client views (Vite/React SPA) from deterministic financial engines and stateful orchestration loops, preventing any client-side exposure of security models, API credentials, or unvetted AI queries.

```
       [ Client Browser (React SPA) ]
                     │  ▲
        HTTPS/WSS    │  │ PostgREST / JSON RPC
                     ▼  │
┌──────────────────── Supabase Ingress Gateway ──────────────┐
│                                                            │
│  ┌───────────────────┐               ┌──────────────────┐  │
│  │   Supabase Auth   │◄─────────────►│ Row-Level        │  │
│  │ (GoTrue JWT Auth) │               │ Security (RLS)   │  │
│  └───────────────────┘               └────────┬─────────┘  │
│                                               │            │
│  ┌───────────────────┐               ┌────────▼─────────┐  │
│  │   Edge Functions  │◄─────────────►│    PostgreSQL    │  │
│  │  (TypeScript/Deno)│  Reads Schema │ (Database State) │  │
│  └─────────┬─────────┘               └──────────────────┘  │
│            │                                               │
└────────────┼───────────────────────────────────────────────┘
             │ Proxy Secure Calls
             ▼
 ┌─────────────────────── Cloud / Intelligence Ingress ──────┐
 │                                                           │
 │  ┌─────────────────────────────────────────────────────┐  │
 │  │        Vertex AI / Google Gen AI API Proxy          │  │
 │  │     (Gemini-2.5-Flash / Gemini-2.5-Pro Engine)      │  │
 │  └─────────────────────────────────────────────────────┘  │
 │                                                           │
 └───────────────────────────────────────────────────────────┘
```

### Components:
1. **Client Tier**: Fully stateless React Single-Page Application (SPA) served via static hosting CDN (Cloud Run Web Container). All structural routing is client-side.
2. **Auth & Gateway Tier (GoTrue)**: Supabase Auth issues cryptographically signed JSON Web Tokens (JWTs) containing the user’s Role, UID, and metadata.
3. **API & Data Tier**: Client queries are handled directly via **PostgREST** (Supabase Client) executing against the PostgreSQL schema, strictly guarded by PostgreSQL **Row-Level Security (RLS)**.
4. **Compute Tier (Supabase Edge Functions)**: Lightweight TypeScript sandboxes running on Deno. Ideal for processing incoming third-party webhooks, running the safe AI proxy layer, and executing multi-variable calculation runs.
5. **Database (PostgreSQL 15+)**: Serves as the single source of truth for structured profiles, historical simulations, log files, user roles, security audits, and global variables.
6. **AI Orchestration & Safe Grounding Layer**: Edge functions proxy and sanitize all structured Gemini requests. Zero raw user-input data propagates unmonitored; deterministic calculation outputs ground every single model prompt template.

---

## 2. Database Implementation Plan

The database schema is written in standard DDL for PostgreSQL and deployed inside Supabase under the `public` schema.

```
                  ┌──────────────┐
                  │    users     │ (auth.users)
                  └──────┬───────┘
                         │ 1:1
                  ┌──────▼───────┐
                  │   profiles   │
                  └──────┬───────┘
                         │ 1:1
              ┌──────────┴──────────┐
              │   financial_twins   │
              └──────┬───┬───┬──────┘
                     │   │   │
         ┌───────────┘   │   └───────────┐
      1:N│            1:N│            1:N│
┌────────▼─────────┐ ┌───▼───────┐ ┌─────▼───────┐
│  income_sources  │ │ liabilities│ │   assets    │
└──────────────────┘ └───────────┘ └─────────────┘
```

### Table Definitions & Policies

#### 2.1 Table: `profiles`
* **Purpose**: Coordinates user billing tiers, settings, metadata, and security roles mapping to Supabase Auth.
* **Key Columns**:
  * `id` (uuid, PK, References `auth.users`)
  * `email` (text)
  * `role` (text, default `'customer'`)
  * `created_at` (timestamptz)
  * `updated_at` (timestamptz)
* **RLS Policies**:
  * `Enable read for self`: `auth.uid() = id`
  * `Enable update for self`: `auth.uid() = id`
  * `Admin full bypass`: `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'governance_admin'))`
* **Indexes**: `CREATE INDEX idx_profiles_role ON profiles(role);`
* **Seed Data Requirements**: At least 1 Super Admin (`super_admin`), 1 Auditor (`auditor`), and 1 Governance Admin (`governance_admin`) credentials pre-configured for internal debugging.

#### 2.2 Table: `financial_twins`
* **Purpose**: Stores the core financial profile parameters acting as the dynamic baseline "digital twin".
* **Key Columns**:
  * `id` (uuid, PK, Default gen_random_uuid())
  * `profile_id` (uuid, FK, References `profiles(id)`, UNIQUE)
  * `current_net_worth` (numeric)
  * `annual_surplus` (numeric)
  * `target_retirement_age` (integer)
  * `current_age` (integer)
  * `life_expectancy` (integer, default `90`)
  * `dependants` (integer)
  * `location_state` (varchar(2))
  * `investment_risk_appetite` (text)
* **RLS Policies**:
  * `Read/Write policy`: `auth.uid() = profile_id`
* **Indexes**: `CREATE INDEX idx_twins_profile ON financial_twins(profile_id);`

#### 2.3 Tables: `income_sources`, `assets`, `liabilities`
* **Purpose**: Multi-row financial specifications linked to a user's core financial twin.
* **Key Columns**:
  * `id` (uuid, PK)
  * `twin_id` (uuid, FK, References `financial_twins(id)`)
  * `name` (text)
  * `amount` (numeric)
  * `type` (text) (e.g. `cash`, `brokerage`, `retirement`, `real_estate` for assets; `student`, `mortgage`, `car_loan`, `credit_card` for liabilities)
  * `annual_growth` / `annual_growth_rate` (numeric)
  * `original_principal` (numeric, null)
  * `monthly_payment` (numeric, null)
* **RLS Policies**:
  * `Access via Twin ID owner`: `EXISTS (SELECT 1 FROM financial_twins WHERE id = twin_id AND profile_id = auth.uid())`
* **Indexes**:
  * `CREATE INDEX idx_assets_twin ON assets(twin_id);`
  * `CREATE INDEX idx_liabilities_twin ON liabilities(twin_id);`

#### 2.4 Table: `goals`
* **Purpose**: Tracks milestones (e.g., college fund, home downpayment, sabbatical) mapped out by the user.
* **Key Columns**:
  * `id` (uuid, PK)
  * `profile_id` (uuid, FK, References `profiles(id)`)
  * `title` (text)
  * `cost` (numeric)
  * `target_year` (integer)
  * `priority` (text)
  * `category` (text)
  * `amount_funded` (numeric)
  * `is_essential` (boolean)
* **RLS Policies**:
  * `Direct owner update/read`: `auth.uid() = profile_id`

#### 2.5 Table: `simulations` & `simulation_results`
* **Purpose**: Records individual simulation parameters executed by users, pairing them with the resulting calculations.
* **Key Columns (`simulations`)**:
  * `id` (uuid, PK)
  * `profile_id` (uuid, FK)
  * `type` (text) (e.g., `'home_purchase'`, `'vehicle_purchase'`)
  * `parameters` (jsonb)
  * `created_at` (timestamptz)
* **Key Columns (`simulation_results`)**:
  * `id` (uuid, PK)
  * `simulation_id` (uuid, FK, References `simulations(id)`)
  * `baseline_curve` (numeric[])
  * `simulated_curve` (numeric[])
  * `lifetime_wealth_impact` (numeric)
  * `decision_health_score` (integer)
  * `risk_score` (integer)
  * `confidence_score` (integer)
  * `has_hazard_flags` (boolean)
  * `raw_recommendation` (jsonb)
* **RLS Policies**:
  * `Access by owner`: `auth.uid() = profile_id`

#### 2.6 Table: `feedback`
* **Purpose**: Holds user ratings of individual recommendations and simulations.
* **Key Columns**:
  * `id` (uuid, PK)
  * `profile_id` (uuid, FK)
  * `simulation_id` (uuid, FK, Nullable)
  * `rating` (text) (e.g. `'helpful'`, `'not_helpful'`)
  * `reason_category` (text)
  * `comment` (text)
* **RLS Policies**:
  * `Write by self`: `auth.uid() = profile_id`
  * `Read by Auditor / Admins`: `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('auditor', 'governance_admin', 'super_admin'))`

#### 2.7 Table: `governance_events` & `audit_logs`
* **Purpose**: System-wide security tracking for audit compliance.
* **Key Columns**:
  * `id` (uuid, PK)
  * `operator_id` (uuid, FK, References `profiles(id)`)
  * `event_type` (text) (e.g., `'ACCESS_DENIED'`, `'ROLE_CHANGE'`, `'HIGH_VARIANCE_SIMULATION'`)
  * `severity` (text) (e.g., `'info'`, `'warning'`, `'high'`, `'critical'`)
  * `details` (jsonb)
  * `ip_address` (text)
  * `timestamp` (timestamptz)
* **RLS Policies**:
  * `Insert`: Allowed anonymously or authenticated.
  * `Read/Select`: Only super_admin, auditor, or governance_admin role levels are permitted to read.
* **Indexes**: `CREATE INDEX idx_audit_severity ON audit_logs(severity);`

---

## 3. Authentication & Authorization

Standard JWT claims managed by Supabase Auth are mapped into user roles located in the `public.profiles` database. Every incoming HTTP session passes a cryptographically secure token checked against the database.

```
  [ Client JWT ] ────►  [ PostgREST/Postgres REST Gateway ]
                                  │
                                  ▼
                     [ Read signed JWT claims ]
                                  │
                        ┌─────────┴─────────┐
             Is Admin?  │                   │  Is Customer?
                        ▼                   ▼
           [ Read Audit Logs /      [ Strict Row-Level Security ]
             Modify Global System ]  `profile_id = auth.uid()`
```

### Role Matrices & Permissions
Aura divides authorization into four distinct access profiles:

| Role | Financial Sandbox | Simulation Engines | Feedback Metrics | Security Audit Logs | Global Assumptions Control |
|---|---|---|---|---|---|
| **Customer** | Complete Read/Write | Yes (Self Only) | Create Only | Denied | Read Only |
| **Auditor** | Read Only (De-identified) | No | View Full Metrics | Read Only | Read Only |
| **Governance Admin** | Read Only (De-identified)| No | Yes (Review Comments) | Complete Read/Write | Read Only |
| **Super Admin** | Complete Read/Write | Full Access | Complete Read/Write | Complete Read/Write | Complete Read/Write |

### Access Violation Flowchart
If a user attempts an unauthorized action:
1. Postgres triggers an RLS violation (returns `0` records or standard access permission errors).
2. The UI intercepts authorization errors, displaying a neutral security alert page and resetting the login token if necessary.
3. An entry is posted to the database within `/api/log-violation`:
   ```json
   {
     "id": "event_uuid",
     "operator_id": "current_authenticated_user_id",
     "event_type": "ACCESS_VIOLATION_ATTEMPT",
     "severity": "high",
     "details": {
       "route": "/admin/governance",
       "component": "GovernanceHub",
       "timestamp": "2026-06-16T18:17:42Z"
     }
   }
   ```
4. If a single account registers three high-severity audit logging exceptions in a 10-minute window, the account is temporarily suspended inside Supabase Auth, and the event level escalates to **Critical**.

---

## 4. Data Persistence Strategy

Aura's data persistence layer enforces clean separation between transient reactive client states and system-validated cloud persistence.

```
┌───────────────────────────────── Client Browser State ──────────┐
│                                                                 │
│   ┌────────────────────┐               ┌────────────────────┐   │
│   │  Active User Input │◄─────────────►│ Local React States │   │
│   │   (Slider, Forms)  │               │ (Uncommitted Drafts│   │
│   └────────────────────┘               └─────────┬──────────┘   │
│                                                  │              │
│                                                  ▼ Save Trigger │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │
                                                   ▼ REST API Payload
┌───────────────────────────────── Durable Cloud Storage ──────────┐
│                                                                 │
│   ┌────────────────────┐               ┌────────────────────┐   │
│   │    PostgreSQL DB   │◄─────────────►│ Database State DB  │   │
│   │ (Supabase Engine)  │               │   (Audit Tables)   │   │
│   └────────────────────┘               └────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Strategic Allocation of State
* **Transient React Component State**: Sliders moving on forms, temporary sandbox changes in Life Simulator before selecting "Calculate", draft profiles without saved changes, and interactive UI menu expansions.
* **Persisted in Database (Supabase Cloud)**: Active financial twins, custom milestones, historical running simulations, user feedback ratings, global assumptions database, dynamic settings parameters, security audit logs.

### Database Sync & Cache Invalidation
1. **Pessimistic Writes**: To avoid race-conditions with compound projections, updates to the active `financial_twins` object are validated on save, requiring database confirmation before updating the global application context state.
2. **Cascading Updates**: Editing income tables automatically updates the Twin’s calculated aggregate annual surplus, resetting matching calculations cache indices.
3. **Optimistic UI Transition**: On simple non-critical operations (such as goals toggling or updating localization values), the client assumes immediate success, rolling back only if a persistence error is caught.

---

## 5. Financial Calculation Engine Architecture

To ensure strict audibility, absolute consistency, and safety, the computational core is implemented entirely in TypeScript. **All math must run deterministically; raw AI models are completely forbidden from executing numerical calculations.**

```
                                  [ Input Params ]
                                         │
                                         ▼
                             ┌──────────────────────┐
                             │ Calculation Gateway  │
                             └──────────┬───────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
      ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
      │  netWorthEngine     │ │   retirementEngine  │ │   Other Engines     │
      └──────────┬──────────┘ └──────────┬──────────┘ └──────────┬──────────┘
                 │                       │                       │
                 └───────────────────────┼───────────────────────┘
                                         │
                                         ▼
                              [ Unified Result Object ]
```

### Module Specifications

#### 5.1 Module: `netWorthEngine`
* **Inputs**:
  ```typescript
  interface NetWorthInput {
    currentNetWorth: number;
    annualSurplus: number;
    averageGrowthRate: number;
    years: number;
  }
  ```
* **Outputs**: `Array<number>` consisting of annually compounding coordinates representing net worth.
* **Mathematical Formula**:
  $$\text{NetWorth}_n = \left(\text{NetWorth}_{n-1} + \text{AnnualSurplus}\right) \times (1 + R)$$
* **Validation Rules**: `averageGrowthRate` must be capped at $15\%$ ($\le 0.15$). Prohibits compound rates over practical benchmarks without triggering hazard warnings.

#### 5.2 Module: `homePurchaseEngine`
* **Inputs**:
  ```typescript
  interface HomePurchaseInput {
    price: number;
    downPayment: number;
    interestRate: number;
    loanTermYears: number;
    currentNetWorth: number;
    annualSurplus: number;
    averageGrowthRate: number;
  }
  ```
* **Outputs**:
  ```typescript
  interface HomePurchaseOutput {
    monthlyPayment: number;
    projectedNetWorth30Y: number[];
    lifetimeWealthImpact: number;
    decisionHealthScore: number;
  }
  ```
* **Formulas**:
  * **Amortization Fee**:
    $$M = P \frac{r(1+r)^N}{(1+r)^N-1}$$
    *Where:*
    * $M$ = monthly payment
    * $P$ = principal loan amount (`price` - `downPayment`)
    * $r$ = monthly interest rate (`interestRate` / 12)
    * $N$ = total amortization months (`loanTermYears` * 12)
  * **Property Appreciation**: $4\%$ flat annual rate compounding property asset value.
  * **Simulated Net Worth Curve**:
    $$\text{SimulatedNW}_i = \text{LiquidAssets}_i + \text{PropertyValue}_i - \text{RemainingLoan}_i$$
* **Validation Guards**: Down payment cannot exceed property price. Monthly amortization cannot absorb more than $45\%$ of active family income pools without triggering extreme credit risk warnings.

#### 5.3 Module: `debtFreedomEngine`
* **Inputs**: Individual liabilities arrays with active APR values and minimum monthly payments.
* **Formulas**:
  * **Snowball Hierarchy**: Calculates payoff tracks sorting liabilities from smallest balance to largest.
  * **Avalanche Hierarchy**: Pays down debts starting with the highest APR first (mathematically optimal model).
  * **Interest Saved Calculation**:
    $$\text{InterestSaved} = \text{TotalCompoundedInterest}_{\text{Snowball}} - \text{TotalCompoundedInterest}_{\text{Avalanche}}$$

#### 5.4 Module: `confidenceEngine`
* **Inputs**: Profile completeness index ($0$ to $100$), cumulative tracking duration, and active volatility rates.
* **Formula**:
  $$\text{ConfidenceScore} = \text{CompletenessPercent} \times 0.8 + 12 + \text{ComplexityMod}$$
  *Where:*
  * `CompletenessPercent` = fraction representing inputs provided ($7$ core elements).
  * `ComplexityMod` = $2 \times (\text{Incomes} + \text{Assets} + \text{Liabilities})$, capped at $+15$.
  * If `CompletenessPercent < 50`, deduct $15\%$ from the confidence score.

#### 5.5 Calculation Engine Logic Safemode Check
To guarantee calculation reproducibility, every output is structured for automated testing:
```typescript
describe("homePurchaseEngine", () => {
  it("should output exactly $415,090 lifetime wealth impact under standard parameters", () => {
    const input = {
      price: 500000,
      downPayment: 100000,
      interestRate: 0.065,
      loanTermYears: 30,
      currentNetWorth: 250000,
      annualSurplus: 36000,
      averageGrowthRate: 0.07,
    };
    const result = runHomePurchaseSimulation(input);
    expect(result.lifetimeWealthImpact).toBeCloseTo(415090, -1);
  });
});
```

---

## 6. AI Advisory Layer

The AI Advisory Layer provides accessible summaries of deterministic calculations, ensuring safe and standardized output formatting.

```
┌───────────────────────────────── Safe Prompting Orchestration ──┐
│                                                                 │
│   ┌─────────────────────┐               ┌─────────────────────┐ │
│   │ Input Parameters    │──────────────►│ Grounding Template  │ │
│   │ (From Engine Only)  │               │ (Must provide math) │ │
│   └─────────────────────┘               └─────────┬───────────┘ │
│                                                   │             │
│                                                   ▼             │
│   ┌─────────────────────┐               ┌─────────────────────┐ │
│   │ Strict JSON Schema  │◄─────────────►│   Gemini-2.5-Flash   │ │
│   │ (System Policy)     │               └─────────────────────┘ │
│   └─────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Standard Grounding Template Structure
Every system call to Gemini is dynamically grounded. Prompt templates are structured as follows:

```
[SYSTEM PROMPT]
You are Aura, an elite, highly risk-averse AI Financial Decision Coach. You translate raw, deterministic financial calculations into human narratives.

[STRICT DISCLAIMERS]
1. Never produce financial, legal, investment, or tax advice.
2. Never comment on specific private equities, single stocks, or crypto assets.
3. Keep all text objective, direct, and conversational. Refer to the mathematical model coordinates provided.

[DETERMINISTIC INPUTS]
- Current Age: {{twin.currentAge}}
- Baseline 30Y Projected Net Worth: {{result.baselineNW30Y}}
- Simulated 30Y Projected Net Worth: {{result.simulatedNW30Y}}
- Proportional Wealth Impact: {{result.lifetimeWealthImpact}}
- AI Performance Score: {{result.decisionHealthScore}}
- Confidence Rating Index: {{result.confidenceScore}}

[RESPONSE SCHEMA]
You must respond with raw JSON matching the following schema structure:
{
  "narrativeSummary": "A direct, 2-sentence explanation of downstream balance implications.",
  "psychologicalProfile": "Summary of behavioral factors, linking downpayments with current liquidity ratios.",
  "coachingActions": [
    "Actionable, non-investment steps to increase confidence score metrics (e.g. declare retirement values)."
  ]
}
```

### Prompt Guardrails & Safety Auditing
1. **Validation Checks**: If the model output contains financial terminology like `"buy stock"`, `"mutual fund"`, or `"equity allocation guidance"`, the system rejects the payload and falls back to a pre-defined static calculation summary.
2. **Error Safeguards**: If the model outputs invalid JSON or triggers a safety filter, the system dynamically displays standard calculation parameters:
   * `"Calculation completed. Under standard location variables, this scenario yields a 30-year net-worth delta of [Impact]. Clear your remaining liabilities to increase overall calculation confidence."`

---

## 7. Recommendation Engine

Aura utilizes a standardized scoring engine to construct recommendations from deterministic simulation curves, calculating values before passing them to the translation layer.

```
                           [ Core Engine Run ]
                                    │
                                    ▼
                        [ Evaluate Decision Metrics ]
                                    │
                  ┌─────────────────┼─────────────────┐
                  ▼                 ▼                 ▼
          [ Surplus % ]      [ Reserves Mo. ]     [ Debt Ratio ]
                  │                 │                 │
                  └─────────────────┼─────────────────┘
                                    │
                                    ▼
                         [ Output Score & Logic ]
                                    │
                                    ▼
                         [ Human Narrative Layer ]
```

### Evaluated Decision Parameters
The recommendation score is generated along three primary vectors:
1. **Reserves Coverage**: Calculates checking/saving accounts against absolute monthly expenses:
   $$\text{CoverageMonths} = \frac{\text{CashAssets}}{\text{MonthlyOutflows}}$$
   * If coverage is below 3 months, decision health drops below 50.
2. **Debt Service Capacity**: Total liability payments against active monthly income sources:
   $$\text{DebtRatio} = \frac{\text{TotalMonthlyLiabilityCharges}}{\text{AggregateIncomes}}$$
   * Ratios exceeding $43\%$ trigger an emergency priority payout suggestion.
3. **Surplus Saving Rate**: Excess monthly capital compared with baseline household income:
   $$\text{SurplusRatio} = \frac{\text{MonthlySurplus}}{\text{MonthlyIncome}}$$

### Structured Response Contract
The backend API returns standard recommendation payloads to ensure UI consistency:
```json
{
  "recommendationId": "rec_snowball_boost",
  "priority": "high",
  "title": "Establish Checking Safety Valve",
  "outcomeSummary": "Allocate monthly surpluses directly to immediate savings until basic expenses are secured.",
  "whyAuraRecommendsThis": [
    "Your current cash runway covers less than 3 months of essential fixed liabilities.",
    "Bypassing potential market volatility avoids forced asset liquidation penalties."
  ],
  "confidenceScore": 85,
  "riskScore": 15,
  "alternativeScenarios": [
    {
      "title": "Partial Snowball Paydown",
      "description": "Dedicate 35% of monthly surpluses to checking balances and 65% to high-rate credit cards."
    }
  ]
}
```

---

## 8. API / Edge Function Design

All backend endpoints are implemented as decoupled JSON RPC services or REST parameters via Supabase Edge Deno runtimes.

```
Client Auth JWT ──►  [ Supabase Edge gateway ] ──► [ Role Validation Check ]
                                                           │
                                                           ▼
                                                [ Execute Process Logic ]
                                                           │
                                                ┌──────────┴──────────┐
                                                ▼                     ▼
                                         [ Database Write ]    [ Audit Logging ]
```

### Key API Contracts

#### 8.1 Endpoint: `POST /functions/v1/runSimulation`
* **Authorization**: Bearer JWT (Authenticated Customer)
* **Request Payload**:
  ```json
  {
    "simulationType": "home_purchase",
    "params": {
      "price": 500000,
      "downPayment": 100000,
      "interestRate": 0.065,
      "loanTermYears": 30
    }
  }
  ```
* **Response Payload**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "sim_34021aa",
      "lifetimeWealthImpact": 415090,
      "projectedNetWorth30Y": [250000, 264000, 279500,...],
      "decisionHealthScore": 78,
      "confidenceScore": 92,
      "hazardFlagsDetected": false
    }
  }
  ```
* **Failure Modes**: Missing parameters return `HTTP 400 Bad Request`. System limits cap simulation years at 30 to prevent calculation drift.

#### 8.2 Endpoint: `POST /functions/v1/logGovernanceEvent`
* **Authorization**: Bearer JWT (Requires Admin or System Auditor Roles)
* **Request Payload**:
  ```json
  {
    "eventType": "GLOBAL_ASSUMPTION_OVERRIDE",
    "severity": "high",
    "details": {
      "parameterModified": "averageGrowthRate",
      "oldValue": 0.07,
      "newValue": 0.09
    }
  }
  ```
* **Response Payload**: `{"status": "logged", "eventId": "gov_uuid"}`
* **Audit Logging**: Inserts a record into the `public.audit_logs` table with the execution context IP.

---

## 9. Governance & Audit Logging

Aura uses structured logs to maintain an audit trail for system events and changes.

```
[ Security Event ] ──► [ Severity Evaluation ] ──► [ DB Write (audit_logs) ]
                                                           │
                                                           ▼
                                                 [ Escalation Trigger ]
                                                           │
                                                   (If level >= High)
                                                           ▼
                                                [ System Admin Alert ]
```

### Event Logging Spec
The system logs events across four severity tiers:

* **Level 1: Info (Non-Critical)**:
  * *Events*: `USER_LOGIN`, `SIMULATION_EXECUTED`, `FEEDBACK_SUBMITTED`.
  * *Audit Details*: Log UUID and timestamp. Used for standard behavior analysis.
* **Level 2: Warning (Attention Required)**:
  * *Events*: `UNREASONABLE_ASSUMPTIONS_INPUT`, `LOW_CONFIDENCE_RUN`.
  * *Audit Details*: Flags inputs that exceed system guidelines (e.g. location inflation parameters $> 10\%$).
* **Level 3: High (Immediate Action)**:
  * *Events*: `ACCESS_DENIED_ATTEMPT`, `UNKNOWN_ENDPOINT_PAYLOAD`, `MULTIPLE_CALCULATION_FAILURES`.
  * *Audit Details*: Logs source coordinates, client environment details, and active JWT structures.
* **Level 4: Critical (System Security Alert)**:
  * *Events*: `SQL_INJECTION_ATTEMPT`, `ROLE_PROMOTION_UNAUTHORIZED`, `GLOBAL_VARIABLES_CORRUPTION`.
  * *Audit Details*: Triggers safe-mode database lockdowns for affected schemas.

### Admin Dashboard Compliance
Admin views operate with access controls that enforce data privacy:
* All raw identifiable user parameters are de-identified when loaded by auditors.
* Tables display transaction histories without showing full customer profile addresses.

---

## 10. Feedback & Learning Loop

Aura tracks user feedback to identify areas for model improvements and monitor calculation accuracy.

```
                  [ User Views Suggestion ]
                              │
                              ▼
                  [ Selects Helpfulness Rating ]
                              │
                  ┌───────────┴───────────┐
                  ▼                       ▼
            [ Helpful ]             [ Not Helpful ]
                  │                       │
      (Add positive count)        (Assign reason code)
                  │                       │
                  └───────────┬───────────┘
                              │
                              ▼
                  [ Log Context Metadata ]
                              │
                              ▼
                  [ Store Feedback Payload ]
```

### Logged Context Metadata
* **Interactive Parameters**: Records variables (downpayment ratios, vehicle loan types) used to generate the recommendation.
* **Calculated Values**: Saves computed metrics (confidence indices, simulated asset values) along with the rating.
* **Qualitative Data**: Stores free-text comments with language filters applied to sanitize fields.

### Processing Pipeline
1. Feedback entries are queued and processed to identify recommendations with low helpfulness ratings.
2. Items that consistently receive low scores are flagged for human review or parameter recalibration.
3. This feedback loop supports the requirements of the V3 core governance guidelines, helping to ensure recommendations remain balanced and relevant.

---

## 11. Bias, Transparency & Model Card Support

Aura is designed with safety safeguards that acknowledge mathematical limitations, providing transparency regarding the variables used in its calculations.

```
   [ Input Profile ] ──► [ Bias & Constraint Check ] ──────────┐
                                                               │
                                                               ▼
   [ Model Card Variables Documented ] ──────────────► [ Output Card ]
                                                               │
                                                               ▼
                                                    [ Dynamic Warnings ]
```

### Model Card Validation Rules
Aura operates within defined parameter limits:
* **Age Limits**: Projections cap life expectancy at $90$ years to prevent compound asset curves from outputting unrealistic numbers in extreme projection lines.
* **State Variation**: Property values apply a standard $4\%$ appreciation rate, with warnings that real-world local markets are subject to real estate cycles.
* **Emergency Reserve Minimums**: Financial plans require a 3-month savings reserve, with guidance that individual needs vary based on location-specific factors.

### Low-Confidence Flags
The UI displays low-confidence warnings if:
1. Necessary details (like active asset holdings or retirement plans) are missing from the user's profile.
2. The user inputs growth assumptions that are significantly higher than historical index trends.

---

## 12. Globalization & Localization Architecture

Phase 1 provides national coverage for all 50 U.S. states. The system structure is planned to support international tax models and systems in future releases.

```
                        [ Input Location ]
                                │
                                ▼
                    ┌────────────────────────┐
                    │  Localization Adapter  │
                    └───────────┬────────────┘
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
       [ US State Profiles ]         [ Base Global Models ]
       - Local Tax Rate              - Currency Configuration
       - Real Estate Levy            - Language Translation
```

### National Variables File Map
The database references state-specific calculations using localized parameters:
```json
{
  "locale": "en-US",
  "states": {
    "CA": {
      "stateTaxMultiplier": 0.08,
      "averagePropertyTax": 0.0075,
      "relativeCostOfLivingIndex": 1.35
    },
    "TX": {
      "stateTaxMultiplier": 0.00,
      "averagePropertyTax": 0.016,
      "relativeCostOfLivingIndex": 0.94
    }
  }
}
```

### Future International Implementation Plan
To scale the platform globally:
1. Multi-currency formatters will adjust outputs using local exchange rates.
2. Asset calculators will adjust compound equations for country-specific account types (e.g. ISA, Superannuation, RRSP).

---

## 13. Testing Strategy

Aura's testing environment uses Jest and dynamic mock frameworks to verify system functionality.

```
       [ Client Tests ]         [ Calculation Tests ]         [ Edge API Tests ]
              │                           │                           │
              ▼                           ▼                           ▼
┌────────────────────────── Automated Test Suites ──────────────────────────┐
│                                                                           │
│  - Form Flow Checks      - Formula Accuracy        - JWT Authentication   │
│  - Components Rendering - Compound Calculations   - RLS Policy Boundary  │
│                                                                           │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
                                      ▼
                           [ Verified Build Ready ]
```

### Sample Executable Boundary Checks

```typescript
describe("Aura Security Boundary Tests", () => {
  it("should block non-admin users from reading governance logs", async () => {
    const mockClient = createMockSupabaseClient({ 
      role: "customer", 
      userId: "user_123" 
    });
    const { data, error } = await mockClient
      .from("audit_logs")
      .select("*");
    
    expect(error).toBeDefined();
    expect(error?.message).toContain("permission denied");
    expect(data).toBeNull();
  });

  it("should log access attempts to the security log table", async () => {
    const mockClient = createMockSupabaseClient({ 
      role: "unauthorized_role" 
    });
    const response = await mockClient.functions.invoke("logGovernanceEvent", {
      body: { eventType: "UNAUTHORIZED_ADMIN_ROUTE_ATTEMPT" }
    });
    expect(response.status).toBe(200);
  });
});
```

---

## 14. Deployment Plan

Deployments use isolated container workflows and automated database migrations.

```
┌──────────────────────────────── Deployment Steps ──────────────────┐
│                                                                    │
│  Step 1: Apply SQL Migrations ──► Verify Local Postgres Installs  │
│                                                                    │
│  Step 2: Sync Schema Keys ──────► Deploy Supabase Deno Edge APIs    │
│                                                                    │
│  Step 3: Dockerize Applet Container ──► Release UI Content to CDN │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Release Checklist
1. Export SQL database migrations using schema files and test queries.
2. Initialize environment variables for Vertex AI endpoints and Google API keys.
3. Run the linter and compiler checks locally before promoting builds.
4. Deploy Edge functions to Supabase, validating token configuration paths.
5. Deploy UI components to the Content Delivery Network (CDN) once calculation and linter checks pass.

---

## 15. Implementation Roadmap

```
Phase 2A (Auth & DB Schema) ──► Phase 2B (Persistence Layer) ──► Phase 2C (Engines)
                                                                       │
                                                                       ▼
Phase 2G (Release Run) ◄────── Phase 2F (Governance API) ◄─── Phase 2D/2E (Advisory)
```

### Roadmap Details

#### Phase 2A: Database Schema & Authentication Setup
* **Goal**: Build PostgreSQL schemas and configure secure user authentication on Supabase.
* **Component Modifications**: Deploy DDL tables for profile, feedback, and financial twin metrics. Create Row-Level Security policies.
* **Criteria**: Block queries from unauthorized tokens and confirm user session profiles load correctly.

#### Phase 2B: Local-Cloud Persistence Integration
* **Goal**: Establish synchronization between client browser context and the backend database.
* **Component Modifications**: Coordinate data pipelines for assets, liabilities, and scenario structures.
* **Criteria**: Confirm user profile changes persist across browser refreshes.

#### Phase 2C: Deterministic Calculation Engines
* **Goal**: Move financial calculation logic to verified, standalone code modules.
* **Component Modifications**: Standardize net worth, home buying, and debt payoff calculations.
* **Criteria**: Verify outputs align with historical mathematical averages.

#### Phase 2D: Recommendations & Advisory Translation
* **Goal**: Integrate text translation summaries of deterministic output calculations.
* **Component Modifications**: Build structured API prompt templates for the grounded translation layer.
* **Criteria**: Format response narrative text without altering raw calculation numbers.

#### Phase 2E: Systems Governance & Feedback Panels
* **Goal**: Enable feedback mechanisms and administrative governance dashboards.
* **Component Modifications**: Implement tables for user feedback, safety warnings, and event audit trails.
* **Criteria**: Ensure administrator logs update when system warnings trigger.

---

## 16. Technical Risk Register

The Risk Register identifies technical risks, impact levels, and mitigation strategies for Phase 2:

| Event Risk Description | Likelihood | Impact | Proposed Mitigation Strategy | Responsible Owner |
|---|---|---|---|---|
| **Exposing Keys in Browser Packages** | Low | Critical | Use server-side proxy routes for all API queries. Do not include raw security credentials in compiled frontend files. | Security Lead |
| **Simulations Generating Outlier Calculations** | Medium | High | Apply bounds to compounding calculations and show warnings for scenarios with high variance. | Mathematics Lead |
| **Row-Level Security Leaks** | Low | High | Prevent default table access and execute automated test suites on relational tables. | Database Administrator |
| **Incomplete User Profile Inputs** | High | Medium | Implement completeness indicators and adjust calculation confidence scores appropriately. | Product Owner |
| **API Boundary Key Changes** | Low | Medium | Standardize JSON API contracts and verify integrations before deployment. | Integration Engineer |

---

## Calculations Clarification & Worked Example

### 1. Mathematical Breakdown of Home Purchase Simulation
* **Baseline Horizon Tracking Target (Doing Nothing)**:
  * Current starting cash positions are compounded over the selected timeline using base parameters.
* **Simulated Horizon tracking Target (Purchasing the Home)**:
  * Simulated assets compound of liquid capital and net property values, offset by remaining mortgage liabilities.
* **Wealth Impact Formula**:
  $$\text{Lifetime Wealth Impact} = \text{SimulatedNW}_{30} - \text{BaselineNW}_{30}$$

### 2. Standard Worked Example Mapped Under Profile Defaults
* **Starting Portfolio Parameters**:
  * Baseline checking balances: $\$250,000$ (with $\$36,000$ in annual surpluses).
  * Long-term average compounding rate: $7\%$.
* **Target Real Estate Details**:
  * Acquisition Value: $\$500,000$.
  * Downpayment Outlay: $\$100,000$.
  * Financed Principal: $\$400,000$ (at $6.5\%$ interest over $30$-years).
* **30-Year Projections**:
  * **Baseline Output**: Checking capital compounds to **$\$3,755,750$**.
  * **Simulated Output**: Total liquid capital plus property asset valuation (\$1,621,700) compounds to **$\$4,170,840$**.
  * **Net Proportional Delta (Wealth Impact)**: **$\$415,090$** ($+\$415,090$).
