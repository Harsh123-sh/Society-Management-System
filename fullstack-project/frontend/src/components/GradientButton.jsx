import { motion } from "framer-motion";

export default function GradientButton({ children, loading = false, className = "", ...props }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ translateY: -2 }}
      className={`auth-button w-full disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
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
