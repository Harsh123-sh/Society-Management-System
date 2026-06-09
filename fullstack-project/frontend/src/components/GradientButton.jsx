import { motion } from "framer-motion";

export default function GradientButton({ children, loading = false, className = "", ...props }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ translateY: -2 }}
      className={`w-full rounded-2xl px-5 py-3 text-sm font-semibold text-[var(--text-main)] shadow-[0_24px_80px_-40px_rgba(34,211,238,0.45)] transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)" }}
      {...props}
    >
      <span className="flex items-center justify-center gap-2">
        {loading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : null}
        <span>{children}</span>
      </span>
    </motion.button>
  );
}
