/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SupabaseService } from "../supabaseService";
import { KeyRound, Mail, UserPlus, LogIn, User, Phone, CheckCircle2, ShieldAlert } from "lucide-react";

interface AuthContainerProps {
  onSuccess: (session: any, role: string) => void;
  initialSignUp?: boolean;
  onBackToLanding?: () => void;
}

export default function AuthContainer({ onSuccess, initialSignUp = false, onBackToLanding }: AuthContainerProps) {
  const [isSignUp, setIsSignUp] = useState(initialSignUp);
  const [isReset, setIsReset] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  
  const [status, setStatus] = useState<{ type: "success" | "error" | "info" | ""; message: string }>({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setLoading(true);

    try {
      if (isReset) {
        // Password Reset Request
        const res = await SupabaseService.triggerPasswordReset(email);
        if (res.success) {
          setStatus({ type: "success", message: res.message });
        } else {
          setStatus({ type: "error", message: res.message });
        }
      } else if (isSignUp) {
        // Sign Up
        if (!email || !password || !firstName || !lastName) {
          throw new Error("AURA SECURITY: Please fill in all mandatory fields.");
        }
        const res = await SupabaseService.signUp(email, password, firstName, lastName, phone);
        if (res.success) {
          if (res.emailConfirmationRequired) {
            // 2. confirmation email required
            setStatus({ 
              type: "success", 
              message: "Account created! We've sent a verification link to your email. Please click the link in your inbox to confirm your account and log in." 
            });
            setPassword("");
          } else {
            // 1. registration completed and signed in
            setStatus({ 
              type: "success", 
              message: "Registration completed! Your account has been created and your financial profile is initialized." 
            });
            if (res.session) {
              onSuccess(res.session, "customer");
            } else {
              setIsSignUp(false);
              setPassword("");
            }
          }
        } else {
          const msg = res.message || "";
          if (msg.includes("Confirmation emails are temporarily limited") || msg.includes("rate limit")) {
            // 4. temporary email rate limit
            setStatus({
              type: "error",
              message: "Confirmation emails are temporarily limited. Please wait a few minutes and try again."
            });
          } else if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("email-already-in-use") || msg.includes("taken")) {
            // 3. existing account
            setStatus({
              type: "error",
              message: "An account with this email address already exists. Please sign in instead."
            });
          } else if (msg.toLowerCase().includes("profile initialization") || msg.toLowerCase().includes("twin allocation")) {
            // 5. profile initialization failure
            setStatus({
              type: "error",
              message: `Profile initialization failed: ${msg}. Although the account was registered, we could not initialize the dashboard. Please try signing in directly.`
            });
          } else {
            setStatus({ type: "error", message: msg });
          }
        }
      } else {
        // Sign In / Login
        if (!email || !password) {
          throw new Error("AURA SECURITY: Email and password credentials required.");
        }
        const res = await SupabaseService.signIn(email, password);
        if (res.success) {
          setStatus({ type: "success", message: "Successfully authenticated." });
          onSuccess(res.session, res.role || "customer");
        } else {
          setStatus({ type: "error", message: res.message });
        }
      }
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "An authentication error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-slate-800 selection:bg-teal-500/20 relative overflow-hidden">
      
      {/* Background radial effects */}
      <div className="absolute w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-teal-200/40 to-emerald-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-100/40 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6 font-sans">
        {/* Core application banner */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center font-bold text-white shadow-lg text-lg">
            AR
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 mt-3">Aura Identity Gate</h1>
          <p className="text-xs font-mono text-teal-700 tracking-wider uppercase font-bold">
            Phase 2A Secure Database Core
          </p>
          <p className="text-xs text-slate-500 italic">
            "See your future before you spend your money."
          </p>
        </div>

        {/* Core login card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-widest">
              {isReset ? "Password Link Recovery" : isSignUp ? "Establish Customer Record" : "Authorized Gate Entry"}
            </span>
            <span className="bg-teal-50 border border-teal-200 text-[9px] text-teal-800 px-2 py-0.5 rounded font-mono font-bold uppercase">
              RLS ACTIVE
            </span>
          </div>

          {status.message && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              status.type === "success" 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                : status.type === "info"
                  ? "bg-teal-50 border-teal-200 text-teal-800 animate-pulse"
                  : "bg-rose-50 border-rose-200 text-rose-800"
            }`}>
              {status.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : status.type === "info" ? (
                <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium leading-relaxed">{status.message}</span>
            </div>
          )}

          <form onSubmit={handleAction} className="space-y-4">
            
            {/* Show extended onboarding fields if making a profile record */}
            {isSignUp && (
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block mb-1">First Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block mb-1">Last Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block mb-1">Contact Phone (PII Encrypted)</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="tel"
                    placeholder="+1 (555) 012-3456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block mb-1">Email Coordinates</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all shadow-inner"
                />
              </div>
            </div>

            {!isReset && (
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">Personal Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsReset(true);
                        setStatus({ type: "", message: "" });
                      }}
                      className="text-[10px] text-teal-600 hover:text-teal-700 uppercase tracking-wide font-bold cursor-pointer"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-9 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold tracking-tight text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-teal-600/10 active:scale-[0.98] disabled:opacity-40"
            >
              {loading ? (
                <span>Validating Cryptographic Session...</span>
              ) : isReset ? (
                <>
                  <LogIn className="w-4 h-4" /> Trigger Recovery Link
                </>
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4" /> Create Account
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In to Command Center
                </>
              )}
            </button>
          </form>

          {/* Toggle buttons */}
          <div className="flex justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            {isReset ? (
              <button
                onClick={() => {
                  setIsReset(false);
                  setStatus({ type: "", message: "" });
                }}
                className="hover:text-teal-600 font-bold uppercase tracking-wider font-mono cursor-pointer"
              >
                Back to Entrance
              </button>
            ) : (
              <>
                <span>
                  {isSignUp ? "Already have an account?" : "Need a secure twin record?"}
                </span>
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setStatus({ type: "", message: "" });
                  }}
                  className="text-teal-600 hover:text-teal-700 font-bold uppercase tracking-wider font-mono cursor-pointer"
                >
                  {isSignUp ? "Gate entry" : "Create account"}
                </button>
              </>
            )}
          </div>
        </div>

        {onBackToLanding && (
          <div className="text-center pt-2">
            <button
              onClick={onBackToLanding}
              className="text-[11px] font-mono font-bold text-slate-400 hover:text-teal-600 uppercase tracking-widest cursor-pointer transition-colors"
            >
              ← Back to Landing Page
            </button>
          </div>
        )}

        {import.meta.env.DEV && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-center space-y-3 shadow-inner mt-4">
            <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-widest block">
              ⚠️ Development Preview
            </span>
            <p className="text-[11px] text-amber-700 leading-normal">
              Database is unconfigured/sandbox mode. Use local mock-preview endpoints to verify compliance interfaces. This is NOT a real financial account.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  const mockSession = {
                    user: {
                      id: "mock-dev-id",
                      userId: "mock-dev-id",
                      email: "dev-customer@auraripple.local",
                      userEmail: "dev-customer@auraripple.local",
                      firstName: "Dev",
                      lastName: "Customer",
                      role: "customer"
                    }
                  };
                  onSuccess(mockSession, "customer");
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold font-mono text-[9.5px] py-2 rounded-xl cursor-pointer transition-colors uppercase tracking-wider"
              >
                Demo Customer
              </button>
              <button
                onClick={() => {
                  const mockSession = {
                    user: {
                      id: "mock-dev-auditor-id",
                      userId: "mock-dev-auditor-id",
                      email: "dev-auditor@auraripple.local",
                      userEmail: "dev-auditor@auraripple.local",
                      firstName: "Dev",
                      lastName: "Auditor",
                      role: "auditor"
                    }
                  };
                  onSuccess(mockSession, "auditor");
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold font-mono text-[9.5px] py-2 rounded-xl cursor-pointer transition-colors uppercase tracking-wider"
              >
                Demo Auditor
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
