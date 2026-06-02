export default function ThemeLabel({ children, htmlFor, className = "" }) {
  return (
    <label htmlFor={htmlFor} className={`auth-label block text-sm ${className}`}>
      {children}
    </label>
  );
}
