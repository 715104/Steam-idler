import React from 'react';
import { AlertTriangle, LogOut, X, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  warningText?: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  warningText,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded transition-colors disabled:opacity-50 hover:scale-110 active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-red-950/80 text-red-400 border border-red-900/60'
                : 'bg-zinc-900 text-zinc-200 border border-zinc-700'
            }`}
          >
            {isDanger ? <AlertTriangle className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
          </div>
          <div className="space-y-1 pr-4">
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{message}</p>
          </div>
        </div>
        {warningText && (
          <div className="p-3 bg-red-950/30 border border-red-900/50 rounded text-xs text-red-300 font-medium animate-pulse">
            {warningText}
          </div>
        )}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] ${
              isDanger
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-white hover:bg-zinc-200 text-black'
            }`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
