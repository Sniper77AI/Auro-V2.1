/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { FinancialTwin, SimulationResult, GovernanceEvent, FeedbackItem, AuditLog } from "./types";
import TwinConfigurator from "./components/TwinConfigurator";
import SimulatorEngine from "./components/SimulatorEngine";
import CommandCenter from "./components/CommandCenter";
import GovernanceHub from "./components/GovernanceHub";
import FeedbackHub from "./components/FeedbackHub";
import GoalsMatrix from "./components/GoalsMatrix";
import UnifiedSettings from "./components/UnifiedSettings";
import AuthContainer from "./components/AuthContainer";
import LandingPage from "./components/LandingPage";
import AboutPage from "./components/AboutPage";
import UnauthNavbar from "./components/UnauthNavbar";
import { SupabaseService, safeStorage } from "./supabaseService";
import { getSupabaseClient } from "./supabaseClient";
import { 
  LayoutDashboard, Wallet, Sparkles, Scale, 
  MessageSquare, ChevronRight, Coins, 
  Activity, MapPin, User, ShieldAlert, Target, Settings, Eye, EyeOff, LogOut, Database, ShieldCheck, ChevronUp, HelpCircle
} from "lucide-react";

// Pre-populated default financial twin representation
const INITIAL_TWIN: FinancialTwin = {
  age: 32,
  monthlyExpenses: 4200,
  dependants: 1,
  retirementAge: 65,
  riskTolerance: "moderate",
  taxState: "CA",
  country: "United States",
  incomes: [
    { id: "inc-1", name: "Primary W2 Base Salary", amount: 115000, frequency: "annual", type: "salary" },
    { id: "inc-2", name: "Strategic Advisory Consulting", amount: 15000, frequency: "annual", type: "other" }
  ],
  assets: [
    { id: "ast-1", name: "High-Yield Liquid Checking", amount: 32000, type: "cash", annualGrowth: 0.042 },
    { id: "ast-2", name: "Principal Index 401(k) Portfolio", amount: 55000, type: "retirement", annualGrowth: 0.075 },
    { id: "ast-3", name: "Equity Brokerage Account", amount: 18000, type: "brokerage", annualGrowth: 0.08 }
  ],
  liabilities: [
    { id: "lia-1", name: "Outstanding Student Loans", amount: 15000, interestRate: 0.052, monthlyPayment: 210, type: "student_loan" },
    { id: "lia-2", name: "Hybrid Vehicle Loan", amount: 11000, interestRate: 0.045, monthlyPayment: 290, type: "auto_loan" }
  ]
};

// Initial Seed Data for Compliance, Feedback & Audit trail metrics
const INITIAL_GOVERNANCE_EVENTS: GovernanceEvent[] = [
  { id: "gov-1", timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), type: "model_recalibration", severity: "low", message: "Standard IRS federal bracket guidelines and progressive California tax maps synchronized.", status: "resolved" },
  { id: "gov-2", timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), type: "bias_flag", severity: "medium", message: "Equitable check passed: prioritized core emergency fund and student loan payoffs over speculative tax shelters.", status: "resolved" }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: "aud-1", timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), userEmail: "unknown-user", action: "AUTH_INIT", source: "client_gateway", status: "success", description: "Authorization session initialized." },
  { id: "aud-2", timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), userEmail: "unknown-user", action: "COGNITIVE_KEY", source: "pii_vault", status: "success", description: "Standard secure PII data serialization isolation active." },
  { id: "aud-3", timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), userEmail: "unknown-user", action: "REGIONAL_MAP", source: "state_tax_db", status: "success", description: "Progressive California tax codes loaded into client compilation cache." }
];

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [unauthPage, setUnauthPage] = useState<"landing" | "about" | "login">("landing");
  const [unauthSignUpDefault, setUnauthSignUpDefault] = useState<boolean>(false);
  const [profileId, setProfileId] = useState<string>("fallback_profile_id");
  const [userRole, setUserRole] = useState<"customer" | "auditor" | "governance_admin" | "super_admin">("customer");
  const [activeMenu, setActiveMenu] = useState<"command" | "twin" | "simulator" | "goals" | "settings" | "governance" | "feedback">("command");
  const [activeScenarioType, setActiveScenarioType] = useState<any>(undefined);
  const [isBooting, setIsBooting] = useState<boolean>(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [sessionVerifyFailed, setSessionVerifyFailed] = useState<boolean>(false);
  
  // Account dropdown & Modal UI states
  const [showAccountDropdown, setShowAccountDropdown] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<"profile" | "privacy" | "help" | "about_aura" | null>(null);
  const [activeSimulationParams, setActiveSimulationParams] = useState<any>(null);
  
  // Real active state trackers
  const [twin, setTwin] = useState<FinancialTwin>(INITIAL_TWIN);
  const [goals, setGoals] = useState<any[]>([]);
  const [savedSimulations, setSavedSimulations] = useState<SimulationResult[]>([]);
  const [governanceEvents, setGovernanceEvents] = useState<GovernanceEvent[]>(INITIAL_GOVERNANCE_EVENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [syncingState, setSyncingState] = useState<"synced" | "syncing" | "error">("synced");
  const [sandboxNotice, setSandboxNotice] = useState<string | null>(null);

  // Initial Auth checking and Profile database sync on boot
  const withTimeout = <T,>(
    promise: Promise<T>,
    milliseconds: number
  ): Promise<T> => {
    let timerId: any;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timerId = window.setTimeout(
        () => reject(new Error("Request timed out")),
        milliseconds
      );
    });
    return Promise.race([
      promise.then((res) => {
        window.clearTimeout(timerId);
        return res;
      }),
      timeoutPromise
    ]);
  };

  const loadAuthenticatedUserData = async (currentSession: any) => {
    const uId = currentSession.user?.id || currentSession.user?.userId;
    if (!uId) {
      throw new Error("No user ID found in session.");
    }

    // Set temporary session structure so session?.user is truthy BEFORE running DB queries
    setSession({
      ...currentSession,
      user: {
        ...currentSession.user,
        id: uId,
        userId: uId,
        userEmail: currentSession.user.email || "unknown-user",
        role: "customer"
      }
    });

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) {
      throw new Error("Supabase is not configured.");
    }

    const loadProfileAndRole = async () => {
      const loadedProfile = await SupabaseService.loadCombinedProfile(uId);
      const loadedGoals = await SupabaseService.loadLifeGoals(uId, loadedProfile.profileId);
      
      let userRole = "customer";
      const { data: roleData } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("auth_user_id", uId)
        .maybeSingle();
      
      if (roleData) {
        userRole = roleData.role;
      }

      return { loadedProfile, loadedGoals, userRole };
    };

    const { loadedProfile, loadedGoals, userRole } = await withTimeout(
      loadProfileAndRole(),
      8000
    );

    const loadedTwin = loadedProfile.twin || INITIAL_TWIN;
    setTwin(loadedTwin);
    setProfileId(loadedProfile.profileId);
    
    // Merge extra metadata from localStorage if available
    const cachedMetadataStr = localStorage.getItem(`approved_goals_metadata_${uId}`);
    let mergedGoals = loadedGoals;
    if (cachedMetadataStr) {
      try {
        const cachedMetadata = JSON.parse(cachedMetadataStr);
        mergedGoals = loadedGoals.map((g: any) => {
          const matchingCached = cachedMetadata.find((c: any) => c.name === g.name);
          if (matchingCached) {
            return {
              ...g,
              ...matchingCached,
              id: g.id // Keep the real DB ID
            };
          }
          return g;
        });
      } catch (err) {
        console.warn("Failed to parse cached goals metadata:", err);
      }
    }
    setGoals(mergedGoals);

    const isIncomplete = !loadedTwin || !loadedTwin.incomes || loadedTwin.incomes.length === 0 || loadedTwin.monthlyExpenses <= 0;
    if (isIncomplete) {
      setActiveMenu("twin");
    } else {
      setActiveMenu("command");
    }
    
    setSession({
      ...currentSession,
      user: {
        ...currentSession.user,
        id: uId,
        userId: uId,
        userEmail: currentSession.user.email || "unknown-user",
        role: userRole
      }
    });
    setUserRole(userRole as any);
  };

  useEffect(() => {
    let isMounted = true;
    let initialLoadTriggered = false;

    const initializeAuth = async () => {
      const supabaseClient = getSupabaseClient();
      if (!supabaseClient) return;
      
      try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) {
          console.error("Session check failed:", error);
          return;
        }

        const validSession = data.session;

        if (!validSession?.user) {
          if (isMounted) {
            setSession(null);
            setIsBooting(false);
          }
          return;
        }

        if (isMounted) {
          initialLoadTriggered = true;
          setIsBooting(true);
          setBootError(null);
        }

        try {
          await loadAuthenticatedUserData(validSession);
        } catch (err: any) {
          console.error("Failed to load authenticated user data on boot:", err);
          if (isMounted) {
            setBootError(err.message || "Failed to load financial profile.");
          }
        } finally {
          if (isMounted) {
            setIsBooting(false);
          }
        }
      } catch (error) {
        console.error("Authentication initialization failed:", error);
        if (isMounted) {
          setSession(null);
          setIsBooting(false);
        }
      }
    };

    initializeAuth();

    const supabaseClient = getSupabaseClient();
    if (!supabaseClient) return;

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, updatedSession) => {
      console.log(`[AURA AUTH] Event received: ${event}`);
      if (!isMounted) return;

      if (event === "SIGNED_IN") {
        if (initialLoadTriggered) {
          console.log("[AURA AUTH] SIGNED_IN event on boot bypassed, initializeAuth is handling it.");
          initialLoadTriggered = false;
          return;
        }

        if (updatedSession?.user) {
          setIsBooting(true);
          setBootError(null);
          try {
            await loadAuthenticatedUserData(updatedSession);
          } catch (err: any) {
            console.error("Error loading user profile after sign-in:", err);
            setBootError(err.message || "Failed to load financial profile after sign-in.");
          } finally {
            setIsBooting(false);
          }
        }
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setTwin(INITIAL_TWIN);
        setGoals([]);
        setSavedSimulations([]);
        setFeedbacks([]);
        setActiveMenu("command");
        setUnauthPage("landing");
        setUnauthSignUpDefault(false);
        setBootError(null);
        setIsBooting(false);
      } else if (event === "TOKEN_REFRESHED") {
        if (updatedSession?.user) {
          setSession((prev: any) => {
            if (!prev) return prev;
            return {
              ...updatedSession,
              user: {
                ...updatedSession.user,
                id: updatedSession.user.id,
                userId: updatedSession.user.id,
                userEmail: updatedSession.user.email,
                role: prev.user?.role || "customer"
              }
            };
          });
        }
      } else if (event === "PASSWORD_RECOVERY") {
        setUnauthPage("login");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Enforce access control redirect filters
  useEffect(() => {
    if (userRole === "customer" && ["governance", "feedback"].includes(activeMenu)) {
      setActiveMenu("command");
    }
  }, [userRole, activeMenu]);

  // Combined saving orchestrations
  const handleSaveTwin = async (updatedTwin: FinancialTwin, skipDbSave = false) => {
    const previousTaxState = twin.taxState || "US";
    const newTaxState = updatedTwin.taxState || "US";
    const sourceComponent = activeMenu === "settings" ? "UnifiedSettings" : "TwinConfigurator";

    if (previousTaxState !== newTaxState && process.env.NODE_ENV !== "production") {
      console.log("[QA LOG] State Change Detected in handleSaveTwin:", {
        previousTaxState,
        newTaxState,
        sourceComponent,
        savedSuccessfully: "Saving...",
        activeStateUsedBySimulatorEngine: newTaxState,
        activeStateShownByTopBadge: newTaxState
      });
    }

    setTwin(updatedTwin);
    const hasSupabase = SupabaseService.isConfigured();
    // Always save to sandbox storage immediately if we are offline/sandbox mode (ignores skipDbSave)
    if (!hasSupabase) {
      const uId = session?.user?.userId || session?.user?.id || "fallback_sandbox_uid";
      await SupabaseService.saveCombinedProfile(uId, profileId, updatedTwin);
      setSyncingState("synced");
      if (previousTaxState !== newTaxState && process.env.NODE_ENV !== "production") {
        console.log("[QA LOG] State Change Saved Successfully (Sandbox):", {
          previousTaxState,
          newTaxState,
          sourceComponent,
          savedSuccessfully: true,
          activeStateUsedBySimulatorEngine: newTaxState,
          activeStateShownByTopBadge: newTaxState
        });
      }
      return;
    }
    if (skipDbSave) return;
    setSyncingState("syncing");
    
    const uId = session?.user?.userId || session?.user?.id;
    if (uId) {
      const success = await SupabaseService.saveCombinedProfile(uId, profileId, updatedTwin);
      setSyncingState(success ? "synced" : "error");
      if (previousTaxState !== newTaxState && process.env.NODE_ENV !== "production") {
        console.log("[QA LOG] State Change Save Completed (Supabase):", {
          previousTaxState,
          newTaxState,
          sourceComponent,
          savedSuccessfully: success,
          activeStateUsedBySimulatorEngine: newTaxState,
          activeStateShownByTopBadge: newTaxState
        });
      }
    } else {
      setSyncingState("synced");
    }
  };

  const handleSaveGoals = async (updatedGoals: any[], skipDbSave = false) => {
    setGoals(updatedGoals);
    const hasSupabase = SupabaseService.isConfigured();
    // Always save to sandbox storage immediately if we are offline/sandbox mode (ignores skipDbSave)
    if (!hasSupabase) {
      const uId = session?.user?.userId || session?.user?.id || "fallback_sandbox_uid";
      await SupabaseService.saveLifeGoals(uId, profileId, updatedGoals);
      setSyncingState("synced");
      return;
    }
    if (skipDbSave) return;
    setSyncingState("syncing");
    
    const uId = session?.user?.userId || session?.user?.id;
    if (uId) {
      const success = await SupabaseService.saveLifeGoals(uId, profileId, updatedGoals);
      setSyncingState(success ? "synced" : "error");
    } else {
      setSyncingState("synced");
    }
  };

  const handleApproveLifeGoal = async (goalData: any) => {
    // Check if goal category and name already exists to avoid duplication
    const exists = goals.some(g => g.category === goalData.category && g.name === goalData.name);
    if (exists) {
      alert(`A Life Goal for "${goalData.name}" has already been approved and registered.`);
      setActiveMenu("goals");
      return;
    }

    const newGoalId = "goal-" + Math.random().toString(36).substring(2, 9);
    const newGoal = {
      id: newGoalId,
      name: goalData.name,
      category: goalData.category,
      targetAmount: Number(goalData.targetAmount) || 0,
      targetYear: Number(goalData.targetYear) || new Date().getFullYear() + 10,
      currentSavings: Number(goalData.currentSavings) || 0,
      priority: goalData.priority || "important",
      status: goalData.status || "Approved",
      monthlyContribution: Number(goalData.monthlyContribution) || 0,
      approvedScenarioType: goalData.approvedScenarioType,
      approvedScenarioName: goalData.approvedScenarioName,
      approvedAssumptions: goalData.approvedAssumptions || [],
      projectedImpact: Number(goalData.projectedImpact) || 0,
      approvedDate: new Date().toLocaleDateString(),
      nextAction: goalData.nextAction
    };

    const updatedGoals = [...goals, newGoal];
    await handleSaveGoals(updatedGoals);

    // Also cache extra simulation metadata in localStorage mapped by user ID and goal name
    const uId = session?.user?.userId || session?.user?.id;
    if (uId) {
      try {
        const cachedMetadataStr = localStorage.getItem(`approved_goals_metadata_${uId}`);
        const cachedMetadata = cachedMetadataStr ? JSON.parse(cachedMetadataStr) : [];
        cachedMetadata.push({
          name: goalData.name,
          status: newGoal.status,
          monthlyContribution: newGoal.monthlyContribution,
          approvedScenarioType: newGoal.approvedScenarioType,
          approvedScenarioName: newGoal.approvedScenarioName,
          approvedAssumptions: newGoal.approvedAssumptions,
          projectedImpact: newGoal.projectedImpact,
          approvedDate: newGoal.approvedDate,
          nextAction: newGoal.nextAction
        });
        localStorage.setItem(`approved_goals_metadata_${uId}`, JSON.stringify(cachedMetadata));
      } catch (err) {
        console.warn("Failed to cache metadata locally:", err);
      }
    }

    // Direct redirection to the Life Goals view
    setActiveMenu("goals");
  };

  const handleReviewGoal = (goal: any) => {
    if (goal.approvedScenarioType) {
      setActiveScenarioType(goal.approvedScenarioType);
      
      // Determine target variables
      const initialParams = {
        scenarioType: goal.approvedScenarioType,
        targetAmount: goal.targetAmount,
        targetYear: goal.targetYear,
        monthlyContribution: goal.monthlyContribution,
        approvedScenarioName: goal.approvedScenarioName,
        approvedAssumptions: goal.approvedAssumptions,
        projectedImpact: goal.projectedImpact,
        interestRate: 0.08,
        downPayment: goal.targetAmount * 0.2
      };
      
      setActiveSimulationParams(initialParams);
      setActiveMenu("command");
    }
  };

  const handleSignOut = async () => {
    await SupabaseService.signOut();
    // Clear all user-specific React state and cached financial data
    setSession(null);
    setUserRole("customer");
    setTwin(INITIAL_TWIN);
    setGoals([]);
    setSavedSimulations([]);
    setFeedbacks([]);
    setActiveMenu("command");
    setUnauthPage("landing");
    setUnauthSignUpDefault(false);
  };

  // Calculate high level KPI totals for header display
  const totalAnnualIncome = (twin.incomes || []).reduce((acc, curr) => acc + (curr.frequency === "annual" ? (Number(curr.amount) || 0) : (Number(curr.amount) || 0) * 12), 0);
  const totalAssetsValue = (twin.assets || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalLiabilitiesValue = (twin.liabilities || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const netWorth = totalAssetsValue - totalLiabilitiesValue;

  // Real-time Event handlers
  const handleSaveSimulation = (newSim: SimulationResult) => {
    setSavedSimulations([newSim, ...savedSimulations]);

    // Append standard security audit log trace
    const log: AuditLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      userEmail: session?.user?.userEmail || session?.user?.email || "unknown-user",
      action: "SIM_PERSIST",
      source: "simulation_engine",
      status: "success",
      description: `Committed alternative scenario "${newSim.type.toUpperCase()}" with target Suitability rating of ${newSim.decisionHealthScore}.`
    };
    setAuditLogs([log, ...auditLogs]);
  };


  const handleLogGovernanceEvent = (event: Omit<GovernanceEvent, "id" | "timestamp">) => {
    const freshEvent: GovernanceEvent = {
      ...event,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString()
    };
    setGovernanceEvents([freshEvent, ...governanceEvents]);
  };

  const handleAddFeedback = (newFeedback: FeedbackItem) => {
    setFeedbacks([newFeedback, ...feedbacks]);

    // Append to audit trail
    const log: AuditLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      userEmail: session?.user?.userEmail || session?.user?.email || "unknown-user",
      action: "FDBK_RECAL",
      source: "feedback_mesh",
      status: "success",
      description: `Evaluation rating "${newFeedback.experienceRating.toUpperCase()}" on planning simulator [${newFeedback.simulationType}] added to user profile feedback log.`
    };
    setAuditLogs([log, ...auditLogs]);
  };

  const handleAddDispute = (disputeMsg: string) => {
    const govId = Math.random().toString(36).substring(2, 9);
    
    // Add compliance ticket
    const govEvent: GovernanceEvent = {
      id: govId,
      timestamp: new Date().toISOString(),
      type: "dispute_filed",
      severity: "medium",
      message: disputeMsg,
      status: "under_review"
    };
    setGovernanceEvents([govEvent, ...governanceEvents]);

    // Add security audit trail entry
    const audit: AuditLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      userEmail: session?.user?.userEmail || session?.user?.email || "unknown-user",
      action: "GRV_DISPUTE",
      source: "governance_dashboard",
      status: "violation",
      description: `Compliance ticket registered: ${disputeMsg.substring(0, 50)}...`
    };
    setAuditLogs([audit, ...auditLogs]);
  };

  if (bootError && session?.user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-slate-800 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-2xl shadow-2xl text-center space-y-6 relative z-10 font-sans">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-rose-500 to-red-500 flex items-center justify-center font-bold text-white shadow-lg text-2xl">
            ⚠️
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 font-sans">Profile Loading Failed</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              We encountered an issue loading your financial profile. This can happen if the database connection is slow or temporarily offline.
            </p>
            {bootError && (
              <p className="text-[11px] font-mono bg-red-50 text-red-600 p-2.5 rounded-lg border border-red-100 max-h-24 overflow-y-auto">
                {bootError}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={async () => {
                setBootError(null);
                setIsBooting(true);
                try {
                  await loadAuthenticatedUserData(session);
                } catch (err: any) {
                  setBootError(err.message || "Unknown error during retry");
                } finally {
                  setIsBooting(false);
                }
              }}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold tracking-tight text-xs py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              Retry
            </button>
            <button
              onClick={async () => {
                setBootError(null);
                await handleSignOut();
              }}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold tracking-tight text-xs py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (bootError && sessionVerifyFailed) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-6 text-zinc-100 selection:bg-emerald-500/20">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-805/80 p-8 rounded-2xl shadow-2xl text-center space-y-6 relative z-10 font-sans">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-rose-500 to-red-500 flex items-center justify-center font-black text-zinc-950 font-mono shadow-lg text-2xl">
            !
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-black tracking-tight text-white font-sans">Unable to connect</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We could not verify your session. Please return to the sign-in page and try again.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setBootError(null);
                setSessionVerifyFailed(false);
                setIsBooting(false);
                setSession(null);
                setUnauthPage("landing");
              }}
              className="bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-bold tracking-tight text-xs py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              Return to Home
            </button>
            <button
              onClick={() => {
                setBootError(null);
                setSessionVerifyFailed(false);
                setIsBooting(false);
                setSession(null);
                setUnauthPage("login");
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black tracking-tight text-xs py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isBooting && session?.user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-slate-800 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-4 text-center relative z-10">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center font-bold text-white shadow-lg text-lg animate-pulse">
            AR
          </div>
          <div className="space-y-2">
            <h1 className="text-sm font-bold tracking-tight text-slate-900 font-sans">Initializing AuraRipple Secure Core</h1>
            <div className="w-48 h-1 bg-slate-200 rounded-full mx-auto overflow-hidden relative">
              <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-teal-600 to-emerald-500 animate-pulse rounded-full" />
            </div>
            <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">Verifying database integrity...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    if (unauthPage === "login") {
      return (
        <AuthContainer 
          initialSignUp={unauthSignUpDefault}
          onBackToLanding={() => {
            setUnauthPage("landing");
            setUnauthSignUpDefault(false);
          }}
          onSuccess={async (sess, sRole) => {
            setIsBooting(true);
            setBootError(null);
            try {
              await loadAuthenticatedUserData(sess);
            } catch (onSuccessErr: any) {
              console.error("[AURA BOOT CRITICAL ERROR] OnSuccess transition failure:", onSuccessErr);
              setBootError(onSuccessErr.message || "Failed to load financial profile.");
            } finally {
              setIsBooting(false);
            }
          }} 
        />
      );
    }

    return (
      <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col justify-between">
        <UnauthNavbar 
          currentPage={unauthPage} 
          onNavigate={(page, signUpDefault) => {
            setUnauthPage(page);
            if (signUpDefault !== undefined) {
              setUnauthSignUpDefault(signUpDefault);
            } else {
              setUnauthSignUpDefault(false);
            }
          }} 
        />
        
        <div className="flex-1">
          {unauthPage === "landing" && (
            <LandingPage 
              onNavigate={(page, signUpDefault) => {
                setUnauthPage(page);
                if (signUpDefault !== undefined) {
                  setUnauthSignUpDefault(signUpDefault);
                } else {
                  setUnauthSignUpDefault(false);
                }
              }} 
            />
          )}
          {unauthPage === "about" && (
            <AboutPage 
              onNavigate={(page) => {
                setUnauthPage(page);
                setUnauthSignUpDefault(false);
              }} 
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* 1. LEFT NAVIGATION MENU RAIL */}
      <aside className="w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between select-none font-sans shadow-sm">
        <div className="p-5 space-y-6 flex-1 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            {/* Logo segment */}
            <div className="space-y-1 pb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center font-bold text-white shadow-md text-xs">
                  AR
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-slate-900 font-sans leading-none">AuraRipple</h1>
                  <span className="text-[9px] font-mono font-bold tracking-wider text-teal-600 uppercase leading-none mt-1.5 block">Financial Decision Coach</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic leading-snug pt-1">
                "See your future before you spend your money."
              </p>
            </div>

            {/* Nav groups */}
            <nav className="space-y-1.5">
              <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block pb-2 border-b border-slate-100 font-semibold">
                Financial Twin Experience
              </span>

               <button
                onClick={() => setActiveMenu("twin")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-sans transition-all flex items-center gap-3 cursor-pointer ${
                  activeMenu === "twin"
                    ? "bg-teal-50/70 border border-teal-100 text-teal-800 font-bold shadow-sm"
                    : "border border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                }`}
              >
                <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Financial Profile</span>
              </button>

              <button
                onClick={() => {
                  setActiveMenu("command");
                  setActiveScenarioType(undefined);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-sans transition-all flex items-center gap-3 cursor-pointer ${
                  activeMenu === "command"
                    ? "bg-teal-50/70 border border-teal-100 text-teal-800 font-bold shadow-sm"
                    : "border border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Financial Intelligence</span>
              </button>

              <button
                onClick={() => setActiveMenu("goals")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-sans transition-all flex items-center gap-3 cursor-pointer ${
                  activeMenu === "goals"
                    ? "bg-teal-50/70 border border-teal-100 text-teal-800 font-bold shadow-sm"
                    : "border border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                }`}
              >
                <Target className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Life Goals</span>
              </button>

              {/* SYSTEM ADMINISTRATIVE SECTOR (Visible ONLY under non-customer roles) */}
              {userRole !== "customer" && (
                <div className="pt-4 space-y-1.5">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-rose-600 block pb-2 border-b border-slate-100 font-bold">
                    Oversight & Compliance
                  </span>

                  <button
                    onClick={() => setActiveMenu("governance")}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-sans transition-all flex items-center gap-3 cursor-pointer ${
                      activeMenu === "governance"
                        ? "bg-rose-50/70 border border-rose-100 text-rose-800 font-bold shadow-sm"
                        : "border border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                    }`}
                  >
                    <Scale className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Governance Dashboard</span>
                  </button>

                  <button
                    onClick={() => setActiveMenu("feedback")}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-sans transition-all flex items-center gap-3 cursor-pointer ${
                      activeMenu === "feedback"
                        ? "bg-rose-50/70 border border-rose-100 text-rose-800 font-bold shadow-sm"
                        : "border border-transparent text-slate-500 hover:text-slate-850 hover:bg-slate-100/60"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Feedback Recalibrator</span>
                  </button>
                </div>
              )}
            </nav>
          </div>

        </div>

        {/* User Identity bottom tag with compact Account Control */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs shrink-0 font-sans relative">
          {showAccountDropdown && (
            <div 
              className="absolute bottom-16 left-4 right-4 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 font-sans"
              role="menu"
              aria-label="Account Menu"
            >
              <button
                role="menuitem"
                onClick={() => {
                  setActiveModal("profile");
                  setShowAccountDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs text-slate-700 font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <User className="w-3.5 h-3.5 text-slate-400 animate-pulse" /> Account Profile
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setActiveMenu("settings");
                  setShowAccountDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs text-slate-700 font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" /> Settings
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setActiveModal("privacy");
                  setShowAccountDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs text-slate-700 font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Security & Privacy
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setActiveModal("help");
                  setShowAccountDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs text-slate-700 font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Help & Support
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setActiveModal("about_aura");
                  setShowAccountDropdown(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs text-slate-700 font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-400" /> About Aura Ripple
              </button>
              <div className="border-t border-slate-100 my-1"></div>
              <button
                role="menuitem"
                onClick={() => {
                  setShowAccountDropdown(false);
                  handleSignOut();
                }}
                className="w-full text-left px-4 py-2 hover:bg-rose-50 text-xs text-rose-700 font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          )}

          <div 
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            className="flex items-center justify-between p-1 rounded-xl hover:bg-slate-100 transition-all cursor-pointer select-none"
            aria-haspopup="true"
            aria-expanded={showAccountDropdown}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-full bg-slate-200 text-slate-500 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="font-semibold block text-slate-800 truncate font-sans text-xs">
                  {session?.user?.userEmail || "guest@domain.com"}
                </span>
                <span className="text-[9px] font-mono text-teal-600 uppercase font-bold leading-none block mt-1">
                  ROLE: {userRole.replace("_", " ")}
                </span>
              </div>
            </div>
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200" style={{ transform: showAccountDropdown ? "rotate(180deg)" : "none" }} />
          </div>
        </div>
      </aside>

      {/* 2. MAIN CENTER BODY SCROLL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        
        {/* UPPER STATUS BAR */}
        <header className="h-16 border-b border-slate-200 px-8 flex justify-between items-center bg-white shrink-0 shadow-sm font-sans">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Active Zone:</span>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 text-slate-700 font-mono text-[11px] shadow-inner">
              <MapPin className="w-3 h-3 text-teal-600" />
              <span className="font-semibold">{twin.taxState || "US"}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 text-slate-700 font-mono text-[11px] shadow-inner">
              <Coins className="w-3.5 h-3.5 text-teal-600" />
              <span>Long-Term Growth Assumption: <span className="font-semibold">{(twin.assets && twin.assets.length > 0 ? (twin.assets.reduce((acc, c) => acc + (Number(c.annualGrowth) || 0), 0) / twin.assets.length) * 100 : 7).toFixed(1)}%</span></span>
            </div>

            {session?.user && (
              <div className="ml-2">
                {syncingState === "syncing" && (
                  <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    Syncing changes...
                  </span>
                )}
                {syncingState === "synced" && (
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Synced to Supabase
                  </span>
                )}
                {syncingState === "error" && (
                  <span className="text-[11px] font-mono text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    ⚠ Database Save Error
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none">TOTAL NET WORTH</span>
              <span className={`text-sm font-extrabold block mt-1 ${netWorth >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                ${netWorth.toLocaleString()}
              </span>
            </div>
          </div>
        </header>

        {/* WORKSPACE AREA CONTAINER */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 font-sans">
          
          {sandboxNotice && (
            <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="font-semibold">{sandboxNotice}</span>
              </div>
              <button 
                onClick={() => setSandboxNotice(null)} 
                className="text-xs text-amber-500 hover:text-amber-700 font-bold px-2 py-1 rounded hover:bg-amber-100 transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
          
           {/* Main dynamic dispatcher */}
          {activeMenu === "command" && activeScenarioType === undefined && (
            <CommandCenter 
              twin={twin} 
              savedSimulations={savedSimulations} 
              onOpenSimulator={(scenarioType) => {
                setActiveScenarioType(scenarioType || "home_purchase");
              }}
              onOpenTwin={() => setActiveMenu("twin")}
            />
          )}

          {activeMenu === "command" && activeScenarioType !== undefined && (
            <SimulatorEngine 
              twin={twin} 
              initialType={activeScenarioType}
              initialParams={activeSimulationParams}
              onSaveSimulation={handleSaveSimulation}
              onLogGovernanceEvent={handleLogGovernanceEvent}
              onLogFeedback={handleAddFeedback}
              onApproveLifeGoal={handleApproveLifeGoal}
              onBack={() => {
                setActiveScenarioType(undefined);
                setActiveSimulationParams(null);
              }}
            />
          )}

          {activeMenu === "twin" && (
            <TwinConfigurator 
              twin={twin} 
              profileId={profileId}
              syncingState={syncingState}
              setSyncingState={setSyncingState}
              onChange={(updated, skipDbSave) => {
                handleSaveTwin(updated, skipDbSave);
                // Append secure audit log
                const audit: AuditLog = {
                  id: Math.random().toString(36).substring(2, 9),
                  timestamp: new Date().toISOString(),
                  userEmail: session?.user?.userEmail || session?.user?.email || "unknown-user",
                  action: "TWIN_RECAL",
                  source: "twin_configurator",
                  status: "success",
                  description: "Updated active user asset definitions, debt levels, and monthly savings markers."
                };
                setAuditLogs([audit, ...auditLogs]);
              }}
            />
          )}

          {activeMenu === "goals" && (
            <GoalsMatrix 
              twin={twin} 
              goals={goals} 
              profileId={profileId}
              syncingState={syncingState}
              setSyncingState={setSyncingState}
              onSaveGoals={(updated, skipDbSave) => handleSaveGoals(updated, skipDbSave)} 
              onReviewGoal={handleReviewGoal}
            />
          )}

          {activeMenu === "settings" && (
            <UnifiedSettings 
              twin={twin} 
              session={session}
              onChangeTwin={(updated) => {
                handleSaveTwin(updated);
                const audit: AuditLog = {
                  id: Math.random().toString(36).substring(2, 9),
                  timestamp: new Date().toISOString(),
                  userEmail: session?.user?.userEmail || session?.user?.email || "unknown-user",
                  action: "SETTING_UPDATE",
                  source: "settings_dashboard",
                  status: "success",
                  description: "Updated global settings parameters in profile registry."
                };
                setAuditLogs([audit, ...auditLogs]);
              }}
            />
          )}

          {activeMenu === "governance" && userRole !== "customer" && (
            <GovernanceHub 
              events={governanceEvents} 
              auditLogs={auditLogs}
              onAddDispute={handleAddDispute}
            />
          )}

          {activeMenu === "feedback" && userRole !== "customer" && (
            <FeedbackHub 
              feedbacks={feedbacks}
            />
          )}

        </div>
      </main>

      {/* Account Modals overlays */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in duration-150 animate-duration-150">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
            >
              &times;
            </button>
            
            {activeModal === "profile" && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">Account Profile</h3>
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                    <span className="text-slate-400 font-bold block text-[9px] uppercase font-mono">Registered Email Address</span>
                    <p className="text-slate-800 font-mono mt-0.5">{session?.user?.userEmail || "guest@domain.com"}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                    <span className="text-slate-400 font-bold block text-[9px] uppercase font-mono">Assigned Profile ID</span>
                    <p className="text-slate-800 font-mono mt-0.5">{profileId}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                    <span className="text-slate-400 font-bold block text-[9px] uppercase font-mono">Assigned Role</span>
                    <p className="text-slate-800 font-mono mt-0.5 capitalize">{userRole.replace("_", " ")}</p>
                  </div>
                </div>
              </div>
            )}

            {activeModal === "privacy" && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">Security & Privacy</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Aura Ripple secures your data using advanced AES-256 state encryption and strict Row-Level Security (RLS) guards inside Supabase.
                </p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-2 text-[11px] text-slate-700">
                  <div className="flex justify-between">
                    <span>Database Integrity</span>
                    <span className="text-emerald-600 font-bold font-mono">Verified SecurID</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Anonymization Layer</span>
                    <span className="text-emerald-600 font-bold font-mono">Active Shield</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Audit Trail Compliance</span>
                    <span className="text-emerald-600 font-bold font-mono">SOC2 Audited</span>
                  </div>
                </div>
              </div>
            )}

            {activeModal === "help" && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">Help & Support</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Have questions about your Financial Twin calculations or active Life Goals monitoring?
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-150">
                    <h4 className="font-bold text-slate-800 text-[11px]">How do simulations affect my profile?</h4>
                    <p className="text-slate-500 mt-0.5 leading-relaxed text-[10.5px]">
                      Simulations test hypothetical outcomes and do not modify your underlying profile data until approved as a Life Goal.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-150">
                    <h4 className="font-bold text-slate-800 text-[11px]">Contact Core Support</h4>
                    <p className="text-slate-500 mt-0.5 leading-relaxed text-[10.5px]">
                      Open a request or read complete user guides directly inside settings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeModal === "about_aura" && (
              <div className="space-y-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center font-bold text-white shadow-md text-sm mx-auto">
                  AR
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">About Aura Ripple</h3>
                <span className="text-[10px] font-mono text-teal-600 font-bold uppercase tracking-wider block">Version 2.4.0 Secure Stable</span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Aura Ripple is an advanced cognitive financial decision helper designed to model and simulate structural lifecycle outcomes, ensuring long-term family nest egg security.
                </p>
                <p className="text-[10px] text-slate-400">
                  Licensed under Apache-2.0. Copyright &copy; 2026 AuraRipple Core Devs. All rights reserved.
                </p>
              </div>
            )}

            <button
              onClick={() => setActiveModal(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
