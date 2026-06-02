import { Link } from "react-router-dom";
import AnimatedBackground from "./AnimatedBackground";
import AuthCard from "./AuthCard";
import AuthHero from "./AuthHero";
import ThemeToggle from "./ThemeToggle";
import { MotionConfig } from "framer-motion";

export const authLabelClass = "text-sm font-medium auth-label";

function AuthLayout({ title, subtitle, children }) {
  return (
    <MotionConfig transition={{ duration: 0.45 }}>
      <div className="app-shell app-shell--auth min-h-screen" style={{ backgroundColor: "var(--background)", color: "var(--text)" }}>
        <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
          <aside className="relative overflow-hidden px-6 py-8 sm:px-10 lg:px-12 lg:py-10" style={{ background: "var(--hero-bg)", color: "var(--text)" }}>
            <AnimatedBackground />
            <AuthHero />
            <div className="mt-8 hidden md:block">
              <div className="space-y-4 rounded-[1.75rem] border p-5 shadow-[0_32px_80px_-40px_rgba(0,0,0,0.18)] backdrop-blur-lg" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-muted)" }}>Designed for premium communities</p>
                <h2 className="text-3xl font-semibold leading-tight sm:text-4xl" style={{ color: "var(--text)" }}>Secure auth with society-aware intelligence.</h2>
                <p className="max-w-md text-sm leading-6" style={{ color: "var(--text-muted)" }}>One unified sign-in experience across login, registration, verification, and reset workflows.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border p-4 text-sm" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>Modern AI-first auth</div>
                  <div className="rounded-2xl border p-4 text-sm" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>Role-aware registration</div>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
            <div className="w-full max-w-md">
              <AuthCard className="p-6 sm:p-8">
                <div className="mb-6 flex flex-col gap-2">
                  <div>
                    <h2 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>{title}</h2>
                    <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
                  </div>
                </div>
                <div className="space-y-5">{children}</div>
              </AuthCard>
            </div>
          </main>
        </div>
      </div>
    </MotionConfig>
  );
}

export default AuthLayout;
