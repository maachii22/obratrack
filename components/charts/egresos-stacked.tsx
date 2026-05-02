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
import { fmtARS, fmtMes } from "@/lib/formatters";
import { ChartTooltipContent } from "./chart-tooltip";
import { Wallet } from "lucide-react";

type Row = {
  mes: string;
  impuestos: number;
  planesPago: number;
  costosFijos: number;
  costosVariables: number;
};

type RTip = {
  active?: boolean;
  label?: unknown;
  payload?: { name?: string; value?: number; color?: string }[];
};
function Tip(p: RTip) {
  const items = (p.payload ?? [])
    .filter((d) => d.value && Number(d.value) > 0)
    .map((d) => ({
      name: d.name,
      value: Number(d.value),
      color: d.color,
    }));
  const total = items.reduce((s, it) => s + (it.value ?? 0), 0);
  return (
    <ChartTooltipContent
      active={!!p.active}
      label={
        <div className="flex items-center justify-between gap-4">
          <span>{fmtMes(String(p.label))}</span>
          <span className="text-xs font-bold tabular-nums">{fmtARS(total)}</span>
        </div>
      }
      items={items}
      formatValue={fmtARS}
    />
  );
}

export function EgresosStacked({ data }: { data: Row[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
          <Wallet className="h-4 w-4 text-primary" />
        </div>
        <div>
          <CardTitle className="text-base leading-tight">
            Egresos proyectados
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Próximos 12 meses por categoría
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }} barCategoryGap="18%">
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
                tickFormatter={fmtARS}
                stroke="var(--color-muted-foreground)"
                fontSize={10}
                width={100}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<Tip />} cursor={{ fill: "var(--color-muted)", opacity: 0.4 }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
              <Bar dataKey="impuestos" name="Impuestos" stackId="e" fill="var(--color-destructive)" />
              <Bar dataKey="planesPago" name="Planes de Pago" stackId="e" fill="var(--color-warning)" />
              <Bar dataKey="costosFijos" name="Costos Fijos" stackId="e" fill="var(--color-primary)" />
              <Bar dataKey="costosVariables" name="Variables" stackId="e" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
