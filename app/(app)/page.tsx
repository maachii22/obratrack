"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { resumenMensual, statsPorCuadrilla, statsPorObra } from "@/lib/calc";
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
import { Hammer, DollarSign, Building2, Wallet, Trophy } from "lucide-react";

const ObrasMap = dynamic(
  () => import("@/components/obras-map").then((m) => m.ObrasMap),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardContent className="h-[420px] animate-pulse bg-muted/30" />
      </Card>
    ),
  }
);

export default function DashboardPage() {
  const { rdos, preciosCuadrilla, preciosMaterial, egresos } = useStore();
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

  const resumen = useMemo(() => resumenMensual(rdos, pc, pm), [rdos, pc, pm]);
  const resumenMesActual = resumen.find((r) => r.mes === mes);
  const idx = resumen.findIndex((r) => r.mes === mes);
  const resumenMesAnterior = idx > 0 ? resumen[idx - 1] : undefined;

  const obrasActivas = useMemo(() => {
    const f = rdos.filter((r) => r.fecha.startsWith(mes));
    return new Set(f.map((r) => r.frente)).size;
  }, [rdos, mes]);

  const egresoMes = egresos.find((e) => e.mes === mes);
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
      <header className="flex flex-wrap items-end justify-between gap-3 pb-2 border-b">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
            Vista general · {fmtMes(mes)}
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Dashboard
          </h1>
        </div>
        <Select value={mes} onValueChange={(v) => v && setMes(v)}>
          <SelectTrigger className="w-[200px] h-10">
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
      </header>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Hammer}
          label="M² ejecutados"
          value={fmtM2(resumenMesActual?.m2 ?? 0)}
          delta={
            resumenMesAnterior
              ? { pct: m2DeltaPct, label: "vs mes anterior" }
              : undefined
          }
          accent="primary"
        />
        <KpiCard
          icon={DollarSign}
          label="Costo / m² promedio"
          value={fmtARS(resumenMesActual?.costoM2 ?? 0)}
          hint={`${resumenMesActual?.rdos ?? 0} reportes este mes`}
          accent="success"
        />
        <KpiCard
          icon={Building2}
          label="Obras activas"
          value={obrasActivas.toString()}
          hint="frentes únicos"
          accent="warning"
        />
        <KpiCard
          icon={Wallet}
          label="Egresos del mes"
          value={fmtARS(totalEgreso)}
          hint="impuestos + fijos + planes"
          accent="destructive"
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ObrasMap rdos={rdos} mes={mes} />
        </div>
        <CostoM2Trend data={resumen} />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <M2CuadrillaBars
            data={cuadrillasDataChart}
            cuadrillas={["Adrian", "Mario", "Tyson", "Matias"]}
          />
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <div className="h-8 w-8 rounded-md bg-warning/10 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-warning" />
            </div>
            <div>
              <CardTitle className="text-base leading-tight">Top obras del mes</CardTitle>
              <p className="text-xs text-muted-foreground">Por costo total</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {top3.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Sin obras este mes.
              </p>
            )}
            {top3.map((o, i) => (
              <div
                key={o.frente}
                className="flex items-start gap-3 py-3 border-b last:border-0 group"
              >
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                    i === 0
                      ? "bg-warning/15 text-warning"
                      : i === 1
                      ? "bg-muted text-muted-foreground"
                      : "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{o.frente}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
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
