"use client";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

export type ThemeChoice = "system" | "light" | "dark";
const KEY = "np-theme";

function resolve(choice: ThemeChoice) {
  if (choice !== "system") return choice;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyTheme(choice: ThemeChoice) {
  try { localStorage.setItem(KEY, choice); } catch {}
  document.documentElement.setAttribute("data-theme", resolve(choice));
  document.documentElement.setAttribute("data-theme-choice", choice);
  window.dispatchEvent(new Event("np-theme"));
}

function subscribe(cb: () => void) {
  window.addEventListener("np-theme", cb);
  return () => window.removeEventListener("np-theme", cb);
}
const read = () => (document.documentElement.getAttribute("data-theme-choice") as ThemeChoice) || "dark";

export function useThemeChoice() {
  const choice = useSyncExternalStore(subscribe, read, () => "dark" as ThemeChoice);
  // Follow the device while "system" is selected.
  useEffect(() => {
    if (choice !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const on = () => applyTheme("system");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [choice]);
  return choice;
}

const OPTIONS: { value: ThemeChoice; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

/** Segmented control, used in settings and as the quick toggle in the top bar. */
export function ThemeSwitch({ compact = false, onChange }: { compact?: boolean; onChange?: (c: ThemeChoice) => void }) {
  const choice = useThemeChoice();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-full border border-line p-0.5">
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mounted && choice === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            aria-label={compact ? label : undefined}
            onClick={() => { applyTheme(value); onChange?.(value); }}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm transition-colors ${
              active ? "bg-elevated text-fg shadow-sm" : "text-muted hover:text-fg"
            }`}
          >
            <Icon size={14} aria-hidden />
            {!compact && label}
          </button>
        );
      })}
    </div>
  );
}

/** Two-state sun/moon pill from the mockup header. "System" lives in Account → Theme. */
export function ThemePill({ onChange }: { onChange?: (c: ThemeChoice) => void }) {
  const choice = useThemeChoice();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const resolved = mounted ? (choice === "system" ? resolve("system") : choice) : "dark";
  const set = (c: ThemeChoice) => { applyTheme(c); onChange?.(c); };
  const seg = (active: boolean) =>
    `grid h-8 w-10 place-items-center rounded-full transition-all ${active ? "nav-active" : "text-muted hover:text-fg"}`;
  return (
    <div role="radiogroup" aria-label="Theme" className="tile inline-flex rounded-full p-1">
      <button role="radio" aria-checked={resolved === "light"} aria-label="Light theme" onClick={() => set("light")} className={seg(resolved === "light")}>
        <Sun size={17} aria-hidden />
      </button>
      <button role="radio" aria-checked={resolved === "dark"} aria-label="Dark theme" onClick={() => set("dark")} className={seg(resolved === "dark")}>
        <Moon size={17} aria-hidden />
      </button>
    </div>
  );
}
