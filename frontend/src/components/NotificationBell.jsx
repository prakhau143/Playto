import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/client";

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const seen = useRef(new Set());

  async function fetchNotifs() {
    const res = await api.get("/notifications/");
    const list = res.data || [];

    // Toast only for brand-new unread notifications
    for (const n of list) {
      if (!seen.current.has(n.id) && !n.is_read) {
        toast(`${n.event_type}`, { duration: 3000 });
      }
      seen.current.add(n.id);
    }
    setItems(list);
  }

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 10000);
    return () => clearInterval(id);
  }, []);

  const unread = items.filter((n) => !n.is_read).length;

  return (
    <div className="relative">
      <button
        className="relative rounded-xl border border-slate-800/70 bg-slate-900/40 p-2 hover:bg-slate-800/60"
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-violet-500 text-slate-950 text-xs grid place-items-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[80vw] rounded-2xl border border-slate-800/70 bg-slate-950 shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800/70 text-sm font-semibold">
            Notifications
          </div>
          <div className="max-h-80 overflow-auto">
            {items.length === 0 ? (
              <div className="p-4 text-sm text-slate-400">No notifications</div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={[
                    "px-4 py-3 border-b border-slate-900",
                    n.is_read ? "bg-slate-950" : "bg-slate-900/40",
                  ].join(" ")}
                >
                  <div className="text-sm">{n.event_type}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                  {!n.is_read && (
                    <button
                      className="mt-2 text-xs text-violet-300 hover:text-violet-200"
                      onClick={async () => {
                        await api.post(`/notifications/${n.id}/read/`);
                        await fetchNotifs();
                      }}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

