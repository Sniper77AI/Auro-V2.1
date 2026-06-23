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
          setStatus({ type: "success", message: `${res.message} You are now authorized to log in.` });
          setIsSignUp(false);
          setPassword("");
        } else {
          setStatus({ type: "error", message: res.message });
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
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-6 text-zinc-100 selection:bg-emerald-500/20">
      
      {/* Background radial effects */}
      <div className="absolute w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-emerald-500/10 to-teal-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-zinc-900/40 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6 font-sans">
        {/* Core application banner */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-450 flex items-center justify-center font-bold text-zinc-950 font-mono shadow-lg text-lg">
            A
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-3">Aura Identity Gate</h1>
          <p className="text-xs font-mono text-emerald-400 tracking-wider uppercase">
            Phase 2A Secure Database Core
          </p>
          <p className="text-xs text-zinc-400 italic">
            "See your future before you spend your money."
          </p>
        </div>

        {/* Core login card */}
        <div className="bg-zinc-900/90 border border-zinc-805 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
            <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">
              {isReset ? "Password Link Recovery" : isSignUp ? "Establish Customer Record" : "Authorized Gate Entry"}
            </span>
            <span className="bg-emerald-950/40 border border-emerald-900/30 text-[9px] text-emerald-400 px-2 py-0.5 rounded font-mono font-bold uppercase">
              RLS ACTIVE
            </span>
          </div>

          {status.message && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              status.type === "success" 
                ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-300" 
                : status.type === "info"
                  ? "bg-teal-950/20 border-teal-900/40 text-teal-350 animate-pulse"
                  : "bg-rose-950/20 border-rose-900/40 text-rose-300"
            }`}>
              {status.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : status.type === "info" ? (
                <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-450 shrink-0 mt-0.5" />
              )}
              <span className="font-medium leading-relaxed">{status.message}</span>
            </div>
          )}

          <form onSubmit={handleAction} className="space-y-4">
            
            {/* Show extended onboarding fields if making a profile record */}
            {isSignUp && (
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide block mb-1">First Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-zinc-550 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-805 rounded-lg p-2.5 pl-9 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide block mb-1">Last Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-zinc-550 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-805 rounded-lg p-2.5 pl-9 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide block mb-1">Contact Phone (PII Encrypted)</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-zinc-550 absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="+1 (555) 012-3456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-805 rounded-lg p-2.5 pl-9 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide block mb-1">Email Coordinates</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-zinc-550 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-805 rounded-lg p-2.5 pl-9 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {!isReset && (
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide block">Personal Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsReset(true);
                        setStatus({ type: "", message: "" });
                      }}
                      className="text-[10px] text-zinc-500 hover:text-emerald-400 uppercase tracking-wide font-semibold cursor-pointer"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-zinc-550 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-805 rounded-lg p-2.5 pl-9 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black tracking-tight text-xs py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40"
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
          <div className="flex justify-between pt-3 border-t border-zinc-850 text-[11px] text-zinc-450">
            {isReset ? (
              <button
                onClick={() => {
                  setIsReset(false);
                  setStatus({ type: "", message: "" });
                }}
                className="hover:text-zinc-200 font-bold uppercase tracking-wider font-mono cursor-pointer"
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
                  className="text-emerald-450 hover:text-emerald-400 font-bold uppercase tracking-wider font-mono cursor-pointer"
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
              className="text-[11px] font-mono font-bold text-zinc-500 hover:text-emerald-450 uppercase tracking-widest cursor-pointer transition-colors"
            >
              ← Back to Landing Page
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
