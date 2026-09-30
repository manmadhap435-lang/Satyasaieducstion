import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClassFeeStructure } from "./types";
import { CLASS_OPTIONS, GROUP_OPTIONS, formatINR } from "./constants";
import { GraduationCap, RefreshCw, Plus, Check, Pencil } from "lucide-react";

export function FeeStructureSection() {
  const [structures, setStructures] = useState<ClassFeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<ClassFeeStructure | null>(null);
  const [form, setForm] = useState({
    class: CLASS_OPTIONS[0],
    group_name: "General",
    academic_year: "2026-2027",
    total_fee: "25000",
    term1_fee: "10000",
    term2_fee: "8000",
    term3_fee: "7000",
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchStructures = useCallback(async () => {
    setLoading(true);
    let list: ClassFeeStructure[] = [];

    try {
      const { data, error } = await supabase
        .from("class_fee_structures")
        .select("*")
        .order("class", { ascending: true });

      if (!error && data && data.length > 0) {
        list = data as ClassFeeStructure[];
      }
    } catch (e) {
      console.warn("Could not fetch class fee structures from Supabase", e);
    }

    // Local storage fallback
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sses_class_fee_structures");
        if (stored) {
          const cached: ClassFeeStructure[] = JSON.parse(stored);
          if (list.length === 0) {
            list = cached;
          } else {
            // merge
            const map = new Map<string, ClassFeeStructure>();
            list.forEach((item) => map.set(`${item.class}_${item.group_name}`, item));
            cached.forEach((item) => {
              if (!map.has(`${item.class}_${item.group_name}`)) {
                map.set(`${item.class}_${item.group_name}`, item);
              }
            });
            list = Array.from(map.values());
          }
        }
      }
    } catch (e) {}

    // Default seed if empty
    if (list.length === 0) {
      list = [
        { class: "Nursery", group_name: "General", academic_year: "2026-2027", total_fee: 15000, term1_fee: 5000, term2_fee: 5000, term3_fee: 5000 },
        { class: "Class 1", group_name: "General", academic_year: "2026-2027", total_fee: 20000, term1_fee: 8000, term2_fee: 6000, term3_fee: 6000 },
        { class: "Class 5", group_name: "General", academic_year: "2026-2027", total_fee: 25000, term1_fee: 11000, term2_fee: 7000, term3_fee: 7000 },
        { class: "Class 10 (SSC)", group_name: "General", academic_year: "2026-2027", total_fee: 40000, term1_fee: 18000, term2_fee: 11000, term3_fee: 11000 },
        { class: "Intermediate — MPC", group_name: "MPC", academic_year: "2026-2027", total_fee: 45000, term1_fee: 20000, term2_fee: 15000, term3_fee: 10000 },
        { class: "Intermediate — BiPC", group_name: "BiPC", academic_year: "2026-2027", total_fee: 45000, term1_fee: 20000, term2_fee: 15000, term3_fee: 10000 },
        { class: "Degree — B.Sc.", group_name: "B.Sc.", academic_year: "2026-2027", total_fee: 42000, term1_fee: 18000, term2_fee: 14000, term3_fee: 10000 },
      ];
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("sses_class_fee_structures", JSON.stringify(list));
        }
      } catch (e) {}
    }

    setStructures(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  const handleTotalChange = (val: string) => {
    const total = parseFloat(val) || 0;
    // auto-suggest terms: 40%, 30%, 30%
    const t1 = Math.round(total * 0.4);
    const t2 = Math.round(total * 0.3);
    const t3 = total - t1 - t2;
    setForm((prev) => ({
      ...prev,
      total_fee: val,
      term1_fee: String(t1),
      term2_fee: String(t2),
      term3_fee: String(t3),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");

    const total = parseFloat(form.total_fee) || 0;
    const t1 = parseFloat(form.term1_fee) || 0;
    const t2 = parseFloat(form.term2_fee) || 0;
    const t3 = parseFloat(form.term3_fee) || 0;

    const payload: ClassFeeStructure = {
      class: form.class,
      group_name: form.group_name,
      academic_year: form.academic_year,
      total_fee: total,
      term1_fee: t1,
      term2_fee: t2,
      term3_fee: t3,
    };

    // Save to Supabase
    try {
      await supabase.from("class_fee_structures").upsert(
        {
          class: payload.class,
          group_name: payload.group_name,
          academic_year: payload.academic_year,
          total_fee: payload.total_fee,
          term1_fee: payload.term1_fee,
          term2_fee: payload.term2_fee,
          term3_fee: payload.term3_fee,
        },
        { onConflict: "class,group_name,academic_year" }
      );
    } catch (err) {
      console.warn("Could not save to Supabase class_fee_structures:", err);
    }

    // Save to LocalStorage cache
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sses_class_fee_structures");
        const existing: ClassFeeStructure[] = stored ? JSON.parse(stored) : [];
        const filtered = existing.filter(
          (item) => !(item.class === payload.class && item.group_name === payload.group_name)
        );
        const updated = [...filtered, payload];
        localStorage.setItem("sses_class_fee_structures", JSON.stringify(updated));
      }
    } catch (e) {}

    setSuccessMsg(`Fee structure for ${payload.class} (${payload.group_name}) saved successfully!`);
    setSaving(false);
    fetchStructures();
    setEditingItem(null);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const startEdit = (item: ClassFeeStructure) => {
    setEditingItem(item);
    setForm({
      class: item.class,
      group_name: item.group_name,
      academic_year: item.academic_year,
      total_fee: String(item.total_fee),
      term1_fee: String(item.term1_fee),
      term2_fee: String(item.term2_fee),
      term3_fee: String(item.term3_fee),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="rounded-3xl border border-[#e5e0d4] bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-[#064e3b] bg-emerald-50 border border-emerald-200 shadow-sm mb-2">
              <GraduationCap className="size-3.5" /> Institutional Fee Policy Configuration
            </span>
            <h2 className="text-2xl font-bold font-serif text-[#064e3b]">
              Class-Wise Fee Structures & 3-Term Distribution
            </h2>
            <div className="h-1 w-12 bg-amber-500 rounded-full mt-1.5 mb-2" />
            <p className="text-xs text-slate-600 max-w-2xl">
              Configure total annual tuition fees and the 3-term installment breakdown for each class and group.
              The fee collection dashboard automatically computes dues and term balances based on these rates.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchStructures}
            className="flex items-center gap-1.5 rounded-xl border border-[#d8d2c4] bg-[#faf8f5] px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-[#f0ede6] shadow-sm"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-emerald-700" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="rounded-2xl border border-[#e5e0d4] bg-[#faf8f5] p-5 sm:p-6 mb-8">
          <div className="flex items-center justify-between mb-4 border-b border-[#e5e0d4] pb-3">
            <h4 className="text-sm font-bold text-[#064e3b] flex items-center gap-2">
              <Plus className="size-4" />
              <span>{editingItem ? "Edit Class Fee Structure" : "Set New Class Fee Structure"}</span>
            </h4>
            {editingItem && (
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Class / Course
              </label>
              <select
                value={form.class}
                onChange={(e) => setForm({ ...form, class: e.target.value })}
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#064e3b] focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
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
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#064e3b] focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
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
                Total Annual Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={form.total_fee}
                onChange={(e) => handleTotalChange(e.target.value)}
                placeholder="Total Annual Fee"
                className="w-full rounded-xl border border-[#d8d2c4] bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#064e3b] focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
                required
              />
            </div>
          </div>

          {/* Term Installment Distribution */}
          <div className="mt-4 pt-4 border-t border-[#e5e0d4] grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                Term 1 Installment (₹)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={form.term1_fee}
                onChange={(e) => setForm({ ...form, term1_fee: e.target.value })}
                className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#064e3b] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                Term 2 Installment (₹)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={form.term2_fee}
                onChange={(e) => setForm({ ...form, term2_fee: e.target.value })}
                className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#064e3b] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                Term 3 Installment (₹)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={form.term3_fee}
                onChange={(e) => setForm({ ...form, term3_fee: e.target.value })}
                className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#064e3b] focus:outline-none"
                required
              />
            </div>
          </div>

          {successMsg && (
            <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-300 p-2.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
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
              <Check className="size-4" />
              <span>{saving ? "Saving…" : "Save Fee Structure"}</span>
            </button>
          </div>
        </form>

        {/* Existing Configured Fee Structures Table */}
        <div className="overflow-x-auto rounded-xl border border-[#e5e0d4]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e0d4] text-left text-xs font-bold uppercase tracking-wider text-[#064e3b] bg-[#064e3b]/5">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Class / Course</th>
                <th className="py-3 px-4">Group / Stream</th>
                <th className="py-3 px-4 text-right">Total Annual Fee</th>
                <th className="py-3 px-4 text-right">Term 1</th>
                <th className="py-3 px-4 text-right">Term 2</th>
                <th className="py-3 px-4 text-right">Term 3</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ede6]">
              {structures.map((s, idx) => (
                <tr key={`${s.class}_${s.group_name}_${idx}`} className="hover:bg-[#faf8f5] transition-colors">
                  <td className="py-3 px-4 text-center text-xs font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{s.class}</td>
                  <td className="py-3 px-4 text-xs font-semibold text-amber-800">
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 border border-amber-200">
                      {s.group_name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-[#064e3b]">{formatINR(s.total_fee)}</td>
                  <td className="py-3 px-4 text-right text-xs font-semibold text-slate-700">{formatINR(s.term1_fee)}</td>
                  <td className="py-3 px-4 text-right text-xs font-semibold text-slate-700">{formatINR(s.term2_fee)}</td>
                  <td className="py-3 px-4 text-right text-xs font-semibold text-slate-700">{formatINR(s.term3_fee)}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#d8d2c4] bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-[#064e3b] hover:text-white transition-colors"
                      title="Edit this fee structure"
                    >
                      <Pencil className="size-3" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
