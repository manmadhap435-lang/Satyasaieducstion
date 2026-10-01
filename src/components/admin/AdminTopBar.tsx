import { AdminActiveTab } from "./AdminSidebar";
import { formatINR } from "./constants";
import { Menu, RefreshCw, Lock, Shield, ArrowUpRight } from "lucide-react";

interface AdminTopBarProps {
  currentTab: AdminActiveTab;
  onOpenMobileSidebar: () => void;
  totals: { fees: number; expenses: number; salaries: number };
  loadingTotals: boolean;
  onRefreshTotals: () => void;
}

const TAB_TITLES: Record<AdminActiveTab, { title: string; subtitle: string; iconText: string }> = {
  overview: {
    title: "Executive Dashboard Overview",
    subtitle: "High-level summary of financial collections, expenditures, and admissions",
    iconText: "📊",
  },
  fees: {
    title: "Fee Collections & 3-Term Installments",
    subtitle: "Hall Ticket auto-lookup, multi-term receipts, and remaining fee dues",
    iconText: "💳",
  },
  expenses: {
    title: "Operational & Facility Expenses",
    subtitle: "Campus expenditure vouchers, utilities, equipment, and maintenance",
    iconText: "📉",
  },
  salaries: {
    title: "Staff Salaries & Automated Email Slips",
    subtitle: "Faculty and staff payroll disbursements with digital pay slips",
    iconText: "👥",
  },
  monthly: {
    title: "Monthly Financial Statements & Class PDFs",
    subtitle: "Official monthly executive audit reports and class registers",
    iconText: "📑",
  },
  students: {
    title: "Student Registry & Due Audit",
    subtitle: "Student enrollment, Hall Ticket registry, and 3-term due calculations",
    iconText: "🎓",
  },
  feestructure: {
    title: "Class Fee Structures & 3-Term Distribution",
    subtitle: "Annual tuition fee and installment distribution policy per class",
    iconText: "🏛️",
  },
  enquiries: {
    title: "Student Admission Enquiries",
    subtitle: "Prospective student applications with direct Tele-Counselling and WhatsApp links",
    iconText: "📝",
  },
};

export function AdminTopBar({
  currentTab,
  onOpenMobileSidebar,
  totals,
  loadingTotals,
  onRefreshTotals,
}: AdminTopBarProps) {
  const info = TAB_TITLES[currentTab] || TAB_TITLES.overview;
  const balance = totals.fees - totals.expenses - totals.salaries;

  return (
    <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-[#e5e0d4] bg-white/95 px-4 sm:px-8 backdrop-blur shadow-sm">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="rounded-xl border border-[#d8d2c4] bg-[#faf8f5] p-2 text-slate-700 hover:bg-[#f0ede6] md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5 text-[#064e3b]" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg">{info.iconText}</span>
            <h1 className="font-serif text-base sm:text-xl font-bold tracking-tight text-[#064e3b]">
              {info.title}
            </h1>
          </div>
          <p className="hidden sm:block text-[11px] text-slate-500 font-medium truncate max-w-md lg:max-w-lg">
            {info.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Financial Status & Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Available Reserve Badge */}
        <div className="flex items-center gap-2 rounded-xl border border-[#e5e0d4] bg-[#faf8f5] px-3 py-1.5 shadow-xs">
          <div className="text-right">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
              Net Reserve
            </div>
            <div
              className={`font-serif text-xs sm:text-sm font-extrabold ${
                balance >= 0 ? "text-[#064e3b]" : "text-rose-700"
              }`}
            >
              {loadingTotals ? "…" : formatINR(balance)}
            </div>
          </div>
        </div>

        {/* User Manual Button */}
        <button
          type="button"
          onClick={() => {
            import("./pdfGenerators").then((mod) => mod.downloadUserManualPDF());
          }}
          className="hidden sm:flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-sm"
          title="Download User Manual PDF"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          User Manual
        </button>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefreshTotals}
          className="rounded-xl border border-[#d8d2c4] bg-[#faf8f5] p-2 text-slate-700 hover:bg-[#f0ede6] transition-colors"
          title="Refresh All Records & Totals"
        >
          <RefreshCw className={`size-4 \${loadingTotals ? "animate-spin text-emerald-700" : ""}`} />
        </button>
      </div>
    </header>
  );
}
