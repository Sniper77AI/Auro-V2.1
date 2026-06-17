# Systems Architecture Document — Aura V3.1
## Core Simulation, Security, and Intelligence Architecture

*Tagline: "See your future before you spend your money."*

---

## 1. Technical Design of the 7 Core Modules

Aura's simulation engine models multi-year scenarios by feeding the user's **My Financial Profile** state into 7 specialized deterministic decision solvers.

### Module 1: Home Purchase Planning
*   **User Questions**: "Given high-cost-of-living state tax rules, can I purchase a $950,000 home in 3 years? What is the lifetime difference on wealth between a 15-year equity build vs a 30-year market index compound?"
*   **Twin Inputs Required**: Down payment savings target, current liquid asset portfolio, monthly disposable cash surplus, credit tier, state of residence (for property tax rates and insurance averages).
*   **Simulation Outputs**: Projected 30-year liquid wealth track, monthly cash-flow impact (PITI: Principal, Interest, Taxes, Insurance), transaction friction overhead (closing costs, inspection), net worth trajectory.
*   **Assumptions**: Annual property appreciation average (default 3.5%), annual maintenance reserves (1-2% of valuation), mortgage interest rate baseline (user input or state average), standard state-level property tax tables.
*   **Risk Factors**: Significant localized property tax increases, homeowner association (HOA) special assessment shocks, unexpected mortgage rates hikes.
*   **Transparency & Bias Notes**: Defaulting to the national 3% home price appreciation baseline understates the high volatility of municipal urban pockets. Emphasizes mortgage interest deductions which may not benefit non-itemizing taxpayers.
*   **Feedback Signals**: "Do you find the balance of liquidity versus home value accurate to your lifestyle expectations?"

### Module 2: Vehicle Purchase Planning
*   **User Questions**: "Should I take the automaker's 1.9% financing rate and keep my cash invested in a brokerage index, or pay cash upfront to avoid monthly cash drain?"
*   **Twin Inputs Required**: Liquid checking assets, preferred vehicle value, proposed loan terms (Months, Down payment, Interest rate), monthly insurance overhead.
*   **Simulation Outputs**: Opportunity cost analysis of cash vs debt, monthly cash-flow impact, depreciation valuation curve over 7 years, break-even liquidity threshold.
*   **Assumptions**: Annual vehicle depreciation rate (typically 15-20% in years 1-3, 10% thereafter), opportunity cost investment returns rate (default 7.5% real index growth).
*   **Risk Factors**: Underestimating local maintenance cycles, higher gas/utility expense spikes, variable insurance rate hikes based on region.
*   **Transparency & Bias Notes**: Models high opportunity cost which assumes the user actually leaves cash invested in index funds, whereas cash may otherwise drift into low-yield checking accounts.
*   **Feedback Signals**: "Did we correctly capture the insurance adjustments for your specific model?"

### Module 3: Career & Income Planning
*   **User Questions**: "If I take a $20,000 pay-cut to jump from a stressful corporate W2 position to a 1099 consulting business, how does the self-employment tax burden impact my net worth timeline?"
*   **Twin Inputs Required**: Base salary, variable income streams, corporate health insurance subsidy values, retirement matching rates, 1099 deductible business expense estimates.
*   **Simulation Outputs**: Net take-home cash flow comparison, self-employment tax obligations, retirement matching replacement requirements.
*   **Assumptions**: Adjusted Gross Income (AGI) progressive tax tables, self-employment FICA obligations (15.3% U.S. baseline), standard healthcare replacement cost.
*   **Risk Factors**: Highly volatile consulting contracts, zero W2 safety nets (such as severance or short-term medical leaves).
*   **Transparency & Bias Notes**: Does not project psychic benefits (job satisfaction, stress reduction) which could lead to longer productive working careers.
*   **Feedback Signals**: "Are our estimates of your quarterly self-employment taxes realistic to your industry standards?"

### Module 4: Retirement Planning
*   **User Questions**: "When can I retire with a sustained $65,000 annual inflation-adjusted withdrawal rate? How does retiring at 62 instead of 67 affect my decumulation success under historic sequence-of-returns?"
*   **Twin Inputs Required**: Current age, planned retirement age, target lifestyle cost, current retirement assets (IRA, Roth, 401k), Social Security projection estimates.
*   **Simulation Outputs**: Projected age at asset depletion, decumulation order optimization chart, Medicare gap cost projections, annual probability of success bands.
*   **Assumptions**: Static real investment returns (typically 6-8% nominal, adjusted down for inflation), average lifespans, progressive tax tables.
*   **Risk Factors**: Longevity risk, systemic standard healthcare inflation outrunning standard index growth, severe sequences of negative returns early in decumulation.
*   **Transparency & Bias Notes**: Uses linear returns which hides the dramatic impact of market downturns during the critical first five years of retirement (Sequence of Returns Risk).
*   **Feedback Signals**: "Are the healthcare cost estimates for the gap years before Medicare realistic to your family history?"

### Module 5: Debt Optimization
*   **User Questions**: "What is the optimal routing between paying off my student loans at 5.5% versus paying off my auto loan at 4.5% versus investing in my taxable brokerage? How many months faster is the snowflake payoff route?"
*   **Twin Inputs Required**: Absolute list of debts (outstanding amounts, interest rates, minimum monthly payments), monthly surplus allocated for accelerated payoff.
*   **Simulation Outputs**: Snowball vs. Avalanche comparison logs, total interest saved overlay, exact debt-free calendar target date.
*   **Assumptions**: Static payment capacity throughout the acceleration tier, zero newly generated consumer liabilities.
*   **Risk Factors**: Emergency occurrences prompting suspension of the extra payment tier.
*   **Transparency & Bias Notes**: The Avalanche method is mathematically superior but ignored by users who thrive on the psychological wins of the shorter Snowball payoff cadence.
*   **Feedback Signals**: "Would you prefer a psychological Snowball approach or a purely logical Avalanche hierarchy?"

### Module 6: College Funding Planning
*   **User Questions**: "How much must I save monthly in a 529 plan to cover 80% of in-state tuition for my newborn? If I save at 100%, how many years does that delay my target retirement transition?"
*   **Twin Inputs Required**: Child age/dependent record, expected matriculation age, desired contribution level (e.g. 50%, 80%, 100%), university tier (In-state public, Out-of-state public, Elite private).
*   **Simulation Outputs**: 529 growth projection, monthly savings requirement, opportunity cost on parents' retirement trajectory, net college cost projection.
*   **Assumptions**: Annual college tuition hyper-inflation (typically modeled at 5%), college asset allocation glidepath indexing.
*   **Risk Factors**: Extreme tuition price jumps, child choosing non-traditional vocational career or receiving significant merit fellowships.
*   **Transparency & Bias Notes**: Assumes historical public college cost climbs will persist indefinitely, which might underplay future structural higher-education disruption.
*   **Feedback Signals**: "Do you expect your children to attend local public or premium national universities?"

### Module 7: Estate & Legacy Planning
*   **User Questions**: "How will my net worth be distributed after death? How much estate tax is due on my current portfolio? What are the benefits of sheltering assets via a living trust?"
*   **Twin Inputs Required**: Comprehensive assets and liabilities inventory, beneficiary distributions (%), state of residence (for state-level estate taxes and probate estimates).
*   **Simulation Outputs**: Estimated probate costs, federal and state estate tax liability, transfer speed metrics.
*   **Assumptions**: Estate tax exemption limits (current and scheduled 2026 sunset provisions), standard local municipal probate fee architectures.
*   **Risk Factors**: Frequent legislative tax-code updates, family structure modifications.
*   **Transparency & Bias Notes**: Estimates are educational and must not substitute for authentic legal documents or estate attorney counsel.
*   **Feedback Signals**: "Has our estate tax projection helped you identify trust requirements?"

---

## 2. Information Architecture & Navigation

The platform's hierarchy ensures safe segmentation between administrative auditing, governance monitoring, and the customer-facing core:

```
AURA ROOT
 │
 ├── GOV / AUDIT ACCESS CONTROLLER (Strict DB Filter)
 │    ├── JWT Signature Check -> Fetch profiles.role
 │    ├── Role: 'customer' -> Deny access to Audit Logs, PII Vault, and Governance Console
 │    └── Role: 'super_admin' | 'governance_admin' | 'auditor' -> Serve Restricted Console
 │
 ├── CUSTOMER WORKSPACE (Single-Page App States)
 │    ├── Wealth Command Center
 │    ├── My Financial Profile
 │    ├── Life Simulator (7 Modules)
 │    ├── Life Outcomes Tracker & Trade-offs
 │    └── Settings (Localization & Preferences)
 │
 └── ADMIN/GOVERNANCE CONSOLE (Restricted API Contexts)
      ├── Governance Dashboard
      ├── Database Audit Logs (Masked PII)
      ├── Feedback Analytics
      ├── Risk Event Register
      ├── Bias Monitoring Engine
      └── Model Cards & Global Assumptions Registry
```

### Onboarding Flow (First-Time User)
1. **Welcome & Identity Allocation**: The user registers. A random UUID is generated for the authenticated context. Identity records are saved directly to the **PII Vault**, completely isolated from the standard app database schema.
2. **Financial Twin Setup**: Walkthrough to enter primary income, essential fixed expenses, basic assets, and liabilities. This constructs the stateful `financial_twins` entity.
3. **Core Priority Definition**: Tag immediate target (e.g., Buy Home vs. Retire Early).
4. **Baseline Generation**: System computes health score and serves single main recommendation on Wealth Command Center.

---

## 3. PII Vault Architecture (Objective 1)

To strictly enforce customer data privacy and guarantee regulatory compliance, Aura splits identity profiles from economic models. Personal Identifiable Information (PII) is isolated within a cryptographic perimeter.

```
       [ Client HTTPS Ingress ]
                  │
        ┌─────────┴─────────┐
        │  Supabase Auth    │
        └─────────┬─────────┘
                  │ JWT Token (uid)
                  ▼
   ┌───────────────────────────── Database Boundary ─────────────────────────────┐
   │                                                                             │
   │  ┌─────────────────────────┐                 ┌───────────────────────────┐  │
   │  │    PII VAULT SCHEMA     │                 │   FINANCIAL CORE SCHEMA   │  │
   │  │                         │                 │                           │  │
   │  │   [user_identity]       │                 │   [profiles]              │  │
   │  │   - id                  │                 │   - profile_id (uuid, PK) │  │
   │  │   - auth_user_id (idx)  │                 │   - financial_preferences │  │
   │  │   - first_name (AES256) │                 │   - retirement_targets    │  │
   │  │   - last_name (AES256)  │   Implicit      │   - localization_settings │  │
   │  │   - email (AES256)      │   Relation      │                           │  │
   │  │   - phone (AES256)      │◄───────────────►│   [financial_twins]       │  │
   │  │                         │   Through UID   │   - twin_id               │  │
   │  └─────────────────────────┘                 │   - assets, liabilities   │  │
   │        ▲                                     │   - income, expenses      │  │
   │        │                                     └───────────────────────────┘  │
   │        │ Guarded by Strict                                  ▲               │
   │        │ RLS Policy: auth.uid()                             │               │
   │        │                                                    │ Read allowed  │
   │        ▼                                                    │ for Admins    │
   │  ┌─────────────────────────┐                                │ & Auditors    │
   │  │  Governance Lock        │                                │ (Anonymized)  │
   │  │  "Break-Glass" Gateway  ├────────────────────────────────┘               │
   │  └─────────────────────────┘                                                │
   └─────────────────────────────────────────────────────────────────────────────┘
```

### Table Definitions

#### Table: `user_identity`
* **Purpose**: Houses highly sensitive personal identity parameters behind standard encryption patterns.
* **Key Columns**:
  * `id` (`uuid`, PK, default `gen_random_uuid()`)
  * `auth_user_id` (`uuid`, Unique Index, references `auth.users`)
  * `first_name` (`bytea` / Encrypted Text)
  * `last_name` (`bytea` / Encrypted Text)
  * `email` (`bytea` / Encrypted Text)
  * `phone` (`bytea` / Encrypted Text, Nullable)
  * `created_at` (`timestamptz`, default `now()`)

#### Table: `profiles`
* **Purpose**: Coordinates localized configurations, financial behaviors, and goals. Contains **zero direct identity parameters**.
* **Key Columns**:
  * `profile_id` (`uuid`, PK, references `auth.users`)
  * `financial_preferences` (`jsonb`)
  * `retirement_targets` (`jsonb`)
  * `goals` (`jsonb`)
  * `localization_settings` (`jsonb`, defaults to `{ "currency": "USD", "locale": "en-US" }`)

### Key Access Policies
* **Customer Access Rule**: Row-Level Security on `user_identity` restricts access via `auth.uid() = auth_user_id`. Users can view and modify only their own identity.
* **Auditor Restriction Rules**:
  * System Auditors are assigned database roles with **zero select permissions** on the `user_identity` table.
  * Joins between `user_identity` and financial records (`profiles`, `financial_twins`) are systematically blocked by Postgres parser rules on non-super_admin accounts.
* **Governance Admin "Break-Glass" Flow**:
  * Accessing general PII is forbidden by default.
  * To resolve severe identity fraud, regulatory audits, or active safety incidents, Governance Admins must execute a multi-signature "Break-Glass" bypass procedure.
  * This procedure requires dual confirmation: a second administrator (Super Admin) must authorize the decrypt requests.
  * Once unlocked, the system logs a `CRITICAL` severity event to `audit_logs` capturing the administrator's context, IP, reason, and duration.
  * Decrypted parameters are exposed through a temporary, secure 5-minute read token.

### Encryption Specifications
* **Implementation**: Standard envelope encryption logic utilizing `pgcrypto` or KMS.
* **Algorithm**: AES-256-GCM symmetric encryption.
* **Key Management**: Encryption keys are rotated every 90 days via Google Cloud KMS, completely isolated from runtime application nodes.

---

## 4. Simplified State Assumptions Engine (Objective 2)

Rather than building a highly complex, maintenance-heavy personal income tax simulator, Aura uses an **assumption-driven, highly maintainable state catalog**. This provides localized, consistent calculations across all 50 U.S. states while maintaining a clean, testable codebase.

### Table Definition: `state_assumptions`
* **Purpose**: Houses core, average regional metrics to guide calculations.
* **Key Columns**:
  * `state_code` (`varchar(2)`, PK) (e.g., `'CA'`, `'TX'`)
  * `state_name` (`varchar(100)`, Unique)
  * `effective_tax_rate` (`numeric`) (Weighted state blended income tax rate projection)
  * `estimated_property_tax_rate` (`numeric`) (Average property tax burden per state)
  * `cost_of_living_index` (`numeric`) (Relative cost multiplier, baseline: `1.0`)
  * `average_home_appreciation_rate` (`numeric`) (Historical municipal real estate growth averages, baseline: `0.04`)
  * `retirement_factor` (`numeric`) (State pension/retirement distribution deductibility multipliers)
  * `updated_at` (`timestamptz`, default `now()`)

### Global Assumptions Library Schema
To support future expansion, international geographic entities (such as individual UK counties or Canadian provinces) utilize identical schema designs using international regional code formats (e.g., `'GB-ENG'` or `'CA-ON'`).

### Maintenance & Governance Workflow
* **Maintenance Strategy**: Assumptions are treated as deterministic inputs, separating calculations from hardcoded application logic.
* **Update Cadence**: Blended parameters are audited and updated annually on November 15, immediately following IRS index releases and local voter index updates.
* **Governance Ownership**:
  * The **Governance Admin** owns modifications to `state_assumptions` through verified administrative controllers.
  * Alterations trigger an immediate simulation run against standard test vector profiles (e.g., "Jane Doe CA Default") to verify consistent outputs before changes are pushed to manufacturing nodes.

---

## 5. Confidence Engine Specification (Objective 3)

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

## 6. AI Provider Abstraction Layer (Objective 4)

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

## 7. Educational Guidance Compliance Boundary (Objective 5)

Aura is designed strictly as a lifestyle planning and scenario simulation tool. It **does not provide, nor is it configured to deliver, licensed financial, tax, or legal advice**.

```
┌───────────────────────────────── Compliance Filter ─────────────────────────────────┐
│                                                                                     │
│    [ User Query / API Run ] ───► [ Validate Compliance Parameters ]                 │
│                                                 │                                   │
│                                                 ▼                                   │
│                       Is Prohibited? (e.g. "Buy Tesla stock", "Invest BTC")         │
│                                                 │                                   │
│                        ┌────────────────────────┴────────────────────────┐          │
│                        ▼ Yes                                             ▼ No       │
│               [ Safety Block Triggered ]                       [ Allow Process to ] │
│               "Aura cannot provide investment                  [ Execute Normal   ] │
│                allocation decisions..."                        [ Calculation      ] │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Mandated System Disclosures
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

## 8. Architectural Guardrails & Technical Debt Prevention (Objective 6)

The platform enforces strict guardrails to maintain system reliability, security, and calculational transparency:

*   **Rule 1: AI Computation Separation**: AI models and LLM providers are **completely prohibited** from executing compound calculations. Calculations are handled entirely by verified TypeScript modules.
*   **Rule 2: Absolute Reproducibility**: Projections are entirely deterministic. Every calculation run accepts a structured seeding parameter payload, ensuring identical inputs produce identical outputs.
*   **Rule 3: Deterministic Generation**: Recommendations are triggered from baseline calculations. LLMs translate these outputs for clarity but do not generate the underlying recommendations.
*   **Rule 4: Grounding Enforcement**: AI models cannot generate narrative text without complete grounding details from the mathematical calculations.
*   **Rule 5: Log Trace Auditing**: Every transaction has a transparent audit path. Projections document referenced inputs, calculated values, and state tax rules.
*   **Rule 6: Secure Execution**: Calculations must run in secure, verified server-side environment nodes (Deno Edge endpoints) to prevent parameter tampering.
