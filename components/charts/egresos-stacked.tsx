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

type Row = {
  mes: string;
  impuestos: number;
  planesPago: number;
  costosFijos: number;
  costosVariables: number;
};

export function EgresosStacked({ data }: { data: Row[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Egresos proyectados (12 meses)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
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
                tickFormatter={fmtARS}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                width={100}
              />
              <Tooltip
                formatter={(v) => fmtARS(Number(v))}
                labelFormatter={(l) => fmtMes(String(l))}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="impuestos" name="Impuestos" stackId="e" fill="var(--color-destructive)" />
              <Bar dataKey="planesPago" name="Planes de Pago" stackId="e" fill="var(--color-warning)" />
              <Bar dataKey="costosFijos" name="Costos Fijos" stackId="e" fill="var(--color-primary)" />
              <Bar dataKey="costosVariables" name="Costos Variables" stackId="e" fill="var(--color-success)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
