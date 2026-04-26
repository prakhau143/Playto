import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // login | register
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "register") {
        await register(form);
        toast.success("Registered. Now login karo.");
        setMode("login");
      } else {
        const me = await login({ username: form.username, password: form.password });
        toast.success(`Welcome ${me.username}`);
        navigate(me.role === "admin" ? "/admin" : "/merchant", { replace: true });
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-100 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-800/70 bg-slate-900/30 p-6 shadow-xl">
        <div className="mb-5">
          <div className="text-xs text-slate-400"></div>
          <div className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Login" : "Create account"}
          </div>
          <div className="text-sm text-slate-400 mt-1">
            
          </div>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <input
            className="w-full rounded-2xl bg-slate-950/40 border border-slate-800/70 px-4 py-3 outline-none"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            required
          />

          {mode === "register" && (
            <input
              className="w-full rounded-2xl bg-slate-950/40 border border-slate-800/70 px-4 py-3 outline-none"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          )}

          <input
            className="w-full rounded-2xl bg-slate-950/40 border border-slate-800/70 px-4 py-3 outline-none"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
          />

          <button
            disabled={busy}
            className="w-full rounded-2xl bg-violet-500 text-slate-950 font-semibold py-3 hover:bg-violet-400 disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "login" ? "Login" : "Register"}
          </button>
        </form>

        <div className="mt-4 text-sm text-slate-400">
          {mode === "login" ? (
            <>
              New here?{" "}
              <button className="text-violet-300 hover:text-violet-200" onClick={() => setMode("register")}>
                Register
              </button>
            </>
          ) : (
            <>
              Already have account?{" "}
              <button className="text-violet-300 hover:text-violet-200" onClick={() => setMode("login")}>
                Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

