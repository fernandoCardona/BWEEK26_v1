import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown } from 'react-icons/fi';

export default function CustomSelect({ label, value, onChange, disabled, options }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  const selected = useMemo(() => {
    return options?.find((o) => String(o.value) === String(value)) ?? options?.[0] ?? { value: '', label: '' };
  }, [options, value]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(e.target)) return;
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const width = Math.max(220, rect.width);
      const left = Math.min(rect.left, window.innerWidth - width - 12);
      const top = Math.min(rect.bottom + 8, window.innerHeight - 100);
      setMenuStyle({
        position: 'fixed',
        top,
        left,
        width,
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {label ? <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label> : null}
      <button
        type="button"
        disabled={disabled}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-10 text-left flex items-center justify-between gap-3 disabled:opacity-60"
        onClick={() => setOpen((o) => !o)}
        ref={buttonRef}
      >
        <span className="truncate text-gray-200">{selected?.label ?? ''}</span>
        <FiChevronDown className={`shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} size={21} />
      </button>
      {open && !disabled && menuStyle && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              style={menuStyle}
              className="z-[9999] rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/60"
            >
              <div className="max-h-72 overflow-auto py-2 bweek-scrollbar">
                {(options ?? []).map((o) => {
                  const isActive = String(o.value) === String(value);
                  return (
                    <button
                      key={String(o.value)}
                      type="button"
                      className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                        isActive ? 'bg-white/10 text-white' : 'text-gray-200 hover:bg-white/5'
                      }`}
                      onClick={() => {
                        onChange?.(o.value);
                        setOpen(false);
                      }}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

