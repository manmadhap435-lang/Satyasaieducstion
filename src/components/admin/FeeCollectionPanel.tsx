import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import emailjs from "@emailjs/browser";
import { FeeRecord, StudentRecord, ClassFeeStructure } from "./types";
import {
  CLASS_OPTIONS,
  TERMS,
  PAYMENT_MODES,
  formatINR,
  formatDate,
  getTodayDateString,
  getCurrentMonthKey,
} from "./constants";
import { downloadStudentFeeReceiptPDF } from "./pdfGenerators";
import { EditAmountModal, EditTarget } from "./EditAmountModal";
import {
  Wallet,
  Receipt,
  Search,
  Calendar,
  Lock,
  RefreshCw,
  Printer,
  Pencil,
  Check,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

export function FeeCollectionPanel({
  onRefreshTotals,
  initialHallTicket,
}: {
  onRefreshTotals: () => void;
  initialHallTicket?: string;
}) {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [structures, setStructures] = useState<ClassFeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTarget, setEditingTarget] = useState<EditTarget | null>(null);

  // Form State
  const [form, setForm] = useState({
    hall_ticket_no: initialHallTicket || "",
    student_name: "",
    class: CLASS_OPTIONS[3],
    email: "",
    term: "Term 1",
    payment_mode: "Cash",
    fee_amount: "",
  });

  const [matchedStudent, setMatchedStudent] = useState<StudentRecord | null>(null);
  const [studentPaymentHistory, setStudentPaymentHistory] = useState<FeeRecord[]>([]);
  const [studentTotalFee, setStudentTotalFee] = useState<number>(30000);
  const [studentTotalPaid, setStudentTotalPaid] = useState<number>(0);
  const [studentRemainingDue, setStudentRemainingDue] = useState<number>(30000);

  const [saving, setSaving] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<{
    receiptNo: string;
    studentName: string;
    amount: number;
    hallTicket: string;
    term: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);

    // 1. Fetch Fees
    try {
      const { data } = await supabase
        .from("fee_collections")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) setFees(data as FeeRecord[]);
    } catch (e) {}

    // 2. Fetch Students
    try {
      const { data } = await supabase.from("students").select("*");
      if (data && data.length > 0) {
        setStudents(data as StudentRecord[]);
      } else if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sses_students_cache");
        if (stored) setStudents(JSON.parse(stored));
      }
    } catch (e) {}

    // 3. Fetch Fee Structures
    try {
      const { data } = await supabase.from("class_fee_structures").select("*");
      if (data && data.length > 0) {
        setStructures(data as ClassFeeStructure[]);
      } else if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sses_class_fee_structures");
        if (stored) setStructures(JSON.parse(stored));
      }
    } catch (e) {}

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // When initialHallTicket changes from parent tab navigation
  useEffect(() => {
    if (initialHallTicket) {
      setForm((prev) => ({ ...prev, hall_ticket_no: initialHallTicket }));
      handleLookupRoll(initialHallTicket);
    }
  }, [initialHallTicket]);

  // Trigger Hall Ticket Lookup: computes 3 terms and how many times paid
  const handleLookupRoll = useCallback(
    (inputRoll: string) => {
      const cleaned = inputRoll.trim().toUpperCase();
      if (!cleaned) {
        setMatchedStudent(null);
        setStudentPaymentHistory([]);
        return;
      }

      const match = students.find((s) => s.hall_ticket_no.toUpperCase() === cleaned);
      if (match) {
        setMatchedStudent(match);
        setForm((prev) => ({
          ...prev,
          hall_ticket_no: match.hall_ticket_no,
          student_name: match.student_name,
          class: match.class,
          email: match.email || prev.email,
        }));

        // Find Class Fee Structure
        const struct =
          structures.find((s) => s.class === match.class && s.group_name === match.group_name) ||
          structures.find((s) => s.class === match.class) || {
            class: match.class,
            group_name: match.group_name,
            academic_year: "2026-2027",
            total_fee: 30000,
            term1_fee: 12000,
            term2_fee: 10000,
            term3_fee: 8000,
          };

        const totalClassFee = struct.total_fee || 30000;
        setStudentTotalFee(totalClassFee);

        // Find existing payments for this student
        const prevPayments = fees.filter(
          (f) =>
            (f.hall_ticket_no && f.hall_ticket_no.toUpperCase() === cleaned) ||
            f.student_name.toLowerCase().trim() === match.student_name.toLowerCase().trim()
        );
        setStudentPaymentHistory(prevPayments);

        const paid = prevPayments.reduce((sum, p) => sum + (p.fee_amount || 0), 0);
        setStudentTotalPaid(paid);
        const due = Math.max(0, totalClassFee - paid);
        setStudentRemainingDue(due);

        // Determine default suggested term and amount
        const t1Paid = prevPayments
          .filter((p) => (p.term || "").includes("1"))
          .reduce((sum, p) => sum + p.fee_amount, 0);
        const t2Paid = prevPayments
          .filter((p) => (p.term || "").includes("2"))
          .reduce((sum, p) => sum + p.fee_amount, 0);

        if (t1Paid < struct.term1_fee) {
          setForm((prev) => ({
            ...prev,
            term: "Term 1",
            fee_amount: String(struct.term1_fee - t1Paid),
          }));
        } else if (t2Paid < struct.term2_fee) {
          setForm((prev) => ({
            ...prev,
            term: "Term 2",
            fee_amount: String(struct.term2_fee - t2Paid),
          }));
        } else {
          setForm((prev) => ({
            ...prev,
            term: "Term 3",
            fee_amount: String(Math.min(due, struct.term3_fee)),
          }));
        }
      } else {
        setMatchedStudent(null);
        // If not in student directory, calculate based on class
        const prevPayments = fees.filter(
          (f) => f.hall_ticket_no && f.hall_ticket_no.toUpperCase() === cleaned
        );
        setStudentPaymentHistory(prevPayments);
        const paid = prevPayments.reduce((sum, p) => sum + (p.fee_amount || 0), 0);
        setStudentTotalPaid(paid);
      }
    },
    [students, structures, fees]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessReceipt(null);

    const amount = parseFloat(form.fee_amount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg("Please enter a valid fee amount.");
      setSaving(false);
      return;
    }

    const receiptNo = `REC-${Math.floor(100000 + Math.random() * 900000)}`;
    const todayISO = new Date().toISOString();

    const newRecord: FeeRecord = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `fee_${Date.now()}`,
      hall_ticket_no: form.hall_ticket_no.trim().toUpperCase(),
      student_name: form.student_name.trim(),
      class: form.class,
      term: form.term,
      payment_mode: form.payment_mode,
      receipt_no: receiptNo,
      email: form.email.trim(),
      fee_amount: amount,
      created_at: todayISO,
    };

    // 1. Insert into Supabase
    try {
      const { error } = await supabase.from("fee_collections").insert({
        hall_ticket_no: newRecord.hall_ticket_no,
        student_name: newRecord.student_name,
        class: newRecord.class,
        term: newRecord.term,
        payment_mode: newRecord.payment_mode,
        receipt_no: newRecord.receipt_no,
        email: newRecord.email,
        fee_amount: newRecord.fee_amount,
        created_at: newRecord.created_at,
      });
      if (error) console.warn("Supabase insert notice:", error);
    } catch (err) {
      console.warn("Could not insert fee collection to Supabase:", err);
    }

    // 2. Dispatch EmailJS Confirmation
    if (form.email && form.email.includes("@")) {
      try {
        const remainingAfter = Math.max(0, studentRemainingDue - amount);
        await emailjs.send(
          import.meta.env["VITE_EMAILJS_SERVICE_ID"] || "service_id4a23u",
          import.meta.env["VITE_EMAILJS_TEMPLATE_ID"] || "template_f0zedgs",
          {
            to_name: form.student_name.trim(),
            student_name: form.student_name.trim(),
            hall_ticket_no: form.hall_ticket_no.trim().toUpperCase(),
            receipt_no: receiptNo,
            class: form.class,
            term: form.term,
            amount: formatINR(amount),
            remaining_due: formatINR(remainingAfter),
            payment_date: getTodayDateString(),
            payment_mode: form.payment_mode,
            message: `Official Fee Payment Confirmation: Received ${formatINR(amount)} for ${form.term} (${form.class}) from ${form.student_name}. Receipt No: ${receiptNo}. Outstanding fee due: ${formatINR(remainingAfter)}.`,
          }
        );
      } catch (emailErr) {
        console.warn("EmailJS fee dispatch note:", emailErr);
      }
    }

    setSuccessReceipt({
      receiptNo,
      studentName: form.student_name,
      amount,
      hallTicket: form.hall_ticket_no,
      term: form.term,
    });

    setFees((prev) => [newRecord, ...prev]);
    onRefreshTotals();
    setSaving(false);

    // Re-trigger roll lookup to refresh dues
    handleLookupRoll(form.hall_ticket_no);
  };

  const currentMonthKey = getCurrentMonthKey();

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="rounded-3xl border border-[#e5e0d4] bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-[#064e3b] bg-emerald-50 border border-emerald-200 shadow-sm mb-2">
              <Receipt className="size-3.5" /> Multi-Term Fee Receipt Desk
            </span>
            <h2 className="text-2xl font-bold font-serif text-[#064e3b]">
              Student Fee Collection & Multi-Term Due Audit
            </h2>
            <div className="h-1 w-12 bg-amber-500 rounded-full mt-1.5 mb-2" />
            <p className="text-xs text-slate-600 max-w-2xl">
              Enter or scan the student's <strong>Hall Ticket / Roll Number</strong> to view their full 3-term payment history,
              verify previous installments, and collect fee receipts with audit-locked timestamps and automated email delivery.
            </p>
          </div>

          {/* Audit Locked Date Badge */}
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

        {/* Collection Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#e5e0d4] bg-[#faf8f5] p-5 sm:p-6 mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e0d4] pb-3">
            <h4 className="text-sm font-bold text-[#064e3b] flex items-center gap-2">
              <Wallet className="size-4" />
              <span>Record Fee Voucher & Issue Receipt</span>
            </h4>
            <span className="text-[11px] font-semibold text-slate-500">
              Trigger with Roll Number / Hall Ticket
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            {/* Hall Ticket Input with Quick Trigger */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Hall Ticket / Roll No *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. SSES-2026-101"
                  value={form.hall_ticket_no}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, hall_ticket_no: val });
                    handleLookupRoll(val);
                  }}
                  className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-[#064e3b] focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
                  required
                />
              </div>
            </div>

            {/* Student Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Student Name *
              </label>
              <input
                type="text"
                placeholder="Student full name"
                value={form.student_name}
                onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#064e3b] focus:outline-none"
                required
              />
            </div>

            {/* Class */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Class / Course *
              </label>
              <select
                value={form.class}
                onChange={(e) => setForm({ ...form, class: e.target.value })}
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#064e3b] focus:outline-none"
              >
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Term Dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                Payment Installment / Term *
              </label>
              <select
                value={form.term}
                onChange={(e) => setForm({ ...form, term: e.target.value })}
                className="w-full rounded-xl border border-amber-300 bg-amber-50/50 px-3 py-2 text-xs font-bold text-amber-900 focus:border-[#064e3b] focus:outline-none"
              >
                {TERMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hall Ticket Live Audit Trigger Banner */}
          {matchedStudent && (
            <div className="mt-4 rounded-xl border border-[#064e3b]/30 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0ede6] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-emerald-100 text-[#064e3b] px-2 py-0.5 rounded">
                    {matchedStudent.hall_ticket_no}
                  </span>
                  <span className="font-bold text-sm text-slate-900">{matchedStudent.student_name}</span>
                  <span className="text-xs text-slate-500">
                    ({matchedStudent.class} · Sec {matchedStudent.section})
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-600">
                  Total Payments Made: <strong className="text-emerald-700">{studentPaymentHistory.length} times</strong>
                </div>
              </div>

              {/* 3 Terms Status Cards */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="rounded-lg bg-[#faf8f5] p-2.5 border border-[#e5e0d4]">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Total Annual Fee</div>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5">{formatINR(studentTotalFee)}</div>
                </div>
                <div className="rounded-lg bg-emerald-50 p-2.5 border border-emerald-200">
                  <div className="text-[10px] uppercase font-bold text-emerald-800">Total Fee Paid</div>
                  <div className="text-sm font-extrabold text-emerald-800 mt-0.5">{formatINR(studentTotalPaid)}</div>
                </div>
                <div className="rounded-lg bg-rose-50 p-2.5 border border-rose-200">
                  <div className="text-[10px] uppercase font-bold text-rose-800">Remaining Due</div>
                  <div className="text-sm font-extrabold text-rose-800 mt-0.5">{formatINR(studentRemainingDue)}</div>
                </div>
                <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-200">
                  <div className="text-[10px] uppercase font-bold text-amber-800">Selected Term</div>
                  <div className="text-sm font-extrabold text-amber-900 mt-0.5">{form.term}</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {/* Amount */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Fee Amount to Collect (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 10000"
                  value={form.fee_amount}
                  onChange={(e) => setForm({ ...form, fee_amount: e.target.value })}
                  className="w-full rounded-xl border border-[#d8d2c4] bg-white py-2 pl-7 pr-3 text-xs font-bold text-slate-900 focus:border-[#064e3b] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Payment Mode
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

            {/* Email for Confirmation */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Student / Guardian Email (Optional)
              </label>
              <input
                type="email"
                placeholder="Dispatches instant payment confirmation"
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-700" />
                  <span>
                    Successfully collected {formatINR(successReceipt.amount)} for {successReceipt.term} from{" "}
                    <strong>{successReceipt.studentName}</strong> (Receipt: {successReceipt.receiptNo}).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const studentRecord = matchedStudent || {
                      id: "s-temp",
                      hall_ticket_no: successReceipt.hallTicket,
                      student_name: successReceipt.studentName,
                      class: form.class,
                      group_name: "General",
                      section: "A",
                      phone: "",
                      admission_date: "",
                      academic_year: "2026-2027",
                    };
                    downloadStudentFeeReceiptPDF({
                      student: studentRecord,
                      totalFee: studentTotalFee,
                      totalPaid: studentTotalPaid + successReceipt.amount,
                      remainingDue: Math.max(0, studentRemainingDue - successReceipt.amount),
                      latestPayment: fees[0],
                      payments: fees.filter(
                        (f) =>
                          f.hall_ticket_no?.toUpperCase() === successReceipt.hallTicket.toUpperCase() ||
                          f.student_name.toLowerCase() === successReceipt.studentName.toLowerCase()
                      ),
                    });
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 bg-white px-3 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                >
                  <Printer className="size-3" />
                  <span>Print Receipt Slip</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#064e3b] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#085a44] transition-all disabled:opacity-50"
            >
              <Check className="size-4" />
              <span>{saving ? "Processing Receipt…" : "Issue Fee Receipt"}</span>
            </button>
          </div>
        </form>

        {/* Recent Fee Collections Table */}
        <div className="border-t border-[#f0ede6] pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-[#064e3b] uppercase tracking-wider">
              Recent Fee Collection Vouchers ({fees.length})
            </h4>
            <span className="text-xs text-slate-500">
              Current Month: <strong>{currentMonthKey}</strong> (Amount editable)
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#e5e0d4]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5e0d4] text-left text-xs font-bold uppercase tracking-wider text-[#064e3b] bg-[#064e3b]/5">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Hall Ticket / Roll No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Term</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ede6]">
                {fees.map((f, idx) => {
                  const feeDate = new Date(f.created_at);
                  const feeMonthKey = `${feeDate.toLocaleString("en-US", { month: "long" })} ${feeDate.getFullYear()}`;
                  const isCurrentMonth = feeMonthKey === currentMonthKey;

                  return (
                    <tr key={f.id} className="hover:bg-[#faf8f5] transition-colors">
                      <td className="py-3 px-4 text-center text-xs font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#064e3b]">
                        {f.hall_ticket_no || "—"}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{f.student_name}</td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-700">{f.class}</td>
                      <td className="py-3 px-4">
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900 border border-amber-200">
                          {f.term || "Term 1"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">{f.payment_mode || "Cash"}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{formatDate(f.created_at)}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-[#064e3b]">
                        {formatINR(f.fee_amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {isCurrentMonth && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingTarget({
                                  type: "fee",
                                  id: f.id,
                                  name: `${f.student_name} (${f.class})`,
                                  currentAmount: f.fee_amount,
                                  month: feeMonthKey,
                                })
                              }
                              className="rounded-lg border border-[#d8d2c4] bg-white p-1 text-slate-600 hover:bg-slate-100"
                              title="Edit current month amount"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Amount Modal */}
      <EditAmountModal
        target={editingTarget}
        onClose={() => setEditingTarget(null)}
        onSuccess={() => {
          fetchData();
          onRefreshTotals();
        }}
      />
    </div>
  );
}
