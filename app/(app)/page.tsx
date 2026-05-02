"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { resumenMensual, statsPorCuadrilla, statsPorObra } from "@/lib/calc";
import preciosCuadrilla from "@/data/precios-cuadrilla.json";
import preciosMaterial from "@/data/precios-material.json";
import egresos from "@/data/egresos.json";
import { KpiCard } from "@/components/kpi-card";
import { CostoM2Trend } from "@/components/charts/costo-m2-trend";
import { M2CuadrillaBars } from "@/components/charts/m2-cuadrilla-bars";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtARS, fmtM2, fmtMes, mesActual } from "@/lib/formatters";
import type {
  PrecioCuadrilla,
  PrecioMaterial,
  EgresoMensual,
} from "@/lib/types";

const ObrasMap = dynamic(
  () => import("@/components/obras-map").then((m) => m.ObrasMap),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardContent className="h-[400px] animate-pulse" />
      </Card>
    ),
  }
);

export default function DashboardPage() {
  const { rdos } = useStore();
  const [mes, setMes] = useState<string>(() => {
    const meses = Array.from(new Set(rdos.map((r) => r.fecha.slice(0, 7))))
      .sort()
      .reverse();
    const actual = mesActual();
    return meses.includes(actual) ? actual : meses[0] ?? actual;
  });

  const pc = preciosCuadrilla as PrecioCuadrilla[];
  const pm = preciosMaterial as PrecioMaterial[];

  const meses = useMemo(() => {
    const s = new Set(rdos.map((r) => r.fecha.slice(0, 7)));
    return Array.from(s).sort().reverse();
  }, [rdos]);

  const resumen = useMemo(() => resumenMensual(rdos, pc, pm), [rdos, pc, pm]);
  const resumenMesActual = resumen.find((r) => r.mes === mes);
  const idx = resumen.findIndex((r) => r.mes === mes);
  const resumenMesAnterior = idx > 0 ? resumen[idx - 1] : undefined;

  const obrasActivas = useMemo(() => {
    const f = rdos.filter((r) => r.fecha.startsWith(mes));
    return new Set(f.map((r) => r.frente)).size;
  }, [rdos, mes]);

  const egresoMes = (egresos as EgresoMensual[]).find((e) => e.mes === mes);
  const totalEgreso = egresoMes
    ? [
        ...egresoMes.impuestos,
        ...egresoMes.planesPago,
        ...egresoMes.costosFijos,
      ].reduce((s, l) => s + l.monto, 0)
    : 0;

  const m2DeltaPct =
    resumenMesAnterior && resumenMesAnterior.m2 > 0 && resumenMesActual
      ? (resumenMesActual.m2 - resumenMesAnterior.m2) / resumenMesAnterior.m2
      : 0;

  const cuadrillasDataChart = useMemo(() => {
    const meses6 = resumen.slice(-6);
    const cuadrillas = ["Adrian", "Mario", "Tyson", "Matias"];
    return meses6.map((r) => {
      const stats = statsPorCuadrilla(rdos, r.mes, pc, pm);
      const row: { mes: string } & Record<string, string | number> = { mes: r.mes };
      for (const c of cuadrillas) row[c] = stats.find((s) => s.cuadrilla === c)?.m2 ?? 0;
      return row;
    });
  }, [rdos, pc, pm, resumen]);

  const top3 = useMemo(() => {
    const obras = statsPorObra(
      rdos.filter((r) => r.fecha.startsWith(mes)),
      pc,
      pm
    );
    return obras.sort((a, b) => b.costoTotal - a.costoTotal).slice(0, 3);
  }, [rdos, pc, pm, mes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Vista general de la operación · {fmtMes(mes)}
          </p>
        </div>
        <Select value={mes} onValueChange={(v) => v && setMes(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
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
        <KpiCard
          label="M² ejecutados"
          value={fmtM2(resumenMesActual?.m2 ?? 0)}
          delta={
            resumenMesAnterior
              ? { pct: m2DeltaPct, label: "vs mes anterior" }
              : undefined
          }
        />
        <KpiCard
          label="Costo / m² promedio"
          value={fmtARS(resumenMesActual?.costoM2 ?? 0)}
          hint={`${resumenMesActual?.rdos ?? 0} reportes este mes`}
        />
        <KpiCard
          label="Obras activas"
          value={obrasActivas.toString()}
          hint="frentes únicos"
        />
        <KpiCard
          label="Egresos del mes"
          value={fmtARS(totalEgreso)}
          hint="impuestos + fijos + planes"
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ObrasMap rdos={rdos} mes={mes} />
        <CostoM2Trend data={resumen} />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <M2CuadrillaBars
          data={cuadrillasDataChart}
          cuadrillas={["Adrian", "Mario", "Tyson", "Matias"]}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 3 obras del mes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {top3.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin obras este mes.</p>
            )}
            {top3.map((o, i) => (
              <div
                key={o.frente}
                className="flex items-start gap-3 py-2 border-b last:border-0"
              >
                <span className="text-2xl font-semibold text-muted-foreground tabular-nums w-8">
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{o.frente}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {fmtM2(o.m2)} · {o.rdos} días · {o.cuadrillas.join(", ")}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {fmtARS(o.costoTotal)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
