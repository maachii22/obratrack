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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Resumen mensual</h1>
          <p className="text-sm text-muted-foreground">
            Agregaciones por mes calculadas en vivo desde los RDOs.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            toast.info("Exportar PDF — disponible en la versión completa")
          }
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      <Card>
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
