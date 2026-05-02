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
import { ChartTooltipContent } from "./chart-tooltip";
import { Users } from "lucide-react";

type Row = { mes: string } & Record<string, number | string>;

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
];

type RTip = {
  active?: boolean;
  label?: unknown;
  payload?: { name?: string; value?: number; color?: string }[];
};
function makeTooltip(cuadrillas: string[]) {
  const Tip = (p: RTip) => {
    const items = (p.payload ?? [])
      .filter((d) => d.value && Number(d.value) > 0)
      .map((d) => ({
        name: d.name,
        value: Number(d.value),
        color: d.color,
      }));
    return (
      <ChartTooltipContent
        active={!!p.active}
        label={fmtMes(String(p.label))}
        items={items}
        formatValue={(v) => `${fmtNum(v)} m²`}
      />
    );
  };
  Tip.displayName = `MTooltip(${cuadrillas.length})`;
  return Tip;
}

export function M2CuadrillaBars({
  data,
  cuadrillas,
}: {
  data: Row[];
  cuadrillas: string[];
}) {
  const Tip = makeTooltip(cuadrillas);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div>
          <CardTitle className="text-base leading-tight">
            M² ejecutados por cuadrilla
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Distribución mensual del trabajo
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }} barCategoryGap="20%">
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
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickFormatter={fmtNum}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<Tip />} cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                iconType="circle"
                iconSize={8}
              />
              {cuadrillas.map((c, i) => (
                <Bar
                  key={c}
                  dataKey={c}
                  stackId="a"
                  fill={COLORS[i % COLORS.length]}
                  radius={i === cuadrillas.length - 1 ? [4, 4, 0, 0] : 0}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
