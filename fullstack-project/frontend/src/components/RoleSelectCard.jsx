import { motion } from "framer-motion";

export default function RoleSelectCard({ active, title, description, value, onSelect }) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(value)}
      className={`auth-role-card ${active ? "is-active" : ""}`}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="auth-role-card__content">
        <div>
          <p>{title}</p>
          <span>{description}</span>
        </div>
        {active ? <strong>Selected</strong> : null}
      </div>
    </motion.button>
  );
}
