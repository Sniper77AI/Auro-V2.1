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
import { 
  LayoutDashboard, Wallet, Sparkles, Scale, 
  MessageSquare, ChevronRight, Coins, 
  Activity, MapPin, User, ShieldAlert, Target, Settings, Eye, EyeOff, LogOut, Database, ShieldCheck
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
  { id: "aud-1", timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), userEmail: "sinior.bkk@gmail.com", action: "AUTH_INIT", source: "client_gateway", status: "success", description: "Authorization session initialized." },
  { id: "aud-2", timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), userEmail: "sinior.bkk@gmail.com", action: "COGNITIVE_KEY", source: "pii_vault", status: "success", description: "Standard secure PII data serialization isolation active." },
  { id: "aud-3", timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), userEmail: "sinior.bkk@gmail.com", action: "REGIONAL_MAP", source: "state_tax_db", status: "success", description: "Progressive California tax codes loaded into client compilation cache." }
];

export default function App() {
  const getInitialSession = () => {
    try {
      const data = safeStorage.getItem("aura_sandbox_active_session");
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.user) {
          return {
            user: {
              id: parsed.user.id,
              userId: parsed.user.id,
              userEmail: parsed.user.email,
              role: parsed.user.role || "customer"
            }
          };
        }
      }
    } catch (e) {
      console.error("Failed to parse initial sandbox session", e);
    }
    return null;
  };

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
  
  // Real active state trackers
  const [twin, setTwin] = useState<FinancialTwin>(INITIAL_TWIN);
  const [goals, setGoals] = useState<any[]>([]);
  const [savedSimulations, setSavedSimulations] = useState<SimulationResult[]>([]);
  const [governanceEvents, setGovernanceEvents] = useState<GovernanceEvent[]>(INITIAL_GOVERNANCE_EVENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [syncingState, setSyncingState] = useState<"synced" | "syncing" | "error">("synced");
  const [sandboxNotice, setSandboxNotice] = useState<string | null>(null);

  // Initial Auth checking and Profile database sync
  useEffect(() => {
    const checkSessionAndSync = async () => {
      if (!SupabaseService.isConfigured()) {
        setIsBooting(false);
        const initialSess = getInitialSession();
        if (initialSess) {
          setIsBooting(true);
          try {
            const uId = initialSess.user.id || initialSess.user.userId;
            const loadedProfile = await SupabaseService.loadCombinedProfile(uId);
            const loadedGoals = await SupabaseService.loadLifeGoals(uId, loadedProfile.profileId);
            
            setTwin(loadedProfile.twin);
            setProfileId(loadedProfile.profileId);
            setGoals(loadedGoals);
            setSession(initialSess);
            setUserRole(initialSess.user.role as any);
          } catch (e) {
            console.error("Failed to restore sandbox session on load", e);
          } finally {
            setIsBooting(false);
          }
        }
        return;
      }

      // 3-second initialization timeout guard to ensure app never hangs
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AURA BOOT SECURITY: Authentication verification timed out (3000ms limit reached).")), 3000)
      );

      try {
        const bootTask = async () => {
          try {
            const active = await SupabaseService.getActiveUser();
            if (active.userId) {
              setIsBooting(true);
              // Load specific profile representation
              const loadedProfile = await SupabaseService.loadCombinedProfile(active.userId);
              
              // Load goals collection
              const loadedGoals = await SupabaseService.loadLifeGoals(active.userId, loadedProfile.profileId);
              
              // Apply coordinates atomically to prevent race condition flickering
              setTwin(loadedProfile.twin);
              setProfileId(loadedProfile.profileId);
              setGoals(loadedGoals);
              setSession({
                user: {
                  id: active.userId,
                  userId: active.userId,
                  userEmail: active.userEmail,
                  role: active.role
                }
              });
              setUserRole(active.role);
            }
          } catch (innerErr) {
            console.warn("[AURA BOOT ERROR] Supabase fetch error, continuing in local sandbox:", innerErr);
            // Non-blocking fallback to local session / sandbox profile
            const initialSess = getInitialSession();
            if (initialSess) {
              const uId = initialSess.user.id || initialSess.user.userId;
              const loadedProfile = await SupabaseService.loadCombinedProfile(uId);
              const loadedGoals = await SupabaseService.loadLifeGoals(uId, loadedProfile.profileId);
              
              setTwin(loadedProfile.twin);
              setProfileId(loadedProfile.profileId);
              setGoals(loadedGoals);
              setSession(initialSess);
              setUserRole(initialSess.user.role as any);
              setSandboxNotice("Aura connection is offline. Using local sandbox session.");
            } else {
              setSandboxNotice("Aura database is currently offline. Operating in guest sandbox mode.");
            }
          }
        };

        const taskPromise = bootTask();
        // Prevent unhandled promise rejection if background bootTask rejects after timeout
        taskPromise.catch((err) => {
          console.error("[AURA BOOT BACKGROUND ERROR] Handled background bootTask error:", err);
        });

        await Promise.race([taskPromise, timeoutPromise]);
      } catch (err: any) {
        console.warn("[AURA BOOT TIMEOUT/CRITICAL ERROR] Boot verification timeout, falling back to offline sandbox:", err);
        // Recover from timeouts elegantly: load local storage if available, otherwise notify sandbox mode
        const initialSess = getInitialSession();
        if (initialSess) {
          const uId = initialSess.user.id || initialSess.user.userId;
          try {
            const loadedProfile = await SupabaseService.loadCombinedProfile(uId);
            const loadedGoals = await SupabaseService.loadLifeGoals(uId, loadedProfile.profileId);
            setTwin(loadedProfile.twin);
            setProfileId(loadedProfile.profileId);
            setGoals(loadedGoals);
          } catch (loadErr) {
            console.error("Local sandbox load failed", loadErr);
          }
          setSession(initialSess);
          setUserRole(initialSess.user.role as any);
          setSandboxNotice("Aura connection timed out. Operating in offline sandbox mode.");
        } else {
          setSandboxNotice("Aura connection timed out. Operating in guest sandbox mode.");
        }
      } finally {
        setIsBooting(false);
      }
    };
    checkSessionAndSync();
  }, []);

  // Enforce access control redirect filters
  useEffect(() => {
    if (userRole === "customer" && ["governance", "feedback"].includes(activeMenu)) {
      setActiveMenu("command");
    }
  }, [userRole, activeMenu]);

  // Combined saving orchestrations
  const handleSaveTwin = async (updatedTwin: FinancialTwin, skipDbSave = false) => {
    setTwin(updatedTwin);
    const hasSupabase = SupabaseService.isConfigured();
    // Always save to sandbox storage immediately if we are offline/sandbox mode (ignores skipDbSave)
    if (!hasSupabase) {
      const uId = session?.user?.userId || session?.user?.id || "fallback_sandbox_uid";
      await SupabaseService.saveCombinedProfile(uId, profileId, updatedTwin);
      setSyncingState("synced");
      return;
    }
    if (skipDbSave) return;
    setSyncingState("syncing");
    
    const uId = session?.user?.userId || session?.user?.id;
    if (uId) {
      const success = await SupabaseService.saveCombinedProfile(uId, profileId, updatedTwin);
      setSyncingState(success ? "synced" : "error");
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

  const handleSignOut = async () => {
    await SupabaseService.signOut();
    setSession(null);
    setUserRole("customer");
    setTwin(INITIAL_TWIN);
    setGoals([]);
    setActiveMenu("command");
  };

  // Calculate high level KPI totals for header display
  const totalAnnualIncome = twin.incomes.reduce((acc, curr) => acc + (curr.frequency === "annual" ? curr.amount : curr.amount * 12), 0);
  const totalAssetsValue = twin.assets.reduce((acc, curr) => acc + curr.amount, 0);
  const totalLiabilitiesValue = twin.liabilities.reduce((acc, curr) => acc + curr.amount, 0);
  const netWorth = totalAssetsValue - totalLiabilitiesValue;

  // Real-time Event handlers
  const handleSaveSimulation = (newSim: SimulationResult) => {
    setSavedSimulations([newSim, ...savedSimulations]);

    // Append standard security audit log trace
    const log: AuditLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      userEmail: session?.user?.userEmail || "sinior.bkk@gmail.com",
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
      userEmail: "sinior.bkk@gmail.com",
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
      userEmail: session?.user?.userEmail || "sinior.bkk@gmail.com",
      action: "GRV_DISPUTE",
      source: "governance_dashboard",
      status: "violation",
      description: `Compliance ticket registered: ${disputeMsg.substring(0, 50)}...`
    };
    setAuditLogs([audit, ...auditLogs]);
  };

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

  if (isBooting) {
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
            try {
              const uId = sess.user?.id || sess.user?.userId;
              const loadedProfile = await SupabaseService.loadCombinedProfile(uId);
              const loadedGoals = await SupabaseService.loadLifeGoals(uId, loadedProfile.profileId);
              
              setTwin(loadedProfile.twin);
              setProfileId(loadedProfile.profileId);
              setGoals(loadedGoals);

              const normalizedSession = {
                ...sess,
                user: {
                  ...sess.user,
                  id: sess.user?.id,
                  userId: sess.user?.id || sess.user?.userId,
                  userEmail: sess.user?.email || "sandbox@aura.org",
                  role: sRole
                }
              };
              setSession(normalizedSession);
              setUserRole(sRole as any);
            } catch (onSuccessErr: any) {
              console.error("[AURA BOOT CRITICAL ERROR] OnSuccess transition failure:", onSuccessErr);
              // Graceful fallback to initial local storage / mock values so application remains accessible
              const normalizedSession = {
                ...sess,
                user: {
                  ...sess?.user,
                  id: sess?.user?.id || "dem-id-99",
                  userId: sess?.user?.id || sess?.user?.userId || "dem-id-99",
                  userEmail: sess?.user?.email || "sinior.bkk@gmail.com",
                  role: sRole
                }
              };
              setSession(normalizedSession);
              setUserRole(sRole as any);
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
                onClick={() => setActiveMenu("command")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-sans transition-all flex items-center gap-3 cursor-pointer ${
                  activeMenu === "command"
                    ? "bg-teal-50/70 border border-teal-100 text-teal-800 font-bold shadow-sm"
                    : "border border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Financial Twin Command Center</span>
              </button>

              <button
                onClick={() => setActiveMenu("twin")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-sans transition-all flex items-center gap-3 cursor-pointer ${
                  activeMenu === "twin"
                    ? "bg-teal-50/70 border border-teal-100 text-teal-800 font-bold shadow-sm"
                    : "border border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                }`}
              >
                <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Financial Profile Builder</span>
              </button>

              <button
                onClick={() => setActiveMenu("simulator")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-sans transition-all flex items-center gap-3 cursor-pointer ${
                  activeMenu === "simulator"
                    ? "bg-teal-50/70 border border-teal-100 text-teal-800 font-bold shadow-sm"
                    : "border border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                }`}
              >
                <Sparkles className="w-4 h-4 text-teal-500 shrink-0" />
                <span>Life Simulator</span>
                {savedSimulations.length > 0 && (
                  <span className="text-[9px] text-teal-700 font-bold ml-auto bg-teal-100 px-1.5 py-0.5 rounded font-mono">
                    {savedSimulations.length}
                  </span>
                )}
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
                <span>Life Outcomes & Goals</span>
              </button>

              <button
                onClick={() => setActiveMenu("settings")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-sans transition-all flex items-center gap-3 cursor-pointer ${
                  activeMenu === "settings"
                    ? "bg-teal-50/70 border border-teal-100 text-teal-800 font-bold shadow-sm"
                    : "border border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                }`}
              >
                <Settings className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Settings</span>
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

        {/* User Identity bottom tag */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs shrink-0 font-sans flex items-center justify-between gap-2">
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
          <button
            onClick={handleSignOut}
            title="Terminate secure session key"
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-rose-600 transition-all cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
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
              <span className="font-semibold">CA</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 text-slate-700 font-mono text-[11px] shadow-inner">
              <Coins className="w-3.5 h-3.5 text-teal-600" />
              <span>Long-Term Growth Assumption: <span className="font-semibold">{(twin.assets.length > 0 ? (twin.assets.reduce((acc, c) => acc + c.annualGrowth, 0) / twin.assets.length) * 100 : 7).toFixed(1)}%</span></span>
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
          {activeMenu === "command" && (
            <CommandCenter 
              twin={twin} 
              savedSimulations={savedSimulations} 
              onOpenSimulator={(scenarioType) => {
                if (scenarioType) {
                  setActiveScenarioType(scenarioType);
                } else {
                  setActiveScenarioType(undefined);
                }
                setActiveMenu("simulator");
              }}
              onOpenTwin={() => setActiveMenu("twin")}
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
                  userEmail: session?.user?.userEmail || "sinior.bkk@gmail.com",
                  action: "TWIN_RECAL",
                  source: "twin_configurator",
                  status: "success",
                  description: "Updated active user asset definitions, debt levels, and monthly savings markers."
                };
                setAuditLogs([audit, ...auditLogs]);
              }}
            />
          )}

          {activeMenu === "simulator" && (
            <SimulatorEngine 
              twin={twin} 
              initialType={activeScenarioType}
              onSaveSimulation={handleSaveSimulation}
              onLogGovernanceEvent={handleLogGovernanceEvent}
              onLogFeedback={handleAddFeedback}
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
            />
          )}

          {activeMenu === "settings" && (
            <UnifiedSettings 
              twin={twin} 
              onChangeTwin={(updated) => {
                handleSaveTwin(updated);
                const audit: AuditLog = {
                  id: Math.random().toString(36).substring(2, 9),
                  timestamp: new Date().toISOString(),
                  userEmail: session?.user?.userEmail || "sinior.bkk@gmail.com",
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
    </div>
  );
}
