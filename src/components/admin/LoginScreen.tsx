import { useState } from "react";
import { Lock, ArrowRight } from "lucide-react";
import { ADMIN_USER, ADMIN_PASS } from "./constants";

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === ADMIN_USER && password === ADMIN_PASS) {
      setError(false);
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f2eb] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Institutional Monogram */}
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#064e3b] text-white shadow-xl border-4 border-amber-400 font-serif text-3xl font-extrabold tracking-wider">
          SS
        </div>
        <h2 className="mt-5 text-2xl font-bold font-serif tracking-tight text-[#064e3b]">
          Satya Sai Educational Society
        </h2>
        <div className="h-1 w-16 bg-amber-500 rounded-full mx-auto mt-2" />
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
          Plakonda · Vizianagaram Dist. · A.P. · Admin Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-[#e5e0d4]">
          <div className="mb-6 pb-4 border-b border-[#f0ede6] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#064e3b] flex items-center gap-1.5">
              <Lock className="size-3.5" /> Secure Administrator Login
            </span>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Authorized Staff Only
            </span>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Admin Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full rounded-xl border border-[#d8d2c4] bg-[#faf8f5] px-4 py-2.5 text-sm text-slate-900 focus:border-[#064e3b] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#d8d2c4] bg-[#faf8f5] px-4 py-2.5 text-sm text-slate-900 focus:border-[#064e3b] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#064e3b]"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
                Invalid credentials. Please verify your administrative username and password.
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 rounded-xl bg-[#064e3b] px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#085a44] active:scale-95"
            >
              <span>Access Admin Dashboard</span>
              <ArrowRight className="size-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-slate-500">
            Session remains active until you sign out. For access assistance, contact the Correspondent / Secretary office.
          </p>
        </div>
      </div>
    </div>
  );
}
