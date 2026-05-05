"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { fmtFecha, fmtM2, fmtARS } from "@/lib/formatters";
import { costoRDO } from "@/lib/calc";
import type { RDO, Materiales } from "@/lib/types";
import { MATERIALES_KEYS } from "@/lib/types";
import { useStore } from "@/lib/store";

type Props = {
  frente: string | null;
  rdos: RDO[];
  onClose: () => void;
};

const emptyMats = (): Materiales => ({
  caños: 0,
  bolson: 0,
  volquetes: 0,
  palletBaldosas: 0,
  arena: 0,
  cal: 0,
  cemento: 0,
  mlPlantera: 0,
  protectorPluvial: 0,
  tapasCamaraPluvial: 0,
  cordon: 0,
});

export function ObraDrawer({ frente, rdos, onClose }: Props) {
  const { preciosCuadrilla, preciosMaterial } = useStore();
  const open = !!frente;
  const obraRdos = rdos
    .filter((r) => r.frente === frente)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const m2Total = obraRdos.reduce((s, r) => s + r.m2, 0);
  const costoTotal = obraRdos.reduce(
    (s, r) => s + costoRDO(r, preciosCuadrilla, preciosMaterial).total,
    0
  );
  const matsTotal = MATERIALES_KEYS.reduce((acc, k) => {
    acc[k] = obraRdos.reduce((s, r) => s + (r.materiales[k] ?? 0), 0);
    return acc;
  }, emptyMats());

  const m2PorDia = obraRdos.length > 0 ? m2Total / obraRdos.length : 0;
  const costoM2 = m2Total > 0 ? costoTotal / m2Total : 0;
  const primerDia = obraRdos[obraRdos.length - 1]?.fecha;
  const ultimoDia = obraRdos[0]?.fecha;
  const cuadrillasUnicas = Array.from(new Set(obraRdos.map((r) => r.cuadrilla)));

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-5 sm:p-6">
        <SheetHeader className="px-0">
          <SheetTitle className="text-base sm:text-lg leading-tight pr-8">
            {frente}
          </SheetTitle>
          <SheetDescription>
            Timeline · materiales · costos por m²
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-4">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-md bg-muted/40 px-2 py-2 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">M²</p>
              <p className="font-semibold tabular-nums text-[13px] sm:text-base whitespace-nowrap">{fmtM2(m2Total)}</p>
            </div>
            <div className="rounded-md bg-muted/40 px-2 py-2 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Días</p>
              <p className="font-semibold tabular-nums text-[13px] sm:text-base">{obraRdos.length}</p>
            </div>
            <div className="rounded-md bg-muted/40 px-2 py-2 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Costo</p>
              <p className="font-semibold tabular-nums text-[13px] sm:text-base whitespace-nowrap">{fmtARS(costoTotal)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between rounded-md border px-2.5 py-1.5">
              <span className="text-muted-foreground">M² / día</span>
              <span className="tabular-nums font-medium">{m2PorDia.toFixed(1)}</span>
            </div>
            <div className="flex justify-between rounded-md border px-2.5 py-1.5">
              <span className="text-muted-foreground">Costo / m²</span>
              <span className="tabular-nums font-medium">{fmtARS(costoM2)}</span>
            </div>
            {primerDia && (
              <div className="flex justify-between rounded-md border px-2.5 py-1.5">
                <span className="text-muted-foreground">Inicio</span>
                <span className="tabular-nums font-medium">{fmtFecha(primerDia)}</span>
              </div>
            )}
            {ultimoDia && (
              <div className="flex justify-between rounded-md border px-2.5 py-1.5">
                <span className="text-muted-foreground">Último día</span>
                <span className="tabular-nums font-medium">{fmtFecha(ultimoDia)}</span>
              </div>
            )}
          </div>

          {cuadrillasUnicas.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                Cuadrillas asignadas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {cuadrillasUnicas.map((c) => (
                  <Badge key={c} variant="outline">{c}</Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
              Materiales acumulados
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {Object.entries(matsTotal)
                .filter(([, v]) => v > 0)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b py-1">
                    <span className="text-muted-foreground capitalize">{k}</span>
                    <span className="font-medium tabular-nums">{v.toFixed(1)}</span>
                  </div>
                ))}
              {Object.values(matsTotal).every((v) => v === 0) && (
                <span className="text-muted-foreground col-span-2">
                  Sin materiales registrados
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
              Timeline · {obraRdos.length} RDOs
            </p>
            <div className="space-y-2">
              {obraRdos.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between gap-3 text-sm border-l-2 border-primary pl-3 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium tabular-nums">{fmtFecha(r.fecha)}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {r.cuadrilla}
                      </Badge>
                      <Badge
                        variant={r.trabajo === "Baldosas" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {r.trabajo}
                      </Badge>
                    </div>
                    {r.notas && (
                      <p className="text-xs text-muted-foreground italic mt-0.5">
                        {r.notas}
                      </p>
                    )}
                  </div>
                  <span className="text-sm tabular-nums font-medium shrink-0">
                    {fmtM2(r.m2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
