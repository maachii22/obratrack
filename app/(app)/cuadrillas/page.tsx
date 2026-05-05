"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { statsPorCuadrilla, resumenMensual } from "@/lib/calc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmtARS, fmtM2, fmtMes, mesActual } from "@/lib/formatters";
import { M2CuadrillaBars } from "@/components/charts/m2-cuadrilla-bars";
import { CUADRILLAS } from "@/lib/types";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function CuadrillasPage() {
  const { rdos, preciosCuadrilla, preciosMaterial } = useStore();
  const meses = useMemo(() => {
    const s = new Set(rdos.map((r) => r.fecha.slice(0, 7)));
    return Array.from(s).sort().reverse();
  }, [rdos]);

  const [mes, setMes] = useState<string>(() => {
    const actual = mesActual();
    return meses.includes(actual) ? actual : meses[0] ?? actual;
  });

  const pc = preciosCuadrilla;
  const pm = preciosMaterial;

  const stats = useMemo(() => statsPorCuadrilla(rdos, mes, pc, pm), [rdos, mes, pc, pm]);

  const idxMesAnt = meses.indexOf(mes) + 1;
  const mesAnterior = meses[idxMesAnt];
  const statsAnt = useMemo(
    () => (mesAnterior ? statsPorCuadrilla(rdos, mesAnterior, pc, pm) : []),
    [rdos, mesAnterior, pc, pm]
  );

  const meses6 = useMemo(
    () => resumenMensual(rdos, pc, pm).slice(-6).map((r) => r.mes),
    [rdos, pc, pm]
  );

  const tablaRows = useMemo(() => {
    return CUADRILLAS.map((c) => {
      const row: { cuadrilla: string } & Record<string, number | string> = { cuadrilla: c };
      for (const m of meses6) {
        const s = statsPorCuadrilla(rdos, m, pc, pm).find((x) => x.cuadrilla === c);
        row[m] = s?.costoM2 ?? 0;
      }
      return row;
    });
  }, [rdos, pc, pm, meses6]);

  const chartData = useMemo(() => {
    return meses6.map((m) => {
      const s = statsPorCuadrilla(rdos, m, pc, pm);
      const row: { mes: string } & Record<string, number | string> = { mes: m };
      for (const c of CUADRILLAS) row[c] = s.find((x) => x.cuadrilla === c)?.m2 ?? 0;
      return row;
    });
  }, [rdos, pc, pm, meses6]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pb-2 border-b">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
            Productividad · {fmtMes(mes)}
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Cuadrillas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comparativa de m²/día y costo/m² mes a mes.
          </p>
        </div>
        <Select value={mes} onValueChange={(v) => v && setMes(v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue>{(v) => fmtMes(v as string)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {meses.map((m) => (
              <SelectItem key={m} value={m}>
                {fmtMes(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {CUADRILLAS.map((c) => {
          const s = stats.find((x) => x.cuadrilla === c);
          const sa = statsAnt.find((x) => x.cuadrilla === c);
          const delta = s && sa && sa.costoM2 > 0 ? (s.costoM2 - sa.costoM2) / sa.costoM2 : 0;
          const TrendIcon = delta < 0 ? TrendingDown : TrendingUp;
          const trendColor =
            delta < 0
              ? "text-success"
              : delta > 0
              ? "text-destructive"
              : "text-muted-foreground";
          return (
            <Card key={c}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {c[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{c}</p>
                    <p className="text-xs text-muted-foreground">
                      {s?.rdos ?? 0} reportes
                    </p>
                  </div>
                </div>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">M² del mes</dt>
                    <dd className="tabular-nums">{fmtM2(s?.m2 ?? 0)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Costo / m²</dt>
                    <dd className="tabular-nums">{fmtARS(s?.costoM2 ?? 0)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">M² / día</dt>
                    <dd className="tabular-nums">{(s?.m2PorDia ?? 0).toFixed(1)}</dd>
                  </div>
                </dl>
                {sa && delta !== 0 && (
                  <p className={`flex items-center gap-1 text-xs mt-3 ${trendColor}`}>
                    <TrendIcon className="h-3 w-3" />
                    {Math.abs(delta * 100).toFixed(1)}% vs mes anterior
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <M2CuadrillaBars data={chartData} cuadrillas={CUADRILLAS as unknown as string[]} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Costo / m² por cuadrilla por mes</CardTitle>
          <p className="text-xs text-muted-foreground sm:hidden">Deslizá horizontal →</p>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10 min-w-[100px]">Cuadrilla</TableHead>
                  {meses6.map((m) => (
                    <TableHead key={m} className="text-right whitespace-nowrap">
                      {fmtMes(m)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tablaRows.map((row) => (
                  <TableRow key={row.cuadrilla as string}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10">
                      {row.cuadrilla}
                    </TableCell>
                    {meses6.map((m) => (
                      <TableCell key={m} className="text-right tabular-nums whitespace-nowrap">
                        {(row[m] as number) > 0 ? fmtARS(row[m] as number) : "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
