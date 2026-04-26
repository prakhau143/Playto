import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/client";

function StatusPill({ status }) {
  const map = {
    draft: "bg-slate-800 text-slate-200",
    submitted: "bg-blue-500/20 text-blue-200 ring-1 ring-blue-500/40",
    under_review: "bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/40",
    on_hold: "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40",
    more_info_requested: "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40",
    approved: "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/40",
    rejected: "bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/40",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status] || ""}`}>
      {status}
    </span>
  );
}

export default function MerchantHome() {
  const [sub, setSub] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false); // upload/submit
  const [doc, setDoc] = useState({ doc_type: "pan", file: null });
  const [history, setHistory] = useState([]);

  async function loadOrCreate() {
    const res = await api.get("/submissions/?ordering=-created_at");
    const list = res.data || [];
    setHistory(list);
    if (list.length > 0) return setSub(list[0]);
    const created = await api.post("/submissions/", {});
    setSub(created.data);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadOrCreate();
      } catch {
        if (!cancelled) toast.error("Failed to load submission");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const editable = useMemo(
    () => sub && ["draft", "more_info_requested"].includes(sub.status),
    [sub]
  );

  const isFinal = useMemo(
    () => sub && ["approved", "rejected"].includes(sub.status),
    [sub]
  );

  async function savePatch(patch) {
    setSaving(true);
    try {
      const res = await api.patch(`/submissions/${sub.id}/`, patch);
      setSub(res.data);
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function uploadDoc() {
    if (!doc.file) return toast.error("Select a file");
    const fd = new FormData();
    fd.append("doc_type", doc.doc_type);
    fd.append("file", doc.file);
    setBusy(true);
    try {
      await api.post(`/submissions/${sub.id}/upload_document/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded");
      await loadOrCreate();
    } catch (e) {
      toast.error(
        e?.response?.data?.file?.[0] ||
          e?.response?.data?.non_field_errors?.[0] ||
          "Upload failed (PDF/JPG/PNG <= 5MB)"
      );
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    try {
      await api.post(`/submissions/${sub.id}/submit/`);
      toast.success("Submitted to admin queue");
      await loadOrCreate();
    } catch (e) {
      toast.error(e?.response?.data?.error || "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  async function startNew() {
    setBusy(true);
    try {
      const created = await api.post("/submissions/", {});
      toast.success("New draft created");
      setSub(created.data);
      await loadOrCreate();
    } catch {
      toast.error("Failed to create new draft");
    } finally {
      setBusy(false);
    }
  }

  function fileUrl(fileField) {
    if (!fileField) return null;
    if (fileField.startsWith("http://") || fileField.startsWith("https://")) return fileField;
    // DRF usually returns "/media/.."
    return `http://127.0.0.1:8000${fileField}`;
  }

  if (!sub) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Merchant</div>
          <div className="text-2xl font-semibold">My KYC Submission</div>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={sub.status} />
          {isFinal && (
            <button
              type="button"
              disabled={busy}
              onClick={startNew}
              className="rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-2 hover:bg-slate-800/40 disabled:opacity-60"
            >
              Start new KYC
            </button>
          )}
          <button
            type="button"
            disabled={busy || !editable}
            onClick={(e) => {
              e.preventDefault();
              submit();
            }}
            className="rounded-2xl bg-violet-500 text-slate-950 font-semibold px-4 py-2 disabled:opacity-60"
          >
            Submit
          </button>
        </div>
      </div>

      {!editable && (
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/30 p-4 text-sm text-slate-200">
          <div className="font-semibold">Last submitted KYC</div>
          <div className="text-slate-400 text-xs mt-1">
            #{sub.id} · status: {sub.status} · submitted at{" "}
            {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : "—"}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Note: After submit/approval, form edit locked. New KYC ke liye “Start new KYC” use karo.
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/20 p-4">
          <div className="text-sm font-semibold">Previous submissions</div>
          <div className="mt-2 grid md:grid-cols-3 gap-2">
            {history.slice(0, 3).map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setSub(h)}
                className={`text-left rounded-2xl border px-3 py-2 ${
                  h.id === sub.id
                    ? "border-violet-500/50 bg-violet-500/10"
                    : "border-slate-800/70 bg-slate-950/20 hover:bg-slate-800/30"
                }`}
              >
                <div className="text-xs text-slate-400">#{h.id}</div>
                <div className="text-sm font-semibold">{h.status}</div>
                <div className="text-xs text-slate-400">
                  {h.submitted_at ? new Date(h.submitted_at).toLocaleDateString() : "Draft"}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {sub.reviewer_remarks && (
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/30 p-4">
          <div className="text-sm font-semibold">Reviewer remarks</div>
          <div className="text-sm text-slate-300 mt-1">{sub.reviewer_remarks}</div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/30 p-5">
          <div className="text-sm font-semibold mb-4">KYC Form (editable in draft / more-info)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ["full_name", "Full name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["business_name", "Business name"],
              ["business_type", "Business type"],
              ["expected_volume_usd", "Expected volume (USD)"],
            ].map(([key, label]) => (
              <input
                key={key}
                className="rounded-2xl bg-slate-950/40 border border-slate-800/70 px-4 py-3 outline-none text-sm"
                placeholder={label}
                value={sub[key] ?? ""}
                disabled={!editable || busy}
                onChange={(e) => setSub((s) => ({ ...s, [key]: e.target.value }))}
                onBlur={(e) => {
                  if (!editable) return;
                  const v = e.target.value;
                  savePatch({ [key]: v });
                }}
              />
            ))}
          </div>
      
          {saving && <div className="text-xs text-slate-400 mt-2">Saving…</div>}
        </div>

        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/30 p-5">
          <div className="text-sm font-semibold mb-4">Documents (PDF/JPG/PNG ≤ 5MB)</div>
          <div className="flex flex-wrap gap-3 items-center">
            <select
              className="rounded-2xl bg-slate-950/40 border border-slate-800/70 px-4 py-3 text-sm"
              value={doc.doc_type}
              onChange={(e) => setDoc((d) => ({ ...d, doc_type: e.target.value }))}
              disabled={busy}
            >
              <option value="pan">PAN</option>
              <option value="aadhaar">Aadhaar</option>
              <option value="bank_statement">Bank Statement</option>
              <option value="gst">GST</option>
            </select>
            <input
              type="file"
              className="text-sm"
              onChange={(e) => setDoc((d) => ({ ...d, file: e.target.files?.[0] }))}
              disabled={busy}
            />
            <button
              disabled={busy}
              onClick={uploadDoc}
              type="button"
              className="rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-2 hover:bg-slate-800/40 disabled:opacity-60"
            >
              Upload
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {(sub.documents || []).map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-950/30 px-4 py-2"
              >
                <div className="text-sm">
                  <span className="font-semibold">{d.doc_type}</span>{" "}
                  <span className="text-slate-400">#{d.id}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">
                    {new Date(d.uploaded_at).toLocaleString()}
                  </div>
                  {d.file && (
                    <a
                      className="text-xs text-violet-300 hover:text-violet-200"
                      href={fileUrl(d.file)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                  )}
                </div>
              </div>
            ))}
            {sub.documents?.length === 0 && (
              <div className="text-sm text-slate-400">No documents yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

