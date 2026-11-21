export function Avatar({ first, last, size = 44 }: { first?: string | null; last?: string | null; size?: number }) {
  const initials = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "N";
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-semibold text-[#2a1d02]"
      style={{ width: size, height: size, fontSize: size * 0.36, background: "linear-gradient(160deg,#f6dc93,#c99a36)", boxShadow: "0 0 0 2px var(--border-strong)" }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
