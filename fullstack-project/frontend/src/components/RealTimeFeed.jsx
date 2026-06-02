import { useEffect, useState } from "react";
import { subscribe } from "../sockets/socketClient";

export default function RealTimeFeed({ initial = [] }) {
  const [feed, setFeed] = useState(initial || []);

  useEffect(() => {
    const handleActivity = (payload) => {
      setFeed((prev) => [payload, ...prev].slice(0, 50));
    };

    const unsub = subscribe("activity", handleActivity);
    return () => unsub();
  }, []);

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {feed.length ? (
        feed.map((item, idx) => (
          <div key={`${item.id || idx}-${item.type || 'evt'}`} className="rounded-2xl border p-3 bg-[rgb(var(--app-surface-muted-rgb))]">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{item.icon || '🔔'}</div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-[rgb(var(--app-primary-rgb))]">{item.type || 'Event'}</div>
                <div className="mt-1 truncate text-sm text-[rgb(var(--app-text-muted-rgb))]">{item.message || item.label || JSON.stringify(item)}</div>
                <div className="mt-1 text-xs text-[rgb(var(--app-text-muted-rgb))] opacity-70">{item.time ? new Date(item.time).toLocaleString() : ''}</div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="py-8 text-center text-sm text-[rgb(var(--app-text-muted-rgb))]">No realtime events yet.</p>
      )}
    </div>
  );
}
