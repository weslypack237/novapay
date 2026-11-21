import { forwardRef, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string };

export const Field = forwardRef<HTMLInputElement, Props>(function Field({ label, error, hint, id, ...rest }, ref) {
  const fid = id ?? rest.name;
  return (
    <div>
      <label htmlFor={fid} className="mb-1.5 block text-[0.92rem] font-medium">{label}</label>
      <input
        ref={ref}
        id={fid}
        aria-invalid={!!error}
        aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
        className={`w-full rounded-[16px] border bg-surface px-4 py-3 text-[1.05rem] outline-none transition-colors placeholder:text-faint focus:border-gold ${
          error ? "border-danger" : "border-line-strong"
        }`}
        {...rest}
      />
      {error ? (
        <p id={`${fid}-error`} className="mt-1.5 text-[0.92rem] text-danger">{error}</p>
      ) : hint ? (
        <p id={`${fid}-hint`} className="mt-1.5 text-[0.92rem] text-faint">{hint}</p>
      ) : null}
    </div>
  );
});
