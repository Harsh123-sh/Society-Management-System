import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import BrandLogo from "./BrandLogo";
import { BRAND } from "../config/brand";

export default function AuthHero() {
  return (
    <div className="auth-hero">
      <motion.div
        className="auth-hero__nav"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="auth-hero__brand">
          <BrandLogo to="/login" variant="full" />
        </div>
        <div className="auth-hero__pill">
          encrypted access
        </div>
      </motion.div>

      <motion.div
        className="auth-hero__copy"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <div className="auth-hero__eyebrow">
          {BRAND.tagline}
        </div>
        <h1>
          Secure access for every society role.
        </h1>
        <p>
          A polished, role-aware entry experience for chairmen, secretaries, owners, tenants, staff, security and platform administrators.
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
          <strong>7 roles</strong>
          <span>Smart detection</span>
        </div>
      </motion.div>

      <motion.div
        className="auth-platform-preview"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="auth-platform-preview__header">
          <span>Live society access</span>
          <strong>Protected</strong>
        </div>
        <div className="auth-platform-preview__grid">
          {["Resident KYC", "Gate Pass", "Billing", "AI Health"].map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
