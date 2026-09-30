import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseRecord } from "./types";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_MODES,
  formatINR,
  formatDate,
  getTodayDateString,
  getCurrentMonthKey,
} from "./constants";
import { downloadExpensesReportPDF } from "./pdfGenerators";
import { EditAmountModal, EditTarget } from "./EditAmountModal";
import { TrendingDown, Calendar, Lock, RefreshCw, FileText, Check, Pencil } from "lucide-react";

export function ExpensesPanel({ onRefreshTotals }: { onRefreshTotals: () => void }) {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTarget, setEditingTarget] = useState<EditTarget | null>(null);

  const [form, setForm] = useState({
    reason: "",
    amount: "",
    category: EXPENSE_CATEGORIES[0],
    payment_mode: "Cash",
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("expenses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) setExpenses(data as ExpenseRecord[]);
    } catch (e) {
      console.warn("Could not query Supabase expenses:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");

    const val = parseFloat(form.amount);
    if (isNaN(val) || val <= 0) {
      alert("Please enter a valid expense amount.");
      setSaving(false);
      return;
    }

    const todayISO = new Date().toISOString();
    const newRecord: ExpenseRecord = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `exp_${Date.now()}`,
      reason: form.reason.trim(),
      amount: val,
      category: form.category,
      payment_mode: form.payment_mode,
      created_at: todayISO,
    };

    try {
      await supabase.from("expenses").insert({
        reason: newRecord.reason,
        amount: newRecord.amount,
        created_at: newRecord.created_at,
      });
    } catch (err) {
      console.warn("Could not insert expense to Supabase:", err);
    }

    setExpenses((prev) => [newRecord, ...prev]);
    onRefreshTotals();
    setSaving(false);
    setSuccessMsg(`Expense voucher for ${formatINR(val)} recorded successfully!`);
    setForm({
      reason: "",
      amount: "",
      category: EXPENSE_CATEGORIES[0],
      payment_mode: "Cash",
    });
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const currentMonthKey = getCurrentMonthKey();
  const d = new Date();
  const currentMonthName = d.toLocaleString("en-US", { month: "long" });
  const currentYear = d.getFullYear();

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-[#e5e0d4] bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 shadow-sm mb-2">
              <TrendingDown className="size-3.5" /> Institutional Expenditure Ledger
            </span>
            <h2 className="text-2xl font-bold font-serif text-[#064e3b]">
              Operational & Facility Expenses
            </h2>
            <div className="h-1 w-12 bg-amber-500 rounded-full mt-1.5 mb-2" />
            <p className="text-xs text-slate-600 max-w-2xl">
              Record campus operational expenses, utilities, lab supplies, maintenance, and examination fees
              with audit-locked payment dates.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs shadow-sm">
            <Lock className="size-4 text-emerald-800" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                Audit Payment Date
              </div>
              <div className="font-serif font-extrabold text-[#064e3b]">{getTodayDateString()}</div>
            </div>
          </div>
        </div>

        {/* Expense Entry Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#e5e0d4] bg-[#faf8f5] p-5 sm:p-6 mb-8">
          <div className="mb-4 flex items-center justify-between border-b border-[#e5e0d4] pb-3">
            <h4 className="text-sm font-bold text-[#064e3b] flex items-center gap-2">
              <TrendingDown className="size-4" />
              <span>Record New Expenditure Voucher</span>
            </h4>
            <span className="text-[11px] font-semibold text-slate-500">
              Auto-timestamps today's date
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Particulars / Expense Description *
              </label>
              <input
                type="text"
                placeholder="e.g. Science lab equipment, electricity bill, bus diesel"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#064e3b] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#064e3b] focus:outline-none"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 5000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full rounded-xl border border-[#d8d2c4] bg-white py-2 pl-7 pr-3 text-xs font-bold text-slate-900 focus:border-[#064e3b] focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="w-1/3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Disbursement Mode
              </label>
              <select
                value={form.payment_mode}
                onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#064e3b] focus:outline-none"
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-700 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-800 transition-all disabled:opacity-50"
            >
              <Check className="size-4" />
              <span>{saving ? "Recording…" : "Record Expense Voucher"}</span>
            </button>
          </div>

          {successMsg && (
            <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-300 p-2.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <Check className="size-4" />
              <span>{successMsg}</span>
            </div>
          )}
        </form>

        {/* Expenses List */}
        <div className="border-t border-[#f0ede6] pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h4 className="text-sm font-bold text-[#064e3b] uppercase tracking-wider">
                Recent Expense Vouchers ({expenses.length})
              </h4>
              <span className="text-xs text-slate-500">
                Current Month: <strong>{currentMonthKey}</strong> (Amount editable)
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                downloadExpensesReportPDF({
                  monthName: currentMonthName,
                  year: currentYear,
                  expenses,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#064e3b] bg-white px-4 py-2 text-xs font-bold text-[#064e3b] hover:bg-emerald-50 shadow-sm"
            >
              <FileText className="size-3.5" />
              <span>Download Expenses Statement (PDF)</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#e5e0d4]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5e0d4] text-left text-xs font-bold uppercase tracking-wider text-[#064e3b] bg-[#064e3b]/5">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Particulars / Description</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ede6]">
                {expenses.map((e, idx) => {
                  const expDate = new Date(e.created_at);
                  const expMonthKey = `${expDate.toLocaleString("en-US", { month: "long" })} ${expDate.getFullYear()}`;
                  const isCurrentMonth = expMonthKey === currentMonthKey;

                  return (
                    <tr key={e.id} className="hover:bg-[#faf8f5] transition-colors">
                      <td className="py-3 px-4 text-center text-xs font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {e.category || "General Operations"}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">{e.reason}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{e.payment_mode || "Cash"}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{formatDate(e.created_at)}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-rose-700">
                        {formatINR(e.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isCurrentMonth && (
                          <button
                            type="button"
                            onClick={() =>
                              setEditingTarget({
                                type: "expense",
                                id: e.id,
                                name: e.reason,
                                currentAmount: e.amount,
                                month: expMonthKey,
                              })
                            }
                            className="rounded-lg border border-[#d8d2c4] bg-white p-1 text-slate-600 hover:bg-slate-100"
                            title="Edit current month amount"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <EditAmountModal
        target={editingTarget}
        onClose={() => setEditingTarget(null)}
        onSuccess={() => {
          fetchExpenses();
          onRefreshTotals();
        }}
      />
    </div>
  );
}
