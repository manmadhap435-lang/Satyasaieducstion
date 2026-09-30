import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "./constants";

export interface EditTarget {
  type: "fee" | "expense" | "salary";
  id: string;
  name: string;
  currentAmount: number;
  month: string;
}

interface EditAmountModalProps {
  target: EditTarget | null;
  onClose: () => void;
  onSuccess: (updatedAmount: number) => void;
}

export function EditAmountModal({ target, onClose, onSuccess }: EditAmountModalProps) {
  const [newAmount, setNewAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (target) {
      setNewAmount(String(target.currentAmount));
      setErrorMsg("");
    }
  }, [target]);

  if (!target) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newAmount);
    if (isNaN(val) || val <= 0) {
      setErrorMsg("Please enter a valid positive amount in Rupees.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      if (target.type === "fee") {
        const { error } = await supabase
          .from("fee_collections")
          .update({ fee_amount: val })
          .eq("id", target.id);
        if (error) throw error;
      } else if (target.type === "expense") {
        const { error } = await supabase
          .from("expenses")
          .update({ amount: val })
          .eq("id", target.id);
        if (error) throw error;
      } else if (target.type === "salary") {
        const { error } = await supabase
          .from("salaries")
          .update({ salary_amount: val })
          .eq("id", target.id);
        if (error) throw error;
      }

      onSuccess(val);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update record. Check Supabase connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const typeLabels = {
    fee: "Student Fee Payment",
    expense: "Institutional Expense Voucher",
    salary: "Staff Salary Disbursement",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#e5e0d4] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#f0ede6] pb-4 mb-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#064e3b]">
              Edit Current Month Amount
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {typeLabels[target.type]} · {target.month}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="rounded-xl bg-[#faf8f5] border border-[#e5e0d4] p-3 text-xs">
            <div className="font-semibold text-slate-700">{target.name}</div>
            <div className="mt-1 text-slate-500">
              Current Registered Amount:{" "}
              <strong className="text-slate-900">{formatINR(target.currentAmount)}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Revised Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="any"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full rounded-xl border border-[#d8d2c4] bg-[#faf8f5] py-2.5 pl-8 pr-4 text-sm font-bold text-slate-900 focus:border-[#064e3b] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
                placeholder="Enter revised amount"
                autoFocus
                required
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#d8d2c4] px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#064e3b] px-4 py-2 text-xs font-bold text-white hover:bg-[#085a44] disabled:opacity-50"
            >
              {submitting ? "Updating…" : "Save Revised Amount"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
