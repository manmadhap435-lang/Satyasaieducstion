import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import emailjs from "@emailjs/browser";
import { SalaryRecord } from "./types";
import {
  STAFF_ROLES,
  PAYMENT_MODES,
  formatINR,
  formatDate,
  getTodayDateString,
  getCurrentMonthKey,
} from "./constants";
import { downloadSalariesReportPDF } from "./pdfGenerators";
import { EditAmountModal, EditTarget } from "./EditAmountModal";
import { Briefcase, Calendar, Lock, RefreshCw, FileText, Check, Pencil, AlertCircle } from "lucide-react";

export function SalariesPanel({ onRefreshTotals }: { onRefreshTotals: () => void }) {
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTarget, setEditingTarget] = useState<EditTarget | null>(null);

  const currentMonthKey = getCurrentMonthKey();

  const [form, setForm] = useState({
    staff_name: "",
    designation: STAFF_ROLES[0],
    email: "",
    salary_amount: "",
    salary_month: currentMonthKey,
    payment_mode: "Bank Transfer (NEFT/RTGS)",
  });
  const [saving, setSaving] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<{
    staffName: string;
    amount: number;
    voucherNo: string;
    month: string;
    emailSent: boolean;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchSalaries = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("salaries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) setSalaries(data as SalaryRecord[]);
    } catch (e) {
      console.warn("Could not query Supabase salaries:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSalaries();
  }, [fetchSalaries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessReceipt(null);

    const amount = parseFloat(form.salary_amount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg("Please enter a valid salary amount.");
      setSaving(false);
      return;
    }

    const voucherNo = `SAL-${Math.floor(100000 + Math.random() * 900000)}`;
    const todayISO = new Date().toISOString();

    const newRecord: SalaryRecord = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `sal_${Date.now()}`,
      staff_name: form.staff_name.trim(),
      designation: form.designation,
      email: form.email.trim(),
      salary_amount: amount,
      salary_month: form.salary_month,
      payment_mode: form.payment_mode,
      created_at: todayISO,
    };

    // 1. Insert into Supabase
    try {
      const { error } = await supabase.from("salaries").insert({
        staff_name: newRecord.staff_name,
        designation: newRecord.designation,
        email: newRecord.email,
        salary_amount: newRecord.salary_amount,
        salary_month: newRecord.salary_month,
        payment_mode: newRecord.payment_mode,
        created_at: newRecord.created_at,
      });
      if (error) console.warn("Supabase insert salaries notice:", error);
    } catch (err) {
      console.warn("Could not insert salary to Supabase:", err);
    }

    // 2. Dispatch Email Confirmation with Faculty / Staff wording
    let emailSuccess = false;
    if (form.email && form.email.includes("@")) {
      try {
        await emailjs.send(
          import.meta.env["VITE_EMAILJS_SERVICE_ID"] || "service_id4a23u",
          import.meta.env["VITE_EMAILJS_TEMPLATE_ID"] || "template_f0zedgs",
          {
            to_name: form.staff_name.trim(),
            staff_name: form.staff_name.trim(),
            faculty_name: form.staff_name.trim(),
            student_name: `${form.staff_name.trim()} (Faculty / Staff)`,
            designation: form.designation,
            role: form.designation,
            class: form.designation,
            course_class: form.designation,
            amount: formatINR(amount),
            salary_amount: formatINR(amount),
            receipt_no: voucherNo,
            voucher_no: voucherNo,
            payment_date: getTodayDateString(),
            salary_month: form.salary_month,
            payment_mode: form.payment_mode,
            payment_type: "Staff Salary Disbursement",
            title: "Staff Salary Payment Confirmation",
            subject: `Salary Disbursement Confirmation - ${form.staff_name.trim()} (${form.salary_month})`,
            message: `Dear ${form.staff_name.trim()},\n\nWe have successfully disbursed your monthly salary for ${form.salary_month}. Transaction details:\n• Voucher No: ${voucherNo}\n• Faculty / Staff: ${form.staff_name.trim()}\n• Role / Designation: ${form.designation}\n• Disbursed Amount: ${formatINR(amount)}\n• Payment Date: ${getTodayDateString()}\n• Mode: ${form.payment_mode}\n\nThank you for your dedicated service to Satya Sai Educational Society.`,
          }
        );
        emailSuccess = true;
      } catch (emailErr) {
        console.warn("EmailJS salary dispatch notice:", emailErr);
      }
    }

    setSuccessReceipt({
      staffName: form.staff_name,
      amount,
      voucherNo,
      month: form.salary_month,
      emailSent: emailSuccess,
    });

    setSalaries((prev) => [newRecord, ...prev]);
    onRefreshTotals();
    setSaving(false);
    setForm({
      staff_name: "",
      designation: STAFF_ROLES[0],
      email: "",
      salary_amount: "",
      salary_month: currentMonthKey,
      payment_mode: "Bank Transfer (NEFT/RTGS)",
    });
  };

  const d = new Date();
  const currentMonthName = d.toLocaleString("en-US", { month: "long" });
  const currentYear = d.getFullYear();

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-[#e5e0d4] bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-sky-900 bg-sky-50 border border-sky-200 shadow-sm mb-2">
              <Briefcase className="size-3.5" /> Institutional Payroll Register & Electronic Slips
            </span>
            <h2 className="text-2xl font-bold font-serif text-[#064e3b]">
              Staff Salaries Disbursement & Email Slips
            </h2>
            <div className="h-1 w-12 bg-amber-500 rounded-full mt-1.5 mb-2" />
            <p className="text-xs text-slate-600 max-w-2xl">
              Disburse monthly compensation for teaching faculty and administrative personnel.
              Sends automated salary slips with designation and voucher details directly to their email.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs shadow-sm">
            <Lock className="size-4 text-emerald-800" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                Audit Disbursement Date
              </div>
              <div className="font-serif font-extrabold text-[#064e3b]">{getTodayDateString()}</div>
            </div>
          </div>
        </div>

        {/* Salary Disbursement Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#e5e0d4] bg-[#faf8f5] p-5 sm:p-6 mb-8">
          <div className="mb-4 flex items-center justify-between border-b border-[#e5e0d4] pb-3">
            <h4 className="text-sm font-bold text-[#064e3b] flex items-center gap-2">
              <Briefcase className="size-4" />
              <span>Record Salary Disbursement Voucher</span>
            </h4>
            <span className="text-[11px] font-semibold text-slate-500">
              Dispatches automated email payslip
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Faculty / Staff Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Srikanth V., M.Sc. B.Ed."
                value={form.staff_name}
                onChange={(e) => setForm({ ...form, staff_name: e.target.value })}
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#064e3b] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Role / Designation *
              </label>
              <select
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#064e3b] focus:outline-none"
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Salary Month *
              </label>
              <input
                type="text"
                value={form.salary_month}
                onChange={(e) => setForm({ ...form, salary_month: e.target.value })}
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#064e3b] focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Disbursed Salary Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 25000"
                  value={form.salary_amount}
                  onChange={(e) => setForm({ ...form, salary_amount: e.target.value })}
                  className="w-full rounded-xl border border-[#d8d2c4] bg-white py-2 pl-7 pr-3 text-xs font-bold text-slate-900 focus:border-[#064e3b] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
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

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Staff Email (for Automated Pay Slip)
              </label>
              <input
                type="email"
                placeholder="faculty@satayasai.edu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#064e3b] focus:outline-none"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="mt-3 rounded-xl bg-rose-50 border border-rose-300 p-2.5 text-xs font-semibold text-rose-800">
              {errorMsg}
            </div>
          )}

          {successReceipt && (
            <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-300 p-4 text-xs font-semibold text-emerald-900">
              <div className="flex items-center gap-2">
                <Check className="size-4 text-emerald-700" />
                <span>
                  Disbursed {formatINR(successReceipt.amount)} to faculty <strong>{successReceipt.staffName}</strong> (Voucher: {successReceipt.voucherNo}, {successReceipt.month}).
                  {successReceipt.emailSent && " Automated electronic salary slip dispatched to email."}
                </span>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#064e3b] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#085a44] transition-all disabled:opacity-50"
            >
              <Check className="size-4" />
              <span>{saving ? "Disbursing…" : "Disburse Salary Voucher"}</span>
            </button>
          </div>
        </form>

        {/* Salary Records List */}
        <div className="border-t border-[#f0ede6] pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h4 className="text-sm font-bold text-[#064e3b] uppercase tracking-wider">
                Recent Salary Disbursements ({salaries.length})
              </h4>
              <span className="text-xs text-slate-500">
                Current Month: <strong>{currentMonthKey}</strong> (Amount editable)
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                downloadSalariesReportPDF({
                  monthName: currentMonthName,
                  year: currentYear,
                  salaries,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#064e3b] bg-white px-4 py-2 text-xs font-bold text-[#064e3b] hover:bg-emerald-50 shadow-sm"
            >
              <FileText className="size-3.5" />
              <span>Download Salaries Statement (PDF)</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#e5e0d4]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5e0d4] text-left text-xs font-bold uppercase tracking-wider text-[#064e3b] bg-[#064e3b]/5">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Voucher No</th>
                  <th className="py-3 px-4">Faculty / Staff Name</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Salary Month</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ede6]">
                {salaries.map((s, idx) => {
                  const salDate = new Date(s.created_at);
                  const salMonthKey = `${salDate.toLocaleString("en-US", { month: "long" })} ${salDate.getFullYear()}`;
                  const isCurrentMonth = salMonthKey === currentMonthKey;

                  return (
                    <tr key={s.id} className="hover:bg-[#faf8f5] transition-colors">
                      <td className="py-3 px-4 text-center text-xs font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-[#064e3b]">
                        SAL-{s.id.slice(0, 6).toUpperCase()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.staff_name}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-700">{s.designation}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-amber-900">{s.salary_month}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{s.payment_mode}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{formatDate(s.created_at)}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-[#064e3b]">
                        {formatINR(s.salary_amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isCurrentMonth && (
                          <button
                            type="button"
                            onClick={() =>
                              setEditingTarget({
                                type: "salary",
                                id: s.id,
                                name: `${s.staff_name} (${s.designation})`,
                                currentAmount: s.salary_amount,
                                month: s.salary_month,
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
          fetchSalaries();
          onRefreshTotals();
        }}
      />
    </div>
  );
}
