import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "./constants";
import { AdminActiveTab } from "./AdminSidebar";
import {
  Briefcase,
  Users,
  GraduationCap,
  FileText,
  ArrowRight,
  TrendingUp,
  Receipt,
  Wallet,
} from "lucide-react";

export function OverviewSection({
  totals,
  loadingTotals,
  onNavigate,
}: {
  totals: { fees: number; expenses: number; salaries: number };
  loadingTotals: boolean;
  onNavigate: (tab: AdminActiveTab) => void;
}) {
  const [enquiryCount, setEnquiryCount] = useState<number | null>(null);
  const [studentCount, setStudentCount] = useState<number>(0);

  const fetchStats = useCallback(async () => {
    // 1. Enquiries Count
    let eCount = 0;
    try {
      const { count } = await supabase
        .from("admission_enquiries")
        .select("id", { count: "exact", head: true });
      if (typeof count === "number") eCount = count;
    } catch (e) {}

    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sses_admission_enquiries_cache");
        if (stored) {
          const cached = JSON.parse(stored);
          if (Array.isArray(cached) && cached.length > eCount) {
            eCount = cached.length;
          }
        }
      }
    } catch (e) {}
    setEnquiryCount(eCount);

    // 2. Student Count
    let sCount = 0;
    try {
      const { count } = await supabase
        .from("students")
        .select("id", { count: "exact", head: true });
      if (typeof count === "number") sCount = count;
    } catch (e) {}

    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sses_students_cache");
        if (stored) {
          const cached = JSON.parse(stored);
          if (Array.isArray(cached) && cached.length > sCount) {
            sCount = cached.length;
          }
        }
      }
    } catch (e) {}
    setStudentCount(sCount);
  }, []);

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel("overview_live_stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "admission_enquiries" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, fetchStats)
      .subscribe();

    const handleCustom = () => fetchStats();
    window.addEventListener("storage", handleCustom);
    window.addEventListener("sses_new_enquiry", handleCustom);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("storage", handleCustom);
      window.removeEventListener("sses_new_enquiry", handleCustom);
    };
  }, [fetchStats]);

  const balance = totals.fees - totals.expenses - totals.salaries;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#e5e0d4] bg-gradient-to-r from-emerald-50 via-amber-50/40 to-stone-50 p-8 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-[#064e3b] bg-white border border-[#d8d2c4] shadow-sm mb-3">
              ✦ Administrative Suite · Satya Sai Educational Society
            </span>
            <h2 className="text-3xl font-extrabold font-serif tracking-tight text-[#064e3b]">
              Welcome back, Administrator
            </h2>
            <div className="h-1.5 w-16 bg-amber-500 rounded-full mt-2 mb-3" />
            <p className="text-sm max-w-2xl leading-relaxed text-slate-600">
              Manage student enrollment with Hall Ticket tracking, class-wise 3-term fee collections,
              operational expenditures, faculty salary disbursements, and instant audit statement generation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate("fees")}
              className="flex items-center gap-2 rounded-2xl px-5 py-3.5 text-xs font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-95 bg-[#064e3b] hover:bg-[#085a44]"
            >
              <Briefcase className="size-4" />
              <span>Revenue Management</span>
              <ArrowRight className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("students")}
              className="flex items-center gap-2 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-900 shadow-md transition-all hover:brightness-105 active:scale-95 bg-amber-400 hover:bg-amber-500"
            >
              <Users className="size-4" />
              <span>Student Registry & Dues</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Module Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Module 1: Revenue Management */}
        <div
          className="rounded-3xl border border-[#e5e0d4] bg-white p-7 transition-all hover:border-[#064e3b] hover:shadow-md cursor-pointer group shadow-sm flex flex-col justify-between"
          onClick={() => onNavigate("fees")}
        >
          <div>
            <div className="flex items-start justify-between">
              <span className="flex size-13 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-[#064e3b] border border-emerald-200 group-hover:scale-110 transition-transform">
                💼
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Primary Financial Suite
              </span>
            </div>

            <h3 className="mt-5 text-xl font-bold font-serif text-[#064e3b] group-hover:text-[#085a44] transition-colors">
              Revenue & Payroll Management
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Collect fees with Hall Ticket auto-lookup, record operational expenses, disburse staff salaries with email slips, and download monthly statements.
            </p>

            <div className="mt-5 grid grid-cols-4 gap-2 border-t border-[#f0ede6] pt-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Collections</p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                  {loadingTotals ? "…" : formatINR(totals.fees)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Expenses</p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                  {loadingTotals ? "…" : formatINR(totals.expenses)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Salaries</p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                  {loadingTotals ? "…" : formatINR(totals.salaries)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Reserve</p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                  {loadingTotals ? "…" : formatINR(Math.abs(balance))}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs font-bold text-[#064e3b] group-hover:underline">
            <span>Enter Revenue Desk</span>
            <ArrowRight className="size-4" />
          </div>
        </div>

        {/* Module 2: Student Registry */}
        <div
          className="rounded-3xl border border-[#e5e0d4] bg-white p-7 transition-all hover:border-[#064e3b] hover:shadow-md cursor-pointer group shadow-sm flex flex-col justify-between"
          onClick={() => onNavigate("students")}
        >
          <div>
            <div className="flex items-start justify-between">
              <span className="flex size-13 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-800 border border-amber-200 group-hover:scale-110 transition-transform">
                🎓
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Enrollment Desk
              </span>
            </div>

            <h3 className="mt-5 text-xl font-bold font-serif text-[#064e3b] group-hover:text-[#085a44] transition-colors">
              Student Registry & Due Audit
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Enroll students with unique Hall Ticket / Roll numbers, assign class, group, and section, and explain their exact outstanding fee dues across Term 1, 2, and 3.
            </p>

            <div className="mt-5 border-t border-[#f0ede6] pt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Enrolled Students</p>
              <p className="text-2xl font-bold font-serif text-slate-900 mt-0.5">
                {studentCount} Students Active
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs font-bold text-[#064e3b] group-hover:underline">
            <span>Manage Student Registry & Dues</span>
            <ArrowRight className="size-4" />
          </div>
        </div>

        {/* Module 3: Class Fee Structures */}
        <div
          className="rounded-3xl border border-[#e5e0d4] bg-white p-7 transition-all hover:border-[#064e3b] hover:shadow-md cursor-pointer group shadow-sm flex flex-col justify-between"
          onClick={() => onNavigate("feestructure")}
        >
          <div>
            <div className="flex items-start justify-between">
              <span className="flex size-13 items-center justify-center rounded-2xl bg-sky-50 text-2xl text-sky-800 border border-sky-200 group-hover:scale-110 transition-transform">
                🏛️
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                Fee Configuration
              </span>
            </div>

            <h3 className="mt-5 text-xl font-bold font-serif text-[#064e3b] group-hover:text-[#085a44] transition-colors">
              Class-Wise Fee Structures
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Define the annual fee and 3-term installment distribution for all classes (Nursery to Class 10, Intermediate, and Degree streams).
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs font-bold text-[#064e3b] group-hover:underline">
            <span>Configure Class Fee Structures</span>
            <ArrowRight className="size-4" />
          </div>
        </div>

        {/* Module 4: Admission Enquiries */}
        <div
          className="rounded-3xl border border-[#e5e0d4] bg-white p-7 transition-all hover:border-[#064e3b] hover:shadow-md cursor-pointer group shadow-sm flex flex-col justify-between"
          onClick={() => onNavigate("enquiries")}
        >
          <div>
            <div className="flex items-start justify-between">
              <span className="flex size-13 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-800 border border-indigo-200 group-hover:scale-110 transition-transform">
                📝
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                Admissions Live Desk
              </span>
            </div>

            <h3 className="mt-5 text-xl font-bold font-serif text-[#064e3b] group-hover:text-[#085a44] transition-colors">
              Admission Enquiries
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Review incoming admissions leads submitted from the website form with direct Tele-Counselling and WhatsApp links.
            </p>

            <div className="mt-5 border-t border-[#f0ede6] pt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Enquiries Received</p>
              <p className="text-2xl font-bold font-serif text-slate-900 mt-0.5">
                {enquiryCount === null ? "…" : `${enquiryCount} Prospective Students`}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs font-bold text-[#064e3b] group-hover:underline">
            <span>View Prospective Enquiries</span>
            <ArrowRight className="size-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
