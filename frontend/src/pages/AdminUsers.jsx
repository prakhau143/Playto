import { useEffect, useState } from "react";
import api from "../api/client";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get("/admin/users/").then((res) => setUsers(res.data));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-slate-400">Admin</div>
        <div className="text-2xl font-semibold">User Management</div>
      </div>

      <div className="rounded-3xl border border-slate-800/70 bg-slate-900/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-950/40 text-slate-300">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Username</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-800/70">
                <td className="p-3 text-slate-400">#{u.id}</td>
                <td className="p-3 font-semibold">{u.username}</td>
                <td className="p-3 text-slate-300">{u.email || "—"}</td>
                <td className="p-3">{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

