function AlertMessage({ type = "error", message }) {
  if (!message) return null;

  const styleMap = {
    success: {
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      label: "Success",
    },
    error: {
      className: "border-rose-200 bg-rose-50 text-rose-700",
      label: "Error",
    },
    info: {
      className: "border-sky-200 bg-sky-50 text-sky-700",
      label: "Info",
    },
    warning: {
      className: "border-amber-200 bg-amber-50 text-amber-700",
      label: "Warning",
    },
  };
  const alertStyle = styleMap[type] || styleMap.error;

  return (
    <div
      className={`app-alert app-alert--${type} rounded-2xl border px-4 py-3 text-sm shadow-sm ${alertStyle.className}`}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      <span className="sr-only">{alertStyle.label}: </span>
      {message}
    </div>
  );
}

export default AlertMessage;
