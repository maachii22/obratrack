"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { fmtARS, fmtMes } from "@/lib/formatters";
import type { ResumenMes } from "@/lib/calc";

export function CostoM2Trend({ data }: { data: ResumenMes[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Costo / m² mensual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="mes"
                tickFormatter={fmtMes}
                stroke="var(--color-muted-foreground)"
                fontSize={12}
              />
              <YAxis
                tickFormatter={(v) => fmtARS(v)}
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                width={90}
              />
              <Tooltip
                formatter={(v) => [fmtARS(Number(v)), "Costo / m²"]}
                labelFormatter={(l) => fmtMes(String(l))}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="costoM2"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
