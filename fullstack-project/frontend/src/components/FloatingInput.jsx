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
    <div className={`auth-field relative ${className}`}>
      <motion.input
        initial={false}
        animate={focused || value ? { boxShadow: "0 18px 45px rgba(20, 184, 166, 0.14)" } : { boxShadow: "0 10px 28px rgba(15, 23, 42, 0.04)" }}
        className={`auth-input block w-full ${error ? "auth-input--error" : ""}`}
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
        className={`auth-floating-label ${focused || value ? "is-raised" : ""}`}
      >
        {label}
      </label>

      {showPasswordToggle && isPassword ? (
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="auth-password-toggle"
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
