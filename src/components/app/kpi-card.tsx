import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  tone = "neutral",
  href,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "neutral" | "positive" | "warning" | "danger";
  href?: string;
  icon?: React.ReactNode;
}) {
  const toneStyle = {
    neutral: "text-foreground",
    positive: "text-success",
    warning: "text-amber-700",
    danger: "text-destructive",
  }[tone];

  const inner = (
    <div className="rounded-lg border bg-card p-5 transition-shadow hover:shadow-sm group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        </div>
        {href && (
          <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      <div className={cn("mt-3 text-2xl font-semibold tabular tracking-tight", toneStyle)}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
