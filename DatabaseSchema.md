# Database Schema Design - Aura V2.2

This document specifies the PostgreSQL/Supabase physical data warehouse schema designed to support the Digital Financial Twin, our life-planning solvers, logging, and feedback recalibration.

---

## 1. Entity-Relationship Conceptual Diagram

```
 [user_roles] <--- (M:N) ---> [users] <--- (1:1) ---> [profiles]
                                │   │
                                │   ├──> [notifications]
                                │   └──> [localization_settings]
                                │
                                └──> [financial_twins]
                                        │
                                        ├──> [income_sources]
                                        ├──> [expenses]
                                        ├──> [assets]
                                        ├──> [liabilities]
                                        └──> [goals]
                                                │
                                                └──> [simulations]
                                                        │
                                                        └──> [simulation_results]
                                                                │
                                                                └──> [feedback]

 [assumptions_library] <------+
 [decision_modules] <---------+---> [risk_events] [model_cards]
 [governance_events] <--------+
 [admin_actions] <------------+
 [audit_log] (System wide log trail)
```

---

## 2. Table Schemas, RLS, and Columns

### Table 1: `users`
*   **Purpose**: Core authentication table (usually managed by Supabase Auth / Firebase).
*   **Primary Key**: `id` UUID Standard.
*   **Columns**:
    *   `id` UUID Default `gen_random_uuid()` PRIMARY KEY
    *   `email` VARCHAR(255) UNIQUE NOT NULL
    *   `created_at` TIMESTAMPTZ DEFAULT NOW()
*   **Indexes**: `idx_users_email` (B-Tree on `email`).
*   **RLS Rule**: Enforce `auth.uid() = id`. Users can only view their own authentication records.

### Table 2: `user_roles`
*   **Purpose**: Roles mapping layer for Role-Based Access Control.
*   **Columns**:
    *   `user_id` UUID FK REFERENCES `users(id)` ON DELETE CASCADE
    *   `role` VARCHAR(50) CHECK (`role` IN ('customer', 'auditor', 'governance_admin', 'super_admin'))
*   **Primary Key**: `(user_id, role)`
*   **Indexes**: `idx_user_roles_user` (B-Tree).
*   **RLS Rule**: Read allowed to authenticated users; write allowed only to administrative systems.

### Table 3: `profiles`
*   **Purpose**: Personal demographic state.
*   **Columns**:
    *   `id` UUID PRIMARY KEY FK REFERENCES `users(id)` ON DELETE CASCADE
    *   `full_name` VARCHAR(255)
    *   `avatar_url` VARCHAR(512)
    *   `updated_at` TIMESTAMPTZ DEFAULT NOW()
*   **RLS Rule**: Read/write allowed only to owning user (`auth.uid() = id`).

### Table 4: `financial_twins`
*   **Purpose**: Master configuration for household representation.
*   **Columns**:
    *   `id` UUID PRIMARY KEY Default `gen_random_uuid()`
    *   `user_id` UUID FK REFERENCES `users(id)` UNIQUE ON DELETE CASCADE
    *   `age` INTEGER CHECK (`age` >= 0 AND `age` < 120)
    *   `monthly_expenses` NUMERIC(12,2) DEFAULT 0.00
    *   `dependents` INTEGER DEFAULT 0
    *   `retirement_age` INTEGER DEFAULT 65
    *   `risk_tolerance` VARCHAR(50) CHECK (`risk_tolerance` IN ('conservative', 'moderate', 'aggressive'))
    *   `tax_state` VARCHAR(2) DEFAULT 'CA'
    *   `country` VARCHAR(50) DEFAULT 'United States'
    *   `currency` VARCHAR(3) DEFAULT 'USD'
    *   `updated_at` TIMESTAMPTZ DEFAULT NOW()
*   **Indexes**: `idx_twins_user` on `user_id`.
*   **RLS Rule**: Owner read/write: `auth.uid() = user_id`.

### Table 5: `income_sources`
*   **Purpose**: Active cash-inflow vectors.
*   **Columns**:
    *   `id` UUID PRIMARY KEY Default `gen_random_uuid()`
    *   `twin_id` UUID FK REFERENCES `financial_twins(id)` ON DELETE CASCADE
    *   `name` VARCHAR(150) NOT NULL
    *   `amount` NUMERIC(15,2) NOT NULL
    *   `frequency` VARCHAR(50) DEFAULT 'annual' CHECK (`frequency` IN ('weekly', 'monthly', 'annual', 'one-time'))
    *   `type` VARCHAR(50) DEFAULT 'salary' CHECK (`type` IN ('salary', 'dividends', 'rent', 'business', 'other'))
*   **Indexes**: `idx_income_twin` on `twin_id`.
*   **RLS Rule**: Filtered via `twin_id` owned by the authenticated caller.

### Table 6: `expenses`
*   **Purpose**: Granular household outlays.
*   **Columns**:
    *   `id` UUID PRIMARY KEY Default `gen_random_uuid()`
    *   `twin_id` UUID FK REFERENCES `financial_twins(id)` ON DELETE CASCADE
    *   `category` VARCHAR(100)
    *   `monthly_amount` NUMERIC(12,2) NOT NULL
*   **RLS Rule**: Owner access only.

### Table 7: `assets`
*   **Purpose**: Core asset ledgers featuring dynamic compounding tracking.
*   **Columns**:
    *   `id` UUID PRIMARY KEY Default `gen_random_uuid()`
    *   `twin_id` UUID FK REFERENCES `financial_twins(id)` ON DELETE CASCADE
    *   `name` VARCHAR(150) NOT NULL
    *   `amount` NUMERIC(15,2) NOT NULL
    *   `type` VARCHAR(50) CHECK (`type` IN ('cash', 'retirement', 'brokerage', 'real_estate', 'other'))
    *   `annual_growth` NUMERIC(5,4) DEFAULT 0.0500
*   **RLS Rule**: Owner access only.

### Table 8: `liabilities`
*   **Purpose**: Debt structures.
*   **Columns**:
    *   `id` UUID PRIMARY KEY Default `gen_random_uuid()`
    *   `twin_id` UUID FK REFERENCES `financial_twins(id)` ON DELETE CASCADE
    *   `name` VARCHAR(150) NOT NULL
    *   `amount` NUMERIC(15,2) NOT NULL
    *   `interest_rate` NUMERIC(5,4) NOT NULL
    *   `monthly_payment` NUMERIC(12,2) NOT NULL
    *   `type` VARCHAR(50) CHECK (`type` IN ('credit_card', 'student_loan', 'auto_loan', 'mortgage', 'other'))
*   **RLS Rule**: Owner access only.

### Table 9: `goals`
*   **Purpose**: Target wealth landmarks.
*   **Columns**:
    *   `id` UUID PRIMARY KEY Default `gen_random_uuid()`
    *   `twin_id` UUID FK REFERENCES `financial_twins(id)` ON DELETE CASCADE
    *   `title` VARCHAR(150) NOT NULL
    *   `target_amount` NUMERIC(15,2) NOT NULL
    *   `target_year` INTEGER NOT NULL
    *   `priority` VARCHAR(20) CHECK (`priority` IN ('must_have', 'nice_to_have', 'flex'))
    *   `category` VARCHAR(50)
*   **RLS Rule**: Owner access only.

### Table 10: `simulations`
*   **Purpose**: Scenario envelopes containing parameters.
*   **Columns**:
    *   `id` UUID PRIMARY KEY Default `gen_random_uuid()`
    *   `user_id` UUID FK REFERENCES `users(id)` ON DELETE CASCADE
    *   `module_type` VARCHAR(50) NOT NULL
    *   `scenario_name` VARCHAR(255) NOT NULL
    *   `inputs_json` JSONB NOT NULL
    *   `created_at` TIMESTAMPTZ DEFAULT NOW()
*   **Indexes**: `idx_sims_user_module` on `(user_id, module_type)`.
*   **RLS Rule**: Owner access only.

### Table 11: `simulation_results`
*   **Purpose**: Detailed multi-year deterministic run projections.
*   **Columns**:
    *   `id` UUID PRIMARY KEY Default `gen_random_uuid()`
    *   `simulation_id` UUID FK REFERENCES `simulations(id)` ON DELETE CASCADE
    *   `decision_health_score` INTEGER CHECK (`decision_health_score` BETWEEN 0 AND 100)
    *   `net_worth_progression` NUMERIC(15,2)[] NOT NULL
    *   `risk_score` INTEGER CHECK (`risk_score` BETWEEN 0 AND 100)
    *   `confidence_score` INTEGER CHECK (`confidence_score` BETWEEN 0 AND 100)
    *   `explanations_json` JSONB
*   **RLS Rule**: Owner access only.

### Table 12: `feedback`
*   **Purpose**: Helpfulness logs collected from consumers post-simulation run.
*   **Columns**:
    *   `id` UUID PRIMARY KEY Default `gen_random_uuid()`
    *   `simulation_id` UUID FK REFERENCES `simulations(id)` ON DELETE CASCADE
    *   `is_helpful` BOOLEAN NOT NULL
    *   `reason` VARCHAR(50) CHECK (`reason` IN ('too_optimistic', 'too_conservative', 'missing_information', 'confusing_explanation', 'accurate_trajectory', 'helpful_breakdown'))
    *   `notes` TEXT
    *   `created_at` TIMESTAMPTZ DEFAULT NOW()
*   **Indexes**: `idx_fdbk_helpful` on `is_helpful`.
*   **RLS Rule**: Create allowed to authenticated owners; administrative analytics read-only access.

### Table 13: `governance_events`
*   **Purpose**: Logs of drift alerts, bias flags, and model deviations.
*   **Columns**:
    *   `id` UUID PRIMARY KEY Default `gen_random_uuid()`
    *   `timestamp` TIMESTAMPTZ DEFAULT NOW()
    *   `type` VARCHAR(100) NOT NULL
    *   `severity` VARCHAR(20) CHECK (`severity` IN ('low', 'medium', 'high', 'critical'))
    *   `message` TEXT NOT NULL
    *   `status` VARCHAR(50) DEFAULT 'unresolved' CHECK (`status` IN ('unresolved', 'under_review', 'resolved'))
*   **RLS Rule**: Normal users: None. Admin roles ONLY.

### Table 14: `audit_log`
*   **Purpose**: Tamper-evident session and administrative actions recording.
*   **Columns**:
    *   `id` UUID PRIMARY KEY Default `gen_random_uuid()`
    *   `timestamp` TIMESTAMPTZ DEFAULT NOW()
    *   `user_email` VARCHAR(255)
    *   `action` VARCHAR(100) NOT NULL
    *   `source` VARCHAR(100) NOT NULL
    *   `status` VARCHAR(50) NOT NULL
    *   `description` TEXT
*   **Indexes**: `idx_aud_time` (B-tree on `timestamp` DESC).
*   **RLS Rule**: Read allowed solely to roles `auditor` and `super_admin`.

### Table 15: `notifications`
*   **Purpose**: Contextual system signals pushed to users.
*   **Columns**:
    *   `id` UUID PRIMARY KEY Default `gen_random_uuid()`
    *   `user_id` UUID FK REFERENCES `users(id)` ON DELETE CASCADE
    *   `title` VARCHAR(255) NOT NULL
    *   `message` TEXT NOT NULL
    *   `is_read` BOOLEAN DEFAULT FALSE
    *   `created_at` TIMESTAMPTZ DEFAULT NOW()
*   **RLS Rule**: Owner access only (`auth.uid() = user_id`).

### Table 16: `localization_settings`
*   **Purpose**: Local tax rates, language bindings, and standard municipal indexes.
*   **Columns**:
    *   `id` UUID PRIMARY KEY Default `gen_random_uuid()`
    *   `user_id` UUID FK REFERENCES `users(id)` ON DELETE CASCADE
    *   `locale` VARCHAR(10) DEFAULT 'en-US'
    *   `currency` VARCHAR(3) DEFAULT 'USD'
    *   `active_state` VARCHAR(2) DEFAULT 'CA'
*   **RLS Rule**: Owner access only.

### Table 17: `risk_events`
*   **Purpose**: List of financial risk events evaluated dynamically (e.g., market decline stress test).
*   **Columns**:
    *   `id` UUID PRIMARY KEY Default `gen_random_uuid()`
    *   `simulation_id` UUID FK REFERENCES `simulations(id)` ON DELETE CASCADE
    *   `risk_name` VARCHAR(150) NOT NULL
    *   `probability_percent` INTEGER CHECK (`probability_percent` BETWEEN 0 AND 100)
    *   `impact_rating` VARCHAR(50) CHECK (`impact_rating` IN ('negligible', 'moderate', 'severe'))
*   **RLS Rule**: Owner read only; admin read/write.

### Table 18: `model_cards`
*   **Purpose**: Formal AI and deterministic model descriptions.
*   **Columns**:
    *   `id` UUID PRIMARY KEY Default `gen_random_uuid()`
    *   `model_version` VARCHAR(50) NOT NULL
    *   `description` TEXT NOT NULL
    *   `limitations` TEXT NOT NULL
    *   `risk_factors` TEXT NOT NULL
    *   `deployed_at` TIMESTAMPTZ DEFAULT NOW()
*   **RLS Rule**: Public/Authenticate read allowed; admin write allowed.

### Table 19: `assumptions_library`
*   **Purpose**: Master list of indexes (inflation indexes, tax rates).
*   **Columns**:
    *   `id` UUID PRIMARY KEY Default `gen_random_uuid()`
    *   `category` VARCHAR(100) NOT NULL
    *   `key_name` VARCHAR(100) UNIQUE NOT NULL
    *   `value` NUMERIC(10,5) NOT NULL
    *   `effective_date` DATE NOT NULL
*   **RLS Rule**: All authenticated read; admin write.

### Table 20: `decision_modules`
*   **Purpose**: Record listing of active decision engines.
*   **Columns**:
    *   `id` VARCHAR(50) PRIMARY KEY
    *   `name` VARCHAR(255) NOT NULL
    *   `version` VARCHAR(10) NOT NULL
    *   `is_active` BOOLEAN DEFAULT TRUE
*   **RLS Rule**: All authenticated read; admin write.

### Table 21: `admin_actions`
*   **Purpose**: Records physical configuration modifications by system administrators.
*   **Columns**:
    *   `id` UUID PRIMARY KEY Default `gen_random_uuid()`
    *   `admin_id` UUID FK REFERENCES `users(id)`
    *   `action_type` VARCHAR(100) NOT NULL
    *   `details_json` JSONB
    *   `created_at` TIMESTAMPTZ DEFAULT NOW()
*   **RLS Rule**: Admin read-only. Normal users barred.

---

## 3. Database Scalability & Retention Notes
- **JSONB for Inputs**: Simulation configurations are preserved inside `inputs_json` in `simulations`. This avoids cascading table rewrites as parameters adapt.
- **Partitioning Plan**: The `audit_log` table is highly active; we recommend range partitioning based on `timestamp` monthly.
- **Retention Schedule**:
    - `audit_log`: Retained for 7 years to meet fiduciary requirements.
    - `feedback`: Retained indefinitely for model refinement analytics.
    - `simulations` / `simulation_results`: Cascade-deleted when user deletes their account to honor strict privacy standards.
