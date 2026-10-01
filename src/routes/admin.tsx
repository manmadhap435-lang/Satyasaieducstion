import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import emailjs from "@emailjs/browser";

// Modular Admin Components
import { LoginScreen } from "@/components/admin/LoginScreen";
import { AdminSidebar, AdminActiveTab } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { OverviewSection } from "@/components/admin/OverviewSection";
import { FeeCollectionPanel } from "@/components/admin/FeeCollectionPanel";
import { ExpensesPanel } from "@/components/admin/ExpensesPanel";
import { SalariesPanel } from "@/components/admin/SalariesPanel";
import { MonthlyReportsPanel } from "@/components/admin/MonthlyReportsPanel";
import { StudentManagementSection } from "@/components/admin/StudentManagementSection";
import { FeeStructureSection } from "@/components/admin/FeeStructureSection";
import { AdmissionEnquiriesPanel } from "@/components/admin/AdmissionEnquiriesPanel";

// Initialize EmailJS once globally
emailjs.init(import.meta.env["VITE_EMAILJS_PUBLIC_KEY"] ?? "");

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — Satya Sai Educational Society" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [currentTab, setCurrentTab] = useState<AdminActiveTab>("overview");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedHallTicketForFee, setSelectedHallTicketForFee] = useState<string | undefined>(undefined);

  const [totals, setTotals] = useState({ fees: 0, expenses: 0, salaries: 0 });
  const [loadingTotals, setLoadingTotals] = useState(true);
  const [enquiryCount, setEnquiryCount] = useState<number | null>(null);
  const [studentCount, setStudentCount] = useState<number>(0);

  const fetchTotals = useCallback(async () => {
    setLoadingTotals(true);

    let feeSum = 0;
    let expSum = 0;
    let salSum = 0;

    try {
      const [fRes, eRes, sRes] = await Promise.all([
        supabase.from("fee_collections").select("fee_amount"),
        supabase.from("expenses").select("amount"),
        supabase.from("salaries").select("salary_amount"),
      ]);

      if (fRes.data) {
        feeSum = fRes.data.reduce((sum, item: any) => sum + (Number(item.fee_amount) || 0), 0);
      }
      if (eRes.data) {
        expSum = eRes.data.reduce((sum, item: any) => sum + (Number(item.amount) || 0), 0);
      }
      if (sRes.data) {
        salSum = sRes.data.reduce((sum, item: any) => sum + (Number(item.salary_amount) || 0), 0);
      }
    } catch (e) {
      console.warn("Could not query totals from Supabase:", e);
    }

    setTotals({ fees: feeSum, expenses: expSum, salaries: salSum });
    setLoadingTotals(false);
  }, []);

  const fetchStats = useCallback(async () => {
    // 1. Enquiries count
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

    // 2. Student count
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
    fetchTotals();
    fetchStats();

    const channel = supabase
      .channel("dashboard_root_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "admission_enquiries" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "fee_collections" }, fetchTotals)
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, fetchTotals)
      .on("postgres_changes", { event: "*", schema: "public", table: "salaries" }, fetchTotals)
      .subscribe();

    const handleCustom = () => {
      fetchTotals();
      fetchStats();
    };
    window.addEventListener("storage", handleCustom);
    window.addEventListener("sses_new_enquiry", handleCustom);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("storage", handleCustom);
      window.removeEventListener("sses_new_enquiry", handleCustom);
    };
  }, [fetchTotals, fetchStats]);

  const handleSelectStudentForPayment = (hallTicket: string) => {
    setSelectedHallTicketForFee(hallTicket);
    setCurrentTab("fees");
  };

  return (
    <div className="min-h-screen bg-[#f5f2eb] text-slate-800 antialiased selection:bg-amber-200 flex">
      {/* Institutional Left Sidebar */}
      <AdminSidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab !== "fees") setSelectedHallTicketForFee(undefined);
        }}
        onLogout={onLogout}
        enquiryCount={enquiryCount}
        studentCount={studentCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area (Offset for Desktop Sidebar: md:ml-72) */}
      <div className="flex-1 flex flex-col md:ml-72 min-w-0 min-h-screen">
        {/* Sticky Top Bar */}
        <AdminTopBar
          currentTab={currentTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          totals={totals}
          loadingTotals={loadingTotals}
          onRefreshTotals={() => {
            fetchTotals();
            fetchStats();
          }}
        />

        {/* Content Body on Heritage Cream Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24">
          {currentTab === "overview" && (
            <OverviewSection
              totals={totals}
              loadingTotals={loadingTotals}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === "fees" && (
            <FeeCollectionPanel
              onRefreshTotals={fetchTotals}
              initialHallTicket={selectedHallTicketForFee}
            />
          )}

          {currentTab === "expenses" && (
            <ExpensesPanel onRefreshTotals={fetchTotals} />
          )}

          {currentTab === "salaries" && (
            <SalariesPanel onRefreshTotals={fetchTotals} />
          )}

          {currentTab === "monthly" && (
            <MonthlyReportsPanel />
          )}

          {currentTab === "students" && (
            <StudentManagementSection
              onSelectStudentForPayment={handleSelectStudentForPayment}
            />
          )}

          {currentTab === "feestructure" && (
            <FeeStructureSection />
          )}

          {currentTab === "enquiries" && (
            <AdmissionEnquiriesPanel />
          )}
        </main>
      </div>
    </div>
  );
}

function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sses_admin_auth") === "true";
    }
    return false;
  });

  const handleLogin = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sses_admin_auth", "true");
    }
    setLoggedIn(true);
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sses_admin_auth");
    }
    setLoggedIn(false);
  };

  return loggedIn ? (
    <Dashboard onLogout={handleLogout} />
  ) : (
    <LoginScreen onLogin={handleLogin} />
  );
}
