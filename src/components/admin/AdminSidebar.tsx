import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wallet,
  TrendingDown,
  Briefcase,
  Calendar,
  Users,
  GraduationCap,
  FileText,
  LogOut,
  Globe,
  X,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export type AdminActiveTab =
  | "overview"
  | "fees"
  | "expenses"
  | "salaries"
  | "monthly"
  | "students"
  | "feestructure"
  | "enquiries";

interface AdminSidebarProps {
  currentTab: AdminActiveTab;
  onTabChange: (tab: AdminActiveTab) => void;
  onLogout: () => void;
  enquiryCount: number | null;
  studentCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function AdminSidebar({
  currentTab,
  onTabChange,
  onLogout,
  enquiryCount,
  studentCount,
  isOpenMobile,
  onCloseMobile,
}: AdminSidebarProps) {
  const navSections = [
    {
      group: "MAIN DESK",
      items: [
        {
          id: "overview" as AdminActiveTab,
          label: "Dashboard Overview",
          icon: LayoutDashboard,
          badge: null,
        },
      ],
    },
    {
      group: "FINANCIAL DESK",
      items: [
        {
          id: "fees" as AdminActiveTab,
          label: "Fee Collections",
          icon: Wallet,
          badge: "Receipts",
        },
        {
          id: "expenses" as AdminActiveTab,
          label: "Operational Expenses",
          icon: TrendingDown,
          badge: null,
        },
        {
          id: "salaries" as AdminActiveTab,
          label: "Staff Salaries",
          icon: Briefcase,
          badge: "Email Slips",
        },
        {
          id: "monthly" as AdminActiveTab,
          label: "Monthly Reports & PDFs",
          icon: Calendar,
          badge: "Audit",
        },
      ],
    },
    {
      group: "ACADEMIC DESK",
      items: [
        {
          id: "students" as AdminActiveTab,
          label: "Student Registry & Dues",
          icon: Users,
          badge: studentCount > 0 ? `${studentCount}` : null,
        },
        {
          id: "feestructure" as AdminActiveTab,
          label: "Class Fee Structures",
          icon: GraduationCap,
          badge: "3-Term",
        },
      ],
    },
    {
      group: "COMMUNICATIONS",
      items: [
        {
          id: "enquiries" as AdminActiveTab,
          label: "Admission Enquiries",
          icon: FileText,
          badge: enquiryCount !== null && enquiryCount > 0 ? `${enquiryCount}` : null,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-[#064e3b] text-white shadow-2xl transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-[#043d2e] px-5 bg-[#043d2e]/80">
          <Link to="/" className="flex items-center gap-3 group">
            {/* Circular SS Monogram Logo */}
            <div className="flex size-11 items-center justify-center rounded-full bg-[#064e3b] text-white font-serif font-extrabold text-xl border-2 border-amber-400 shadow-inner group-hover:scale-105 transition-transform">
              SS
            </div>
            <div>
              <div className="font-serif text-[15px] font-bold tracking-tight text-white leading-tight">
                Satya Sai Educational
              </div>
              <div className="font-serif text-[13px] font-bold text-amber-300 leading-tight">
                Society
              </div>
              <p className="text-[9px] uppercase tracking-widest text-emerald-200/80 font-semibold mt-0.5">
                Plakonda · Admin Portal
              </p>
            </div>
          </Link>

          {/* Close Button on Mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-emerald-200 hover:bg-white/10 md:hidden"
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-thin scrollbar-thumb-emerald-800 scrollbar-track-transparent">
          {navSections.map((section) => (
            <div key={section.group}>
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-300/70">
                {section.group}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onTabChange(item.id);
                        if (isOpenMobile) onCloseMobile();
                      }}
                      className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-amber-400 text-slate-900 shadow-md font-bold"
                          : "text-emerald-100 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`size-4 transition-transform group-hover:scale-110 ${
                            isActive ? "text-slate-900" : "text-emerald-300"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isActive
                              ? "bg-slate-900 text-amber-300"
                              : "bg-emerald-900/90 text-amber-300 border border-emerald-700/60"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Profile & Utilities */}
        <div className="border-t border-[#043d2e] bg-[#032e23] p-4 space-y-3">
          {/* Admin User Status */}
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-black/20 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="text-[11px] font-bold text-white leading-tight">Admin Officer</div>
                <div className="text-[9px] text-emerald-300/70">Session Active</div>
              </div>
            </div>
            <ShieldCheck className="size-4 text-amber-400" />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-700/60 bg-emerald-950/40 px-2.5 py-2 text-xs font-semibold text-emerald-200 transition-all hover:bg-emerald-900/60 hover:text-white text-center"
              title="Visit Society Website"
            >
              <Globe className="size-3.5" />
              <span>Public Website</span>
            </Link>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-900/50 bg-rose-950/40 px-3 py-2 text-xs font-bold text-rose-200 transition-all hover:bg-rose-900/60 hover:text-white"
              title="Sign Out of Session"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
