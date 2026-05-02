"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { fmtARS, fmtFecha } from "@/lib/formatters";

type Punto = { vigenciaDesde: string; precio: number };

export function PriceHistoryChart({ data }: { data: Punto[] }) {
  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="vigenciaDesde"
            tickFormatter={(v) => fmtFecha(String(v))}
            stroke="var(--color-muted-foreground)"
            fontSize={12}
          />
          <YAxis
            tickFormatter={fmtARS}
            stroke="var(--color-muted-foreground)"
            fontSize={11}
            width={90}
          />
          <Tooltip
            formatter={(v) => fmtARS(Number(v))}
            labelFormatter={(l) => fmtFecha(String(l))}
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="stepAfter"
            dataKey="precio"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
