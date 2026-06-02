export default function ThemeTextarea({ label, value, onChange, rows = 4, placeholder = '', className = '', id }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label ? <label className="auth-label block text-sm" htmlFor={id}>{label}</label> : null}
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full rounded-2xl border px-4 py-3 text-sm auth-input"
      />
    </div>
  );
}
