export default function RoleSelectCard({ active, title, description, value, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`w-full rounded-3xl border px-4 py-4 text-left transition duration-200 ${
        active
          ? "border-cyan-300/40 bg-cyan-500/15 text-[var(--text-main)] shadow-[0_20px_60px_-45px_rgba(14,165,233,0.65)]"
          : "border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-cyan-300/30 hover:bg-white/10"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--text-main)]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{description}</p>
        </div>
        {active ? <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs text-cyan-100">Selected</span> : null}
      </div>
    </button>
  );
}
