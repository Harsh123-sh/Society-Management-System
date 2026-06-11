import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function AuthHero() {
  return (
    <div className="auth-hero">
      <motion.div
        className="auth-hero__nav"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="auth-hero__brand">
          <div className="auth-hero__mark">
            SP
          </div>
          <div>
            <Link to="/login">
              Society Pro
            </Link>
            <p>Enterprise AI for communities</p>
          </div>
        </div>
        <div className="auth-hero__pill">
          unified auth
        </div>
      </motion.div>

      <motion.div
        className="auth-hero__copy"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <div className="auth-hero__eyebrow">
          AI-powered onboarding
        </div>
        <h1>
          Modern authentication for every society.
        </h1>
        <p>
          A polished, role-aware entry experience for committee members, residents, staff, security, and platform admins.
        </p>
      </motion.div>

      <motion.div
        className="auth-hero__metrics"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
      >
        <div>
          <strong>256-bit</strong>
          <span>Encrypted sessions</span>
        </div>
        <div>
          <strong>6 roles</strong>
          <span>One auth surface</span>
        </div>
      </motion.div>
    </div>
  );
}
