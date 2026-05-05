"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { resumenMensual } from "@/lib/calc";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fmtARS, fmtM2, fmtMes } from "@/lib/formatters";
import { Download } from "lucide-react";
import { toast } from "sonner";

function descargarCSV(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    )
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ResumenPage() {
  const { rdos, preciosCuadrilla, preciosMaterial } = useStore();
  const resumen = useMemo(
    () => resumenMensual(rdos, preciosCuadrilla, preciosMaterial),
    [rdos, preciosCuadrilla, preciosMaterial]
  );

  const promCostoM2 =
    resumen.length > 0
      ? resumen.reduce((s, r) => s + r.costoM2, 0) / resumen.length
      : 0;

  const totalM2 = resumen.reduce((s, r) => s + r.m2, 0);
  const totalCosto = resumen.reduce((s, r) => s + r.costoTotal, 0);

  const exportar = () => {
    const rows: string[][] = [
      ["Mes", "RDOs", "M2", "Costo MO", "Costo Materiales", "Costo Total", "Costo / m2"],
      ...resumen.map((r) => [
        fmtMes(r.mes),
        String(r.rdos),
        r.m2.toFixed(1),
        r.costoMO.toFixed(0),
        r.costoMateriales.toFixed(0),
        r.costoTotal.toFixed(0),
        r.costoM2.toFixed(0),
      ]),
      ["Total", "", totalM2.toFixed(1), "", "", totalCosto.toFixed(0), promCostoM2.toFixed(0)],
    ];
    descargarCSV(`obratrack-resumen-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success("CSV descargado", { description: "Abrilo en Excel o Google Sheets." });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pb-2 border-b">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
            Cierre · {resumen.length} meses
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Resumen mensual</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Agregaciones por mes calculadas en vivo desde los RDOs.
          </p>
        </div>
        <Button variant="outline" onClick={exportar} className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Descargar CSV
        </Button>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {resumen.map((r) => {
          const desviado = promCostoM2 > 0 && Math.abs(r.costoM2 - promCostoM2) > promCostoM2 * 0.2;
          return (
            <div key={r.mes} className="rounded-lg border bg-card p-3">
              <div className="flex items-baseline justify-between mb-2">
                <p className="font-semibold">{fmtMes(r.mes)}</p>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {r.rdos} RDOs
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">M²</span>
                  <span className="tabular-nums font-medium">{fmtM2(r.m2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Costo / m²</span>
                  <span
                    className={`tabular-nums font-medium ${
                      desviado ? "text-warning font-semibold" : ""
                    }`}
                  >
                    {fmtARS(r.costoM2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MO</span>
                  <span className="tabular-nums">{fmtARS(r.costoMO)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Materiales</span>
                  <span className="tabular-nums">{fmtARS(r.costoMateriales)}</span>
                </div>
                <div className="col-span-2 flex justify-between border-t pt-1.5 mt-0.5">
                  <span className="text-muted-foreground">Total</span>
                  <span className="tabular-nums font-semibold">{fmtARS(r.costoTotal)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div className="rounded-lg border-2 bg-muted/30 p-3">
          <div className="flex items-baseline justify-between mb-2">
            <p className="font-semibold uppercase text-xs tracking-wider">Total acumulado</p>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">M²</span>
              <span className="tabular-nums font-semibold">{fmtM2(totalM2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prom / m²</span>
              <span className="tabular-nums font-semibold">{fmtARS(promCostoM2)}</span>
            </div>
            <div className="col-span-2 flex justify-between border-t pt-1.5 mt-0.5">
              <span className="text-muted-foreground">Costo total</span>
              <span className="tabular-nums font-semibold">{fmtARS(totalCosto)}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground px-1">
          Costos / m² en ámbar se desvían más de ±20% del promedio ({fmtARS(promCostoM2)}).
        </p>
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="text-base">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">RDOs</TableHead>
                  <TableHead className="text-right">M²</TableHead>
                  <TableHead className="text-right">MO</TableHead>
                  <TableHead className="text-right">Materiales</TableHead>
                  <TableHead className="text-right">Costo total</TableHead>
                  <TableHead className="text-right">Costo / m²</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumen.map((r) => {
                  const desviado =
                    promCostoM2 > 0 &&
                    Math.abs(r.costoM2 - promCostoM2) > promCostoM2 * 0.2;
                  return (
                    <TableRow key={r.mes}>
                      <TableCell className="font-medium">{fmtMes(r.mes)}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.rdos}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtM2(r.m2)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtARS(r.costoMO)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtARS(r.costoMateriales)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {fmtARS(r.costoTotal)}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums ${
                          desviado ? "text-warning font-semibold" : ""
                        }`}
                      >
                        {fmtARS(r.costoM2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell />
                  <TableCell className="text-right tabular-nums font-semibold">
                    {fmtM2(totalM2)}
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right tabular-nums font-semibold">
                    {fmtARS(totalCosto)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {fmtARS(promCostoM2)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Costos / m² resaltados en ámbar son los que se desvían más de ±20% del
            promedio histórico ({fmtARS(promCostoM2)}).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
