"use client";

import { useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmtARS, fmtMes, mesActual } from "@/lib/formatters";
import { EgresosStacked } from "@/components/charts/egresos-stacked";
import { KpiCard } from "@/components/kpi-card";
import { useStore } from "@/lib/store";
import type { EgresoMensual, EgresoLinea } from "@/lib/types";
import { Wallet, CalendarClock, AlertTriangle, Pencil } from "lucide-react";
import { toast } from "sonner";

function totalDe(e: EgresoMensual): number {
  return (
    [...e.impuestos, ...e.planesPago, ...e.costosFijos].reduce(
      (s, l) => s + l.monto,
      0
    ) + e.costosVariablesEstimados
  );
}

function EditarLineaDialog({
  mes,
  bucket,
  index,
  linea,
}: {
  mes: string;
  bucket: "impuestos" | "planesPago" | "costosFijos";
  index: number;
  linea: EgresoLinea;
}) {
  const { updateEgresoLinea } = useStore();
  const [open, setOpen] = useState(false);
  const [concepto, setConcepto] = useState(linea.concepto);
  const [monto, setMonto] = useState(linea.monto);
  const [vencimiento, setVencimiento] = useState(linea.vencimiento ?? "");

  const submit = () => {
    if (monto < 0) {
      toast.error("El monto no puede ser negativo.");
      return;
    }
    updateEgresoLinea(mes, bucket, index, {
      concepto: concepto.trim() || linea.concepto,
      monto,
      vencimiento: vencimiento.trim() || null,
    });
    toast.success("Línea actualizada", {
      description: "Demo: cambios en memoria.",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <Pencil className="h-3 w-3" />
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar concepto</DialogTitle>
          <DialogDescription>
            {fmtMes(mes)} · {bucket === "impuestos" ? "impuesto" : bucket === "planesPago" ? "plan de pago" : "costo fijo"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="concepto">Concepto</Label>
            <Input
              id="concepto"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="monto">Monto (ARS)</Label>
              <Input
                id="monto"
                type="number"
                min={0}
                step={1000}
                value={monto}
                onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venc">Vencimiento</Label>
              <Input
                id="venc"
                value={vencimiento}
                placeholder="ej. 13/mes"
                onChange={(e) => setVencimiento(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={submit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FinanzasPage() {
  const { egresos } = useStore();
  const mes = mesActual();
  const egMes = egresos.find((e) => e.mes === mes);

  const proximos30 = useMemo(() => {
    const idx = egresos.findIndex((e) => e.mes === mes);
    return idx >= 0 && idx + 1 < egresos.length ? totalDe(egresos[idx + 1]) : 0;
  }, [mes, egresos]);

  const granVencimiento = useMemo(() => {
    const lineas = egresos
      .filter((e) => e.mes >= mes)
      .flatMap((e) =>
        [...e.impuestos, ...e.planesPago].map((l) => ({ ...l, mes: e.mes }))
      )
      .sort((a, b) => b.monto - a.monto);
    return lineas[0];
  }, [mes, egresos]);

  const chartData = useMemo(
    () =>
      egresos.map((e) => ({
        mes: e.mes,
        impuestos: e.impuestos.reduce((s, l) => s + l.monto, 0),
        planesPago: e.planesPago.reduce((s, l) => s + l.monto, 0),
        costosFijos: e.costosFijos.reduce((s, l) => s + l.monto, 0),
        costosVariables: e.costosVariablesEstimados,
      })),
    [egresos]
  );

  const totalMes = egMes ? totalDe(egMes) : 0;

  // Lineas detalladas del mes seleccionable
  const [mesDetalle, setMesDetalle] = useState<string>(mes);
  const egDetalle = egresos.find((e) => e.mes === mesDetalle);

  const allMeses = egresos.map((e) => e.mes);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 pb-2 border-b">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
            Cash flow proyectado · 12 meses
          </p>
          <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">Finanzas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Impuestos + planes de pago + costos fijos + variables.
          </p>
        </div>
      </header>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <KpiCard
          icon={Wallet}
          label="Egresos del mes"
          value={fmtARS(totalMes)}
          hint={fmtMes(mes)}
          accent="primary"
        />
        <KpiCard
          icon={CalendarClock}
          label="Próximos 30 días"
          value={fmtARS(proximos30)}
          hint="mes siguiente"
          accent="warning"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Próximo gran vencimiento"
          value={granVencimiento ? fmtARS(granVencimiento.monto) : "—"}
          hint={
            granVencimiento
              ? `${granVencimiento.concepto} · ${fmtMes(granVencimiento.mes)}`
              : ""
          }
          accent="destructive"
        />
      </div>

      <EgresosStacked data={chartData} />

      <Tabs defaultValue="tabla">
        <TabsList className="w-full justify-stretch sm:w-auto sm:justify-center">
          <TabsTrigger value="tabla" className="flex-1 sm:flex-initial">
            <span className="hidden sm:inline">Resumen mensual</span>
            <span className="sm:hidden">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="detalle" className="flex-1 sm:flex-initial">
            <span className="hidden sm:inline">Detalle por concepto</span>
            <span className="sm:hidden">Detalle</span>
          </TabsTrigger>
          <TabsTrigger value="vencimientos" className="flex-1 sm:flex-initial">
            <span className="hidden sm:inline">Próximos vencimientos</span>
            <span className="sm:hidden">Vencimientos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tabla" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Egresos por categoría</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
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
                    {egresos.map((e) => {
                      const i = e.impuestos.reduce((s, l) => s + l.monto, 0);
                      const p = e.planesPago.reduce((s, l) => s + l.monto, 0);
                      const f = e.costosFijos.reduce((s, l) => s + l.monto, 0);
                      const v = e.costosVariablesEstimados;
                      return (
                        <TableRow
                          key={e.mes}
                          className={`cursor-pointer ${
                            e.mes === mes ? "bg-primary/5" : ""
                          } ${e.mes === mesDetalle ? "ring-1 ring-primary/30" : ""}`}
                          onClick={() => setMesDetalle(e.mes)}
                        >
                          <TableCell className="font-medium">{fmtMes(e.mes)}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {i > 0 ? fmtARS(i) : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {p > 0 ? fmtARS(p) : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fmtARS(f)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {v > 0 ? fmtARS(v) : <span className="text-muted-foreground">—</span>}
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

              {/* Mobile cards */}
              <div className="md:hidden space-y-2">
                {egresos.map((e) => {
                  const i = e.impuestos.reduce((s, l) => s + l.monto, 0);
                  const p = e.planesPago.reduce((s, l) => s + l.monto, 0);
                  const f = e.costosFijos.reduce((s, l) => s + l.monto, 0);
                  const v = e.costosVariablesEstimados;
                  const total = i + p + f + v;
                  const isCurrent = e.mes === mes;
                  const isSelected = e.mes === mesDetalle;
                  return (
                    <button
                      key={e.mes}
                      onClick={() => setMesDetalle(e.mes)}
                      className={`w-full text-left rounded-lg border p-3 transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "bg-card active:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-baseline justify-between mb-2">
                        <p className="font-semibold">
                          {fmtMes(e.mes)}
                          {isCurrent && (
                            <Badge variant="outline" className="ml-2 text-[10px]">
                              actual
                            </Badge>
                          )}
                        </p>
                        <span className="tabular-nums font-semibold">
                          {fmtARS(total)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Impuestos</span>
                          <span className="tabular-nums">{i > 0 ? fmtARS(i) : "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Planes</span>
                          <span className="tabular-nums">{p > 0 ? fmtARS(p) : "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fijos</span>
                          <span className="tabular-nums">{fmtARS(f)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Variables</span>
                          <span className="tabular-nums">{v > 0 ? fmtARS(v) : "—"}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                Tocá un mes para ver el detalle por concepto y editar líneas.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detalle" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
              <div>
                <CardTitle className="text-base">
                  Detalle · {fmtMes(mesDetalle)}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Tocá el lápiz para editar concepto, monto o vencimiento.
                </p>
              </div>
              <Select value={mesDetalle} onValueChange={(v) => v && setMesDetalle(v)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue>{(v) => fmtMes(v as string)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {allMeses.map((m) => (
                    <SelectItem key={m} value={m}>
                      {fmtMes(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-5">
              {!egDetalle && (
                <p className="text-sm text-muted-foreground">
                  No hay datos para este mes.
                </p>
              )}
              {egDetalle &&
                (
                  [
                    { key: "impuestos", title: "Impuestos", color: "text-destructive" },
                    { key: "planesPago", title: "Planes de Pago", color: "text-warning" },
                    { key: "costosFijos", title: "Costos Fijos", color: "text-primary" },
                  ] as const
                ).map(({ key, title, color }) => {
                  const items = egDetalle[key];
                  if (!items?.length) return null;
                  return (
                    <div key={key}>
                      <h3 className={`text-sm font-semibold mb-2 ${color}`}>{title}</h3>
                      <div className="space-y-1">
                        {items.map((l, idx) => (
                          <div
                            key={`${l.concepto}-${idx}`}
                            className="flex items-center gap-3 px-3 py-2 rounded-md border bg-card hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{l.concepto}</p>
                              {l.vencimiento && (
                                <p className="text-xs text-muted-foreground">
                                  Vence {l.vencimiento}
                                </p>
                              )}
                            </div>
                            <span className="text-sm font-semibold tabular-nums">
                              {fmtARS(l.monto)}
                            </span>
                            <EditarLineaDialog
                              mes={egDetalle.mes}
                              bucket={key}
                              index={idx}
                              linea={l}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vencimientos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Próximos vencimientos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {egresos
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
