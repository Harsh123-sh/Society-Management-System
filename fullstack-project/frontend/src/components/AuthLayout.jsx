import AuthCard from "./AuthCard";
import AuthHero from "./AuthHero";
import ThemeToggle from "./ThemeToggle";
import { MotionConfig, motion } from "framer-motion";

export const authLabelClass = "auth-label";

function AuthLayout({
  title,
  subtitle,
  children,
  eyebrow = "Society Pro",
  insightTitle = "Secure auth with society-aware intelligence.",
  insightSubtitle = "One unified sign-in experience across login, registration, verification, and reset workflows.",
  insightMeta = [
    ["AI-ready", "Contextual onboarding"],
    ["Role-aware", "Chairman to resident flows"],
  ],
}) {
  return (
    <MotionConfig transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      <div className="auth-shell">
        <div className="auth-shell__glow auth-shell__glow--one" />
        <div className="auth-shell__glow auth-shell__glow--two" />

        <div className="auth-frame">
          <aside className="auth-side">
            <div className="auth-side__top">
              <AuthHero />
            </div>

            <motion.div
              className="auth-insight-card"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              <p>Designed for premium communities</p>
              <h2>{insightTitle}</h2>
              <span>{insightSubtitle}</span>
              <div className="auth-insight-card__grid">
                {insightMeta.map(([label, value]) => (
                  <div key={label}>
                    <strong>{label}</strong>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </aside>

          <main className="auth-main">
            <div className="auth-main__toolbar">
              <ThemeToggle />
            </div>

            <motion.div
              className="auth-card-wrap"
              initial={{ opacity: 0, y: 26, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.08 }}
            >
              <AuthCard>
                <div className="auth-card__heading">
                  <span>{eyebrow}</span>
                  <h2>{title}</h2>
                  <p>{subtitle}</p>
                </div>
                <motion.div
                  className="auth-card__body"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.24 }}
                >
                  {children}
                </motion.div>
              </AuthCard>
            </motion.div>
          </main>
        </div>
      </div>
    </MotionConfig>
  );
}

export default AuthLayout;
