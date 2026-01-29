import React from 'react';

export default function SwitchToggle({ checked, onChange, disabled, labelOn = 'Activo', labelOff = 'Inactivo', showLabel = true, className = '' }) {
  const effectiveChecked = !!checked;
  return (
    <label className={`inline-flex items-center gap-3 text-sm text-gray-300 select-none ${disabled ? 'opacity-60' : ''} ${className}`}>
      {showLabel ? <span className="text-xs text-gray-400">{effectiveChecked ? labelOn : labelOff}</span> : null}
      <span className="relative inline-flex items-center">
        <input type="checkbox" className="sr-only peer" checked={effectiveChecked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} />
        <span className="w-11 h-6 bg-white/10 border border-white/10 rounded-full peer peer-checked:bg-accent-primary/60 peer-checked:border-accent-primary/40 transition-colors" />
        <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
