"use client";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

/** Bottom sheet on phones, centred dialog on larger screens. Native <dialog> handles focus and Escape. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="sheet-title"
      className="m-0 mt-auto w-full max-w-none bg-transparent p-0 text-fg backdrop:bg-black/55 backdrop:backdrop-blur-[2px] sm:m-auto sm:max-w-md"
    >
      {open && (
        <div className="glass sheet-in rounded-t-[28px] px-6 pb-8 pt-3 sm:rounded-[28px] sm:pt-6">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden />
          <div className="flex items-center justify-between gap-4">
            <h2 id="sheet-title" className="text-[1.5rem]">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="tile grid size-9 place-items-center rounded-full"><X size={17} /></button>
          </div>
          <div className="mt-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}
