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
import { ImageOff } from "lucide-react";

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

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto p-6">
        <SheetHeader className="px-0">
          <SheetTitle>{frente}</SheetTitle>
          <SheetDescription>
            Detalle de obra: timeline de RDOs y materiales acumulados.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-4">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">M² totales</p>
              <p className="font-semibold tabular-nums">{fmtM2(m2Total)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Días</p>
              <p className="font-semibold tabular-nums">{obraRdos.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Costo total</p>
              <p className="font-semibold tabular-nums">{fmtARS(costoTotal)}</p>
            </div>
          </div>

          <div className="aspect-video rounded-md border-2 border-dashed flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
            <ImageOff className="h-8 w-8" />
            <span>Foto de obra (placeholder)</span>
            <span className="text-[10px]">En la versión completa, foto desde el celular</span>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Materiales acumulados</p>
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
            <p className="text-sm font-medium mb-2">Timeline de RDOs</p>
            <div className="space-y-2">
              {obraRdos.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between text-sm border-l-2 border-primary pl-3 py-1"
                >
                  <div>
                    <p className="font-medium">
                      {fmtFecha(r.fecha)}
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        {r.cuadrilla}
                      </Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.trabajo} · {fmtM2(r.m2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
