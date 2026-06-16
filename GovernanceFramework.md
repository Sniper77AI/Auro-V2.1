# Governance & Transparency Framework - Aura V2.2

This framework details how Aura maintains compliance, addresses systemic biases, ensures transparency, and establishes robust escalation and oversight paths.

---

## 1. Compliance Guidelines
*   **Educational Scenario Analysis Only**: Aura is strictly an educational tool. It does not provide professional tax, legal, or investment advisory services. It does not solicit, recommend, list, or broker individual equities or securities.
*   **No Transactional Capabilities**: The application contains no programmatic connections to commercial brokerage suites, ensuring no automated executions can occur.
*   **Clear Disclaimers**: Every simulation view must feature an explicit, unambiguous disclosure outlining the simulation limitations.

---

## 2. Systemic Bias Evaluation Metrics

To guarantee fair treatment across all demographics, Aura's model auditors continuously evaluate variance margins across multiple profiles.

### 1. Age-Based Bias Filters
-   **Risk**: Algorithms might over-index on standard retirement projections, automatically steering younger users to aggressive market portfolios while dismissing short-term capital liquidity needs (such as real estate down payments).
-   **Mitigation**: The system models a multi-objective optimization matrix, balancing liquid safety buffers against aggressive compounding growth tracks.

### 2. Income-Level Bias Filters
-   **Risk**: Low-to-moderate-income (LMI) users might be nudged toward savings rates that neglect essential cash-flow needs.
-   **Mitigation**: Standard baseline algorithms adjust discretionary targets based on the user's declared basic necessities, preventing recommendations of impractical, high savings rates for vulnerable households.

### 3. State/Location Bias Filters
-   **Risk**: High-cost-of-living state policies might skew federal tax advantages, or state property laws might disproportionately penalize renters.
-   **Mitigation**: Aura uses state-specific progression libraries, incorporating local deductions, median values, and property tax policies.

### 4. Family Status Bias Filters
-   **Risk**: Projections might favor traditional nuclear household frameworks, creating inaccurate tax deductions or savings signals for single parent structures.
-   **Mitigation**: Custom dependent configurations model head-of-household filing status, child credits, and flexible education parameters.

### 5. Debt Burden Bias Filters
-   **Risk**: Overly rigid debt advice could default to purely logical "payoff everything immediately" signals, leaving users without any liquid cash, which raises the risk of immediate default during an unexpected emergency.
-   **Mitigation**: Aura enforces cash-flow thresholds that secure an emergency fund buffer before directing excess money toward debt reduction.

### 6. Retirement Stage Bias Filters
-   **Risk**: Pre-retirees might receive highly optimistic projections that fail to stress-test sequence-of-returns risks or healthcare cost trends.
-   **Mitigation**: Retirement models include sequence-of-returns scenarios and adjust healthcare inflation rates based on longevity estimates.

### 7. Risk Tolerance Bias Filters
-   **Risk**: Conservative profiles could be locked into low-yield setups that guarantee purchasing power decay due to inflation.
-   **Mitigation**: Aura displays a comparative "Purchasing Power Risk" metric alongside standard equity market volatility alerts.

### 8. Globalization & Internationalization Expansion
-   **Risk**: Applying typical U.S. financial concepts (such as Roth 401ks) to international citizens, resulting in irrelevant or incorrect projections.
-   **Mitigation**: Abstract the core simulation engine from localized tax rules, enabling modular integration with international structures (e.g., UK ISA, Canadian TFSA, Australian Superannuation).

---

## 3. Human-in-the-Loop Mitigations

Aura implements automatic threshold triaging to escalate anomalous cases:

1.  **Low-Confidence Alerts**: Triggered when local municipality index values are missing or are highly volatile (e.g., dynamic property tax shifts). This prompts the system to display a warning stating: *"Standard regional indices unavailable. Calculation based on state averages."*
2.  **Human Override Log**: Provides an escalation path for administrative reviewers to manually adjust assumptions on the `assumptions_library` table if systemic computation drift is identified.
3.  **Active Bias Audit**: Automated cron jobs trigger synthetic profiles across various zip codes and income tiers quarterly to monitor outcomes for performance disparities.
