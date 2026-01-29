import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function ImagePickerBox({ previewUrl, onPick, onRemove, size = 'md', roundedClassName = 'rounded-3xl', fit = 'cover', className = '' }) {
  const sizeClass = size === 'sm' ? 'w-20 h-20' : size === 'lg' ? 'w-40 h-40' : 'w-32 h-32';
  const imgClass = fit === 'contain' ? 'w-full h-full object-contain block' : 'w-full h-full object-cover block';
  return (
    <div className={`relative ${sizeClass} ${roundedClassName} border border-white/10 bg-black/30 overflow-hidden flex items-center justify-center cursor-pointer group ${className}`} onClick={onPick}>
      {previewUrl ? <img src={previewUrl} alt="Imagen" className={imgClass} /> : <FiPlus size={22} className="text-gray-500" />}
      {previewUrl ? (
        <button
          type="button"
          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          aria-label="Eliminar imagen"
        >
          <FiTrash2 size={22} className="text-white" />
        </button>
      ) : null}
    </div>
  );
}
