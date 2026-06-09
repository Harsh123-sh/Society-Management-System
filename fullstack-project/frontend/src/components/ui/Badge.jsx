/**
 * Badge Component - For status indicators and tags
 */
export function Badge({ 
  children, 
  variant = "default", 
  size = "md",
  icon,
  onClick
}) {
  const variants = {
    default: "bg-[rgb(var(--app-surface-muted-rgb))] text-[rgb(var(--app-text-rgb))]",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
    info: "bg-sky-100 text-sky-700",
    primary: "bg-[rgb(var(--app-primary-rgb))] text-[var(--text-main)]",
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${variants[variant]} ${sizes[size]} ${
        onClick ? "cursor-pointer hover:opacity-80" : ""
      }`}
      onClick={onClick}
    >
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const config = {
    active: { variant: "success", icon: "✓", label: "Active" },
    pending: { variant: "warning", icon: "⏳", label: "Pending" },
    inactive: { variant: "danger", icon: "✗", label: "Inactive" },
    approved: { variant: "success", icon: "✓", label: "Approved" },
    rejected: { variant: "danger", icon: "✗", label: "Rejected" },
    completed: { variant: "success", icon: "✓", label: "Completed" },
    inprogress: { variant: "info", icon: "◆", label: "In Progress" },
    resolved: { variant: "success", icon: "✓", label: "Resolved" },
    unresolved: { variant: "warning", icon: "!", label: "Unresolved" },
  };

  const config_item = config[status?.toLowerCase()] || config.pending;
  
  return <Badge variant={config_item.variant} icon={config_item.icon}>{config_item.label}</Badge>;
}