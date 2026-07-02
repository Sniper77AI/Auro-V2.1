/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  ShieldCheck, 
  Activity, 
  DollarSign, 
  Briefcase, 
  Home, 
  Users, 
  TrendingUp, 
  Coins,
  Lock
} from "lucide-react";

interface AboutPageProps {
  onNavigate: (page: "landing" | "about" | "login") => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen font-sans flex flex-col justify-between overflow-x-hidden">
      
      {/* HEADER SECTION */}
      <section className="relative pt-12 pb-16 bg-gradient-to-b from-teal-50/70 via-white to-slate-50 border-b border-slate-100">
        
        {/* Colorful blur lights */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-indigo-100/35 rounded-full blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto px-6 space-y-6 text-center">
          
          <button
            onClick={() => onNavigate("landing")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-teal-600 hover:bg-slate-100/80 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </button>

          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600">Aura Ripple</span>
          </h1>
          
          <p className="text-teal-700 font-mono text-sm uppercase tracking-wider font-bold">
            “See your future before you spend your money.”
          </p>

          <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Aura Ripple is an <strong>AI-powered Financial Decision Intelligence Platform</strong>. We believe that looking at backward-facing spreadsheets is a broken way to plan your future. Aura Ripple is designed to help you understand the long-term financial consequences of major financial and life decisions before you commit.
          </p>
        </div>
      </section>

      {/* THREE MAIN PRODUCT PILLARS */}
      <section className="py-16 max-w-5xl mx-auto px-6 space-y-16">
        
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Our Core Pillars</h2>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Three interconnected engines designed to empower clear, confident strategic choices.
          </p>
        </div>

        {/* Pillar 1: Financial Twin */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 border border-teal-100 text-[10px] font-bold uppercase tracking-wider font-mono">
              Pillar 1: Financial Twin Architecture
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your Financial Twin</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your Financial Twin is a personalized, highly accurate digital model of your active economic life. It aggregates your income streams, ongoing liabilities, cash assets, and dynamic tax markers into a single synchronized model.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Instead of looking at disjointed bank balances, your Financial Twin gives you a real-time, holistic visual representation of your total economic footprint.
            </p>
          </div>
          <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-teal-600 font-bold">What is modeled:</h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                <span>Synchronized cash holdings & investment assets</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                <span>Recurring income sources & salary intervals</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                <span>Outstanding liabilities, interest rates, and structures</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                <span>State progressive tax models</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 2: Life Simulator */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5 md:order-last md:col-start-8 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold uppercase tracking-wider font-mono">
              Pillar 2: Life Simulator
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">The Life Simulator</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              The Life Simulator is a powerful playground designed for testing life's major milestones before committing real capital.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Instead of making stressful, emotional decisions in a vacuum, you can model options such as buying a home, purchasing a car, changing career trajectories, retiring early, accelerating debt payoff, funding college, or arranging estate planning.
            </p>
          </div>
          <div className="md:col-span-6 md:order-first grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-3">
              <div className="p-2 w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Home className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Buying a Home / Car</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Observe the immediate down payment drain combined with long-term monthly amortized costs.
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-3">
              <div className="p-2 w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Career Changes & Early Retirement</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Compare salaries, relocation tax modifications, and project exact years of financial runway.
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-3">
              <div className="p-2 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Debt Freedom Models</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Simulate standard paydowns (Snowball vs. Avalanche) to determine the exact date of total liability elimination.
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-3">
              <div className="p-2 w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">College & Estate Planning</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Simulate long-term trust contributions and fund accumulation milestones seamlessly.
              </p>
            </div>
          </div>
        </div>

        {/* Pillar 3: Decision Intelligence Engine */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider font-mono">
              Pillar 3: Decision Intelligence Engine
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Decision Intelligence Engine</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our <strong>Decision Intelligence Engine</strong> is an AI-assisted analyzer that interprets your simulated branches. It flags hidden risks, highlights critical tradeoffs, and suggests potential adjustments to keep you on track.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Instead of guessing how different variables connect, the engine produces readable reports detailing exactly how each choice changes your 30-year runway, savings cushioning, and total liquid milestones.
            </p>
          </div>
          <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-600 font-bold">Key Intelligence Features:</h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>AI-assisted explanations of economic impacts</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Risk signals (e.g. low emergency cushion alerts)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Visual tradeoff analysis (Side-by-side graphs)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Proactive optimizations for savings rates</span>
              </div>
            </div>
          </div>
        </div>

        {/* GOVERNANCE, SECURITY & TRANSPARENCY */}
        <div className="bg-gradient-to-tr from-slate-900 to-teal-950 p-8 md:p-12 rounded-3xl text-white space-y-6">
          <div className="max-w-2xl space-y-4">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-teal-400">Security & Governance</span>
            <h3 className="text-2xl font-extrabold tracking-tight">Trust, Governance & Clear Boundaries</h3>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Your trust is our absolute priority. Aura Ripple utilizes robust <strong>cloud authentication, role-based access control (RBAC), and strict Row-Level Security (RLS)</strong>. Your financial entries, digital twins, and simulated scenarios are securely isolated and accessible only to you.
            </p>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              <strong>Transparency and Control:</strong> All outputs, reports, and simulated scenarios are purely <em>decision-support insights</em>. They are not guaranteed outcomes, nor do they constitute formal financial, tax, legal, or investment advice. You remain in complete, active control of your final real-world choices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-white/10 text-xs">
            <div className="space-y-1">
              <span className="block font-bold text-white flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-teal-400" /> Secure Cloud & RLS
              </span>
              <span className="text-slate-450">Advanced Row-Level Security keeps your profile isolated.</span>
            </div>
            <div className="space-y-1">
              <span className="block font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Decision Support Only
              </span>
              <span className="text-slate-450">Simulated projections are educational tools, not certified financial advice.</span>
            </div>
            <div className="space-y-1">
              <span className="block font-bold text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-400" /> Active Control
              </span>
              <span className="text-slate-450">We provide tradeoffs and signal risks; you make the decisions.</span>
            </div>
          </div>
        </div>

      </section>

      {/* SECONDARY CTA */}
      <section className="py-12 bg-white text-center border-t border-slate-100 space-y-4">
        <h3 className="text-lg font-bold text-slate-950">Ready to start modeling your future?</h3>
        <p className="text-slate-500 text-xs max-w-xs mx-auto leading-normal">
          Build your Financial Twin profile in less than 3 minutes.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate("login")}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-md cursor-pointer transition-all"
          >
            Sign In & Build Twin
          </button>
          <button
            onClick={() => onNavigate("landing")}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer transition-all"
          >
            Go to Home
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 bg-slate-100 border-t border-slate-200/80 text-xs text-slate-500 font-sans">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-teal-600 flex items-center justify-center text-[10px] font-black text-white font-mono">
              AR
            </div>
            <span className="font-bold text-slate-800">Aura Ripple</span>
          </div>
          <div className="flex gap-6">
            <button onClick={() => onNavigate("landing")} className="hover:text-teal-600 cursor-pointer">Home</button>
            <button onClick={() => onNavigate("about")} className="hover:text-teal-600 cursor-pointer">About</button>
            <button onClick={() => onNavigate("login")} className="hover:text-teal-600 cursor-pointer">Login</button>
          </div>
          <p className="text-[11px] text-slate-450">&copy; {new Date().getFullYear()} Aura Ripple. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
