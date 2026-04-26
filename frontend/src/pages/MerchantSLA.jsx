import { useEffect, useMemo, useState } from "react";
import api from "../api/client";

export default function MerchantSLA() {
  const [subs, setSubs] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await api.get("/submissions/?ordering=-created_at");
      setSubs(res.data || []);
    })();
  }, []);

  const pendingStatuses = useMemo(
    () => new Set(["submitted", "under_review", "on_hold", "more_info_requested"]),
    []
  );

  // SLA should track the latest *active* submitted item (not approved/rejected, and must have submitted_at)
  const active = useMemo(
    () =>
      subs.find((s) => pendingStatuses.has(s.status) && !!s.submitted_at) ||
      null,
    [subs, pendingStatuses]
  );

  // Show last final item as history (approved/rejected)
  const lastFinal = useMemo(
    () => subs.find((s) => ["approved", "rejected"].includes(s.status)) || null,
    [subs]
  );

  function hoursBetween(a, b) {
    if (!a || !b) return null;
    const ms = new Date(b).getTime() - new Date(a).getTime();
    return Math.round((ms / 3600000) * 100) / 100;
  }

  const lastFinalDecisionHours = useMemo(() => {
    if (!lastFinal?.submitted_at) return null;
    // events are present in serializer; find decision event timestamp
    const ev = (lastFinal.events || []).find((e) =>
      ["approved", "rejected"].includes(e.to_status)
    );
    const decidedAt = ev?.created_at || lastFinal.status_updated_at;
    return hoursBetween(lastFinal.submitted_at, decidedAt);
  }, [lastFinal]);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-slate-400">Merchant</div>
        <div className="text-2xl font-semibold">SLA Tracking</div>
        <div className="text-sm text-slate-400 mt-1">
          SLA simple rule: <span className="text-slate-200 font-semibold">24 hours</span> from first submit.
        </div>
      </div>

      {!active ? (
        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/30 p-5">
          <div className="text-sm">
            No active submission in review queue right now.
          </div>
          <div className="text-xs text-slate-400 mt-2">
            (SLA runs only after you submit a KYC.)
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/30 p-5">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-slate-400 text-xs">Submission ID</div>
              <div className="font-semibold">#{active.id}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Status</div>
              <div className="font-semibold">{active.status}</div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Submitted at</div>
              <div className="font-semibold">
                {active.submitted_at ? new Date(active.submitted_at).toLocaleString() : "Not submitted"}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">Hours left</div>
              <div className={`font-semibold ${active.is_at_risk ? "text-rose-300" : "text-emerald-300"}`}>
                {active.sla_hours_left ?? "—"}
              </div>
            </div>
          </div>

          {active.is_at_risk && (
            <div className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm">
              Alert: SLA breached / at risk. Admin queue mein pending hai.
            </div>
          )}
        </div>
      )}

      {lastFinal && (
        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/20 p-5">
          <div className="text-sm font-semibold">Last KYC result</div>
          <div className="text-sm mt-2">
            Submission <span className="font-semibold">#{lastFinal.id}</span> was{" "}
            <span className="font-semibold">{lastFinal.status}</span>.
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Submitted at {lastFinal.submitted_at ? new Date(lastFinal.submitted_at).toLocaleString() : "—"}
            {lastFinalDecisionHours != null ? (
              <> · Decision in <span className="text-slate-200 font-semibold">{lastFinalDecisionHours}h</span></>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

