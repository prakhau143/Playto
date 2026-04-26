export default function MerchantHelp() {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-slate-400">Merchant</div>
        <div className="text-2xl font-semibold">Flow (Hindi/English)</div>
      </div>

      <div className="rounded-3xl border border-slate-800/70 bg-slate-900/30 p-5 text-sm text-slate-200 space-y-2">
        <div>
          <span className="font-semibold">Step 1:</span> Form fill karo + documents upload karo.
        </div>
        <div>
          <span className="font-semibold">Step 2:</span> Submit button → status{" "}
          <span className="font-semibold">submitted</span>.
        </div>
        <div>
          <span className="font-semibold">Step 3:</span> Admin queue mein aata hai, SLA starts (24h).
        </div>
        <div>
          <span className="font-semibold">Step 4:</span> Admin action: under_review / on_hold / request_info / approve / reject.
        </div>
        <div className="text-slate-400">
          Important: Status change strict state machine se hi hoga (illegal transitions blocked).
        </div>
      </div>
    </div>
  );
}

