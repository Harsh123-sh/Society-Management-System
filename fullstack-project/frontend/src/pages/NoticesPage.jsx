import { useMemo, useState } from "react";
import ModulePageHeader from "../components/ModulePageHeader";
import "./notices-page.css";

const NOTICE_KEY = "chairman_notices_v2";

const seedNotices = [
  { id: "n-1", title: "Water supply maintenance", category: "Maintenance", priority: "High", audience: "All residents", expiryDate: "2026-07-10", status: "published", pinned: true, message: "Water supply will pause from 10:00 AM to 1:00 PM for pump room maintenance.", createdAt: "2026-07-01T09:30:00.000Z" },
  { id: "n-2", title: "Festival fund collection", category: "Finance", priority: "Medium", audience: "Owners", expiryDate: "2026-06-20", status: "expired", pinned: false, message: "Festival fund contribution details are available at the society office.", createdAt: "2026-06-01T10:15:00.000Z" },
];

function readNotices() {
  if (typeof window === "undefined") return seedNotices;
  try {
    return JSON.parse(localStorage.getItem(NOTICE_KEY)) || seedNotices;
  } catch {
    return seedNotices;
  }
}

function Icon({ name }) {
  const paths = {
    ai: "M12 3l1.6 5L18 10l-5.4 2L11 17l-1.6-5L4 10l5.4-2L12 3Zm6 12l.7 2.1L21 18l-2.3.9L18 21l-.7-2.1L15 18l2.3-.9L18 15Z",
    attachment: "m21.4 11.6-8.8 8.8a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5",
    calendar: "M8 3v4m8-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
    pin: "m15 4 5 5-4 1-4 8-2-2 8-4 1-4-5-5-2 2Z",
    publish: "m22 2-7 20-4-9-9-4 20-7Z",
    save: "M5 3h12l2 2v16H5V3Zm3 0v6h7V3M8 21v-7h8v7",
    search: "m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z",
  };
  return <svg className="notice-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name] || paths.publish} /></svg>;
}

const blank = {
  title: "",
  category: "General",
  priority: "Medium",
  audience: "All residents",
  expiryDate: "",
  scheduleAt: "",
  attachment: "",
  message: "",
};

function NoticesPage() {
  const [notices, setNotices] = useState(readNotices);
  const [form, setForm] = useState(blank);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");

  const preview = useMemo(() => ({ ...form, title: form.title || "Notice preview", message: form.message || "Write the notice content to preview resident delivery." }), [form]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notices.filter((item) => {
      const matches = !q || [item.title, item.category, item.priority, item.audience, item.message].join(" ").toLowerCase().includes(q);
      const bucket = item.pinned ? "pinned" : item.status;
      return matches && (filter === "all" || bucket === filter);
    });
  }, [filter, notices, query]);

  const groups = {
    pinned: notices.filter((item) => item.pinned),
    recent: notices.filter((item) => item.status !== "expired").slice(0, 5),
    expired: notices.filter((item) => item.status === "expired"),
  };

  function update(key, value) {
    setNotice("");
    setForm((current) => ({ ...current, [key]: value }));
  }

  function persist(next) {
    setNotices(next);
    localStorage.setItem(NOTICE_KEY, JSON.stringify(next));
  }

  function submit(status) {
    if (!form.title.trim() || !form.message.trim()) {
      setNotice("Notice title and rich text content are required.");
      return;
    }
    const nextNotice = {
      ...form,
      id: `n-${Date.now()}`,
      status,
      pinned: form.priority === "High",
      createdAt: new Date().toISOString(),
    };
    persist([nextNotice, ...notices]);
    setForm(blank);
    setNotice(status === "published" ? "Notice published. Residents receive it instantly." : status === "scheduled" ? "Notice scheduled." : "Draft saved.");
  }

  function aiAssist() {
    const topic = form.title || "society update";
    update("message", `Dear residents,\n\nPlease note the following update regarding ${topic}. Kindly review the details, plan accordingly, and contact the society office during office hours for any clarification.\n\nThank you for your cooperation.\nChairman Office`);
  }

  return (
    <main className="notices-workspace">
      <ModulePageHeader title="Notices" subtitle="Create, preview, schedule, publish, and track resident notices from one workspace." />
      {notice ? <div className="notice-toast">{notice}</div> : null}

      <section className="notice-composer">
        <div className="notice-card notice-editor">
          <div className="notice-section-head">
            <div>
              <span>Create Notice</span>
              <h2>Announcement workflow</h2>
            </div>
            <button type="button" onClick={aiAssist}><Icon name="ai" /> AI Writing Assistant</button>
          </div>

          <div className="notice-form-grid">
            <label>Notice Title<input value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Water shutdown, AGM, payment reminder..." /></label>
            <label>Category<select value={form.category} onChange={(event) => update("category", event.target.value)}><option>General</option><option>Maintenance</option><option>Finance</option><option>Emergency</option><option>Event</option></select></label>
            <label>Priority<select value={form.priority} onChange={(event) => update("priority", event.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
            <label>Audience<select value={form.audience} onChange={(event) => update("audience", event.target.value)}><option>All residents</option><option>Owners</option><option>Tenants</option><option>Tower A</option><option>Tower B</option><option>Committee</option></select></label>
            <label>Expiry Date<input type="date" value={form.expiryDate} onChange={(event) => update("expiryDate", event.target.value)} /></label>
            <label>Schedule<input type="datetime-local" value={form.scheduleAt} onChange={(event) => update("scheduleAt", event.target.value)} /></label>
            <label className="is-wide">Attachment<input value={form.attachment} onChange={(event) => update("attachment", event.target.value)} placeholder="Paste attachment URL or file reference" /></label>
            <label className="is-wide">Rich Text Editor<textarea value={form.message} onChange={(event) => update("message", event.target.value)} placeholder="Write clear notice content for residents..." /></label>
          </div>

          <div className="notice-actions">
            <button type="button" onClick={() => submit("draft")}><Icon name="save" /> Draft</button>
            <button type="button" onClick={() => submit("scheduled")}><Icon name="calendar" /> Schedule</button>
            <button type="button" className="is-primary" onClick={() => submit("published")}><Icon name="publish" /> Publish</button>
          </div>
        </div>

        <aside className="notice-card notice-preview">
          <div className="notice-section-head">
            <div>
              <span>Preview</span>
              <h2>{preview.title}</h2>
            </div>
            <strong className={`notice-priority notice-priority--${preview.priority.toLowerCase()}`}>{preview.priority}</strong>
          </div>
          <div className="notice-preview-meta">
            <span>{preview.category}</span>
            <span>{preview.audience}</span>
            <span>{preview.expiryDate || "No expiry"}</span>
          </div>
          <p>{preview.message}</p>
          {preview.attachment ? <div className="notice-attachment"><Icon name="attachment" /> {preview.attachment}</div> : null}
        </aside>
      </section>

      <section className="notice-tools">
        <label><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notices" /></label>
        {["all", "pinned", "published", "draft", "scheduled", "expired"].map((item) => (
          <button key={item} type="button" className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)}>{item}</button>
        ))}
      </section>

      <section className="notice-list-grid">
        <NoticeColumn title="Pinned Notices" notices={groups.pinned} />
        <NoticeColumn title="Recent Notices" notices={groups.recent} />
        <NoticeColumn title="Expired Notices" notices={groups.expired} />
      </section>

      <section className="notice-card">
        <div className="notice-section-head">
          <div>
            <span>Search Results</span>
            <h2>{filtered.length} notices</h2>
          </div>
        </div>
        <div className="notice-result-list">
          {filtered.map((item) => <NoticeRow key={item.id} notice={item} />)}
          {!filtered.length ? <p className="notice-empty">No notices match the current search and filters.</p> : null}
        </div>
      </section>
    </main>
  );
}

function NoticeColumn({ title, notices }) {
  return (
    <section className="notice-card">
      <div className="notice-section-head"><div><span>{title}</span><h2>{notices.length}</h2></div></div>
      <div className="notice-mini-list">
        {notices.map((notice) => <NoticeRow key={notice.id} notice={notice} compact />)}
        {!notices.length ? <p className="notice-empty">No records.</p> : null}
      </div>
    </section>
  );
}

function NoticeRow({ notice, compact = false }) {
  return (
    <article className={`notice-row ${compact ? "is-compact" : ""}`}>
      <div>
        <strong>{notice.pinned ? <Icon name="pin" /> : null}{notice.title}</strong>
        {!compact ? <p>{notice.message}</p> : null}
      </div>
      <div className="notice-row-meta">
        <span>{notice.category}</span>
        <span>{notice.status}</span>
        <span>{new Date(notice.createdAt).toLocaleDateString("en-IN")}</span>
      </div>
    </article>
  );
}

export default NoticesPage;
