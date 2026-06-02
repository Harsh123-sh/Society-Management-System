import { Link } from "react-router-dom";

export default function AuthHero() {
  return (
    <div className="relative flex h-full flex-col justify-between gap-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl text-lg font-bold shadow-lg backdrop-blur" style={{ backgroundColor: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}>
            SP
          </div>
          <div>
            <Link to="/login" className="text-lg font-semibold tracking-tight" style={{ color: "var(--text)" }}>
              Society Pro
            </Link>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Enterprise AI for communities</p>
          </div>
        </div>
        <div className="hidden sm:block">
          <div className="rounded-3xl border px-4 py-3 text-xs uppercase tracking-[0.28em] shadow-[0_20px_65px_-40px_rgba(0,0,0,0.2)]" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
            unified auth
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ring-1 ring-transparent" style={{ backgroundColor: "rgba(20,184,166,0.12)", borderColor: "rgba(20,184,166,0.2)", color: "var(--text)" }}>
          AI-powered onboarding
        </div>
        <h1 className="max-w-lg text-4xl font-semibold tracking-tight sm:text-5xl" style={{ color: "var(--text)" }}>
          Modern authentication for every society.
        </h1>
        <p className="max-w-lg text-sm leading-6 sm:text-base" style={{ color: "var(--text-muted)" }}>
          Preserve brand continuity with glassmorphism, bold gradients, and a cohesive SaaS auth experience.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border p-4 text-sm backdrop-blur" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>
          Society-aware signup flow
        </div>
        <div className="rounded-3xl border p-4 text-sm backdrop-blur" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>
          Consistent login, OTP, reset UX
        </div>
      </div>
    </div>
  );
}
