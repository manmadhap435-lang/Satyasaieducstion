import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdmissionEnquiryRecord } from "./types";
import { CLASS_OPTIONS, formatDate } from "./constants";
import { downloadAdmissionEnquiriesPDF, downloadAdmissionEnquiriesCSV } from "./pdfGenerators";
import {
  Search,
  RefreshCw,
  FileDown,
  Printer,
  Phone,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";

export function AdmissionEnquiriesPanel() {
  const [enquiries, setEnquiries] = useState<AdmissionEnquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [rlsNotice, setRlsNotice] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    setRlsNotice(null);

    // 1. Fetch from Supabase
    let supabaseData: AdmissionEnquiryRecord[] = [];
    try {
      const { data, error } = await supabase
        .from("admission_enquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase fetch admission_enquiries notice:", error);
        setRlsNotice(
          error.message || "Row-Level Security (RLS) is restricting SELECT queries on admission_enquiries."
        );
      } else if (data) {
        supabaseData = data as AdmissionEnquiryRecord[];
      }
    } catch (err: any) {
      console.warn("Supabase request exception:", err);
      setRlsNotice(err?.message || "Could not connect to Supabase database.");
    }

    // 2. Fetch from localStorage cache backup
    let cachedData: AdmissionEnquiryRecord[] = [];
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sses_admission_enquiries_cache");
        if (stored) {
          cachedData = JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn("Could not read local enquiries cache", e);
    }

    // 3. Merge both sources (Supabase + localStorage cache), deduplicated
    const seen = new Set<string>();
    const combined: AdmissionEnquiryRecord[] = [];

    for (const item of supabaseData) {
      const key = item.id || `${item.phone}_${item.student_name}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(item);
      }
    }

    for (const item of cachedData) {
      const key = item.id || `${item.phone}_${item.student_name}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(item);
      }
    }

    combined.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    try {
      if (typeof window !== "undefined" && combined.length > 0) {
        localStorage.setItem("sses_admission_enquiries_cache", JSON.stringify(combined.slice(0, 100)));
      }
    } catch (e) {}

    setEnquiries(combined);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEnquiries();

    const channel = supabase
      .channel("admission_enquiries_panel_rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admission_enquiries" },
        () => {
          fetchEnquiries();
        }
      )
      .subscribe();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "sses_admission_enquiries_cache") {
        fetchEnquiries();
      }
    };
    const handleCustom = () => {
      fetchEnquiries();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("sses_new_enquiry", handleCustom);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("sses_new_enquiry", handleCustom);
    };
  }, [fetchEnquiries]);

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        e.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.phone.includes(searchQuery) ||
        e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.class_of_admission.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClass =
        selectedClass === "all" || e.class_of_admission === selectedClass;

      return matchesSearch && matchesClass;
    });
  }, [enquiries, searchQuery, selectedClass]);

  const copySqlToClipboard = () => {
    const sql = `-- Run this in Supabase SQL Editor to grant SELECT & INSERT permissions
grant all on public.admission_enquiries to postgres, service_role;
grant select, insert, update, delete on public.admission_enquiries to anon, authenticated;
alter table public.admission_enquiries enable row level security;
drop policy if exists "Anyone can submit an enquiry" on public.admission_enquiries;
drop policy if exists "Allow anon select on admission_enquiries" on public.admission_enquiries;
drop policy if exists "Allow anon insert on admission_enquiries" on public.admission_enquiries;
create policy "Allow anon select on admission_enquiries" on public.admission_enquiries for select using (true);
create policy "Allow anon insert on admission_enquiries" on public.admission_enquiries for insert with check (true);`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* RLS Notice Banner */}
      {rlsNotice && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 border border-amber-300">
                <AlertTriangle className="size-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  Supabase Row-Level Security Notice
                </h4>
                <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                  Supabase returned an RLS restriction ({rlsNotice}). The system is seamlessly displaying all locally cached inquiries, but to enable public queries on the cloud database, please run the permission SQL script.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={copySqlToClipboard}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-400 bg-white px-3.5 py-2 text-xs font-bold text-amber-900 transition-all hover:bg-amber-100 shadow-sm"
            >
              {copiedSql ? (
                <>
                  <Check className="size-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied SQL!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copy SQL Script</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="rounded-2xl border border-[#e5e0d4] bg-white p-6 shadow-sm">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-5 border-b border-[#f0ede6]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold font-serif text-[#064e3b]">
                Student Admission Enquiries
              </h3>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#064e3b] border border-emerald-200">
                {enquiries.length} Total
              </span>
            </div>
            <div className="h-1 w-10 bg-amber-500 rounded-full mt-1.5 mb-1.5" />
            <p className="text-xs text-slate-500">
              Live prospective inquiries submitted from the website admissions form. Includes tele-counselling links and PDF/CSV export.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={fetchEnquiries}
              className="flex items-center gap-1.5 rounded-xl border border-[#d8d2c4] bg-[#faf8f5] px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-[#f0ede6] shadow-sm"
              title="Refresh from Supabase and local cache"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-emerald-700" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => downloadAdmissionEnquiriesCSV(filteredEnquiries)}
              disabled={filteredEnquiries.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 shadow-sm disabled:opacity-50"
            >
              <FileDown className="size-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => downloadAdmissionEnquiriesPDF(filteredEnquiries)}
              disabled={filteredEnquiries.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-[#064e3b] bg-[#064e3b] px-4 py-2 text-xs font-bold text-white transition-all hover:bg-[#085a44] shadow-sm disabled:opacity-50"
            >
              <Printer className="size-3.5" />
              <span>Download PDF Register</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid gap-3 sm:grid-cols-3 mb-5">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, phone number, location, or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#d8d2c4] bg-[#faf8f5] py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#064e3b] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
            />
          </div>

          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-xl border border-[#d8d2c4] bg-[#faf8f5] py-2.5 px-3 text-xs font-medium text-slate-800 focus:border-[#064e3b] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
            >
              <option value="all">All Classes / Courses</option>
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading && enquiries.length === 0 ? (
          <div className="py-12 text-center">
            <RefreshCw className="size-6 animate-spin text-[#064e3b] mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Checking live admission enquiries…</p>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d8d2c4] bg-[#faf8f5] py-10 px-4 text-center">
            <p className="text-sm font-semibold text-slate-700">No matching admission enquiries found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery || selectedClass !== "all"
                ? "Try clearing your search query or class filter."
                : "Prospective student inquiries submitted from the website admissions page will appear here automatically."}
            </p>
            {(searchQuery || selectedClass !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedClass("all");
                }}
                className="mt-3 inline-flex items-center gap-1 rounded-lg border border-[#064e3b] px-3 py-1.5 text-xs font-bold text-[#064e3b] hover:bg-emerald-50"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#e5e0d4]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e5e0d4] text-left text-xs font-bold uppercase tracking-wider text-[#064e3b] bg-[#064e3b]/5">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class of Admission</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Location / Town</th>
                  <th className="py-3 px-4">Enquiry Received</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ede6]">
                {filteredEnquiries.map((e, index) => {
                  const rawPhone = e.phone.replace(/\D/g, "");
                  return (
                    <tr
                      key={e.id || `${e.phone}_${index}`}
                      className="hover:bg-[#faf8f5] transition-colors"
                    >
                      <td className="py-3 px-4 text-center text-xs font-mono text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {e.student_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                          {e.class_of_admission}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono font-medium text-slate-700">
                        {e.phone}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {e.location}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {formatDate(e.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <a
                            href={`tel:${e.phone}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 transition-colors hover:bg-emerald-100"
                            title="Call Student / Guardian"
                          >
                            <Phone className="size-3 text-emerald-700" />
                            <span>Call</span>
                          </a>
                          {rawPhone.length === 10 && (
                            <a
                              href={`https://wa.me/91${rawPhone}?text=Namaste%20${encodeURIComponent(e.student_name)},%20thank%20you%20for%20enquiring%20about%20admission%20at%20Satya%20Sai%20Educational%20Society,%20Plakonda.`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                              title="Chat on WhatsApp"
                            >
                              <span>WA</span>
                              <ExternalLink className="size-2.5 text-slate-400" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
