export default function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-[1.75rem] border p-6 shadow-[0_35px_80px_-40px_rgba(0,0,0,0.18)] backdrop-blur-3xl ${className}`}
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
        color: "var(--text)",
      }}
    >
      {children}
    </div>
  );
}
