import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-2xl text-sm font-medium text-white min-w-[280px] max-w-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
            t.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            type="button"
            onClick={() => onRemove(t.id)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 opacity-80 hover:opacity-100" />
          </button>
        </div>
      ))}
    </div>
  );
}

