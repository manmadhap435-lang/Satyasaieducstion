import { useState } from "react";
import { FeeCollectionPanel } from "./FeeCollectionPanel";
import { ExpensesPanel } from "./ExpensesPanel";
import { SalariesPanel } from "./SalariesPanel";
import { MonthlyReportsPanel } from "./MonthlyReportsPanel";
import { formatINR } from "./constants";
import { ArrowLeft, Wallet, TrendingDown, Briefcase, Calendar } from "lucide-react";

export type RevenueSubTab = "fees" | "expenses" | "salaries" | "monthly";

export function RevenueManagementSection({
  totals,
  loadingTotals,
  onRefreshTotals,
  onBackToOverview,
  initialHallTicket,
}: {
  totals: { fees: number; expenses: number; salaries: number };
  loadingTotals: boolean;
  onRefreshTotals: () => void;
  onBackToOverview: () => void;
  initialHallTicket?: string;
}) {
  const [subTab, setSubTab] = useState<RevenueSubTab>("fees");
  const balance = totals.fees - totals.expenses - totals.salaries;

  return (
    <div className="space-y-8">
      {/* Top Banner with Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e0d4] pb-6">
        <div>
          <button
            type="button"
            onClick={onBackToOverview}
            className="flex items-center gap-1.5 text-xs font-bold text-[#064e3b] hover:text-[#085a44] mb-2 transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to Admin Overview
          </button>
          <h2 className="text-2xl font-bold font-serif tracking-tight text-[#064e3b] flex items-center gap-2.5">
            <span>💼 Revenue & Payroll Management</span>
          </h2>
          <div className="h-1 w-12 bg-amber-500 rounded-full mt-1.5 mb-2" />
          <p className="text-xs text-slate-600">
            Student fee collections with Hall Ticket lookup, operational expenses, staff salaries with automated email slips, and monthly financial reports with PDF export.
          </p>
        </div>

        {/* Live Balance Pill */}
        <div className="flex items-center gap-2 rounded-2xl border border-[#e5e0d4] bg-white px-4 py-2.5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Available Reserve:
          </span>
          <span
            className={`font-serif font-extrabold text-sm ${
              balance >= 0 ? "text-[#064e3b]" : "text-rose-700"
            }`}
          >
            {loadingTotals ? "…" : formatINR(balance)}
          </span>
        </div>
      </div>

      {/* Institutional Subtab Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e5e0d4] pb-4">
        <button
          type="button"
          onClick={() => setSubTab("fees")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            subTab === "fees"
              ? "bg-[#064e3b] text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-[#faf8f5] border border-[#e5e0d4]"
          }`}
        >
          <Wallet className="size-4" />
          <span>Fee Collections (Receipts)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("expenses")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            subTab === "expenses"
              ? "bg-[#064e3b] text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-[#faf8f5] border border-[#e5e0d4]"
          }`}
        >
          <TrendingDown className="size-4" />
          <span>Operational Expenses</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("salaries")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            subTab === "salaries"
              ? "bg-[#064e3b] text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-[#faf8f5] border border-[#e5e0d4]"
          }`}
        >
          <Briefcase className="size-4" />
          <span>Staff Salaries (Email Slips)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("monthly")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            subTab === "monthly"
              ? "bg-[#064e3b] text-white shadow-sm"
              : "bg-white text-slate-700 hover:bg-[#faf8f5] border border-[#e5e0d4]"
          }`}
        >
          <Calendar className="size-4" />
          <span>Monthly Reports & Statements (PDF)</span>
        </button>
      </div>

      {/* Subtab Views */}
      {subTab === "fees" && (
        <FeeCollectionPanel
          onRefreshTotals={onRefreshTotals}
          initialHallTicket={initialHallTicket}
        />
      )}
      {subTab === "expenses" && <ExpensesPanel onRefreshTotals={onRefreshTotals} />}
      {subTab === "salaries" && <SalariesPanel onRefreshTotals={onRefreshTotals} />}
      {subTab === "monthly" && <MonthlyReportsPanel />}
    </div>
  );
}
