import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/client";

export default function AdminSubmissionDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await api.get(`/submissions/${id}/`);
    setItem(res.data);
  }

  useEffect(() => {
    load().catch(() => toast.error("Failed to load submission"));
  }, [id]);

  async function act(action) {
    const remarks =
      action === "reject" || action === "request_info" || action === "hold"
        ? prompt("Remarks (recommended):") || ""
        : "";
    setBusy(true);
    try {
      await api.post(`/submissions/${id}/review/`, { action, remarks });
      toast.success(`Action: ${action}`);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.error || "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (!item) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Admin</div>
          <div className="text-2xl font-semibold">
            Submission #{item.id}{" "}
            <span className="text-slate-400 text-base">({item.status})</span>
          </div>
          <div className="text-sm text-slate-400 mt-1">
            Merchant: <span className="font-semibold text-slate-200">{item.user_info?.username}</span>
          </div>
        </div>
        <Link to="/admin/submissions" className="text-violet-300 hover:text-violet-200 font-semibold">
          ← Back
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/30 p-5">
          <div className="text-sm font-semibold mb-3">Form details</div>
          <div className="text-sm text-slate-200 space-y-1">
            <div>Full name: {item.full_name || "—"}</div>
            <div>Email: {item.email || "—"}</div>
            <div>Phone: {item.phone || "—"}</div>
            <div>Business: {item.business_name || "—"}</div>
            <div>Type: {item.business_type || "—"}</div>
            <div>Expected volume: {item.expected_volume_usd || "—"}</div>
            <div>
              Submitted at:{" "}
              {item.submitted_at ? new Date(item.submitted_at).toLocaleString() : "—"}
            </div>
          </div>
          {item.reviewer_remarks && (
            <div className="mt-4 text-xs text-slate-400">
              Reviewer remarks: {item.reviewer_remarks}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/30 p-5">
          <div className="text-sm font-semibold mb-3">Documents</div>
          {(item.documents || []).length === 0 ? (
            <div className="text-sm text-slate-400">No documents uploaded.</div>
          ) : (
            <div className="space-y-2">
              {(item.documents || []).map((d) => (
                <a
                  key={d.id}
                  className="block rounded-2xl border border-slate-800/70 bg-slate-950/30 px-4 py-3 hover:bg-slate-800/40"
                  href={d.file?.startsWith("http") ? d.file : `http://127.0.0.1:8000${d.file}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="text-sm font-semibold">
                    {d.doc_type} <span className="text-slate-400">#{d.id}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(d.uploaded_at).toLocaleString()}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800/70 bg-slate-900/20 p-5">
        <div className="text-sm font-semibold mb-3">Actions</div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={() => act("start_review")}
            className="rounded-xl border border-slate-800/70 bg-slate-950/30 hover:bg-slate-800/40 px-3 py-2 text-xs font-semibold"
          >
            Start review
          </button>
          <button
            disabled={busy}
            onClick={() => act("hold")}
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200"
          >
            Hold
          </button>
          <button
            disabled={busy}
            onClick={() => act("request_info")}
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200"
          >
            Request info
          </button>
          <button
            disabled={busy}
            onClick={() => act("approve")}
            className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200"
          >
            Approve
          </button>
          <button
            disabled={busy}
            onClick={() => act("reject")}
            className="rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-200"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

