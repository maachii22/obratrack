import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Props = {
  label: string;
  value: string;
  delta?: { pct: number; label?: string };
  hint?: string;
};

export function KpiCard({ label, value, delta, hint }: Props) {
  const Trend = !delta ? null : delta.pct > 0 ? TrendingUp : delta.pct < 0 ? TrendingDown : Minus;
  const trendColor = !delta
    ? ""
    : delta.pct > 0
    ? "text-success"
    : delta.pct < 0
    ? "text-destructive"
    : "text-muted-foreground";

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight mt-1 tabular-nums">{value}</p>
        {delta && Trend && (
          <p className={`flex items-center gap-1 text-xs mt-2 ${trendColor}`}>
            <Trend className="h-3 w-3" />
            <span className="font-medium tabular-nums">{(delta.pct * 100).toFixed(1)}%</span>
            {delta.label && <span className="text-muted-foreground ml-1">{delta.label}</span>}
          </p>
        )}
        {hint && !delta && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}
      </CardContent>
    </Card>
  );
}
