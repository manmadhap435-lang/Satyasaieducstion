import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StudentRecord, ClassFeeStructure, FeeRecord, StudentFeeSummary } from "./types";
import { CLASS_OPTIONS, GROUP_OPTIONS, SECTION_OPTIONS, formatINR, formatDate } from "./constants";
import { downloadStudentFeeReceiptPDF } from "./pdfGenerators";
import { Users, UserPlus, Search, RefreshCw, FileText, Check, Phone, Eye } from "lucide-react";

export function StudentManagementSection({
  onSelectStudentForPayment,
}: {
  onSelectStudentForPayment?: (hallTicket: string) => void;
}) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [feeStructures, setFeeStructures] = useState<ClassFeeStructure[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");

  // Registration Form State
  const [form, setForm] = useState({
    hall_ticket_no: "",
    student_name: "",
    class: CLASS_OPTIONS[3], // Class 1
    group_name: "General",
    section: "A",
    phone: "",
    email: "",
    parent_name: "",
    academic_year: "2026-2027",
    term1_fee: 12000,
    term2_fee: 10000,
    term3_fee: 8000,
  });
  const [justRegisteredStudent, setJustRegisteredStudent] = useState<StudentRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Student Fee Due Inspection Modal
  const [selectedStudentForDue, setSelectedStudentForDue] = useState<StudentFeeSummary | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // 1. Fetch Students
    let studentList: StudentRecord[] = [];
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        studentList = data as StudentRecord[];
      }
    } catch (e) {
      console.warn("Could not query Supabase students:", e);
    }

    // Merge with localStorage cache
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sses_students_cache");
        if (stored) {
          const cached: StudentRecord[] = JSON.parse(stored);
          const map = new Map<string, StudentRecord>();
          studentList.forEach((s) => map.set(s.hall_ticket_no, s));
          cached.forEach((s) => {
            if (!map.has(s.hall_ticket_no)) {
              map.set(s.hall_ticket_no, s);
            }
          });
          studentList = Array.from(map.values());
        }
      }
    } catch (e) {}

    // Seed default sample students if empty for demonstration
    if (studentList.length === 0) {
      studentList = [
        {
          id: "std-1",
          hall_ticket_no: "SSES-2026-101",
          student_name: "K. Sai Praneeth",
          class: "Class 10 (SSC)",
          group_name: "General",
          section: "A",
          phone: "9848022338",
          email: "saipraneeth@gmail.com",
          parent_name: "K. Satyanarayana",
          admission_date: "2026-06-15",
          academic_year: "2026-2027",
        },
        {
          id: "std-2",
          hall_ticket_no: "SSES-2026-102",
          student_name: "V. Lakshmi Ananya",
          class: "Intermediate — MPC",
          group_name: "MPC",
          section: "A",
          phone: "9440188992",
          email: "ananya.v@gmail.com",
          parent_name: "V. Ramana Rao",
          admission_date: "2026-06-18",
          academic_year: "2026-2027",
        },
        {
          id: "std-3",
          hall_ticket_no: "SSES-2026-103",
          student_name: "B. Raju Bodda",
          class: "Class 5",
          group_name: "General",
          section: "B",
          phone: "9876543210",
          email: "rajubodda@gmail.com",
          parent_name: "B. Somulu",
          admission_date: "2026-06-20",
          academic_year: "2026-2027",
        },
      ];
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("sses_students_cache", JSON.stringify(studentList));
        }
      } catch (e) {}
    }

    setStudents(studentList);

    // 2. Fetch Fee Structures
    try {
      const { data } = await supabase.from("class_fee_structures").select("*");
      if (data && data.length > 0) {
        setFeeStructures(data as ClassFeeStructure[]);
      } else if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sses_class_fee_structures");
        if (stored) setFeeStructures(JSON.parse(stored));
      }
    } catch (e) {}

    // 3. Fetch Fee Collections
    try {
      const { data } = await supabase.from("fee_collections").select("*");
      if (data) {
        setFees(data as FeeRecord[]);
      }
    } catch (e) {}

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute fee summary for a student
  const getStudentFeeSummary = useCallback(
    (student: StudentRecord): StudentFeeSummary => {
      // Find fee structure for student's class and group
      const fs =
        feeStructures.find(
          (s) => s.class === student.class && s.group_name === student.group_name
        ) ||
        feeStructures.find((s) => s.class === student.class) || {
          class: student.class,
          group_name: student.group_name,
          academic_year: "2026-2027",
          total_fee: 30000,
          term1_fee: 12000,
          term2_fee: 10000,
          term3_fee: 8000,
        };

      // Find all payments made by this student (match by hall_ticket_no or student_name)
      const studentPayments = fees.filter(
        (f) =>
          (f.hall_ticket_no && f.hall_ticket_no.toLowerCase() === student.hall_ticket_no.toLowerCase()) ||
          f.student_name.toLowerCase().trim() === student.student_name.toLowerCase().trim()
      );

      const t1Alloc = student.term1_fee !== undefined ? student.term1_fee : fs.term1_fee;
      const t2Alloc = student.term2_fee !== undefined ? student.term2_fee : fs.term2_fee;
      const t3Alloc = student.term3_fee !== undefined ? student.term3_fee : fs.term3_fee;
      const totalFee = student.total_fee !== undefined ? student.total_fee : (t1Alloc + t2Alloc + t3Alloc);

      const totalPaid = studentPayments.reduce((sum, p) => sum + (p.fee_amount || 0), 0);
      const remainingDue = Math.max(0, totalFee - totalPaid);

      // Term Breakdown
      const t1Paid = studentPayments
        .filter((p) => (p.term || "").toLowerCase().includes("1") || (p.term || "").toLowerCase() === "term 1")
        .reduce((sum, p) => sum + (p.fee_amount || 0), 0);
      const t2Paid = studentPayments
        .filter((p) => (p.term || "").toLowerCase().includes("2") || (p.term || "").toLowerCase() === "term 2")
        .reduce((sum, p) => sum + (p.fee_amount || 0), 0);
      const t3Paid = studentPayments
        .filter((p) => (p.term || "").toLowerCase().includes("3") || (p.term || "").toLowerCase() === "term 3")
        .reduce((sum, p) => sum + (p.fee_amount || 0), 0);

      const termBreakdown = [
        {
          term: "Term 1",
          allocated: t1Alloc,
          paid: t1Paid,
          due: Math.max(0, t1Alloc - t1Paid),
        },
        {
          term: "Term 2",
          allocated: t2Alloc,
          paid: t2Paid,
          due: Math.max(0, t2Alloc - t2Paid),
        },
        {
          term: "Term 3",
          allocated: t3Alloc,
          paid: t3Paid,
          due: Math.max(0, t3Alloc - t3Paid),
        },
      ];

      return {
        student,
        feeStructure: fs,
        totalFee,
        totalPaid,
        remainingDue,
        paymentCount: studentPayments.length,
        payments: studentPayments,
        termBreakdown,
      };
    },
    [feeStructures, fees]
  );

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    const hallTicket = form.hall_ticket_no.trim().toUpperCase();
    if (!hallTicket) {
      setErrorMsg("Please enter Hall Ticket / Roll Number.");
      setSaving(false);
      return;
    }

    // Check duplicate
    if (students.some((s) => s.hall_ticket_no.toUpperCase() === hallTicket)) {
      setErrorMsg(`Hall Ticket Number "${hallTicket}" is already registered.`);
      setSaving(false);
      return;
    }

    const t1 = Number(form.term1_fee) || 0;
    const t2 = Number(form.term2_fee) || 0;
    const t3 = Number(form.term3_fee) || 0;
    const total = t1 + t2 + t3;

    const newStudent: StudentRecord = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `std_${Date.now()}`,
      hall_ticket_no: hallTicket,
      student_name: form.student_name.trim(),
      class: form.class,
      group_name: form.group_name,
      section: form.section,
      phone: form.phone.trim(),
      email: form.email.trim(),
      parent_name: form.parent_name.trim(),
      admission_date: new Date().toISOString().split("T")[0],
      academic_year: form.academic_year,
      term1_fee: t1,
      term2_fee: t2,
      term3_fee: t3,
      total_fee: total,
      created_at: new Date().toISOString(),
    };

    // 1. Save to Supabase
    try {
      await supabase.from("students").insert({
        hall_ticket_no: newStudent.hall_ticket_no,
        student_name: newStudent.student_name,
        class: newStudent.class,
        group_name: newStudent.group_name,
        section: newStudent.section,
        phone: newStudent.phone,
        email: newStudent.email,
        parent_name: newStudent.parent_name,
        admission_date: newStudent.admission_date,
        academic_year: newStudent.academic_year,
      });
    } catch (err) {
      console.warn("Could not save student to Supabase:", err);
    }

    // 2. Save to LocalStorage cache
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sses_students_cache");
        const existing: StudentRecord[] = stored ? JSON.parse(stored) : [];
        localStorage.setItem("sses_students_cache", JSON.stringify([newStudent, ...existing]));
      }
    } catch (e) {}

    setSuccessMsg(`Student ${newStudent.student_name} (${newStudent.hall_ticket_no}) registered successfully!`);
    setStudents((prev) => [newStudent, ...prev]);
    setForm({
      hall_ticket_no: "",
      student_name: "",
      class: CLASS_OPTIONS[3],
      group_name: "General",
      section: "A",
      phone: "",
      email: "",
      parent_name: "",
      academic_year: "2026-2027",
    });
    setSaving(false);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        q === "" ||
        s.hall_ticket_no.toLowerCase().includes(q) ||
        s.student_name.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        (s.parent_name && s.parent_name.toLowerCase().includes(q));

      const matchClass = selectedClass === "all" || s.class === selectedClass;
      const matchSec = selectedSection === "all" || s.section === selectedSection;

      return matchSearch && matchClass && matchSec;
    });
  }, [students, searchQuery, selectedClass, selectedSection]);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="rounded-3xl border border-[#e5e0d4] bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-[#064e3b] bg-emerald-50 border border-emerald-200 shadow-sm mb-2">
              <Users className="size-3.5" /> Institutional Student Enrollment & Due Audit
            </span>
            <h2 className="text-2xl font-bold font-serif text-[#064e3b]">
              Student Registry, Hall Ticket & Fee Dues
            </h2>
            <div className="h-1 w-12 bg-amber-500 rounded-full mt-1.5 mb-2" />
            <p className="text-xs text-slate-600 max-w-2xl">
              Enroll students with Hall Ticket / Roll Numbers, assign class, group and section, and track
              multi-term fee status, total paid amount, and remaining due balances.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchData}
            className="flex items-center gap-1.5 rounded-xl border border-[#d8d2c4] bg-[#faf8f5] px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-[#f0ede6] shadow-sm"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-emerald-700" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* New Student Registration Form */}
        <form onSubmit={handleRegister} className="rounded-2xl border border-[#e5e0d4] bg-[#faf8f5] p-5 sm:p-6 mb-8">
          <div className="flex items-center justify-between mb-4 border-b border-[#e5e0d4] pb-3">
            <h4 className="text-sm font-bold text-[#064e3b] flex items-center gap-2">
              <UserPlus className="size-4" />
              <span>Enroll / Register New Student</span>
            </h4>
            <span className="text-[11px] font-semibold text-slate-500">
              Academic Year: 2026-2027
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Hall Ticket / Roll No *
              </label>
              <input
                type="text"
                placeholder="e.g. SSES-2026-104"
                value={form.hall_ticket_no}
                onChange={(e) => setForm({ ...form, hall_ticket_no: e.target.value })}
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-[#064e3b] focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                placeholder="Enter student full name"
                value={form.student_name}
                onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#064e3b] focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Parent / Guardian Name
              </label>
              <input
                type="text"
                placeholder="Father / Guardian"
                value={form.parent_name}
                onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#064e3b] focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Class / Course *
              </label>
              <select
                value={form.class}
                onChange={(e) => {
                  const newClass = e.target.value;
                  const fs =
                    feeStructures.find((s) => s.class === newClass && s.group_name === form.group_name) ||
                    feeStructures.find((s) => s.class === newClass) || {
                      term1_fee: 12000,
                      term2_fee: 10000,
                      term3_fee: 8000,
                    };
                  setForm((prev) => ({
                    ...prev,
                    class: newClass,
                    term1_fee: fs.term1_fee,
                    term2_fee: fs.term2_fee,
                    term3_fee: fs.term3_fee,
                  }));
                }}
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#064e3b] focus:outline-none"
              >
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Group / Stream
              </label>
              <select
                value={form.group_name}
                onChange={(e) => setForm({ ...form, group_name: e.target.value })}
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#064e3b] focus:outline-none"
              >
                {GROUP_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Section
              </label>
              <select
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#064e3b] focus:outline-none"
              >
                {SECTION_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    Section {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Contact Phone Number *
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile"
                maxLength={10}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#064e3b] focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Student Term Fee Customization Schedule */}
          <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2">
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#064e3b]">
                  Student Term Fee Allocation
                </h5>
                <p className="text-[11px] text-slate-500">
                  Auto-populated for {form.class}. You can adjust term amounts here if this student has custom term agreements.
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-[#064e3b] border border-emerald-200">
                Total Annual Fee: {formatINR((Number(form.term1_fee) || 0) + (Number(form.term2_fee) || 0) + (Number(form.term3_fee) || 0))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Term 1 Fee (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.term1_fee}
                  onChange={(e) => setForm({ ...form, term1_fee: Number(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-[#d8d2c4] bg-[#faf8f5] px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#064e3b] focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Term 2 Fee (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.term2_fee}
                  onChange={(e) => setForm({ ...form, term2_fee: Number(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-[#d8d2c4] bg-[#faf8f5] px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#064e3b] focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Term 3 Fee (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.term3_fee}
                  onChange={(e) => setForm({ ...form, term3_fee: Number(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-[#d8d2c4] bg-[#faf8f5] px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#064e3b] focus:bg-white focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-3 rounded-xl bg-rose-50 border border-rose-300 p-2.5 text-xs font-semibold text-rose-800">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-300 p-2.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <Check className="size-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#064e3b] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#085a44] transition-all disabled:opacity-50"
            >
              <UserPlus className="size-4" />
              <span>{saving ? "Registering…" : "Register Student & Set Fees"}</span>
            </button>
          </div>
        </form>

        {/* Post-Registration Prompt with Immediate Term Fee Collection */}
        {justRegisteredStudent && (
          <div className="mb-8 rounded-2xl border-2 border-emerald-500 bg-emerald-50/90 p-5 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-3 py-0.5 text-xs font-bold text-white mb-2">
                  <Check className="size-3.5" /> Enrolled Successfully
                </div>
                <h4 className="text-lg font-bold font-serif text-[#064e3b]">
                  {justRegisteredStudent.student_name}{" "}
                  <span className="font-mono text-sm font-semibold text-emerald-800">
                    ({justRegisteredStudent.hall_ticket_no})
                  </span>
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Class: <strong>{justRegisteredStudent.class}</strong> ({justRegisteredStudent.group_name}) · Section{" "}
                  <strong>{justRegisteredStudent.section}</strong>
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-lg bg-white px-2.5 py-1 border border-emerald-200 font-semibold text-slate-700">
                    Term 1: <strong className="text-emerald-800">{formatINR(justRegisteredStudent.term1_fee || 12000)}</strong>
                  </span>
                  <span className="rounded-lg bg-white px-2.5 py-1 border border-emerald-200 font-semibold text-slate-700">
                    Term 2: <strong className="text-emerald-800">{formatINR(justRegisteredStudent.term2_fee || 10000)}</strong>
                  </span>
                  <span className="rounded-lg bg-white px-2.5 py-1 border border-emerald-200 font-semibold text-slate-700">
                    Term 3: <strong className="text-emerald-800">{formatINR(justRegisteredStudent.term3_fee || 8000)}</strong>
                  </span>
                  <span className="rounded-lg bg-emerald-200/80 px-2.5 py-1 font-extrabold text-[#064e3b]">
                    Total Annual Fee: {formatINR(justRegisteredStudent.total_fee || 30000)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {onSelectStudentForPayment && (
                  <button
                    type="button"
                    onClick={() => {
                      const ht = justRegisteredStudent.hall_ticket_no;
                      onSelectStudentForPayment(ht);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-900 hover:bg-amber-500 shadow-sm transition-all"
                  >
                    <span>Proceed to Collect Term 1 Fee (₹{justRegisteredStudent.term1_fee || 12000}) →</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const summary = getStudentFeeSummary(justRegisteredStudent);
                    setSelectedStudentForDue(summary);
                  }}
                  className="rounded-xl border border-emerald-700 bg-white px-3.5 py-2.5 text-xs font-bold text-[#064e3b] hover:bg-emerald-100"
                >
                  View Due Ledger
                </button>
                <button
                  type="button"
                  onClick={() => setJustRegisteredStudent(null)}
                  className="rounded-xl border border-slate-300 p-2 text-slate-500 hover:bg-slate-100"
                  title="Dismiss banner"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="grid gap-3 sm:grid-cols-4 mb-6">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Hall Ticket No, Student Name, Phone, or Parent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#d8d2c4] bg-[#faf8f5] py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#064e3b] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-xl border border-[#d8d2c4] bg-[#faf8f5] py-2.5 px-3 text-xs font-medium text-slate-800 focus:border-[#064e3b] focus:bg-white focus:outline-none"
            >
              <option value="all">All Classes</option>
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full rounded-xl border border-[#d8d2c4] bg-[#faf8f5] py-2.5 px-3 text-xs font-medium text-slate-800 focus:border-[#064e3b] focus:bg-white focus:outline-none"
            >
              <option value="all">All Sections</option>
              {SECTION_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  Section {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto rounded-xl border border-[#e5e0d4]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e0d4] text-left text-xs font-bold uppercase tracking-wider text-[#064e3b] bg-[#064e3b]/5">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Hall Ticket / Roll No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Class & Group</th>
                <th className="py-3 px-4">Sec</th>
                <th className="py-3 px-4 text-right">Total Fee</th>
                <th className="py-3 px-4 text-right">Fee Paid</th>
                <th className="py-3 px-4 text-right">Remaining Due</th>
                <th className="py-3 px-4 text-center">Fee Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ede6]">
              {filteredStudents.map((s, idx) => {
                const summary = getStudentFeeSummary(s);
                return (
                  <tr key={s.hall_ticket_no} className="hover:bg-[#faf8f5] transition-colors">
                    <td className="py-3 px-4 text-center text-xs font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#064e3b]">{s.hall_ticket_no}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{s.student_name}</div>
                      <div className="text-[11px] font-normal text-slate-500">{s.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="font-semibold text-slate-800">{s.class}</span>
                      <span className="ml-1 text-[11px] text-amber-700">({s.group_name})</span>
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-slate-600">{s.section}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">{formatINR(summary.totalFee)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {formatINR(summary.totalPaid)}
                      <div className="text-[10px] text-slate-400">({summary.paymentCount} payments)</div>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-xs ${
                          summary.remainingDue === 0
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {summary.remainingDue === 0 ? "PAID IN FULL" : formatINR(summary.remainingDue)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForDue(summary)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#d8d2c4] bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-[#064e3b] hover:text-white transition-colors"
                          title="View 3-term fee breakdown and history"
                        >
                          <Eye className="size-3" />
                          <span>Audit Dues</span>
                        </button>

                        {onSelectStudentForPayment && (
                          <button
                            type="button"
                            onClick={() => onSelectStudentForPayment(s.hall_ticket_no)}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-400 px-2.5 py-1 text-xs font-bold text-slate-900 hover:bg-amber-500 shadow-sm transition-colors"
                            title="Collect Fee for this student"
                          >
                            <span>Collect Fee</span>
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

      {/* Student Fee Dues Detail Modal */}
      {selectedStudentForDue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-[#e5e0d4] bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#f0ede6] pb-4 mb-5">
              <div>
                <span className="text-[11px] font-mono font-bold text-[#064e3b] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {selectedStudentForDue.student.hall_ticket_no}
                </span>
                <h3 className="mt-2 text-xl font-bold font-serif text-[#064e3b]">
                  {selectedStudentForDue.student.student_name}
                </h3>
                <p className="text-xs text-slate-600">
                  {selectedStudentForDue.student.class} ({selectedStudentForDue.student.group_name}) · Section{" "}
                  {selectedStudentForDue.student.section}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForDue(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Annual Fee</div>
                <div className="text-lg font-bold text-slate-900 mt-1">{formatINR(selectedStudentForDue.totalFee)}</div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Fee Paid</div>
                <div className="text-lg font-bold text-emerald-800 mt-1">{formatINR(selectedStudentForDue.totalPaid)}</div>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Remaining Balance Due</div>
                <div className="text-lg font-bold text-rose-800 mt-1">{formatINR(selectedStudentForDue.remainingDue)}</div>
              </div>
            </div>

            {/* 3-Term Distribution Audit */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#064e3b] mb-2.5">
                3-Term Installment Schedule & Status
              </h4>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {selectedStudentForDue.termBreakdown.map((t) => (
                  <div key={t.term} className="rounded-xl border border-[#e5e0d4] bg-[#faf8f5] p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{t.term}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.due === 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {t.due === 0 ? "Settled" : `Due ${formatINR(t.due)}`}
                      </span>
                    </div>
                    <div className="mt-2 text-xs flex justify-between text-slate-600">
                      <span>Allocated:</span>
                      <span className="font-semibold">{formatINR(t.allocated)}</span>
                    </div>
                    <div className="text-xs flex justify-between text-slate-600">
                      <span>Paid:</span>
                      <span className="font-bold text-emerald-700">{formatINR(t.paid)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Past Payment Records */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#064e3b] mb-2.5">
                Recorded Transactions ({selectedStudentForDue.payments.length})
              </h4>
              {selectedStudentForDue.payments.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#d8d2c4] bg-[#faf8f5] p-4 text-center text-xs text-slate-500 italic">
                  No payment vouchers recorded yet for this student.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#e5e0d4]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#064e3b]/5 text-left font-bold text-[#064e3b]">
                        <th className="py-2 px-3">Receipt No</th>
                        <th className="py-2 px-3">Term</th>
                        <th className="py-2 px-3">Payment Date</th>
                        <th className="py-2 px-3">Mode</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0ede6]">
                      {selectedStudentForDue.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 px-3 font-mono">{p.receipt_no || "REC-" + p.id.slice(0, 6).toUpperCase()}</td>
                          <td className="py-2 px-3 font-bold text-amber-800">{p.term || "Term 1"}</td>
                          <td className="py-2 px-3">{formatDate(p.created_at)}</td>
                          <td className="py-2 px-3">{p.payment_mode || "Cash"}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700">{formatINR(p.fee_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[#f0ede6] pt-4">
              <button
                type="button"
                onClick={() =>
                  downloadStudentFeeReceiptPDF({
                    student: selectedStudentForDue.student,
                    totalFee: selectedStudentForDue.totalFee,
                    totalPaid: selectedStudentForDue.totalPaid,
                    remainingDue: selectedStudentForDue.remainingDue,
                    payments: selectedStudentForDue.payments,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#064e3b] px-4 py-2 text-xs font-bold text-[#064e3b] hover:bg-emerald-50 transition-colors"
              >
                <FileText className="size-3.5" />
                <span>Download Due Statement (PDF)</span>
              </button>

              <div className="flex items-center gap-2">
                {onSelectStudentForPayment && (
                  <button
                    type="button"
                    onClick={() => {
                      const ht = selectedStudentForDue.student.hall_ticket_no;
                      setSelectedStudentForDue(null);
                      onSelectStudentForPayment(ht);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-900 hover:bg-amber-500 shadow-sm"
                  >
                    <span>Proceed to Collect Fee</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedStudentForDue(null)}
                  className="rounded-xl border border-[#d8d2c4] px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
