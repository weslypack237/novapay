import { Notice } from "@/components/ui/notice";

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : "Something went wrong loading this.";
  return (
    <Notice tone="error">
      {message}{" "}
      {onRetry && <button onClick={onRetry} className="underline underline-offset-4">Try again</button>}
    </Notice>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="skeleton h-12" />)}
    </div>
  );
}
