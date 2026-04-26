import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/stats/").then((res) => setStats(res.data));
  }, []);

  const usersLine = useMemo(() => {
    if (!stats) return null;
    const labels = (stats.users_by_day || []).map((d) => d.day);
    const data = (stats.users_by_day || []).map((d) => d.count);
    return {
      labels,
      datasets: [
        {
          label: "New users (7d)",
          data,
          borderColor: "#a78bfa",
          backgroundColor: "rgba(167,139,250,0.2)",
        },
      ],
    };
  }, [stats]);

  const statusBar = useMemo(() => {
    if (!stats) return null;
    const labels = (stats.submissions_by_status || []).map((x) => x.status);
    const data = (stats.submissions_by_status || []).map((x) => x.count);
    return {
      labels,
      datasets: [
        {
          label: "Submissions by status",
          data,
          backgroundColor: "rgba(34,211,238,0.25)",
          borderColor: "rgba(34,211,238,0.6)",
          borderWidth: 1,
        },
      ],
    };
  }, [stats]);

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end justify-between">
        <div>
          <div className="text-xs text-slate-400">Admin</div>
          <div className="text-2xl font-semibold">Dashboard</div>
          <div className="text-sm text-slate-400 mt-1">
          </div>
        </div>
        <div className="flex gap-3">
          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/30 px-4 py-3">
            <div className="text-xs text-slate-400">Pending</div>
            <div className="text-lg font-semibold">{stats.pending_total}</div>
          </div>
          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/30 px-4 py-3">
            <div className="text-xs text-slate-400">At risk</div>
            <div className="text-lg font-semibold text-rose-300">
              {stats.at_risk_total}
            </div>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/30 p-5">
          <div className="text-sm font-semibold mb-4">User registrations</div>
          {usersLine && <Line data={usersLine} />}
        </div>
        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/30 p-5">
          <div className="text-sm font-semibold mb-4">Submission statuses</div>
          {statusBar && <Bar data={statusBar} />}
        </div>
      </div>
    </div>
  );
}

