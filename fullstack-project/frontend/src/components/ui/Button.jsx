/**
 * Button Component - Multiple variants and sizes
 */
export function Button({ 
  children, 
  onClick, 
  type = "button", 
  variant = "primary", 
  size = "md",
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  className = ""
}) {
  const variants = {
    primary: "ui-button ui-button--primary text-[var(--text-main)]",
    secondary: "ui-button ui-button--secondary",
    danger: "ui-button bg-red-500 text-[var(--text-main)] hover:bg-red-600",
    success: "ui-button bg-emerald-500 text-[var(--text-main)] hover:bg-emerald-600",
    outline: "ui-button ui-button--secondary",
    ghost: "ui-button bg-transparent text-[rgb(var(--app-text-rgb))] hover:bg-[rgb(var(--app-surface-muted-rgb))]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-2 rounded-2xl font-semibold transition ${variants[variant]} ${sizes[size]} ${
        fullWidth ? "w-full justify-center" : ""
      } ${disabled || loading ? "cursor-not-allowed opacity-50" : ""} ${className}`}
    >
      {loading ? "⏳" : icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

export function ButtonGroup({ children, className = "" }) {
  return <div className={`flex gap-2 ${className}`}>{children}</div>;
}