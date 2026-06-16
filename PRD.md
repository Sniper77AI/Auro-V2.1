# Product Requirement Document (PRD) - Aura V2.2

## 1. Product Overview
**Aura** is a next-generation Decision Financial Intelligence (FDI) platform that empowers users with the command: *"See your future before you spend your money."* Unlike traditional retroactive budgeting tools or generic wealth advisors, Aura provides a high-fidelity, forward-looking simulation environment where every high-impact life decision is simulated, audited, and optimized within a personalized "Digital Financial Twin" before execution.

---

## 2. Core Value Proposition
- **Adaptive Digital Twin**: A mathematical model of a household's financial life (income streams, dynamic expense tracks, asset ledgers, compounding liabilities, and tax environments).
- **Multi-Module Decision Arena**: Dedicated simulation containers for vehicle purchases, real estate transactions, career transitions, college funding, nested debts, estate planning, and retirement.
- **Explainable Simulation Logs**: Transparent explanation overlays separating deterministic computations (tax brackets, compounding curves) from educational narratives.

---

## 3. Product Vision & North Star Metric
### Primary North Star Metric
The success of the Aura platform is measured by:
**"Number of financial decisions evaluated before execution."**

### Supporting Key Performance Indicators (KPIs)
To monitor product adoption, retention, and governance alignment, we track:
- **Simulation Completion Rate**: Percentage of started simulations completed through to output receipt.
- **Repeat Simulation Rate**: Cohort percentage of users simulating multiple alternatives.
- **User Decision Confidence Improvement**: Pre- vs. post-simulation survey sentiment.
- **Feedback Helpfulness Score**: User evaluation ratio (Helpful vs. Not Helpful reasons).
- **Retention Rate**: Sticky user return metrics linked to Twin tracking updates.
- **Premium Conversion Rate**: Percentage of free-tier accounts migrating to high-fidelity global settings.
- **Governance Incident Rate**: Frequency of anomalous outcomes, bias alerts, or outlier calibrations.
- **Low-Confidence Output Rate**: Frequency of simulation results throwing variance limits due to lack of local geographic or regulatory parameters.

---

## 4. User Personas (6 Core Segmentations)

### Persona 1: Young Professional
*   **Profile**: Single, age 22–29, high earning potential, technical or consulting sector, residing in a high-cost-of-living metropolitan area (e.g., California).
*   **Primary Decisions**: Rent-vs-buy modeling, student loan payoff strategy (avalanche vs. baseline), early career mobility vs. higher retirement contribution.
*   **Pain Points**: Overwhelmed by student debt; lacks understanding of compounding effects of early investing.
*   **How Aura Helps**: Models impact of lump-sum student loan payments relative to historical index portfolio growth over 10 years.
*   **Relevant Modules**: Career & Income, Debt Optimization, Vehicle Purchase.
*   **Key Risks & Bias Concerns**: System may over-recommend aggressive stock indexing due to youth, ignoring short-term cash safety buffers.

### Persona 2: Family Planner
*   **Profile**: Married couple, age 30–42, expecting or raising young dependents.
*   **Primary Decisions**: Childcare cost absorption, college savings vehicles (529 vs. index), term life insurance levels.
*   **Pain Points**: Balancing immediate childcare spikes alongside 401(k) retirement contributions.
*   **How Aura Helps**: Shows real-time trade-off scenarios (e.g., "Maxing out standard 529 plans will require cutting discretionary vacation spending by 35% for 4 years").
*   **Relevant Modules**: College Funding, Career & Income, Home Purchase.
*   **Key Risks & Bias Concerns**: Platform might over-optimize for child-rearing security and flag standard active entrepreneurial pursuits.

### Persona 3: Home Buyer
*   **Profile**: Prospective first-time real estate purchaser, dual-income, age 26–38.
*   **Primary Decisions**: Upfront down-payment sizing, loan duration (15Y vs. 30Y fixed), property tax escrow absorption.
*   **Pain Points**: Finding the cash envelope point where a mortgage doesn't choke out monthly liquid surplus.
*   **How Aura Helps**: Incorporates state-specific property taxes, insurance estimates, and maintenance reserves into the digital cash flow.
*   **Relevant Modules**: Home Purchase, Debt Optimization, Wealth Command.
*   **Key Risks & Bias Concerns**: Localized housing code fluctuations; system must highlight property devaluations or HOA shocks.

### Persona 4: Entrepreneur / Career Changer
*   **Profile**: Mid-life pivot seeker, age 35–50, moving from stable corporate W2 salary to business startup or variable 1099 consulting.
*   **Primary Decisions**: Capital runway sizing, self-employment tax burden overhead, replacement health insurance expenses.
*   **Pain Points**: Extreme irregular income streams making baseline forecasting difficult.
*   **How Aura Helps**: Simulates variable seasonal cash flows and business stress tests on household reserves.
*   **Relevant Modules**: Career & Income, Retirement, Debt Optimization.
*   **Key Risks & Bias Concerns**: Systematic underestimation of startup failure rates; must warn with aggressive runway buffers.

### Persona 5: Pre-Retiree
*   **Profile**: Stable professional, age 50–62, whose primary focus is accelerating retirement liquidity.
*   **Primary Decisions**: 401(k) catch-up contributions, healthcare transition plans, Social Security start age optimization.
*   **Pain Points**: Sequence-of-returns risk and complex tax conversion brackets (e.g., Traditional IRA to Roth conversions).
*   **How Aura Helps**: Pinpoints when conversions should happen to minimize lifetime federal bracket tax rates.
*   **Relevant Modules**: Retirement, Estate & Legacy, College Funding.
*   **Key Risks & Bias Concerns**: Unstable health expenditure projections; needs explicit stress test ranges.

### Persona 6: Retiree / Legacy Planner
*   **Profile**: Retired senior, age 63+, focusing on decumulation and multi-generational transferring of wealth.
*   **Primary Decisions**: Required Minimum Distributions (RMDs), dynamic trust inheritance vehicles, funeral or medical endowments.
*   **Pain Points**: Depleting retirement assets prematurely.
*   **How Aura Helps**: Directs the decumulation hierarchy (withdrawing from taxable Brokerage first, tax-deferred next, tax-exempt Roth last).
*   **Relevant Modules**: Estate & Legacy, Retirement, Debt Optimization.
*   **Key Risks & Bias Concerns**: Ignores cognitive decline safeguards or elder financial fraud risks; must incorporate extreme health shock scenarios.

---

## 5. Architectural Product Experience Separation
To maintain high user trust, regulatory validation, and clear navigation, Aura maintains a strict split:

### 1. Customer-Facing Navigation Only
Normal customers are presented with an elegant, focused experience consisting of:
*   **Home (Wealth Command Center)**: Unified financial cockpit, health and readiness scores, primary contextual recommendations, and goal progress.
*   **Financial Twin**: Detailed management of income, assets, liabilities, dependent structure, and regional geography configuration.
*   **Life Simulator**: The playground where users run, review, and persist scenarios against all 7 decision engines.
*   **Goals**: Visual track of prioritized timelines, target amounts, and automated goal conflict notifications.
*   **Settings**: Secure state residency, currency, profile, tracking preferences, and internationalization configuration.

### 2. Admin-Only Executive Layer
Accessible solely to accounts tagged with roles `super_admin`, `governance_admin`, or `auditor`. The customer navigation is extended to include:
*   **Governance Hub**: Oversight on systemic variance spikes, regulatory shifts, and model deployment states.
*   **Audit Trail Log**: Comprehensive records of PII serialization, administrative actions, and scenario persist requests.
*   **Feedback Analytics**: Real-time analysis of "Not Helpful" reasons to target deterministic code refinements.
*   **Risk & Bias Monitor**: Continuous testing against geographic, demographic, or age-based optimization bias.
*   **Model Card Registry**: Explanations of underlying formulas, simulation guardrails, and version limits.
*   **Operations Metrics**: Live KPIs on simulation volumes, break-even operating costs, and database performance.

---

## 6. Functional Capabilities Mapping
- **No Direct Financial Advisory**: In compliance with regulatory standards, Aura does not recommend individual ticker symbols, stock picks, or execute automated commercial brokerage transactions. It serves as an interactive educational simulation platform.
- **Separation of Concerns**: Mathematical algorithms handle the compounding compounding interest, progression brackets, and mortgage interest equations; AI is strictly utilized as a translation layer for summaries, educational interpretations, and user feedback synthesis.
