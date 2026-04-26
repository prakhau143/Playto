import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function AdminSubmissions() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/submissions/?ordering=-created_at").then((res) => setItems(res.data || []));
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((s) => {
      const hay = [
        s.business_name,
        s.full_name,
        s.email,
        s.user_info?.username,
        String(s.id),
        s.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q]);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-slate-400">Admin</div>
        <div className="text-2xl font-semibold">All Submissions</div>
        <div className="text-sm text-slate-400 mt-1">View any merchant’s submitted KYC details.</div>
      </div>

      <div className="max-w-xl">
        <input
          className="w-full rounded-2xl bg-slate-950/40 border border-slate-800/70 px-4 py-3 outline-none text-sm"
          placeholder="Filter by merchant, business, status, id…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="rounded-3xl border border-slate-800/70 bg-slate-900/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-950/40 text-slate-300">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Merchant</th>
              <th className="text-left p-3">Business</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">View</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t border-slate-800/70">
                <td className="p-3 text-slate-400">#{s.id}</td>
                <td className="p-3 font-semibold">{s.user_info?.username || `#${s.user}`}</td>
                <td className="p-3">{s.business_name || "—"}</td>
                <td className="p-3 font-semibold">{s.status}</td>
                <td className="p-3">
                  <Link
                    to={`/admin/submissions/${s.id}`}
                    className="text-violet-300 hover:text-violet-200 font-semibold"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

