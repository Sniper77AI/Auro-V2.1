/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  Coins, 
  HelpCircle, 
  ShieldCheck, 
  Activity, 
  DollarSign, 
  Briefcase, 
  Home, 
  ChevronRight, 
  Play, 
  Pause,
  RefreshCw,
  Award,
  Zap,
  CheckCircle2,
  PieChart
} from "lucide-react";

interface LandingPageProps {
  onNavigate: (page: "landing" | "about" | "login", signUpDefault?: boolean) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  // Simulation State
  const [decisions, setDecisions] = useState({
    careerPivot: false,
    buyProperty: false,
    aggressiveSavings: false,
  });

  // Animated Explainer State
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-play the explainer steps
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Interactive twin simulation math
  const getSimulatedNetWorth = () => {
    let baseValue = 45000;
    let growthRate = 1.07; // 7% base
    const years = Array.from({ length: 6 }, (_, i) => i * 5); // 0, 5, 10, 15, 20, 25 years

    return years.map((yr) => {
      let annualContribution = 12000;
      let yrGrowth = growthRate;

      if (decisions.aggressiveSavings) {
        annualContribution += 8000; // Save more
      }
      if (decisions.careerPivot) {
        annualContribution += 15000; // Higher income
        yrGrowth += 0.01; // Slightly better investment options
      }
      
      // Compound interest formula
      let value = baseValue * Math.pow(yrGrowth, yr);
      for (let t = 1; t <= yr; t++) {
        value += annualContribution * Math.pow(yrGrowth, yr - t);
      }

      if (decisions.buyProperty && yr >= 5) {
        // Assume property acquisition takes liquid cash but builds real estate asset
        value = value - 60000 + (yr - 5) * 8000; 
      }

      return {
        year: `Year ${yr}`,
        value: Math.max(0, Math.round(value)),
      };
    });
  };

  const simulatedData = getSimulatedNetWorth();
  const maxSimulatedValue = Math.max(...simulatedData.map(d => d.value));

  // Step explanations data
  const steps = [
    {
      title: "1. Financial Twin Architecture",
      desc: "Financial Twin: a personalized digital model of your financial life. Connect or input your active income sources, assets, liabilities, and goals to see an exact digital representation of your real economic footprint.",
      pill: "Personalized Digital Twin",
      color: "from-blue-500 to-indigo-500",
      icon: <Activity className="w-6 h-6 text-indigo-500" />
    },
    {
      title: "2. Life Simulator",
      desc: "Life Simulator: a tool for testing major decisions such as buying a home, buying a car, changing careers, retiring early, debt freedom, college funding, and estate planning before you commit.",
      pill: "Interactive Decisions Simulator",
      color: "from-amber-500 to-orange-500",
      icon: <Sparkles className="w-6 h-6 text-amber-500" />
    },
    {
      title: "3. Decision Intelligence Engine",
      desc: "Decision Intelligence Engine: AI-assisted explanations, risk signals, tradeoff analysis, and recommendations to help you understand the long-term consequences of major decisions.",
      pill: "AI-Powered Explanations & Tradeoffs",
      color: "from-emerald-500 to-teal-500",
      icon: <TrendingUp className="w-6 h-6 text-emerald-500" />
    }
  ];

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen font-sans flex flex-col justify-between overflow-x-hidden">
      
      {/* HERO HERO HERO */}
      <section className="relative pt-10 pb-20 md:py-24 bg-gradient-to-b from-teal-50/70 via-white to-slate-50 overflow-hidden">
        
        {/* Colorful Abstract Graphic Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200/40 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-12 left-0 w-80 h-80 bg-indigo-100/40 rounded-full blur-3xl -z-10 -translate-x-1/3" />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-emerald-100/35 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left: Value Prop */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/65 border border-teal-200 text-teal-800 text-xs font-semibold tracking-wide animate-fade-in">
              <Zap className="w-3.5 h-3.5 text-teal-600 animate-bounce" />
              <span>AI-powered Financial Decision Intelligence Platform</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              See your future <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600">
                before you spend your money
              </span>
            </h1>

            <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Aura Ripple is an <strong>AI-powered Financial Decision Intelligence Platform</strong> built on our robust <strong>Financial Twin Architecture</strong>. Understand the long-term financial consequences of major financial and life decisions before you commit.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => onNavigate("login", true)}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-xl shadow-teal-600/15 flex items-center justify-center gap-2 group transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                Get Started Free <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => onNavigate("login", false)}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                Sign In
              </button>
              <a
                href="#explainer"
                className="text-xs font-semibold text-slate-500 hover:text-teal-600 flex items-center gap-1 transition-all"
              >
                Learn More
              </a>
            </div>

            {/* Quick trust items */}
            <div className="grid grid-cols-3 gap-4 pt-6 max-w-md mx-auto lg:mx-0 border-t border-slate-200/80">
              <div className="text-center lg:text-left">
                <span className="block text-xl font-extrabold text-slate-900">0%</span>
                <span className="text-xs text-slate-500 font-medium">Risk or ads</span>
              </div>
              <div className="text-center lg:text-left border-l border-slate-200 pl-4">
                <span className="block text-xl font-extrabold text-slate-900">100%</span>
                <span className="text-xs text-slate-500 font-medium">Private twin</span>
              </div>
              <div className="text-center lg:text-left border-l border-slate-200 pl-4">
                <span className="block text-xl font-extrabold text-slate-900">30-Yr</span>
                <span className="text-xs text-slate-500 font-medium">Decision impact</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Decision Ripple Simulator */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100/90 relative overflow-hidden">
            
            {/* Top glass reflection */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-slate-50/40 to-transparent pointer-events-none" />

            <div className="space-y-6 relative">
              
              {/* Card Header */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-950 flex items-center gap-1.5 font-sans">
                    <Activity className="w-4 h-4 text-teal-600 animate-pulse" />
                    Interactive Life Simulator
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Toggle real decisions to see the simulated trajectory</p>
                </div>
                <button
                  onClick={() => setDecisions({ careerPivot: false, buyProperty: false, aggressiveSavings: false })}
                  title="Reset simulator"
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 gap-2.5">
                
                {/* Toggle 1: Career Pivot */}
                <button
                  onClick={() => setDecisions(prev => ({ ...prev, careerPivot: !prev.careerPivot }))}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    decisions.careerPivot 
                      ? "bg-teal-50/70 border-teal-200 ring-1 ring-teal-200" 
                      : "bg-slate-50/60 border-slate-100 hover:bg-slate-100/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${decisions.careerPivot ? "bg-teal-100 text-teal-700" : "bg-slate-200/70 text-slate-500"}`}>
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Career Shift (+25% income)</span>
                      <span className="text-[10px] text-slate-500">Upgrade salary and savings rates</span>
                    </div>
                  </div>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${decisions.careerPivot ? "bg-teal-500" : "bg-slate-300"}`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 transform ${decisions.careerPivot ? "translate-x-4" : ""}`} />
                  </div>
                </button>

                {/* Toggle 2: Real Estate */}
                <button
                  onClick={() => setDecisions(prev => ({ ...prev, buyProperty: !prev.buyProperty }))}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    decisions.buyProperty 
                      ? "bg-indigo-50/70 border-indigo-200 ring-1 ring-indigo-200" 
                      : "bg-slate-50/60 border-slate-100 hover:bg-slate-100/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${decisions.buyProperty ? "bg-indigo-100 text-indigo-700" : "bg-slate-200/70 text-slate-500"}`}>
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Buy $450k Property (Year 5)</span>
                      <span className="text-[10px] text-slate-500">Inject equity, lock mortgage liability</span>
                    </div>
                  </div>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${decisions.buyProperty ? "bg-indigo-500" : "bg-slate-300"}`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 transform ${decisions.buyProperty ? "translate-x-4" : ""}`} />
                  </div>
                </button>

                {/* Toggle 3: Aggressive Savings */}
                <button
                  onClick={() => setDecisions(prev => ({ ...prev, aggressiveSavings: !prev.aggressiveSavings }))}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    decisions.aggressiveSavings 
                      ? "bg-emerald-50/70 border-emerald-200 ring-1 ring-emerald-200" 
                      : "bg-slate-50/60 border-slate-100 hover:bg-slate-100/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${decisions.aggressiveSavings ? "bg-emerald-100 text-emerald-700" : "bg-slate-200/70 text-slate-500"}`}>
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Aggressive Savings (+$500/mo)</span>
                      <span className="text-[10px] text-slate-500">Compound high yield cash and stocks</span>
                    </div>
                  </div>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${decisions.aggressiveSavings ? "bg-emerald-500" : "bg-slate-300"}`}>
                    <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 transform ${decisions.aggressiveSavings ? "translate-x-4" : ""}`} />
                  </div>
                </button>

              </div>

              {/* Dynamic Chart Trajectory Preview */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
                <div className="flex justify-between items-center text-[11px] font-mono font-semibold text-slate-500">
                  <span>ESTIMATED NET WORTH OVER 25 YEARS</span>
                  <span className="text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                    Max: ${simulatedData[5].value.toLocaleString()}
                  </span>
                </div>

                {/* Bar Graph */}
                <div className="h-28 flex items-end justify-between gap-2.5 pt-2 border-b border-slate-200/60">
                  {simulatedData.map((d, index) => {
                    const heightPercent = maxSimulatedValue > 0 ? (d.value / maxSimulatedValue) * 85 + 15 : 15;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 bg-slate-900 text-white text-[9px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow">
                          ${d.value.toLocaleString()}
                        </div>
                        {/* Bar */}
                        <div 
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-md transition-all duration-500 ${
                            decisions.careerPivot || decisions.aggressiveSavings || decisions.buyProperty
                              ? "bg-gradient-to-t from-teal-500 to-teal-400"
                              : "bg-gradient-to-t from-indigo-500 to-indigo-400"
                          }`}
                        />
                        <span className="text-[9px] font-mono text-slate-400 tracking-tight">{d.year.replace("Year ", "Yr")}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Visual Impact Note */}
                <div className="text-[11px] leading-relaxed text-slate-600 flex items-start gap-1.5 bg-white p-2.5 rounded-lg border border-slate-100">
                  <Award className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>
                    {decisions.careerPivot && decisions.aggressiveSavings
                      ? "Combined effect of Career Shift and High Savings generates high compound interest."
                      : decisions.buyProperty
                      ? "Real Estate lowers immediate liquidity but establishes key solid property equity."
                      : "Interactive twin models help balance cash flow, debts, and life milestones."}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* THREE-STEP EXPLAINER */}
      <section id="explainer" className="py-20 bg-white border-y border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Section header */}
          <div className="max-w-2xl mx-auto text-center space-y-3.5 pb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Aura Ripple in Three Simple Steps
            </h2>
            <p className="text-slate-600 text-sm">
              We guide you from simple entry of your asset basics to simulating complex real-world decisions effortlessly.
            </p>
          </div>

          {/* Video-style interactive player interface */}
          <div className="bg-slate-50 rounded-3xl p-5 md:p-8 border border-slate-150 shadow-xl max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Step triggers (left 5 columns) */}
            <div className="md:col-span-5 space-y-4">
              {steps.map((st, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveStep(idx);
                    setIsPlaying(false); // Stop playing when user interacts manually
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-start gap-4 cursor-pointer ${
                    activeStep === idx
                      ? "bg-white border-slate-200 shadow-md ring-1 ring-slate-100"
                      : "bg-slate-50/40 border-transparent hover:bg-slate-150/40"
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${activeStep === idx ? "bg-teal-50 text-teal-600" : "bg-slate-200/60 text-slate-500"}`}>
                    {st.icon}
                  </div>
                  <div className="space-y-1">
                    <span className="block text-xs font-bold text-slate-900">{st.title}</span>
                    <span className="block text-[11px] text-slate-500 leading-snug truncate max-w-[200px]">
                      {st.pill}
                    </span>
                  </div>
                </button>
              ))}

              {/* Player control button */}
              <div className="pt-2 flex items-center justify-between px-2 text-xs font-semibold text-slate-500 font-mono">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-1.5 hover:text-teal-600 cursor-pointer text-[11px]"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-teal-600" />
                      <span>PAUSE AUTO-PLAY</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                      <span>PLAY PILLAR WALKTHROUGH</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] tracking-wide text-teal-600">
                  STEP {activeStep + 1} OF 3
                </span>
              </div>
            </div>

            {/* Simulated app screenshots mockup view (right 7 columns) */}
            <div className="md:col-span-7 bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-inner h-80 flex flex-col justify-between relative overflow-hidden text-slate-200">
              
              {/* Outer light aura */}
              <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/5 to-indigo-500/10 pointer-events-none" />

              {/* Status bar mock */}
              <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 pb-3 border-b border-slate-800 shrink-0">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  DECISION_INTELLIGENCE_CORE
                </span>
                <span>SECURE CACHING ACTIVE</span>
              </div>

              {/* Content mock based on current step */}
              <div className="flex-1 flex flex-col justify-center py-4">
                {activeStep === 0 && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-900/40 text-[9px] font-mono font-bold">
                      STEP 1: DIGITAL MIRROR
                    </div>
                    <h4 className="text-sm font-bold text-white font-sans leading-tight">Financial Twin Configuration</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Enter details such as liquid accounts, index fund portfolios, mortgages, auto loans, and monthly salaries. Aura builds a private state profile immediately.
                    </p>
                    
                    {/* Visual mockup cards */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800 text-center">
                        <span className="text-[8px] text-slate-500 block uppercase font-mono">Cash & Stocks</span>
                        <span className="text-xs font-bold text-white font-mono">$125,000</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800 text-center">
                        <span className="text-[8px] text-slate-500 block uppercase font-mono">Total Debts</span>
                        <span className="text-xs font-bold text-rose-400 font-mono">$42,000</span>
                      </div>
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800 text-center">
                        <span className="text-[8px] text-slate-500 block uppercase font-mono">Base Salary</span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">$8,200/mo</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-900/40 text-[9px] font-mono font-bold">
                      STEP 2: MODELING HORIZONS
                    </div>
                    <h4 className="text-sm font-bold text-white font-sans leading-tight">Interactive Life Decisions Simulator</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Choose from a rich list of standard scenario structures—Career Changes, Relocations, Property Acquisitions, Debt Paydowns—or customize parameters with slider adjustments.
                    </p>
                    
                    {/* Action buttons mock */}
                    <div className="flex gap-2 pt-1.5 overflow-x-auto pb-1">
                      <span className="bg-teal-950/30 text-teal-400 border border-teal-900/50 px-2.5 py-1.5 rounded-lg text-[9px] font-bold font-mono whitespace-nowrap">
                        ✔ Buying Property
                      </span>
                      <span className="bg-slate-850 text-slate-400 border border-slate-800 px-2.5 py-1.5 rounded-lg text-[9px] font-bold font-mono whitespace-nowrap">
                        + Pivot Career
                      </span>
                      <span className="bg-slate-850 text-slate-400 border border-slate-800 px-2.5 py-1.5 rounded-lg text-[9px] font-bold font-mono whitespace-nowrap">
                        + Early Retirement
                      </span>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 text-[9px] font-mono font-bold">
                      STEP 3: FUTURE RESOLUTION
                    </div>
                    <h4 className="text-sm font-bold text-white font-sans leading-tight">Ripple Effects, Projected Future Impact</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Compare your baseline lifestyle against proposed choices. Instantly visualize retirement impacts, passive growth, and budget guardrails.
                    </p>
                    
                    {/* Visual mockup graph lines */}
                    <div className="h-14 flex items-end justify-between gap-1 pt-1 border-b border-slate-800">
                      <div className="flex-1 bg-slate-800/40 h-4 rounded-t" />
                      <div className="flex-1 bg-slate-800/40 h-6 rounded-t" />
                      <div className="flex-1 bg-slate-800/40 h-8 rounded-t" />
                      <div className="flex-1 bg-teal-500/60 h-10 rounded-t" />
                      <div className="flex-1 bg-teal-500/70 h-12 rounded-t" />
                      <div className="flex-1 bg-teal-500/85 h-14 rounded-t" />
                    </div>
                  </div>
                )}
              </div>

              {/* Description footer text */}
              <div className="bg-slate-950/45 p-2.5 rounded-xl border border-slate-850 text-[10px] text-slate-400 leading-normal shrink-0">
                {steps[activeStep].desc}
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* DETAILED VALUE STATS & SECTIONS */}
      <section className="py-20 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <Coins className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Prevent Costly Mistakes</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Before purchasing a vehicle or committing to a major relocation lease, simulate standard living costs, tax adjustments, and commute expenses over 10 years.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Clear Decision Trajectories</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Our projection logic applies compound growth parameters and state-specific tax rates, turning complex spreadsheet calculations into intuitive interactive visual graphs.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Total Privacy Guardrail</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your data is stored securely. We never sell your personal information or pitch speculative financial instruments. Aura Ripple works purely to empower you.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* FINAL CTA PANEL */}
      <section className="py-16 bg-gradient-to-tr from-teal-900 to-indigo-950 text-white relative overflow-hidden">
        
        {/* Soft blur backgrounds */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Take Control of Your Financial Trajectory Today
          </h2>
          <p className="text-slate-300 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
            Stop guessing the outcomes of major decisions. Build your secure digital twin, simulate life's major branches, and decide with confidence.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 pt-4">
            <button
              onClick={() => onNavigate("login", true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-white text-teal-950 hover:bg-slate-100 shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              Get Started Free <ArrowRight className="w-4 h-4 text-teal-700" />
            </button>
            <button
              onClick={() => onNavigate("about", false)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              Learn More
            </button>
          </div>
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
          <p className="text-[11px] text-slate-450">&copy; {new Date().getFullYear()} Aura Ripple. Empowering secure wealth decisions.</p>
        </div>
      </footer>

    </div>
  );
}
