import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FeeRecord, ExpenseRecord, SalaryRecord } from "./types";
import { CLASS_OPTIONS, formatINR, formatDate } from "./constants";
import {
  downloadMonthlyReportPDF,
  downloadClassFeeReportPDF,
  downloadExpensesReportPDF,
  downloadSalariesReportPDF,
} from "./pdfGenerators";
import {
  Calendar,
  Filter,
  FileDown,
  Printer,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Users,
  Building,
} from "lucide-react";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function MonthlyReportsPanel() {
  const d = new Date();
  const [selectedMonth, setSelectedMonth] = useState(d.getMonth());
  const [selectedYear, setSelectedYear] = useState(d.getFullYear());
  const [selectedClass, setSelectedClass] = useState("all");
  const [reportSubTab, setReportSubTab] = useState<"classes" | "expenses" | "salaries">("classes");

  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMonthData = useCallback(async () => {
    setLoading(true);

    const start = new Date(selectedYear, selectedMonth, 1).toISOString();
    const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toISOString();
    const monthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

    try {
      // Fees
      const { data: feeData } = await supabase
        .from("fee_collections")
        .select("*")
        .gte("created_at", start)
        .lte("created_at", end);
      if (feeData) setFees(feeData as FeeRecord[]);

      // Expenses
      const { data: expData } = await supabase
        .from("expenses")
        .select("*")
        .gte("created_at", start)
        .lte("created_at", end);
      if (expData) setExpenses(expData as ExpenseRecord[]);

      // Salaries
      const { data: salData } = await supabase
        .from("salaries")
        .select("*")
        .or(`salary_month.eq."${monthLabel}",and(created_at.gte."${start}",created_at.lte."${end}")`);
      if (salData) setSalaries(salData as SalaryRecord[]);
    } catch (e) {
      console.warn("Could not query month report data:", e);
    }

    setLoading(false);
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchMonthData();
  }, [fetchMonthData]);

  // Calculations
  const totalCollection = useMemo(
    () => fees.reduce((sum, f) => sum + (f.fee_amount || 0), 0),
    [fees]
  );
  const totalExpense = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses]
  );
  const totalSalary = useMemo(
    () => salaries.reduce((sum, s) => sum + (s.salary_amount || 0), 0),
    [salaries]
  );
  const netRevenue = totalCollection - totalExpense - totalSalary;

  // Class breakdown
  const classBreakdown = useMemo(() => {
    return CLASS_OPTIONS.map((className) => {
      const classFees = fees.filter((f) => f.class === className);
      const total = classFees.reduce((sum, f) => sum + (f.fee_amount || 0), 0);
      const percentage = totalCollection > 0 ? (total / totalCollection) * 100 : 0;
      return {
        className,
        count: classFees.length,
        total,
        percentage,
        records: classFees,
      };
    });
  }, [fees, totalCollection]);

  const monthName = MONTH_NAMES[selectedMonth];

  return (
    <div className="space-y-8">
      {/* Top Banner & Control Bar */}
      <div className="rounded-3xl border border-[#e5e0d4] bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-[#064e3b] bg-emerald-50 border border-emerald-200 shadow-sm mb-2">
              <Calendar className="size-3.5" /> Executive Monthly Financial Audit
            </span>
            <h2 className="text-2xl font-bold font-serif text-[#064e3b]">
              Monthly Financial Statement & Class Statements
            </h2>
            <div className="h-1 w-12 bg-amber-500 rounded-full mt-1.5 mb-2" />
            <p className="text-xs text-slate-600 max-w-2xl">
              Audit statement for <strong>{monthName} {selectedYear}</strong>. Main monthly PDF statement excludes student names for clean governance.
              Individual class statements with enrolled student registers can be downloaded separately.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Download Monthly Executive PDF (NO student details) */}
            <button
              type="button"
              onClick={() =>
                downloadMonthlyReportPDF(
                  monthName,
                  selectedYear,
                  fees,
                  expenses,
                  salaries,
                  classBreakdown,
                  totalCollection,
                  totalExpense,
                  totalSalary,
                  netRevenue
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#064e3b] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#085a44] transition-all"
            >
              <Printer className="size-4" />
              <span>Download Monthly Audit (PDF)</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchMonthData}
              className="rounded-xl border border-[#d8d2c4] bg-[#faf8f5] p-2.5 text-slate-600 hover:bg-[#f0ede6]"
              title="Refresh statement"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin text-emerald-700" : ""}`} />
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="grid gap-3 sm:grid-cols-3 mb-6 p-4 rounded-2xl bg-[#faf8f5] border border-[#e5e0d4]">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Select Audit Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#064e3b] focus:outline-none"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Select Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#064e3b] focus:outline-none"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Filter by Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#064e3b] focus:outline-none"
            >
              <option value="all">All Classes & Streams</option>
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Total Fee Collections
            </span>
            <div className="text-xl font-extrabold text-[#064e3b] mt-1">
              {formatINR(totalCollection)}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1">{fees.length} Total Receipts</div>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
              Operational Expenses
            </span>
            <div className="text-xl font-extrabold text-rose-700 mt-1">
              {formatINR(totalExpense)}
            </div>
            <div className="text-[11px] text-rose-600 mt-1">{expenses.length} Vouchers</div>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
              Staff Salaries Disbursed
            </span>
            <div className="text-xl font-extrabold text-sky-700 mt-1">
              {formatINR(totalSalary)}
            </div>
            <div className="text-[11px] text-sky-600 mt-1">{salaries.length} Personnel</div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Net Available Balance
            </span>
            <div
              className={`text-xl font-extrabold mt-1 ${
                netRevenue >= 0 ? "text-[#064e3b]" : "text-rose-700"
              }`}
            >
              {formatINR(netRevenue)}
            </div>
            <div
              className={`text-[11px] font-bold mt-1 ${
                netRevenue >= 0 ? "text-emerald-700" : "text-rose-600"
              }`}
            >
              {netRevenue >= 0 ? "Monthly Surplus" : "Monthly Deficit"}
            </div>
          </div>
        </div>

        {/* Subtabs inside Reports */}
        <div className="flex items-center gap-2 border-b border-[#e5e0d4] pb-3 mb-6">
          <button
            type="button"
            onClick={() => setReportSubTab("classes")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              reportSubTab === "classes"
                ? "bg-[#064e3b] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Class-Wise Fee Collection Summary
          </button>
          <button
            type="button"
            onClick={() => setReportSubTab("expenses")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              reportSubTab === "expenses"
                ? "bg-[#064e3b] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Operational Expenses Register
          </button>
          <button
            type="button"
            onClick={() => setReportSubTab("salaries")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              reportSubTab === "salaries"
                ? "bg-[#064e3b] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Staff Salaries Register
          </button>
        </div>

        {/* SubTab 1: Classes Summary & Dedicated Class PDF */}
        {reportSubTab === "classes" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#064e3b]">
                Class Collection Totals ({classBreakdown.filter((c) => c.total > 0).length} Active)
              </h4>
              {selectedClass !== "all" && (
                <button
                  type="button"
                  onClick={() => {
                    const match = classBreakdown.find((c) => c.className === selectedClass);
                    downloadClassFeeReportPDF({
                      className: selectedClass,
                      monthName,
                      year: selectedYear,
                      fees: match ? match.records : [],
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#064e3b] bg-white px-3.5 py-1.5 text-xs font-bold text-[#064e3b] hover:bg-emerald-50"
                >
                  <FileDown className="size-3.5" />
                  <span>Download {selectedClass} PDF</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#e5e0d4]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e0d4] text-left text-xs font-bold uppercase tracking-wider text-[#064e3b] bg-[#064e3b]/5">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Class / Academic Stream</th>
                    <th className="py-3 px-4 text-center">Enrolled Paying Count</th>
                    <th className="py-3 px-4 text-right">Fee Collected (₹)</th>
                    <th className="py-3 px-4 text-right">Share (%)</th>
                    <th className="py-3 px-4 text-center">Class Register PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ede6]">
                  {classBreakdown
                    .filter((c) => selectedClass === "all" || c.className === selectedClass)
                    .map((c, idx) => (
                      <tr key={c.className} className="hover:bg-[#faf8f5] transition-colors">
                        <td className="py-3 px-4 text-center text-xs font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{c.className}</td>
                        <td className="py-3 px-4 text-center text-xs font-semibold text-slate-700">
                          {c.count} students
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-[#064e3b]">
                          {formatINR(c.total)}
                        </td>
                        <td className="py-3 px-4 text-right text-xs text-slate-500">
                          {c.percentage.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              downloadClassFeeReportPDF({
                                className: c.className,
                                monthName,
                                year: selectedYear,
                                fees: c.records,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-[#d8d2c4] bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-[#064e3b] hover:text-white transition-colors"
                            title="Download dedicated class PDF with student details"
                          >
                            <FileDown className="size-3" />
                            <span>Download PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SubTab 2: Expenses */}
        {reportSubTab === "expenses" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Expenditure Vouchers ({expenses.length})
              </h4>
              <button
                type="button"
                onClick={() =>
                  downloadExpensesReportPDF({
                    monthName,
                    year: selectedYear,
                    expenses,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-700 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-50"
              >
                <FileDown className="size-3.5" />
                <span>Download Expenses PDF</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#e5e0d4]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e0d4] text-left text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-50/50">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ede6]">
                  {expenses.map((e, idx) => (
                    <tr key={e.id} className="hover:bg-[#faf8f5]">
                      <td className="py-3 px-4 text-center text-xs font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {e.category || "General"}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">{e.reason}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{formatDate(e.created_at)}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{e.payment_mode || "Cash"}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-700">
                        {formatINR(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SubTab 3: Salaries */}
        {reportSubTab === "salaries" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-800">
                Staff Salaries Disbursed ({salaries.length})
              </h4>
              <button
                type="button"
                onClick={() =>
                  downloadSalariesReportPDF({
                    monthName,
                    year: selectedYear,
                    salaries,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-700 bg-white px-3.5 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-50"
              >
                <FileDown className="size-3.5" />
                <span>Download Salaries PDF</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#e5e0d4]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e0d4] text-left text-xs font-bold uppercase tracking-wider text-sky-800 bg-sky-50/50">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Faculty / Staff Name</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Salary Month</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ede6]">
                  {salaries.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-[#faf8f5]">
                      <td className="py-3 px-4 text-center text-xs font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.staff_name}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-700">{s.designation}</td>
                      <td className="py-3 px-4 text-xs text-amber-900">{s.salary_month}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{s.payment_mode}</td>
                      <td className="py-3 px-4 text-right font-bold text-sky-700">
                        {formatINR(s.salary_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
