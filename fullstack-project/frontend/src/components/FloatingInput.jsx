import { motion } from "framer-motion";
import { useState } from "react";

export default function FloatingInput({
  label,
  type = "text",
  value,
  onChange,
  name,
  placeholder = "",
  autoComplete,
  required = false,
  maxLength,
  className = "",
  showPasswordToggle = false,
  error,
  disabled = false,
  helperText = "",
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && show ? "text" : type;

  return (
    <div className={`relative ${className}`}>
      <motion.input
        initial={false}
        animate={focused || value ? { boxShadow: "0 10px 38px rgba(6,182,212,0.14)" } : { boxShadow: "none" }}
        className={`block w-full rounded-2xl border px-4 py-3 text-sm backdrop-blur transition focus:outline-none ${error ? "border-rose-400/70" : ""}`}
        style={{
          backgroundColor: "var(--input-bg)",
          borderColor: error ? "rgba(244,63,94,0.7)" : "var(--input-border)",
          color: "var(--text)",
        }}
        type={inputType}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        name={name}
        placeholder={placeholder || label}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        required={required}
        maxLength={maxLength}
        disabled={disabled}
      />

      <label
        className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transform origin-left text-sm transition-all ${focused || value ? "-translate-y-8 scale-90" : ""}`}
        style={{ color: focused || value ? "var(--text-muted)" : "var(--input-placeholder)" }}
      >
        {label}
      </label>

      {showPasswordToggle && isPassword ? (
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1"
          style={{ color: "var(--text-muted)" }}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.2"/></svg>
          )}
        </button>
      ) : null}

      {error ? <p className="mt-2 text-xs" style={{ color: "var(--error)" }}>{error}</p> : null}
      {!error && helperText ? (
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>{helperText}</p>
      ) : null}
    </div>
  );
}
