import { motion } from "framer-motion";

export default function AuthCard({ children, className = "" }) {
  return (
    <motion.section
      className={`auth-card ${className}`}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      {children}
    </motion.section>
  );
}
