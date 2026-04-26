import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client";

export default function AdminAddUser() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "merchant",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/admin/users/", form);
      toast.success("User created");
      setForm({ username: "", email: "", password: "", role: "merchant" });
    } catch (e2) {
      const data = e2?.response?.data;
      toast.error(
        data?.username?.[0] ||
          data?.password?.[0] ||
          data?.role?.[0] ||
          "Create failed"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <div className="text-xs text-slate-400">Admin</div>
        <div className="text-2xl font-semibold">Add User</div>
        <div className="text-sm text-slate-400 mt-1">
        </div>
      </div>

      <form
        onSubmit={submit}
        className="rounded-3xl border border-slate-800/70 bg-slate-900/30 p-5 space-y-3"style={{width: "max-content"}}
      >
        <input
          className="w-full rounded-2xl bg-slate-950/40 border border-slate-800/70 px-4 py-3 outline-none text-sm"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          required
        />
        <input
          className="w-full rounded-2xl bg-slate-950/40 border border-slate-800/70 px-4 py-3 outline-none text-sm"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <input
          className="w-full rounded-2xl bg-slate-950/40 border border-slate-800/70 px-4 py-3 outline-none text-sm"
          placeholder="Password (min 6)"
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required
          minLength={6}
        />
        <select
          className="w-full rounded-2xl bg-slate-950/40 border border-slate-800/70 px-4 py-3 outline-none text-sm"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
        >
          <option value="merchant">merchant</option>
          <option value="admin">admin</option>
        </select>
        <button
          disabled={busy}
          className="w-full rounded-2xl bg-violet-500 text-slate-950 font-semibold py-3 disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create User"}
        </button>
      </form>
    </div>
  );
}

