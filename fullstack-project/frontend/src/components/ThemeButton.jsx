export default function ThemeButton({ children, className = '', ...props }) {
  return (
    <button
      className={`btn-theme inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${className}`}
      style={{
        backgroundColor: 'var(--surface)',
        color: 'var(--text)',
        border: '1px solid var(--border)',
      }}
      {...props}
    >
      {children}
    </button>
  );
}
