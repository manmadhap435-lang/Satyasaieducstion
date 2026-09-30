import { Link } from "@tanstack/react-router";
import { Users, GraduationCap, Briefcase, FileText, Lock, LayoutDashboard } from "lucide-react";

export type AdminMainTab = "overview" | "revenue" | "students" | "feestructure" | "enquiries";

interface AdminHeaderProps {
  currentTab: AdminMainTab;
  onTabChange: (tab: AdminMainTab) => void;
  onLogout: () => void;
}

export function AdminHeader({ currentTab, onTabChange, onLogout }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#064e3b] text-white shadow-md border-b-2 border-amber-400">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Left: Institutional Identity with Gold-ringed Logo */}
        <div className="flex items-center gap-3.5">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex size-11 items-center justify-center rounded-full bg-[#043d2e] text-white font-serif font-extrabold text-xl border-2 border-amber-400 shadow-inner group-hover:scale-105 transition-transform">
              SS
            </div>
            <div>
              <div className="font-serif text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Satya Sai Educational Society</span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-emerald-100/90 font-medium">
                PLAKONDA · VIZIANAGARAM DIST. · A.P. · ADMIN PORTAL
              </p>
            </div>
          </Link>
        </div>

        {/* Right Navigation Bar */}
        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onTabChange("overview")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              currentTab === "overview"
                ? "bg-white/20 text-white border border-white/30 shadow-sm"
                : "text-emerald-100/80 hover:text-white hover:bg-white/10"
            }`}
          >
            <LayoutDashboard className="size-3.5" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("revenue")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              currentTab === "revenue"
                ? "bg-amber-400 text-slate-900 shadow-md"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
            }`}
          >
            <Briefcase className="size-3.5" />
            <span>Revenue Management</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("students")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              currentTab === "students"
                ? "bg-amber-400 text-slate-900 shadow-md"
                : "text-emerald-100/80 hover:text-white hover:bg-white/10"
            }`}
          >
            <Users className="size-3.5" />
            <span>Student Registry</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("feestructure")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              currentTab === "feestructure"
                ? "bg-amber-400 text-slate-900 shadow-md"
                : "text-emerald-100/80 hover:text-white hover:bg-white/10"
            }`}
          >
            <GraduationCap className="size-3.5" />
            <span>Fee Structures</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("enquiries")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              currentTab === "enquiries"
                ? "bg-white/20 text-white border border-white/30 shadow-sm"
                : "text-emerald-100/80 hover:text-white hover:bg-white/10"
            }`}
          >
            <FileText className="size-3.5" />
            <span>Admissions</span>
          </button>

          <div className="h-4 w-px bg-white/20 mx-1 hidden sm:block" />

          <button
            onClick={onLogout}
            className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-emerald-100 transition-all hover:bg-white/15 hover:text-white shadow-sm"
            title="Sign out of Admin Session"
          >
            Sign Out
          </button>
        </nav>
      </div>
    </header>
  );
}
