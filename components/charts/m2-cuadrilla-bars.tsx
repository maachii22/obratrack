"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { fmtMes, fmtNum } from "@/lib/formatters";

type Row = { mes: string } & Record<string, number | string>;

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
];

export function M2CuadrillaBars({
  data,
  cuadrillas,
}: {
  data: Row[];
  cuadrillas: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">M² ejecutados por cuadrilla</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="mes"
                tickFormatter={fmtMes}
                stroke="var(--color-muted-foreground)"
                fontSize={12}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={12}
                tickFormatter={fmtNum}
              />
              <Tooltip
                formatter={(v) => [`${fmtNum(Number(v))} m²`, ""]}
                labelFormatter={(l) => fmtMes(String(l))}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {cuadrillas.map((c, i) => (
                <Bar key={c} dataKey={c} stackId="a" fill={COLORS[i % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
