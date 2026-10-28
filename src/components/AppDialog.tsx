'use client';

import React, { useEffect, useRef } from 'react';
import {
  X,
  AlertTriangle,
  HelpCircle,
  Info,
  AlertCircle,
  CheckCircle2,
  FilePlus,
  FolderPlus,
} from 'lucide-react';

export type DialogType = 'confirm' | 'prompt' | 'alert';
export type DialogVariant = 'danger' | 'warning' | 'primary' | 'info';

export interface DialogOptions {
  isOpen: boolean;
  type: DialogType;
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
  placeholder?: string;
  onConfirm?: (value?: string) => void;
  onCancel?: () => void;
}

export const AppDialog: React.FC<DialogOptions> = ({
  isOpen,
  type,
  title,
  message,
  variant = 'primary',
  confirmText,
  cancelText = 'Cancelar',
  defaultValue = '',
  placeholder = '',
  onConfirm,
  onCancel,
}) => {
  const [inputValue, setInputValue] = React.useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(defaultValue);
    if (isOpen && type === 'prompt') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultValue, type]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
      }
      if (e.key === 'Enter' && type !== 'confirm') {
        e.preventDefault();
        onConfirm?.(inputValue);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onConfirm, inputValue, type]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 text-sky-400 shrink-0" />;
      case 'primary':
      default:
        return type === 'prompt' ? (
          <FolderPlus className="w-5 h-5 text-emerald-400 shrink-0" />
        ) : (
          <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0" />
        );
    }
  };

  const getConfirmBtnClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30';
      case 'info':
        return 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-900/30';
      case 'primary':
      default:
        return 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          <p className="leading-relaxed">{message}</p>

          {type === 'prompt' && (
            <div className="space-y-1.5 pt-1">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end space-x-2">
          {type !== 'alert' && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium text-xs transition"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => onConfirm?.(inputValue)}
            className={`px-4 py-2 rounded-lg font-medium text-xs transition shadow-md ${getConfirmBtnClass()}`}
          >
            {confirmText || (type === 'alert' ? 'Entendi' : 'Confirmar')}
          </button>
        </div>
      </div>
    </div>
  );
};
