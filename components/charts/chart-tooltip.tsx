"use client";

import type { ReactNode } from "react";

type Item = { name?: string; value?: number; color?: string };

export function ChartTooltipContent({
  active,
  label,
  items,
  formatValue = (v) => String(v),
}: {
  active: boolean;
  label: ReactNode;
  items: Item[];
  formatValue?: (v: number) => string;
}) {
  if (!active || !items?.length) return null;
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-md px-3 py-2 text-xs">
      {label && <div className="font-medium mb-1.5">{label}</div>}
      <div className="space-y-1">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            {it.color && (
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ background: it.color }}
              />
            )}
            {it.name && (
              <span className="text-muted-foreground">{it.name}</span>
            )}
            <span className="ml-auto font-semibold tabular-nums">
              {it.value !== undefined ? formatValue(it.value) : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
