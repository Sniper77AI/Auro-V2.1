# Systems Architecture Document - Aura V2.2

This document details the functional specifications of Aura's 7 core decision modules, the system-wide information architecture, and the modular localization framework.

---

## 1. Technical Design of the 7 Core Modules

Aura's simulation engine models multi-year scenarios by feeding the user's **Digital Financial Twin** state into 7 specialized deterministic solvers.

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

The platform's hierarchy ensures safe segmentation between administrative auditing and the customer-facing core.

### 1. Site Map and Screen Tree
```
AURA ROOT
 │
 ├── AUTHENTICATION / ACCESS CONTROLLER (Client Filter)
 │    ├── Check User Session & Role
 │    ├── Role: 'customer' -> Serve Customer Workspace
 │    └── Role: 'super_admin' | 'governance_admin' | 'auditor' -> Serve Expanded Workspace
 │
 ├── CUSTOMER WORKSPACE (Role-allowed views only)
 │    ├── Home / Wealth Command Center
 │    ├── Financial Twin Console
 │    ├── Life Simulator (7 Modules)
 │    ├── Goals Tracker & Conflict Engine
 │    └── System Settings & Global Settings
 │
 └── ADMIN CONSOLE (System logs hidden from standard clients)
      ├── Governance Dashboard
      ├── Audit Logs
      ├── Feedback Analytics
      ├── Risk Event Register
      ├── Bias Monitoring Engine
      ├── Model Cards Manager
      └── Operational System Metrics
```

### 2. User Flows & Execution Maps

#### Onboarding Flow (First-Time User)
1.  **Welcome & Identity**: Enter name, age, and state of residence.
2.  **Financial Twin Setup**: Walkthrough to enter primary income, essential fixed expenses, basic assets, and liabilities.
3.  **Core Priority Definition**: Tag immediate target (e.g., Buy Home vs. Retire Early).
4.  **Baseline Generation**: System computes health score and serves single main recommendation on Wealth Command Center.

#### Simulation Creation Flow
1.  **Select Target Module**: Select among the 7 core modules from the Simulation catalog.
2.  **Define Scenario Parameter**: Set variable inputs (e.g., home price, financing rate, timeline).
3.  **Run Simulation**: Deterministic engines evaluate 30-year projections. Explanations overlay.
4.  **Review Gaps & Alternative Scenarios**: Check conflict logs (e.g., "This simulation reduces retirement confidence by 8%").
5.  **Commit/Persist Result**: Save to Wealth Command comparison matrix. Audit Log records persistent trace.
6.  **Collector Prompt**: Rate simulation helpfulness.

#### Governance Escalation Flow (Internal System Check)
1.  **User registers feedback** as "Not Helpful" due to "Confusing explanation".
2.  **System records** audit instance to `feedback` database table.
3.  **Admin Bias Engine** flags a regional anomaly where progressive tax projections failed on an edge household bracket.
4.  **Operational Metrics** updates low-confidence percentage.
5.  **Governance Admin** recalibrates tax assumptions library inside `assumptions_library`.
6.  **Audit action register** saves the correction trace.

---

## 3. Globalization & Localization Architecture

To support localized simulations without structural redesign, Aura uses an isolation design:

```
+-----------------------------------------------------------------+
|                        SIMULATION SOLVERS                       |
|  Loads tax-formulas & appreciation indexes from localization    |
+-------------------------------+---------------------------------+
                                |
                                v
+-----------------------------------------------------------------+
|                      LOCALIZATION PROVIDER                      |
|                                                                 |
|   US-50 ENGINE:                                                |
|   - Federal Bracket Maps                                        |
|   - 50 State Income Tax Progressions                           |
|   - Local Standard Property Tax Rates                           |
|                                                                 |
|   INTERNATIONAL ENGINE (Phase 2):                               |
|   - Multi-Currency Conversions                                  |
|   - Variable Pension Schemes (e.g., ISA, Superannuation)        |
|   - Foreign VAT / Capital Gains Tax Laws                        |
+-----------------------------------------------------------------+
```

### Parameter Map Structure
-   **Static State Maps**: Stores property tax, state capital gains rates, state sales tax, and median state home values in structured dictionaries.
-   **Currency Provider**: Automatically format currencies and adjust scaling based on active Profile settings (USD, EUR, GBP).
-   **Tax Engine Interface**: Abstracts tax calculations into a clean method signature:
    `calculateNetTaxes(taxableIncome: number, state: string, country: string): number`
