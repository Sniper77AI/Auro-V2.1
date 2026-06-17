-- ==========================================
-- AURA PHASE 2A: FOUNDATIONAL DATABASE SCHEMA
-- PostgreSQL with Supabase Auth & Row Level Security
-- ==========================================

-- Enable Pgcrypto if needed for advanced hashes
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USER ROLES TABLE
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'auditor', 'governance_admin', 'super_admin')) DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for authentication search optimization
CREATE INDEX IF NOT EXISTS idx_user_roles_auth ON public.user_roles(auth_user_id);

-- 2. SECURE PII USER IDENTITY
CREATE TABLE IF NOT EXISTS public.user_identity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL, -- Stored encrypted at backend/database level
    last_name TEXT NOT NULL,  -- Stored encrypted at backend/database level
    email TEXT NOT NULL UNIQUE,     -- Stored encrypted or hashed separately
    phone TEXT,               -- Optional, encrypted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for searching user identity
CREATE INDEX IF NOT EXISTS idx_user_identity_auth ON public.user_identity(auth_user_id);

-- 3. USER PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL UNIQUE REFERENCES public.user_roles(auth_user_id) ON DELETE CASCADE,
    display_name VARCHAR(150) NOT NULL,
    state VARCHAR(2) NOT NULL DEFAULT 'CA',
    country VARCHAR(100) NOT NULL DEFAULT 'United States',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    risk_preference VARCHAR(50) NOT NULL CHECK (risk_preference IN ('conservative', 'moderate', 'aggressive')) DEFAULT 'moderate',
    retirement_target_age INT NOT NULL DEFAULT 65 CHECK (retirement_target_age BETWEEN 18 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_auth ON public.profiles(auth_user_id);

-- 4. FINANCIAL TWINS (Aggregations)
CREATE TABLE IF NOT EXISTS public.financial_twins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    net_worth NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    monthly_income NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    monthly_expenses NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    financial_readiness_score INT NOT NULL DEFAULT 0 CHECK (financial_readiness_score BETWEEN 0 AND 100),
    plan_health INT NOT NULL DEFAULT 0 CHECK (plan_health BETWEEN 0 AND 100),
    profile_completeness INT NOT NULL DEFAULT 0 CHECK (profile_completeness BETWEEN 0 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. ASSETS
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('cash', 'retirement', 'brokerage', 'real_estate', 'other')),
    asset_name VARCHAR(255) NOT NULL,
    current_value NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (current_value >= 0),
    growth_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0500 CHECK (growth_rate BETWEEN -1.0000 AND 1.0000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assets_profile ON public.assets(profile_id);

-- 6. LIABILITIES
CREATE TABLE IF NOT EXISTS public.liabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    liability_type VARCHAR(50) NOT NULL CHECK (liability_type IN ('mortgage', 'student_loan', 'auto_loan', 'credit_card', 'other')),
    liability_name VARCHAR(255) NOT NULL,
    current_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (current_balance >= 0),
    interest_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0500 CHECK (interest_rate BETWEEN 0.0000 AND 2.0000),
    monthly_payment NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (monthly_payment >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_liabilities_profile ON public.liabilities(profile_id);

-- 7. GOALS
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('retirement', 'property', 'education', 'debt_free', 'other')),
    goal_name VARCHAR(255) NOT NULL,
    target_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (target_amount >= 0),
    target_date VARCHAR(50) NOT NULL, -- Date or year ISO format
    current_progress NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (current_progress >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'deferred')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_goals_profile ON public.goals(profile_id);

-- 8. REGIONAL STATE ASSUMPTIONS
CREATE TABLE IF NOT EXISTS public.state_assumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_code VARCHAR(2) NOT NULL UNIQUE,
    state_name VARCHAR(150) NOT NULL,
    effective_tax_rate NUMERIC(5,4) NOT NULL CHECK (effective_tax_rate BETWEEN 0.0000 AND 0.5000),
    property_tax_rate NUMERIC(5,4) NOT NULL CHECK (property_tax_rate BETWEEN 0.0000 AND 0.1000),
    cost_of_living_index NUMERIC(4,2) NOT NULL CHECK (cost_of_living_index > 0),
    appreciation_rate NUMERIC(5,4) NOT NULL CHECK (appreciation_rate BETWEEN -0.1000 AND 0.3000),
    retirement_factor NUMERIC(4,2) NOT NULL DEFAULT 1.00 CHECK (retirement_factor > 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable Row-Level Security on all public tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_twins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_assumptions ENABLE ROW LEVEL SECURITY;


-- 1. Helper Function to Get Active Role In Token Claim/Database Match
CREATE OR REPLACE FUNCTION public.get_auth_role(user_id UUID)
RETURNS VARCHAR AS $$
BEGIN
    RETURN (SELECT role FROM public.user_roles WHERE auth_user_id = user_id LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. USER ROLES Policies
CREATE POLICY "Users can view their own role" 
    ON public.user_roles FOR SELECT 
    USING (auth.uid() = auth_user_id OR public.get_auth_role(auth.uid()) IN ('super_admin', 'governance_admin'));

CREATE POLICY "Only super admins can write roles" 
    ON public.user_roles FOR ALL 
    USING (public.get_auth_role(auth.uid()) = 'super_admin');


-- 3. USER IDENTITY (PII Vault) Policies
CREATE POLICY "PII Customer Access" 
    ON public.user_identity FOR SELECT 
    USING (auth.uid() = auth_user_id OR public.get_auth_role(auth.uid()) = 'super_admin');

CREATE POLICY "PII Self Update" 
    ON public.user_identity FOR ALL 
    USING (auth.uid() = auth_user_id OR public.get_auth_role(auth.uid()) = 'super_admin');

-- Auditors are STRICTLY FORBIDDEN from viewing user_identity (PII) table. No policy permits Auditor access.
-- Governance admins are FORBIDDEN unless under specific break-glass procedures (handled outside DB, or restricted here).


-- 4. PROFILES Policies
CREATE POLICY "Profile self access" 
    ON public.profiles FOR ALL 
    USING (auth.uid() = auth_user_id OR public.get_auth_role(auth.uid()) IN ('super_admin', 'governance_admin'));

CREATE POLICY "Auditors can query core statistics across profiles" 
    ON public.profiles FOR SELECT 
    USING (public.get_auth_role(auth.uid()) = 'auditor');


-- 5. FINANCIAL TWINS, ASSETS, LIABILITIES, GOALS Policies
-- Users can read/write their own records mapped via profile_id
CREATE POLICY "Customer twin isolation"
    ON public.financial_twins FOR ALL
    USING (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR public.get_auth_role(auth.uid()) IN ('super_admin', 'governance_admin'));

CREATE POLICY "Customer assets isolation"
    ON public.assets FOR ALL
    USING (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR public.get_auth_role(auth.uid()) IN ('super_admin', 'governance_admin'));

CREATE POLICY "Customer liabilities isolation"
    ON public.liabilities FOR ALL
    USING (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR public.get_auth_role(auth.uid()) IN ('super_admin', 'governance_admin'));

CREATE POLICY "Customer goals isolation"
    ON public.goals FOR ALL
    USING (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR public.get_auth_role(auth.uid()) IN ('super_admin', 'governance_admin'));

-- Auditors can read these for analytics metrics but cannot access identity matching names
CREATE POLICY "Auditors analytical access to metrics"
    ON public.financial_twins FOR SELECT USING (public.get_auth_role(auth.uid()) = 'auditor');

CREATE POLICY "Auditors analytical access to asset classes"
    ON public.assets FOR SELECT USING (public.get_auth_role(auth.uid()) = 'auditor');

CREATE POLICY "Auditors analytical access to liability profiles"
    ON public.liabilities FOR SELECT USING (public.get_auth_role(auth.uid()) = 'auditor');

CREATE POLICY "Auditors analytical access to goals progress"
    ON public.goals FOR SELECT USING (public.get_auth_role(auth.uid()) = 'auditor');


-- 6. STATE ASSUMPTIONS Policies
CREATE POLICY "General reading for state assumptions" 
    ON public.state_assumptions FOR SELECT 
    TO PUBLIC 
    USING (true);

CREATE POLICY "Only governance admins or super admins can configure state assumptions" 
    ON public.state_assumptions FOR ALL 
    USING (public.get_auth_role(auth.uid()) IN ('governance_admin', 'super_admin'));
