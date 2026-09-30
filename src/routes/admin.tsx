import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import emailjs from "@emailjs/browser";

// Modular Admin Components
import { LoginScreen } from "@/components/admin/LoginScreen";
import { AdminHeader, AdminMainTab } from "@/components/admin/AdminHeader";
import { OverviewSection } from "@/components/admin/OverviewSection";
import { RevenueManagementSection } from "@/components/admin/RevenueManagementSection";
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
  const [mainTab, setMainTab] = useState<AdminMainTab>("overview");
  const [selectedHallTicketForFee, setSelectedHallTicketForFee] = useState<string | undefined>(undefined);

  const [totals, setTotals] = useState({ fees: 0, expenses: 0, salaries: 0 });
  const [loadingTotals, setLoadingTotals] = useState(true);

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

  useEffect(() => {
    fetchTotals();
  }, [fetchTotals]);

  const handleSelectStudentForPayment = (hallTicket: string) => {
    setSelectedHallTicketForFee(hallTicket);
    setMainTab("revenue");
  };

  return (
    <div className="min-h-screen bg-[#f5f2eb] text-slate-800 antialiased selection:bg-amber-200">
      {/* Institutional Forest Green Header */}
      <AdminHeader
        currentTab={mainTab}
        onTabChange={(tab) => {
          setMainTab(tab);
          if (tab !== "revenue") setSelectedHallTicketForFee(undefined);
        }}
        onLogout={onLogout}
      />

      {/* Main Container View on Heritage Cream Canvas */}
      <main className="relative mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6">
        {mainTab === "overview" && (
          <OverviewSection
            totals={totals}
            loadingTotals={loadingTotals}
            onNavigate={(tab) => setMainTab(tab)}
          />
        )}

        {mainTab === "revenue" && (
          <RevenueManagementSection
            totals={totals}
            loadingTotals={loadingTotals}
            onRefreshTotals={fetchTotals}
            onBackToOverview={() => setMainTab("overview")}
            initialHallTicket={selectedHallTicketForFee}
          />
        )}

        {mainTab === "students" && (
          <StudentManagementSection
            onSelectStudentForPayment={handleSelectStudentForPayment}
          />
        )}

        {mainTab === "feestructure" && <FeeStructureSection />}

        {mainTab === "enquiries" && <AdmissionEnquiriesPanel />}
      </main>
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
