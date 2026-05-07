import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
  accent?: "default" | "primary" | "warning" | "destructive";
}

export function MetricCard({ label, value, hint, className, accent = "default" }: Props) {
  const accentClass =
    accent === "primary"
      ? "text-primary"
      : accent === "warning"
        ? "text-warning"
        : accent === "destructive"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1.5 font-mono text-2xl font-semibold tabular-nums", accentClass)}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status?: string | null }) {
  const map: Record<string, string> = {
    completed: "border-primary/40 bg-primary/10 text-primary",
    failed: "border-destructive/40 bg-destructive/10 text-destructive",
    timeout: "border-warning/40 bg-warning/10 text-warning",
    invalid_output: "border-warning/40 bg-warning/10 text-warning",
  };
  const label = status ?? "unknown";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        map[label] ?? "border-border bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

export function WinnerBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
      ★ Winner
    </span>
  );
}
