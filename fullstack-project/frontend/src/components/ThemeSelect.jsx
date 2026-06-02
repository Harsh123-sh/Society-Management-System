import { useState, useRef, useEffect } from 'react';

export default function ThemeSelect({ options = [], value, onChange, placeholder = 'Select...', disabled = false, id }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const rootRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  useEffect(() => {
    if (!open) setHighlight(-1);
  }, [open]);

  function toggle() {
    if (disabled) return;
    setOpen((s) => !s);
  }

  function handleKey(e) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') setHighlight((h) => Math.min(h + 1, options.length - 1));
    if (e.key === 'ArrowUp') setHighlight((h) => Math.max(h - 1, 0));
    if (e.key === 'Enter' && highlight >= 0) {
      onChange && onChange(options[highlight].value);
      setOpen(false);
    }
    if (e.key === 'Escape') setOpen(false);
  }

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={handleKey}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm auth-input ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <span className={`${selected ? 'text-theme' : 'text-muted'}`}>{selected ? selected.label : placeholder}</span>
        <svg className="h-4 w-4 text-muted" viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      {open ? (
        <ul role="listbox" aria-labelledby={id} tabIndex={-1} className="absolute z-50 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-theme bg-surface py-2 shadow-lg">
          {options.map((opt, idx) => {
            const isSelected = value === opt.value;
            const isHighlighted = highlight === idx;
            return (
              <li
                role="option"
                aria-selected={isSelected}
                key={opt.value}
                onMouseEnter={() => setHighlight(idx)}
                onMouseLeave={() => setHighlight(-1)}
                onClick={() => { onChange && onChange(opt.value); setOpen(false); }}
                className={`cursor-pointer px-4 py-2 text-sm flex items-center justify-between ${isHighlighted ? 'bg-card' : 'hover:bg-surface'} `}
                style={isSelected ? { background: `linear-gradient(90deg, var(--primary), var(--accent))`, color: 'white' } : {}}
              >
                <span className={`${isSelected ? 'font-semibold' : ''}`}>{opt.label}</span>
                {isSelected ? <span className="text-xs text-muted">Selected</span> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
