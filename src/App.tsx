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
import DeliverablesViewer from "./components/DeliverablesViewer";
import { 
  LayoutDashboard, Wallet, Sparkles, Scale, 
  MessageSquare, BookOpen, ChevronRight, Coins, 
  Activity, MapPin, User, ShieldAlert 
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
  { id: "gov-1", timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), type: "model_recalibration", severity: "low", message: "Standard IRS federal bracket matrices and progressive California tax maps synchronized.", status: "resolved" },
  { id: "gov-2", timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), type: "bias_flag", severity: "medium", message: "Equitable check passed: prioritized core emergency fund and student loan avalanche payoffs over premium tax shelters.", status: "resolved" }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: "aud-1", timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), userEmail: "sinior.bkk@gmail.com", action: "AUTH_INIT", source: "client_gateway", status: "success", description: "Authorization session initialized on development container." },
  { id: "aud-2", timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), userEmail: "sinior.bkk@gmail.com", action: "COGNITIVE_KEY", source: "pii_vault", status: "success", description: "Standard secure PII data serialization isolation active." },
  { id: "aud-3", timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), userEmail: "sinior.bkk@gmail.com", action: "REGIONAL_MAP", source: "state_tax_db", status: "success", description: "Progressive California tax codes loaded into client compilation cache." }
];

export default function App() {
  const [activeMenu, setActiveMenu] = useState<"command" | "twin" | "simulator" | "governance" | "feedback" | "blueprints">("blueprints");
  
  // Real active state trackers
  const [twin, setTwin] = useState<FinancialTwin>(INITIAL_TWIN);
  const [savedSimulations, setSavedSimulations] = useState<SimulationResult[]>([]);
  const [governanceEvents, setGovernanceEvents] = useState<GovernanceEvent[]>(INITIAL_GOVERNANCE_EVENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);

  // Calculate high level KPI totals for header display
  const totalAnnualIncome = twin.incomes.reduce((acc, curr) => acc + (curr.frequency === "annual" ? curr.amount : curr.amount * 12), 0);
  const totalAssetsValue = twin.assets.reduce((acc, curr) => acc + curr.amount, 0);
  const totalLiabilitiesValue = twin.liabilities.reduce((acc, curr) => acc + curr.amount, 0);
  const netWorth = totalAssetsValue - totalLiabilitiesValue;

  // Real-time Event handlers
  const handleSaveSimulation = (newSim: SimulationResult) => {
    setSavedSimulations([newSim, ...savedSimulations]);

    // Append standard securty audit log trace
    const log: AuditLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      userEmail: "sinior.bkk@gmail.com",
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
      description: `Evaluation rating "${newFeedback.experienceRating.toUpperCase()}" on planning simulator [${newFeedback.simulationType}] added to optimizer.`
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
      userEmail: "sinior.bkk@gmail.com",
      action: "GRV_DISPUTE",
      source: "governance_dashboard",
      status: "violation",
      description: `Compliance ticket registered: ${disputeMsg.substring(0, 50)}...`
    };
    setAuditLogs([audit, ...auditLogs]);
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      
      {/* 1. LEFT NAVIGATION MENU RAIL */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-805 shrink-0 flex flex-col justify-between select-none">
        <div className="p-5 space-y-6">
          
          {/* Logo segment */}
          <div className="space-y-1 pb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-zinc-950 font-mono shadow-md">
                A
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-white font-sans leading-none">AURA V2.1</h1>
                <span className="text-[9px] font-mono font-semibold tracking-wider text-emerald-400 uppercase leading-none mt-1 block">Decision FDI Port</span>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 italic leading-snug pt-1">
              "See your future before you spend your money."
            </p>
          </div>

          {/* Nav groups */}
          <nav className="space-y-1.5 pt-4">
            
            <button
              onClick={() => setActiveMenu("blueprints")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-3 cursor-pointer ${
                activeMenu === "blueprints"
                  ? "bg-emerald-950/40 border border-emerald-505/65 text-zinc-100 font-bold"
                  : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60"
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-405 shrink-0" />
              <span>AURA 20 Blueprints</span>
              <span className="text-[9px] text-zinc-500 ml-auto bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-850">MVP</span>
            </button>

            <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-500 block pt-4 pb-2 border-b border-zinc-800">
              Interactive FDI Console
            </span>

            <button
              onClick={() => setActiveMenu("command")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-sans transition-all flex items-center gap-3 cursor-pointer ${
                activeMenu === "command"
                  ? "bg-zinc-950 border border-zinc-900 text-zinc-100 font-bold"
                  : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Wealth Command Center</span>
            </button>

            <button
              onClick={() => setActiveMenu("twin")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-sans transition-all flex items-center gap-3 cursor-pointer ${
                activeMenu === "twin"
                  ? "bg-zinc-950 border border-zinc-900 text-zinc-100 font-bold"
                  : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60"
              }`}
            >
              <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Digital Financial Twin</span>
            </button>

            <button
              onClick={() => setActiveMenu("simulator")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-sans transition-all flex items-center gap-3 cursor-pointer ${
                activeMenu === "simulator"
                  ? "bg-zinc-950 border border-zinc-900 text-zinc-100 font-bold"
                  : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60"
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-410 shrink-0" />
              <span>Life Scenario Simulator</span>
              {savedSimulations.length > 0 && (
                <span className="text-[9px] text-emerald-400 font-bold ml-auto bg-emerald-950 px-1 rounded">
                  {savedSimulations.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveMenu("governance")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-sans transition-all flex items-center gap-3 cursor-pointer ${
                activeMenu === "governance"
                  ? "bg-zinc-950 border border-zinc-900 text-zinc-100 font-bold"
                  : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60"
              }`}
            >
              <Scale className="w-4 h-4 text-emerald-405 shrink-0" />
              <span>Governance & Security</span>
            </button>

            <button
              onClick={() => setActiveMenu("feedback")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-sans transition-all flex items-center gap-3 cursor-pointer ${
                activeMenu === "feedback"
                  ? "bg-zinc-950 border border-zinc-900 text-zinc-101 font-bold"
                  : "border border-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850/60"
              }`}
            >
              <MessageSquare className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Feedback Recalibrator</span>
            </button>
          </nav>
        </div>

        {/* User Identity bottom tag */}
        <div className="p-4 border-t border-zinc-805 bg-zinc-950/20 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-full bg-zinc-800 text-zinc-400">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold block text-zinc-200 truncate">sinior.bkk@gmail.com</span>
              <span className="text-[9px] font-mono text-emerald-500 uppercase leading-none block mt-0.5">Premium Tier Verified</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CENTER BODY SCROLL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-955">
        
        {/* UPPER STATUS BAR (Tactical system telemetry) */}
        <header className="h-16 border-b border-zinc-805 px-8 flex justify-between items-center bg-zinc-900 shrink-0 bg-zinc-900/40 backdrop-blur-md">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-zinc-400 font-medium">Session Space:</span>
            <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-850 text-zinc-300 font-mono text-[11px]">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>Loc: {twin.taxState}, US Phase 1</span>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-850 text-zinc-300 font-mono text-[11px]">
              <Coins className="w-3.5 h-3.5 text-teal-400" />
              <span>Baseline Proj Comp ARR: {(twin.assets.length > 0 ? (twin.assets.reduce((acc, c) => acc + c.annualGrowth, 0) / twin.assets.length) * 100 : 7).toFixed(1)}%</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-[10px] text-zinc-550 block leading-none">VIRTUAL NET WORTH</span>
              <span className={`text-xs font-bold block mt-1 ${netWorth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                ${netWorth.toLocaleString()}
              </span>
            </div>
            
            <div className="h-6 w-[1px] bg-zinc-800" />

            <div className="text-right">
              <span className="text-[10px] text-zinc-555 block leading-none">Simulations Evaluated</span>
              <span className="text-xs font-bold text-teal-400 block mt-1 text-center font-mono">
                {savedSimulations.length + 3}
              </span>
            </div>
          </div>
        </header>

        {/* WORKSPACE AREA CONTAINER */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* Main dynamic dispatcher */}
          {activeMenu === "blueprints" && <DeliverablesViewer />}
          
          {activeMenu === "command" && (
            <CommandCenter 
              twin={twin} 
              savedSimulations={savedSimulations} 
              onOpenSimulator={() => setActiveMenu("simulator")}
              onOpenTwin={() => setActiveMenu("twin")}
            />
          )}

          {activeMenu === "twin" && (
            <TwinConfigurator 
              twin={twin} 
              onChange={(updated) => {
                setTwin(updated);
                // Append secure audit log
                const audit: AuditLog = {
                  id: Math.random().toString(36).substring(2, 9),
                  timestamp: new Date().toISOString(),
                  userEmail: "sinior.bkk@gmail.com",
                  action: "TWIN_RECAL",
                  source: "twin_configurator",
                  status: "success",
                  description: "Recalibrated active physical assets, liabilities levels, or monthly expenses targets."
                };
                setAuditLogs([audit, ...auditLogs]);
              }}
            />
          )}

          {activeMenu === "simulator" && (
            <SimulatorEngine 
              twin={twin} 
              onSaveSimulation={handleSaveSimulation}
              onLogGovernanceEvent={handleLogGovernanceEvent}
              onLogFeedback={handleAddFeedback}
            />
          )}

          {activeMenu === "governance" && (
            <GovernanceHub 
              events={governanceEvents} 
              auditLogs={auditLogs}
              onAddDispute={handleAddDispute}
            />
          )}

          {activeMenu === "feedback" && (
            <FeedbackHub 
              feedbacks={feedbacks}
            />
          )}

        </div>
      </main>
    </div>
  );
}
