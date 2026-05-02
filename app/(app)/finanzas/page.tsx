"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fmtARS, fmtMes, mesActual } from "@/lib/formatters";
import { EgresosStacked } from "@/components/charts/egresos-stacked";
import { KpiCard } from "@/components/kpi-card";
import egresos from "@/data/egresos.json";
import type { EgresoMensual, EgresoLinea } from "@/lib/types";

const eg = egresos as EgresoMensual[];

function totalDe(e: EgresoMensual): number {
  return (
    [...e.impuestos, ...e.planesPago, ...e.costosFijos].reduce(
      (s, l) => s + l.monto,
      0
    ) + e.costosVariablesEstimados
  );
}

export default function FinanzasPage() {
  const mes = mesActual();
  const egMes = eg.find((e) => e.mes === mes);

  const proximos30 = useMemo(() => {
    const idx = eg.findIndex((e) => e.mes === mes);
    return idx >= 0 && idx + 1 < eg.length ? totalDe(eg[idx + 1]) : 0;
  }, [mes]);

  const granVencimiento = useMemo(() => {
    const lineas = eg
      .filter((e) => e.mes >= mes)
      .flatMap((e) =>
        [...e.impuestos, ...e.planesPago].map((l) => ({ ...l, mes: e.mes }))
      )
      .sort((a, b) => b.monto - a.monto);
    return lineas[0];
  }, [mes]);

  const chartData = useMemo(
    () =>
      eg.map((e) => ({
        mes: e.mes,
        impuestos: e.impuestos.reduce((s, l) => s + l.monto, 0),
        planesPago: e.planesPago.reduce((s, l) => s + l.monto, 0),
        costosFijos: e.costosFijos.reduce((s, l) => s + l.monto, 0),
        costosVariables: e.costosVariablesEstimados,
      })),
    []
  );

  const totalMes = egMes ? totalDe(egMes) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Finanzas</h1>
        <p className="text-sm text-muted-foreground">Cash flow proyectado · 12 meses</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <KpiCard label="Egresos del mes" value={fmtARS(totalMes)} hint={fmtMes(mes)} />
        <KpiCard
          label="Próximos 30 días"
          value={fmtARS(proximos30)}
          hint="mes siguiente"
        />
        <KpiCard
          label="Próximo gran vencimiento"
          value={granVencimiento ? fmtARS(granVencimiento.monto) : "—"}
          hint={
            granVencimiento
              ? `${granVencimiento.concepto} · ${fmtMes(granVencimiento.mes)}`
              : ""
          }
        />
      </div>

      <EgresosStacked data={chartData} />

      <Tabs defaultValue="tabla">
        <TabsList>
          <TabsTrigger value="tabla">Tabla mensual</TabsTrigger>
          <TabsTrigger value="vencimientos">Vencimientos</TabsTrigger>
        </TabsList>

        <TabsContent value="tabla" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Egresos por categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mes</TableHead>
                      <TableHead className="text-right">Impuestos</TableHead>
                      <TableHead className="text-right">Planes de Pago</TableHead>
                      <TableHead className="text-right">Costos Fijos</TableHead>
                      <TableHead className="text-right">Variables</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eg.map((e) => {
                      const i = e.impuestos.reduce((s, l) => s + l.monto, 0);
                      const p = e.planesPago.reduce((s, l) => s + l.monto, 0);
                      const f = e.costosFijos.reduce((s, l) => s + l.monto, 0);
                      const v = e.costosVariablesEstimados;
                      return (
                        <TableRow
                          key={e.mes}
                          className={e.mes === mes ? "bg-primary/5" : ""}
                        >
                          <TableCell className="font-medium">{fmtMes(e.mes)}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fmtARS(i)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fmtARS(p)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fmtARS(f)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fmtARS(v)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">
                            {fmtARS(i + p + f + v)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vencimientos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Próximos vencimientos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {eg
                .filter((e) => e.mes >= mes)
                .slice(0, 6)
                .flatMap((e) =>
                  [...e.impuestos, ...e.planesPago].map((l: EgresoLinea) => ({
                    ...l,
                    mes: e.mes,
                  }))
                )
                .sort((a, b) => a.mes.localeCompare(b.mes))
                .map((l, i) => (
                  <div
                    key={`${l.mes}-${l.concepto}-${i}`}
                    className="flex items-center justify-between border-b pb-2 last:border-0 text-sm"
                  >
                    <div>
                      <p className="font-medium">{l.concepto}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtMes(l.mes)}
                        {l.vencimiento ? ` · vence ${l.vencimiento}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className="tabular-nums">
                      {fmtARS(l.monto)}
                    </Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
