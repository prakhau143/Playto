import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  ListChecks,
  Timer,
  FileText,
  UserPlus,
  Eye,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function LinkItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 px-3 py-2 rounded-xl transition",
          "hover:bg-slate-800/60",
          isActive ? "bg-slate-800/80 ring-1 ring-slate-700" : "text-slate-200",
        ].join(" ")
      }
    >
      <Icon size={18} className="text-violet-300" />
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { isAdmin } = useAuth();

  return (
    <aside className="w-72 shrink-0 min-h-screen border-r border-slate-800/60 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="p-5">
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 px-4 py-3">
          <div className="text-xs text-slate-400">Playto Challenge</div>
          <div className="text-lg font-semibold tracking-tight">
            KYC Command Center
          </div>
        </div>
      </div>

      <nav className="px-4 space-y-2">
        {isAdmin ? (
          <>
            <LinkItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
            <LinkItem to="/admin/users" icon={Users} label="Users" />
            <LinkItem to="/admin/users/new" icon={UserPlus} label="Add User" />
            <LinkItem to="/admin/queue" icon={ListChecks} label="Submissions Queue" />
            <LinkItem to="/admin/submissions" icon={Eye} label="View Submissions" />
          </>
        ) : (
          <>
            <LinkItem to="/merchant" icon={FileText} label="My KYC" />
            <LinkItem to="/merchant/sla" icon={Timer} label="SLA Tracking" />
            <LinkItem to="/merchant/help" icon={ShieldCheck} label="How it works" />
          </>
        )}
      </nav>

      <div className="mt-10 px-5 text-xs text-slate-500">
      </div>
    </aside>
  );
}

