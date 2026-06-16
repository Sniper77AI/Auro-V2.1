/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from "react";
import { AURA_DELIVERABLES } from "../data/deliverables";
import { 
  BookOpen, Search, Filter, HelpCircle, 
  ChevronRight, ArrowRight, CornerDownRight, 
  Download, Terminal, Database, Shield, Layers
} from "lucide-react";

export default function DeliverablesViewer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedItem, setSelectedItem] = useState(AURA_DELIVERABLES[0]);

  // Categories extraction
  const categories = ["All", "Strategy", "Architecture", "governance", "Simulation", "Operations"];

  const filtered = AURA_DELIVERABLES.filter((del) => {
    const matchesSearch = 
      del.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      del.sections.some(s => s.content.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCat = selectedCategory === "All" || del.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCat;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="product-blueprint-viewer">
      {/* LEFT CONTENT LIST (5 cols) */}
      <div className="lg:col-span-5 space-y-4 flex flex-col h-[650px]">
        {/* Search & filters panel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 shrink-0">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-bold leading-none">Deliverables Navigation Index</span>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-650" />
            <input
              type="text"
              placeholder="Search deliverables schemas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-855 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-sans"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-md border font-bold capitalize transition-all cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? "bg-emerald-950/40 border-emerald-500 text-emerald-400"
                    : "bg-zinc-950 border-zinc-850/60 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable list of items */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-xs text-zinc-550 block">No matching deliverables found.</span>
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition-all cursor-pointer ${
                  selectedItem.id === item.id
                    ? "bg-emerald-95%); bg-zinc-950/60 border-emerald-500 text-zinc-100"
                    : "bg-zinc-950/30 border-zinc-805/30 hover:border-zinc-800 text-zinc-440 hover:text-zinc-220"
                }`}
              >
                <div className={`p-1.5 rounded-md ${selectedItem.id === item.id ? "bg-emerald-600 text-zinc-900" : "bg-zinc-950 border border-zinc-850 text-zinc-500"}`}>
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center leading-none text-[10px] font-mono mb-1">
                    <span className="font-bold text-zinc-150">{item.title}</span>
                    <span className="text-[9px] uppercase text-zinc-600">{item.category}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 truncate mt-1 leading-normal">{item.description}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT DETAILED PRESENTER (7 cols) */}
      <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-[650px] overflow-y-auto flex flex-col justify-between">
        <div className="space-y-6">
          {/* Detailed item title card */}
          <div className="border-b border-zinc-800 pb-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-emerald-400 font-mono text-xs uppercase font-bold tracking-wider">{selectedItem.category} Framework</span>
                <h3 className="text-lg font-black text-zinc-150 tracking-tight mt-1">{selectedItem.title}</h3>
              </div>
              <span className="text-[10px] font-mono bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded text-zinc-500 shrink-0">
                MODULE REQUIREMENT #{selectedItem.id}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{selectedItem.description}</p>
          </div>

          {/* Detailed Sections rendering */}
          <div className="space-y-6">
            {selectedItem.sections.map((sec, idx) => (
              <div key={idx} className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-200 border-l-2 border-emerald-500 pl-2 uppercase font-mono tracking-tight">
                  {sec.title}
                </h4>
                
                {/* Check for code logs formatting i.e. database schemas or ER flows */}
                {sec.content.includes("CREATE TABLE") || sec.content.includes("----") || sec.content.includes("HEADER RAIL") ? (
                  <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-xl font-mono text-[10px] text-zinc-300 overflow-x-auto whitespace-pre leading-relaxed">
                    <code>{sec.content}</code>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">{sec.content}</p>
                )}

                {sec.bullets && sec.bullets.length > 0 && (
                  <ul className="space-y-2 pl-1.5 pt-1">
                    {sec.bullets.map((bullet, bidx) => (
                      <li key={bidx} className="flex items-start gap-2 text-xs text-zinc-400">
                        <CornerDownRight className="w-3.5 h-3.5 text-emerald-405 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Verification and signature */}
        <div className="border-t border-zinc-800/80 pt-4 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-955 p-3 rounded-xl border border-zinc-850/60 text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-zinc-300 block">Verified Architectural Blueprint</span>
                <span className="text-[10px] text-zinc-500 block">Status: Completed, awaiting physical C-level implementation</span>
              </div>
            </div>
            
            <div className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-850">
              CPO • STRATEGIST • ARCHITECT APPROVED
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
