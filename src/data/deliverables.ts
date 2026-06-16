/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProductDeliverable } from "../types";

export const AURA_DELIVERABLES: ProductDeliverable[] = [
  {
    id: "1",
    title: "Product Architecture",
    category: "Architecture",
    description: "Multi-layered component block diagram illustrating the interaction of internal engines, ingestion channels, and guardrails.",
    icon: "Layers",
    sections: [
      {
        title: "Platform Core Layers",
        content: "Aura V2.1 is designed around a decoupled micro-architecture that segregates front-end visualizations from core mathematical modeling engines. This ensures high throughput, low latency, and deterministic output safety.",
        bullets: [
          "Presentation Layer: High-density React Client featuring sub-second React-to-SVG canvas re-renders and local state-cache managers.",
          "FDI Core Engines: Hosted container microservices supporting Financial Twin computation, Monte Carlo stochastic models, and custom goal linear programming.",
          "Oversight & Moderation Mesh: Dynamic middleware running real-time bias detectors, limitation enforcement algorithms, and credential isolation.",
          "Durable persistence: High-efficiency data adapters routing to Cloud SQL PostgreSQL systems, isolated with Row-Level Security."
        ]
      },
      {
        title: "Heuristic and Generative Orchestration",
        content: "The core platform relies on two specialized processors: the Mathematical Projection Processor (non-generative, 100% deterministic rules for tax, compounding, and amortization) and the Generative Explainability Processor (Gemini LLM for human-readable summaries and contextual translations of raw coordinates, never raw data computation directly to prevent hallucination errors)."
      }
    ]
  },
  {
    id: "2",
    title: "Information Architecture",
    category: "Architecture",
    description: "Flow of cash, liabilities, and scenario modifications as they pass from ingestion to projection.",
    icon: "Network",
    sections: [
      {
        title: "Ingestion & Analysis Pipeline",
        content: "1. Data Capture -> Financial Twin Serialization -> State Tax & Amortization Adapters -> Projection Simulator (Deterministic Calculations) -> Governance Bias/Risk Flag Filters -> Gemini Explainability Parsing -> Final UI Dashboard Display.",
        bullets: [
          "Data Capture: Explicit inputs (W2, credit lines, estate goals) are serialized into the Financial Twin schema.",
          "Deterministic Simulation: Calculations run on double-precision floats natively inside the calculation engine, utilizing fixed state rules.",
          "Explanation Engine: Feeds raw numeric changes and trade-offs directly to the system explainers to craft immediate, empathetic human advice."
        ]
      }
    ]
  },
  {
    id: "3",
    title: "User Personas",
    category: "Strategy",
    description: "Detailed operational profiles to design personalization triggers and system behavior.",
    icon: "Users",
    sections: [
      {
        title: "Persona A: Sarah & David (Family Planners, Ages 32 & 34)",
        content: "Household income of $165k/year, wanting to buy their first home in Aurora, IL while saving for two children's education and maintaining 401(k) contributions.",
        bullets: [
          "Primary Friction: Anxious about overextending their DTI ratio, confused about downpayment strategies (20% vs. 5% premium with PMI).",
          "Aura Behavior: Demonstrates rent-vs-buy curves over 15 years, showing how a 5% downpayment reduces their Retirement Readiness index by 1.4 years."
        ]
      },
      {
        title: "Persona B: Marcus (Pre-Retiree / Tech Lead, Age 52)",
        content: "High-earner ($240k Base), looking to transition to secondary consulting or a startup by age 55 or plan early semi-retirement.",
        bullets: [
          "Primary Friction: Unsure of asset allocation drawing risk, tax implications on capital gains vs. retirement accounts, and COBRA health expenses.",
          "Aura Behavior: Models career relocation and retirement drawdowns with dynamic tax bracket shifting, showing cash conservation paths."
        ]
      }
    ]
  },
  {
    id: "4",
    title: "User Journeys",
    category: "Strategy",
    description: "Core scenario walkthrough of a Home Purchase Planning module execution from initiation to resolution.",
    icon: "GitCommit",
    sections: [
      {
        title: "The Home Buying Path",
        content: "Step 1: User logs into Aura -> System presents current Decision Score (74/100) -> User launches Home Purchase Simulator. Step 2: User sets price slide to $650,000 and selects state 'Texas'. Step 3: Aura models state property tax rates (1.6%), calculates mortgage payment and compares against the Twin's current cash reserves.",
        bullets: [
          "Actionable Warning: System flags a 12% drop in emergency reserve, falling below the designated 6-month buffer.",
          "Preservation Pathway: Aura suggests an optimal home buy budget of $540,000, maintaining primary goals.",
          "Empowering Decision: User locks the simulation, creating a persistent 'Optimized First Home Goal'."
        ]
      }
    ]
  },
  {
    id: "5",
    title: "Site Map",
    category: "Operations",
    description: "Structural organization of individual route groupings within the Aura FDI environment.",
    icon: "Map",
    sections: [
      {
        title: "Aura V2.1 Global Map Nodes",
        content: "Root App -> (1) Wealth Command Center [Default Home] | (2) Financial Twin Setup [Configuration Portal] | (3) Interactive Decision Simulations [Career, Home, Car, Retirement, Debt, college, Estate] | (4) Governance & Compliance Control Panel | (5) Advanced Product Architecture Explorer."
      }
    ]
  },
  {
    id: "6",
    title: "Navigation Tree",
    category: "Operations",
    description: "Structural hierarchy of navigation components and routing states.",
    icon: "Waypoints",
    sections: [
      {
        title: "Primary Left Navigation Menu",
        content: "Designed for immediate, thumb-friendly viewport toggling, with sub-nodes and settings categorized by tactical focus.",
        bullets: [
          "Level 1: Dashboard (Strategic core) -> Opportunities list.",
          "Level 2: Financial Twin Hub -> Incomes, Assets, Liabilities configurations.",
          "Level 3: Simulation Suite -> 7 launchable projection modules.",
          "Level 4: Governance Hub -> Dispute resolution logs + model cards.",
          "Level 5: Product Blueprint -> Comprehensive list of 20 deliverables."
        ]
      }
    ]
  },
  {
    id: "7",
    title: "Screen Hierarchy",
    category: "Operations",
    description: "Component layout, density mappings, and typographic sizing hierarchies.",
    icon: "ListCollapse",
    sections: [
      {
        title: "View layout grid rules",
        content: "Aura implements an ultra-premium layout centered on responsive content grids, keeping visual noise low.",
        bullets: [
          "Header Rails: Global title, context switchers, local date, and active session identity.",
          "Left-hand rail: Fixed 240px clean slate list with high contrast selected state indicators.",
          "Hero Cards: Clean 3-grid layout displaying Score metrics in 32px display font (Space Grotesk style) and supporting text in 14px body text.",
          "Interactive Playgrounds: Split-screen desktop design with configuration controls on the left, full interactive SVG projections and Monte Carlo outputs on the right."
        ]
      }
    ]
  },
  {
    id: "8",
    title: "UX Wireframes",
    category: "Strategy",
    description: "Low-fidelity component wireframes mapped to high-fidelity SVG views in Aura V2.1.",
    icon: "Grid",
    sections: [
      {
        title: "Command Center Layout Wireframe",
        content: "[ HEADER RAIL: User Badge | Date | Session Status ]\n[ THREE-CELL SCORE BOARD: Health Score Card (30%) | Tactical Advantage (40%) | Direct Command (30%) ]\n[ MAIN SECTION COLUMN: Dynamic Tradeoff chart | Proactive Alerts | Alternate Paths ]"
      }
    ]
  },
  {
    id: "9",
    title: "Database Schema",
    category: "governance",
    description: "Production SQL declarations for Postgres, supporting Row Level Security and index constraints.",
    icon: "Database",
    sections: [
      {
        title: "PostgreSQL Database Architecture & Tables",
        content: "Strictly isolated schemas supporting referential integrity. Here is the production schema script planned for integration:",
        bullets: [
          "Table: users (id UUID PRIMARY KEY, email TEXT UNIQUE, created_at TIMESTAMPTZ, premium_tier BOOLEAN)",
          "Table: financial_twin (id UUID PRIMARY KEY, user_id UUID REFERENCES users, age INT, monthly_expenses NUMERIC, tax_state VARCHAR(2), retirement_age INT, updated_at TIMESTAMPTZ)",
          "Table: incomes (id UUID PRIMARY KEY, twin_id UUID REFERENCES financial_twin, name VARCHAR, amount NUMERIC, frequency VARCHAR, type VARCHAR)",
          "Table: assets (id UUID PRIMARY KEY, twin_id UUID REFERENCES financial_twin, name VARCHAR, amount NUMERIC, type VARCHAR, annual_growth NUMERIC)",
          "Table: liabilities (id UUID PRIMARY KEY, twin_id UUID REFERENCES financial_twin, name VARCHAR, amount NUMERIC, interest_rate NUMERIC, monthly_payment NUMERIC, type VARCHAR)",
          "Table: simulations (id UUID PRIMARY KEY, user_id UUID REFERENCES users, type VARCHAR, params JSONB, timestamp TIMESTAMPTZ)",
          "Table: feedback (id UUID PRIMARY KEY, simulation_id UUID, rating VARCHAR, reason VARCHAR, comment TEXT, created_at TIMESTAMPTZ)",
          "Table: governance_events (id UUID PRIMARY KEY, timestamp TIMESTAMPTZ, type VARCHAR, severity VARCHAR, message TEXT, status VARCHAR)"
        ]
      }
    ]
  },
  {
    id: "10",
    title: "ER Diagram",
    category: "governance",
    description: "Cardinality and entity mapping displaying 1-to-M data modeling constraints.",
    icon: "GitFork",
    sections: [
      {
        title: "Entity-Relationship Cardinality",
        content: "Users (1) ---- (1) Financial Twin\nUsers (1) ---- (M) Simulations\nFinancial Twin (1) ---- (M) Incomes\nFinancial Twin (1) ---- (M) Assets\nFinancial Twin (1) ---- (M) Liabilities\nSimulations (1) ---- (1) Simulation_Results\nSimulations (1) ---- (M) Feedback\nGovernance_Events (1) ---- (1) Audit_Log",
        bullets: [
          "All relationships enforce Cascade Deletes to ensure compliance under global 'Right to be Forgotten' policies.",
          "Foreign keys utilize UUID v4 format to lock out brute-force enum indexing exploits."
        ]
      }
    ]
  },
  {
    id: "11",
    title: "Security & PII Architecture",
    category: "governance",
    description: "Standard definitions for AES-256 wrapping, Row-Level-Security, and audit tracking.",
    icon: "ShieldAlert",
    sections: [
      {
        title: "PII Pseudonymization Framework",
        content: "Aura handles wealth intelligence without coupling financial structures to core biographical identities. Strict separation prevents targeted breach escalation.",
        bullets: [
          "Zero Third-Party Ingestion: No automatic Plaid linkages by default; users manually populate or upload structures to retain privacy.",
          "Encrypted Assets: Sensitive numeric fields (Brokerage balances, mortgage contracts) are optionally stored as AES-256 encrypted blobs, decrypted only in-memory.",
          "System Isolation: System audit logs capture transaction steps but strip parameters, ensuring that telemetry is never a source of financial leakage."
        ]
      }
    ]
  },
  {
    id: "12",
    title: "Governance Framework",
    category: "governance",
    description: "Supervised automation protocols protecting users against volatile projections and system errors.",
    icon: "Scale",
    sections: [
      {
        title: "Escalation & Recalibration Matrix",
        content: "Aura includes explicit algorithmic governance to protect against system drift or excessive optimization risk.",
        bullets: [
          "Override Limits: If a simulation projects an asset growth rate higher than 15% ARR, the governance engine automatically overrides it to a historical baseline (6.5%) and tags the session 'Override Applied'.",
          "Low-Confidence Flagging: Complex layered decisions (e.g. Relocating, career changes, the trust setup combined) trigger visual indicators pointing to assumptions with below 75% market confidence.",
          "Manual Redress Protocol: If recommendations are consistently overridden by the user, a dispute is logged in the compliance database to retune global baselines."
        ]
      }
    ]
  },
  {
    id: "13",
    title: "Feedback & Tuning Loop",
    category: "Simulation",
    description: "The machine-learning calibration framework driven by direct end-user evaluations.",
    icon: "RefreshCw",
    sections: [
      {
        title: "Closing the Optimization Loop",
        content: "Every decision output rendered by the Wealth Command Center of Aura contains a 'Helpful/Not Helpful' rating mechanism. This data is logged to direct tuning queues.",
        bullets: [
          "Quantitative Tuning: Standardized 'Reasons' (too conservative, too aggressive, tax wrong, etc.) are compiled into categorical charts.",
          "Continuous Iteration: Weekly automated aggregations review simulations that scored 'not_helpful' to identify regional tax model bugs.",
          "A/B Validation: Dynamic A/B splits test different wording strategies (Risk-First vs. Goal-First headers) to analyze impact on user anxiety and confidence scores."
        ]
      }
    ]
  },
  {
    id: "14",
    title: "Transparency Framework",
    category: "Simulation",
    description: "Distinguishing educational financial projections from formal investment advisory statements.",
    icon: "FileCheck",
    sections: [
      {
        title: "Algorithmic Model Card & Disclaimers",
        content: "Aura is an educational decision intelligence tool, not a registered investment advisor. True transparency requires telling users how the engines come up with output curves.",
        bullets: [
          "Model Assumptions: Fully displays standard base assumptions (inflation at constant 2.5%, Social Security indexing at 2% COLA) directly on the interface.",
          "Non-Advisor Boundary: Visual and legal boundaries remain persistent, reinforcing that system recommendations are non-solicitous options.",
          "Confidence Calculation: Confidence factors on simulation outputs relate directly to historical variance of the input vector (e.g. Startup success rate is mathematically high-risk, yielding low confidence)."
        ]
      }
    ]
  },
  {
    id: "15",
    title: "Bias Monitoring Framework",
    category: "governance",
    description: "Proactive mitigations blocking ageism, geography disparities, or demographic exclusion.",
    icon: "Activity",
    sections: [
      {
        title: "Equity in Projections",
        content: "Algorithms must perform equitably across varied socioeconomic starting points. Aura ensures that high-income optimization tools do not crowd out standard debt-reduction tools.",
        bullets: [
          "Socioeconomic Parity: Opportunities prioritized by the Wealth Command Center match the user's base asset class (e.g., first suggesting emergency fund building and debt avalanche for entry-level users before estate trust structuring).",
          "State Property Equity: Property tax rates are automatically modeled dynamically, avoiding flat national averages that underrepresent housing costs in states like New Jersey, Illinois, and Texas.",
          "Age Neutrality: Projections do not terminate prematurely for senior users, implementing specialized cash drawdown logic for ages 75 to 100."
        ]
      }
    ]
  },
  {
    id: "16",
    title: "Globalization Strategy",
    category: "Strategy",
    description: "Localization hierarchy mapping US Phase 1 support to continuous Phase 2 multi-currency expansion.",
    icon: "Globe",
    sections: [
      {
        title: "Transition to Multi-Currency & Local Tax Structures",
        content: "Aura is constructed to support national expansion by separating systemic math calculations from localized variables.",
        bullets: [
          "Phase 1: Support for all 50 US States, utilizing local income tax brackets (e.g. California's progressive brackets vs. Texas's 0% state income tax) and property tax profiles.",
          "Phase 2 Foundations: Multi-currency serialization support where every asset, liability, and income has an ISO 4217 currency key.",
          "Regional Adapters: Interface interfaces support dynamic locale translation (English and Spanish, moving to French and German) and region-specific modules (e.g. ISA, Roth IRA, Superannuation)."
        ]
      }
    ]
  },
  {
    id: "17",
    title: "Scalability Strategy",
    category: "Architecture",
    description: "Methods for processing millions of simulated ledger lines dynamically with zero database lag.",
    icon: "Server",
    sections: [
      {
        title: "Caching and Projection Materialization",
        content: "Rather than repeating high-precision compounding operations on every render, Aura scales by persisting vector summaries.",
        bullets: [
          "Client-Side Interpolation: Low-level rendering runs in-memory, computing linear and exponential steps instantly inside React without hitting the database.",
          "Read-Only Replica Scaling: Cloud SQL replica servers absorb read loads for baseline regional tax lookups.",
          "State Optimization: Serializes the state of the Financial Twin into a compact 4KB JSON string, optimizing database row sizes."
        ]
      }
    ]
  },
  {
    id: "18",
    title: "ROI Assessment",
    category: "Strategy",
    description: "Empirical justifications of Financial Decision Intelligence vs. traditional bookkeeping tools.",
    icon: "TrendingUp",
    sections: [
      {
        title: "The FDI Economic Premise",
        content: "Bookkeeping platforms track past actions (e.g. 'You spent $52 in dining last night'). Aura saves the average user between $5,000 and $55,000 in lifetime waste by blocking high-risk, emotional financial decisions.",
        bullets: [
          "Value Metric A: Prevents premium home purchases that would trigger housing stress, saving thousands in transaction and refinancing penalties.",
          "Value Metric B: Accelerates high-interest debt payoffs through dynamic amortization scenario optimization, reducing unnecessary interest expense by up to 22%.",
          "Enterprise ROI: Offers employee wellness benefits for corporate sponsors, decreasing financial stress and improving focus, retention, and retirement planning metrics."
        ]
      }
    ]
  },
  {
    id: "19",
    title: "90-Day MVP Roadmap",
    category: "Strategy",
    description: "Weekly progression breakdown from architecture blueprints to stable initial public production release.",
    icon: "Calendar",
    sections: [
      {
        title: "Sprint-by-Sprint Roadmap",
        content: "Day 1 - 30: Set up PostgreSQL database tables, configure Auth schemas, and integrate core Financial Twin engines in React. Day 31 - 60: Construct first 3 Simulation Modules (Home, Car, Retirement) and active Wealth Command Center state hooks. Day 61 - 90: Implement complete Governance Auditer, Feedback loop mechanisms, and launch the Premium subscription gating layer.",
        bullets: [
          "Milestone 1 (Day 15): Core Twin calculations and state tax modeling verified.",
          "Milestone 2 (Day 45): Simulator engine supports multi-scenario side-by-side caching.",
          "Milestone 3 (Day 75): Model card and transparency disclosure overlays completed.",
          "Milestone 4 (Day 90): Alpha/Beta group user testing completed, private production launch."
        ]
      }
    ]
  },
  {
    id: "20",
    title: "MVP Scope Definition",
    category: "Strategy",
    description: "Core features selected for the initial public launch to balance speed-to-market with comprehensive utility.",
    icon: "CheckSquare",
    sections: [
      {
        title: "Included in Phase 1 MVP",
        content: "A refined subset of features centering on high-impact financial life decisions.",
        bullets: [
          "Core Financial Twin: Self-attested Income, Assets, Liabilities, and state tax selection.",
          "Life Decision Simulator: Implements fully functional Home Purchase, Vehicle Purchase, Career Relocation, and Retirement projections.",
          "Wealth Command Center: Live financial score boards, 1 top Opportunity alert, 1 Risk alert, and a singular prioritised action card.",
          "Governance & Transparency Dashboard: Complete model card view, state rule overrides, and simulation evaluation logs."
        ]
      },
      {
        title: "Post-MVP (V2.2+)",
        content: "Direct banking aggregations (Yodlee/Plaid integrations), automated investment portfolio modeling, advanced inheritance/probate tax rule calculators, and Spanish localization support."
      }
    ]
  }
];
