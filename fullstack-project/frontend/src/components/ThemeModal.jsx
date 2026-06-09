import { useEffect } from 'react';

export default function ThemeModal({ open, onClose, title, children }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose && onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 theme-modal-backdrop backdrop-blur-sm" onClick={() => onClose && onClose()} />
      <div className="relative w-full max-w-2xl p-6">
        <div className="auth-card p-6">
          {title ? <h3 className="text-lg font-semibold text-theme">{title}</h3> : null}
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
