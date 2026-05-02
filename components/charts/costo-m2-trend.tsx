"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { fmtARS, fmtMes } from "@/lib/formatters";
import type { ResumenMes } from "@/lib/calc";
import { ChartTooltipContent } from "./chart-tooltip";
import { LineChart as LineChartIcon } from "lucide-react";

type RTip = { active?: boolean; label?: unknown; payload?: { value?: number }[] };
function CustomTooltip(p: RTip) {
  const v = p.payload?.[0]?.value;
  return (
    <ChartTooltipContent
      active={!!p.active}
      label={fmtMes(String(p.label))}
      items={[
        {
          name: "Costo / m²",
          value: typeof v === "number" ? v : undefined,
          color: "var(--color-primary)",
        },
      ]}
      formatValue={fmtARS}
    />
  );
}

export function CostoM2Trend({ data }: { data: ResumenMes[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
          <LineChartIcon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <CardTitle className="text-base leading-tight">Costo / m² mensual</CardTitle>
          <p className="text-xs text-muted-foreground">
            Evolución del costo unitario
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="grad-costo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="mes"
                tickFormatter={fmtMes}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v) => fmtARS(v)}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                width={90}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "var(--color-border)", strokeDasharray: "3 3" }}
              />
              <Area
                type="monotone"
                dataKey="costoM2"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                fill="url(#grad-costo)"
                dot={{ r: 3, fill: "var(--color-card)", stroke: "var(--color-primary)", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "var(--color-primary)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
