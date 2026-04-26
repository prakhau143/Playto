import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client";

function ActionBtn({ label, onClick, kind = "neutral" }) {
  const styles = {
    neutral: "border-slate-800/70 bg-slate-950/30 hover:bg-slate-800/40",
    ok: "border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-200",
    bad: "border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/15 text-rose-200",
    warn: "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15 text-amber-200",
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${styles[kind]}`}
    >
      {label}
    </button>
  );
}

export default function AdminQueue() {
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [params] = useSearchParams();
  const focus = params.get("focus");

  async function load() {
    const res = await api.get("/submissions/?ordering=submitted_at");
    setItems(res.data || []);
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(
    () => items.filter((s) => s.status !== "draft"),
    [items]
  );

  async function act(id, action) {
    const remarks =
      action === "reject" || action === "request_info" || action === "hold"
        ? prompt("Remarks (optional but recommended):") || ""
        : "";
    setBusyId(id);
    try {
      await api.post(`/submissions/${id}/review/`, { action, remarks });
      toast.success(`Action: ${action}`);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.error || "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-slate-400">Admin</div>
        <div className="text-2xl font-semibold">Submissions Queue</div>
      </div>

      <div className="rounded-3xl border border-slate-800/70 bg-slate-900/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-950/40 text-slate-300">
            <tr>
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Business</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">SLA</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => {
              const highlight = focus && String(s.id) === String(focus);
              return (
                <>
                  <tr
                    key={s.id}
                    className={[
                      "border-t border-slate-800/70 align-top",
                      highlight ? "bg-violet-500/10" : "",
                    ].join(" ")}
                  >
                    <td className="p-3 text-slate-400">#{s.id}</td>
                    <td className="p-3">
                      <button
                        className="text-left"
                        onClick={() => setOpenId((v) => (v === s.id ? null : s.id))}
                        type="button"
                      >
                        <div className="font-semibold hover:text-violet-200">
                          {s.business_name || "—"}
                        </div>
                        <div className="text-xs text-slate-400">
                          Merchant: {s.user_info?.username || `#${s.user}`}
                        </div>
                      </button>
                    </td>
                    <td className="p-3 font-semibold">{s.status}</td>
                    <td className="p-3">
                      <div
                        className={
                          s.is_at_risk
                            ? "text-rose-300 font-semibold"
                            : "text-emerald-300 font-semibold"
                        }
                      >
                        {s.is_at_risk ? "At risk" : "OK"}
                      </div>
                      <div className="text-xs text-slate-400">
                        Hours left: {s.sla_hours_left ?? "—"}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <ActionBtn
                          label={busyId === s.id ? "…" : "Start review"}
                          onClick={() => act(s.id, "start_review")}
                        />
                        <ActionBtn
                          label={busyId === s.id ? "…" : "Hold"}
                          kind="warn"
                          onClick={() => act(s.id, "hold")}
                        />
                        <ActionBtn
                          label={busyId === s.id ? "…" : "Request info"}
                          kind="warn"
                          onClick={() => act(s.id, "request_info")}
                        />
                        <ActionBtn
                          label={busyId === s.id ? "…" : "Approve"}
                          kind="ok"
                          onClick={() => act(s.id, "approve")}
                        />
                        <ActionBtn
                          label={busyId === s.id ? "…" : "Reject"}
                          kind="bad"
                          onClick={() => act(s.id, "reject")}
                        />
                      </div>
                      {s.reviewer_remarks && (
                        <div className="mt-2 text-xs text-slate-400">
                          Remarks: {s.reviewer_remarks}
                        </div>
                      )}
                    </td>
                  </tr>
                  {openId === s.id && (
                    <tr className="border-t border-slate-800/70 bg-slate-950/20">
                      <td />
                      <td colSpan={4} className="p-4">
                        <div className="grid lg:grid-cols-2 gap-4">
                          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/30 p-4">
                            <div className="text-sm font-semibold mb-2">Merchant details</div>
                            <div className="text-sm text-slate-300">
                              <div>Full name: {s.full_name || "—"}</div>
                              <div>Email: {s.email || "—"}</div>
                              <div>Phone: {s.phone || "—"}</div>
                              <div>Business type: {s.business_type || "—"}</div>
                              <div>Expected volume: {s.expected_volume_usd || "—"}</div>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-slate-800/70 bg-slate-950/30 p-4">
                            <div className="text-sm font-semibold mb-2">Documents</div>
                            {(s.documents || []).length === 0 ? (
                              <div className="text-sm text-slate-400">No documents uploaded.</div>
                            ) : (
                              <div className="space-y-2">
                                {(s.documents || []).map((d) => (
                                  <a
                                    key={d.id}
                                    className="block rounded-xl border border-slate-800/70 bg-slate-900/30 px-3 py-2 text-sm hover:bg-slate-800/40"
                                    href={
                                      d.file?.startsWith("http")
                                        ? d.file
                                        : `http://127.0.0.1:8000${d.file}`
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <span className="font-semibold">{d.doc_type}</span>{" "}
                                    <span className="text-slate-400">#{d.id}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

