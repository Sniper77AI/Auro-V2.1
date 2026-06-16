/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FinancialTwin, IncomeSource, AssetItem, LiabilityItem } from "../types";
import { Plus, Trash2, ShieldAlert, DollarSign, Award, ArrowUpRight, Scale, Briefcase, ChevronRight, HelpCircle } from "lucide-react";

interface TwinConfiguratorProps {
  twin: FinancialTwin;
  onChange: (updatedTwin: FinancialTwin) => void;
}

const US_STATES = [
  { code: "CA", name: "California (Prog. Tax to 13.3%)" },
  { code: "TX", name: "Texas (0.0% State Income Tax)" },
  { code: "NY", name: "New York (Prog. Tax to 10.9%)" },
  { code: "FL", name: "Florida (0.0% State Income Tax)" },
  { code: "IL", name: "Illinois (4.95% Flat State Tax)" },
  { code: "WA", name: "Washington (0.0% State Income Income Tax)" },
  { code: "MA", name: "Massachusetts (5.0% Flat State Tax)" },
  { code: "NV", name: "Nevada (0.0% State Income Tax)" },
  { code: "OH", name: "Ohio (Prog. Tax to 3.99%)" },
  { code: "NC", name: "North Carolina (4.5% Flat State Tax)" }
];

export default function TwinConfigurator({ twin, onChange }: TwinConfiguratorProps) {
  const [activeTab, setActiveTab] = useState<"general" | "income" | "assets" | "liabilities">("general");

  // Local state for adding entries easily
  const [newInc, setNewInc] = useState<Omit<IncomeSource, "id">>({
    name: "",
    amount: 50000,
    frequency: "annual",
    type: "salary"
  });

  const [newAsset, setNewAsset] = useState<Omit<AssetItem, "id">>({
    name: "",
    amount: 10000,
    type: "brokerage",
    annualGrowth: 0.07
  });

  const [newLiab, setNewLiab] = useState<Omit<LiabilityItem, "id">>({
    name: "",
    amount: 15000,
    interestRate: 0.06,
    monthlyPayment: 250,
    type: "student_loan"
  });

  // Action helpers
  const handleUpdateGeneral = (field: keyof FinancialTwin, value: any) => {
    onChange({
      ...twin,
      [field]: value
    });
  };

  const handleAddIncome = () => {
    if (!newInc.name) return;
    const item: IncomeSource = {
      ...newInc,
      id: Math.random().toString(36).substring(2, 9)
    };
    onChange({
      ...twin,
      incomes: [...twin.incomes, item]
    });
    setNewInc({ name: "", amount: 50000, frequency: "annual", type: "salary" });
  };

  const handleRemoveIncome = (id: string) => {
    onChange({
      ...twin,
      incomes: twin.incomes.filter(i => i.id !== id)
    });
  };

  const handleAddAsset = () => {
    if (!newAsset.name) return;
    const item: AssetItem = {
      ...newAsset,
      id: Math.random().toString(36).substring(2, 9)
    };
    onChange({
      ...twin,
      assets: [...twin.assets, item]
    });
    setNewAsset({ name: "", amount: 10000, type: "brokerage", annualGrowth: 0.07 });
  };

  const handleRemoveAsset = (id: string) => {
    onChange({
      ...twin,
      assets: twin.assets.filter(a => a.id !== id)
    });
  };

  const handleAddLiability = () => {
    if (!newLiab.name) return;
    const item: LiabilityItem = {
      ...newLiab,
      id: Math.random().toString(36).substring(2, 9)
    };
    onChange({
      ...twin,
      liabilities: [...twin.liabilities, item]
    });
    setNewLiab({
      name: "",
      amount: 15000,
      interestRate: 0.06,
      monthlyPayment: 250,
      type: "student_loan"
    });
  };

  const handleRemoveLiability = (id: string) => {
    onChange({
      ...twin,
      liabilities: twin.liabilities.filter(l => l.id !== id)
    });
  };

  // Aggregated summaries
  const totalAnnualIncome = twin.incomes.reduce((acc, curr) => {
    return acc + (curr.frequency === "annual" ? curr.amount : curr.amount * 12);
  }, 0);

  const totalAssetsValue = twin.assets.reduce((acc, curr) => acc + curr.amount, 0);
  const totalLiabilitiesValue = twin.liabilities.reduce((acc, curr) => acc + curr.amount, 0);
  const netWorth = totalAssetsValue - totalLiabilitiesValue;

  const totalMonthlyDebtPayments = twin.liabilities.reduce((acc, curr) => acc + curr.monthlyPayment, 0);
  const monthlyGrossIncome = totalAnnualIncome / 12;
  const debtToIncomeRatio = monthlyGrossIncome > 0 ? (totalMonthlyDebtPayments / monthlyGrossIncome) * 100 : 0;

  return (
    <div id="twin-configurator" className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Banner Stat Segment */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 p-6 border-b border-zinc-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-emerald-400 font-mono text-xs tracking-wider uppercase">Active Financial Twin Profile</span>
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight mt-1">Virtual Ledger Calibration</h2>
            <p className="text-xs text-zinc-400 mt-1">Configure asset nodes, compounding coefficients, and leverage brackets.</p>
          </div>
          <div className="flex gap-4 self-stretch md:self-auto">
            <div className="bg-zinc-950/60 border border-zinc-805/80 p-3 rounded-lg text-left flex-1 md:flex-initial">
              <span className="text-[10px] uppercase font-mono text-zinc-500 block">Total Net Worth</span>
              <span className={`text-base font-bold font-mono tracking-tight block ${netWorth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                ${netWorth.toLocaleString()}
              </span>
            </div>
            <div className="bg-zinc-950/60 border border-zinc-805/80 p-3 rounded-lg text-left flex-1 md:flex-initial">
              <span className="text-[10px] uppercase font-mono text-zinc-500 block">Annual Income</span>
              <span className="text-base font-bold font-mono text-zinc-200 tracking-tight block">
                ${totalAnnualIncome.toLocaleString()}
              </span>
            </div>
            <div className="bg-zinc-950/60 border border-zinc-805/80 p-3 rounded-lg text-left flex-1 md:flex-initial">
              <span className="text-[10px] uppercase font-mono text-zinc-500 block">DTI Ratio</span>
              <span className={`text-base font-bold font-mono tracking-tight block ${debtToIncomeRatio < 35 ? "text-teal-400" : debtToIncomeRatio < 45 ? "text-amber-400" : "text-rose-400"}`}>
                {debtToIncomeRatio.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 bg-zinc-900/60 text-xs px-2 pt-2">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2.5 font-medium border-b-2 rounded-t-md transition-all ${activeTab === "general" ? "border-emerald-500 text-emerald-400 bg-zinc-955" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
        >
          General Params
        </button>
        <button
          onClick={() => setActiveTab("income")}
          className={`px-4 py-2.5 font-medium border-b-2 rounded-t-md transition-all ${activeTab === "income" ? "border-emerald-500 text-emerald-400 bg-zinc-955" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
        >
          Income ({twin.incomes.length})
        </button>
        <button
          onClick={() => setActiveTab("assets")}
          className={`px-4 py-2.5 font-medium border-b-2 rounded-t-md transition-all ${activeTab === "assets" ? "border-emerald-500 text-emerald-400 bg-zinc-955" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
        >
          Assets ({twin.assets.length})
        </button>
        <button
          onClick={() => setActiveTab("liabilities")}
          className={`px-4 py-2.5 font-medium border-b-2 rounded-t-md transition-all ${activeTab === "liabilities" ? "border-emerald-500 text-emerald-400 bg-zinc-955" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}
        >
          Liabilities ({twin.liabilities.length})
        </button>
      </div>

      {/* Content Form container */}
      <div className="p-6">
        {/* TAB 1: GENERAL */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-zinc-400 text-xs font-mono block mb-1">CURRENT AGE</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="18"
                  max="80"
                  value={twin.age}
                  onChange={(e) => handleUpdateGeneral("age", parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="font-mono text-sm bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800 text-emerald-400 font-bold min-w-[50px] text-center">
                  {twin.age}
                </span>
              </div>
            </div>

            <div>
              <label className="text-zinc-400 text-xs font-mono block mb-1">TARGET RETIREMENT AGE</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="40"
                  max="90"
                  value={twin.retirementAge}
                  onChange={(e) => handleUpdateGeneral("retirementAge", parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="font-mono text-sm bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800 text-teal-400 font-bold min-w-[50px] text-center">
                  {twin.retirementAge}
                </span>
              </div>
            </div>

            <div>
              <label className="text-zinc-400 text-xs font-mono block mb-1">MONTHLY GENERAL EXPENSES ($)</label>
              <input
                type="number"
                value={twin.monthlyExpenses}
                onChange={(e) => handleUpdateGeneral("monthlyExpenses", Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">Living costs, rent/utilities, lifestyle outlays.</span>
            </div>

            <div>
              <label className="text-zinc-400 text-xs font-mono block mb-1">TAX RESIDENCY STATE (US Phase 1)</label>
              <select
                value={twin.taxState}
                onChange={(e) => handleUpdateGeneral("taxState", e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm font-sans text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                {US_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-zinc-500 mt-1 block">Loads state-specific progressive income bracket maps.</span>
            </div>

            <div>
              <label className="text-zinc-400 text-xs font-mono block mb-1">DEPENDANTS</label>
              <input
                type="number"
                min="0"
                max="10"
                value={twin.dependants}
                onChange={(e) => handleUpdateGeneral("dependants", Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-zinc-400 text-xs font-mono block mb-1">PLANNING RISK TOLERANCE</label>
              <div className="grid grid-cols-3 gap-2">
                {(["conservative", "moderate", "aggressive"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleUpdateGeneral("riskTolerance", lvl)}
                    className={`p-2.5 rounded-lg border text-xs font-mono capitalize transition-all ${
                      twin.riskTolerance === lvl
                        ? "bg-emerald-950/40 border-emerald-500 text-emerald-400"
                        : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INCOME */}
        {activeTab === "income" && (
          <div className="space-y-6">
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4">
              <span className="text-xs font-mono font-bold text-zinc-300 block mb-3">Add Custom Income Node</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="e.g. Primary Salary"
                  value={newInc.name}
                  onChange={(e) => setNewInc({ ...newInc, name: e.target.value })}
                  className="bg-zinc-900 border border-zinc-800/60 rounded p-2 text-xs text-zinc-200 font-sans focus:outline-none focus:border-emerald-500"
                />
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-zinc-500 text-xs">$</span>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={newInc.amount}
                    onChange={(e) => setNewInc({ ...newInc, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-800/60 rounded p-2 pl-6 text-xs text-zinc-200 font-mono focus:outline-none"
                  />
                </div>
                <select
                  value={newInc.type}
                  onChange={(e) => setNewInc({ ...newInc, type: e.target.value as any })}
                  className="bg-zinc-900 border border-zinc-800/60 rounded p-2 text-xs text-zinc-200 font-mono focus:outline-none"
                >
                  <option value="salary">Salary (W2)</option>
                  <option value="bonus">Bonus / Commission</option>
                  <option value="investment">Dividends / Yield</option>
                  <option value="business">Self-Employment</option>
                  <option value="other">Other Inflow</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddIncome}
                  disabled={!newInc.name}
                  className="bg-emerald-600 hover:bg-emerald-505 text-zinc-900 font-bold transition-all text-xs rounded py-2 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" /> Append Node
                </button>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 font-mono border-b border-zinc-800">
                  <tr>
                    <th className="p-3">Source Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Annual Return</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {twin.incomes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-zinc-500 italic">
                        No financial inflows mapped to the twin. Add one above.
                      </td>
                    </tr>
                  ) : (
                    twin.incomes.map((inc) => (
                      <tr key={inc.id} className="hover:bg-zinc-900/40">
                        <td className="p-3 font-semibold text-zinc-200">{inc.name}</td>
                        <td className="p-3 font-mono text-zinc-400 capitalize">{inc.type}</td>
                        <td className="p-3 font-mono text-zinc-200 text-right font-bold">
                          ${inc.amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveIncome(inc.id)}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-zinc-950 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ASSETS */}
        {activeTab === "assets" && (
          <div className="space-y-6">
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4">
              <span className="text-xs font-mono font-bold text-zinc-300 block mb-3">Add Custom Asset Balance</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="e.g. 401(k) retirement"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="bg-zinc-900 border border-zinc-800/60 rounded p-2 text-xs text-zinc-200 font-sans focus:outline-none focus:border-emerald-500"
                />
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-zinc-500 text-xs">$</span>
                  <input
                    type="number"
                    placeholder="Current Balance"
                    value={newAsset.amount}
                    onChange={(e) => setNewAsset({ ...newAsset, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-800/60 rounded p-2 pl-6 text-xs text-zinc-200 font-mono focus:outline-none"
                  />
                </div>
                <select
                  value={newAsset.type}
                  onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value as any })}
                  className="bg-zinc-900 border border-zinc-800/60 rounded p-2 text-xs text-zinc-200 font-mono focus:outline-none"
                >
                  <option value="cash">Liquid Cash / HYSA</option>
                  <option value="retirement">Retirement Account (IRA/401k)</option>
                  <option value="brokerage">Brokerage Portfolio</option>
                  <option value="real_estate">Real Estate equity</option>
                  <option value="other">Other Asset</option>
                </select>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Growth (0.07)"
                      value={newAsset.annualGrowth}
                      onChange={(e) => setNewAsset({ ...newAsset, annualGrowth: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-zinc-900 border border-zinc-800/60 rounded p-2 text-xs text-zinc-200 font-mono focus:outline-none"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-zinc-500">ARR</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAsset}
                    disabled={!newAsset.name}
                    className="bg-emerald-600 hover:bg-emerald-505 text-zinc-900 font-bold px-3 transition-all text-xs rounded flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 font-mono border-b border-zinc-800">
                  <tr>
                    <th className="p-3">Asset Ledger Node</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">ARR %</th>
                    <th className="p-3 text-right">Raw Balance</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {twin.assets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-zinc-500 italic">
                        No wealth assets mapped to the twin. Add one above.
                      </td>
                    </tr>
                  ) : (
                    twin.assets.map((ast) => (
                      <tr key={ast.id} className="hover:bg-zinc-900/40">
                        <td className="p-3 font-semibold text-zinc-200">{ast.name}</td>
                        <td className="p-3 font-mono text-zinc-400 capitalize">{ast.type.replace("_", " ")}</td>
                        <td className="p-3 font-mono text-emerald-400 text-right">{(ast.annualGrowth * 100).toFixed(1)}%</td>
                        <td className="p-3 font-mono text-zinc-200 text-right font-bold">
                          ${ast.amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveAsset(ast.id)}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-zinc-950 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: LIABILITIES */}
        {activeTab === "liabilities" && (
          <div className="space-y-6">
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4">
              <span className="text-xs font-mono font-bold text-zinc-300 block mb-3">Add Liability Ledger Item</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="e.g. Student loans"
                  value={newLiab.name}
                  onChange={(e) => setNewLiab({ ...newLiab, name: e.target.value })}
                  className="bg-zinc-900 border border-zinc-800/60 rounded p-2 text-xs text-zinc-200 font-sans focus:outline-none focus:border-emerald-500"
                />
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-zinc-500 text-xs">$</span>
                  <input
                    type="number"
                    placeholder="Total Debt"
                    value={newLiab.amount}
                    onChange={(e) => setNewLiab({ ...newLiab, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-800/60 rounded p-2 pl-6 text-xs text-zinc-200 font-mono focus:outline-none"
                  />
                </div>
                <select
                  value={newLiab.type}
                  onChange={(e) => setNewLiab({ ...newLiab, type: e.target.value as any })}
                  className="bg-zinc-900 border border-zinc-800/60 rounded p-2 text-xs text-zinc-200 font-mono focus:outline-none"
                >
                  <option value="student_loan">Student Loan</option>
                  <option value="mortgage">Mortgage</option>
                  <option value="auto_loan">Vehicle Loan</option>
                  <option value="credit_card">Revolving Credit Card</option>
                  <option value="other">Other Liability</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Rate i.e. 0.05"
                    value={newLiab.interestRate}
                    onChange={(e) => setNewLiab({ ...newLiab, interestRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-800/60 rounded p-2 text-xs text-zinc-200 font-mono focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Min Monthly"
                    value={newLiab.monthlyPayment}
                    onChange={(e) => setNewLiab({ ...newLiab, monthlyPayment: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-800/60 rounded p-2 text-xs text-zinc-200 font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddLiability}
                    disabled={!newLiab.name}
                    className="bg-emerald-600 hover:bg-emerald-505 text-zinc-900 font-bold px-3 transition-all text-xs rounded flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 font-mono border-b border-zinc-800">
                  <tr>
                    <th className="p-3">Debt Liability Node</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Interest Rate</th>
                    <th className="p-3 text-right">Monthly Outpay</th>
                    <th className="p-3 text-right">Total Owed</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {twin.liabilities.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-zinc-500 italic">
                        No financial liabilities mapped to the twin. Add one above.
                      </td>
                    </tr>
                  ) : (
                    twin.liabilities.map((lia) => (
                      <tr key={lia.id} className="hover:bg-zinc-900/40">
                        <td className="p-3 font-semibold text-zinc-200">{lia.name}</td>
                        <td className="p-3 font-mono text-zinc-400 capitalize">{lia.type.replace("_", " ")}</td>
                        <td className="p-3 font-mono text-rose-400 text-right">{(lia.interestRate * 100).toFixed(1)}%</td>
                        <td className="p-3 font-mono text-zinc-300 text-right">${lia.monthlyPayment.toLocaleString()}</td>
                        <td className="p-3 font-mono text-zinc-200 text-right font-bold">
                          ${lia.amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLiability(lia.id)}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-zinc-950 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
