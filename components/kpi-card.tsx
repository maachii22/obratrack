import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string;
  delta?: { pct: number; label?: string };
  hint?: string;
  icon?: LucideIcon;
  accent?: "primary" | "success" | "warning" | "destructive";
};

const ACCENTS: Record<NonNullable<Props["accent"]>, { bg: string; text: string }> = {
  primary: { bg: "bg-primary/10", text: "text-primary" },
  success: { bg: "bg-success/10", text: "text-success" },
  warning: { bg: "bg-warning/10", text: "text-warning" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive" },
};

export function KpiCard({ label, value, delta, hint, icon: Icon, accent = "primary" }: Props) {
  const Trend = !delta ? null : delta.pct > 0 ? TrendingUp : delta.pct < 0 ? TrendingDown : Minus;
  const trendColor = !delta
    ? ""
    : delta.pct > 0
    ? "text-success bg-success/10"
    : delta.pct < 0
    ? "text-destructive bg-destructive/10"
    : "text-muted-foreground bg-muted";
  const a = ACCENTS[accent];

  return (
    <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
            {label}
          </p>
          {Icon && (
            <div className={`h-9 w-9 rounded-lg ${a.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`h-4 w-4 ${a.text}`} />
            </div>
          )}
        </div>
        <p className="text-3xl font-semibold tracking-tight tabular-nums leading-none mb-2">
          {value}
        </p>
        <div className="flex items-center gap-2 text-xs">
          {delta && Trend && (
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium ${trendColor}`}
            >
              <Trend className="h-3 w-3" />
              <span className="tabular-nums">
                {(Math.abs(delta.pct) * 100).toFixed(1)}%
              </span>
            </span>
          )}
          {delta?.label && (
            <span className="text-muted-foreground">{delta.label}</span>
          )}
          {hint && !delta && <span className="text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
