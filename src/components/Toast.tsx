'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none select-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3200);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'info':
        return <Info className="w-4 h-4 text-sky-400 shrink-0" />;
      case 'success':
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'error':
        return 'border-rose-500/40 bg-slate-900/95 text-rose-200';
      case 'info':
        return 'border-sky-500/40 bg-slate-900/95 text-sky-200';
      case 'success':
      default:
        return 'border-emerald-500/40 bg-slate-900/95 text-emerald-200';
    }
  };

  return (
    <div
      className={`pointer-events-auto flex items-center space-x-2.5 px-3.5 py-2.5 rounded-lg border shadow-xl backdrop-blur-md text-xs font-medium transition-all animate-in slide-in-from-bottom-2 fade-in ${getBorderColor()}`}
    >
      {getIcon()}
      <span className="text-slate-100">{toast.message}</span>
      <button
        onClick={onDismiss}
        className="p-0.5 rounded text-slate-400 hover:text-slate-200 transition ml-1"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
