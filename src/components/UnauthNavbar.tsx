/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Menu, X, Sparkles, Activity } from "lucide-react";

interface UnauthNavbarProps {
  currentPage: "landing" | "about" | "login";
  onNavigate: (page: "landing" | "about" | "login", signUpDefault?: boolean) => void;
}

export default function UnauthNavbar({ currentPage, onNavigate }: UnauthNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 font-sans">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <button 
          onClick={() => {
            onNavigate("landing");
            setIsOpen(false);
          }}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center font-bold text-white shadow-md transition-transform group-hover:scale-[1.03]">
            AR
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 leading-none">Aura Ripple</h1>
            <span className="text-[9px] font-mono font-semibold tracking-wider text-teal-600 uppercase leading-none mt-1 block">
              Decision Coach
            </span>
          </div>
        </button>

        {/* DESKTOP NAV ITEMS */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => onNavigate("landing")}
            className={`text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
              currentPage === "landing" ? "text-teal-600" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Home
          </button>
          
          <button
            onClick={() => onNavigate("about")}
            className={`text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
              currentPage === "about" ? "text-teal-600" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            About
          </button>

          <button
            onClick={() => onNavigate("login", false)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow transition-all cursor-pointer"
          >
            Sign In
          </button>
        </div>

        {/* MOBILE BURGER TOGGLE */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

      </div>

      {/* MOBILE DRAWER OPEN/CLOSE */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-4 shadow-xl">
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                onNavigate("landing");
                setIsOpen(false);
              }}
              className={`text-left text-xs font-semibold py-2 transition-colors cursor-pointer ${
                currentPage === "landing" ? "text-teal-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigate("about");
                setIsOpen(false);
              }}
              className={`text-left text-xs font-semibold py-2 transition-colors cursor-pointer ${
                currentPage === "about" ? "text-teal-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              About
            </button>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                onNavigate("login", false);
                setIsOpen(false);
              }}
              className="w-full text-center px-4 py-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow cursor-pointer transition-all block"
            >
              Sign In
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
