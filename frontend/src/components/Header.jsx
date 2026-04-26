import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, LogOut } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState({ users: [], submissions: [] });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (!isAdmin || q.trim().length < 2) {
        setResults({ users: [], submissions: [] });
        setOpen(false);
        return;
      }
      const res = await api.get(`/admin/search/?q=${encodeURIComponent(q.trim())}`);
      setResults(res.data);
      setOpen(true);
    }, 250);
    return () => clearTimeout(handle);
  }, [q, isAdmin]);

  const hasAny = useMemo(
    () => results.users.length > 0 || results.submissions.length > 0,
    [results]
  );

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/60 bg-slate-950/70 backdrop-blur">
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-xl">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-800/70 bg-slate-900/40 px-4 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              className="w-full bg-transparent outline-none text-sm placeholder:text-slate-500"
              placeholder={isAdmin ? "Search users / submissions…" : "Search disabled (admin only)"}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              disabled={!isAdmin}
            />
          </div>

          {open && hasAny && (
            <div className="absolute mt-2 w-full rounded-2xl border border-slate-800/70 bg-slate-950 shadow-xl overflow-hidden">
              {results.users.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-2 text-xs text-slate-400">Users</div>
                  {results.users.map((u) => (
                    <button
                      key={`u-${u.id}`}
                      className="w-full text-left px-4 py-2 hover:bg-slate-900/60 text-sm"
                      onClick={() => {
                        setOpen(false);
                        navigate("/admin/users");
                      }}
                    >
                      <span className="font-medium">{u.username}</span>{" "}
                      <span className="text-slate-400">({u.role})</span>
                    </button>
                  ))}
                </div>
              )}

              {results.submissions.length > 0 && (
                <div className="border-t border-slate-800/70">
                  <div className="px-4 pt-3 pb-2 text-xs text-slate-400">Submissions</div>
                  {results.submissions.map((s) => (
                    <button
                      key={`s-${s.id}`}
                      className="w-full text-left px-4 py-2 hover:bg-slate-900/60 text-sm"
                      onClick={() => {
                        setOpen(false);
                        navigate(`/admin/queue?focus=${s.id}`);
                      }}
                    >
                      <span className="font-medium">{s.business_name}</span>{" "}
                      <span className="text-slate-400">#{s.id} · {s.status}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="hidden sm:block text-right">
            <div className="text-sm font-semibold">{user?.username}</div>
            <div className="text-xs text-slate-400">{user?.role}</div>
          </div>
          <button
            className="rounded-xl border border-slate-800/70 bg-slate-900/40 p-2 hover:bg-slate-800/60"
            onClick={logout}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

