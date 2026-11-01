import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel rounded-2xl border border-rose-500/30 w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1 flex-1">
            <h3 className="text-base font-bold font-display text-white">{title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
            {itemName && (
              <div className="mt-2 p-2 rounded-lg bg-black/40 border border-white/5 text-xs font-mono text-rose-300 truncate">
                {itemName}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Mégse
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-lg shadow-rose-600/30 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Végleges törlés</span>
          </button>
        </div>
      </div>
    </div>
  );
};
