"use client";

import { useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";

// ─── RenameDialog ─────────────────────────────────────────────────────────────

interface RenameDialogProps {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function RenameDialog({ open, value, onChange, onSubmit, onClose }: RenameDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.select(), 50);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[9999] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0f1a28]">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="mynaui:edit" className="text-[#1CABE2] text-lg" />
          <h2 className="font-semibold text-gray-800 dark:text-white">Renommer la discussion</h2>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
            if (e.key === "Escape") onClose();
          }}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1CABE2] focus:ring-2 focus:ring-[#1CABE2]/20 dark:border-white/10 dark:bg-white/6 dark:text-white dark:focus:border-[#1CABE2]/60"
          placeholder="Nom de la discussion"
          autoComplete="off"
        />
        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/8 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={!value.trim()}
            className="rounded-xl bg-[#1CABE2] px-4 py-2 text-sm font-medium text-white hover:bg-[#0d8bbf] disabled:opacity-40 transition-colors"
          >
            Renommer
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

// ─── DeleteConfirmDialog ──────────────────────────────────────────────────────

interface DeleteConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmDialog({ open, onConfirm, onClose }: DeleteConfirmDialogProps) {
  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[9999] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0f1a28]">
        <div className="flex items-center gap-2 mb-2">
          <Icon icon="mynaui:trash" className="text-red-500 text-lg" />
          <h2 className="font-semibold text-gray-800 dark:text-white">Supprimer la discussion ?</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-white/55 mb-5">Cette action est irréversible.</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/8 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
