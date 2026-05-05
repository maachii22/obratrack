"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { statsPorObra } from "@/lib/calc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fmtFecha, fmtM2, fmtARS } from "@/lib/formatters";
import { ObraDrawer } from "@/components/obra-drawer";
export default function ObrasPage() {
  const { rdos, preciosCuadrilla, preciosMaterial } = useStore();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const obras = useMemo(() => {
    return statsPorObra(rdos, preciosCuadrilla, preciosMaterial)
      .filter((o) => (q ? o.frente.toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => b.ultimoDia.localeCompare(a.ultimoDia));
  }, [rdos, q, preciosCuadrilla, preciosMaterial]);

  return (
    <div className="space-y-5">
      <div className="pb-2 border-b">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
          Catálogo · obras con actividad
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Obras</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {obras.length} frentes con actividad. Tocá una fila para ver el detalle.
        </p>
      </div>

      <Input
        placeholder="Buscar obra..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full sm:max-w-xs"
      />

      {obras.length === 0 && (
        <div className="rounded-lg border bg-card h-32 flex items-center justify-center text-sm text-muted-foreground">
          No hay obras que coincidan con la búsqueda.
        </div>
      )}

      {/* Desktop / tablet view */}
      {obras.length > 0 && (
        <div className="hidden md:block rounded-md border overflow-x-auto bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Frente</TableHead>
                <TableHead>Cuadrillas</TableHead>
                <TableHead className="text-right">Días</TableHead>
                <TableHead className="text-right">M² totales</TableHead>
                <TableHead className="text-right">Costo total</TableHead>
                <TableHead>Último día</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obras.map((o) => (
                <TableRow
                  key={o.frente}
                  className="cursor-pointer"
                  onClick={() => setSelected(o.frente)}
                >
                  <TableCell className="font-medium max-w-[260px] truncate" title={o.frente}>
                    {o.frente}
                  </TableCell>
                  <TableCell className="space-x-1">
                    {o.cuadrillas.slice(0, 3).map((c) => (
                      <Badge key={c} variant="outline" className="text-[10px]">
                        {c}
                      </Badge>
                    ))}
                    {o.cuadrillas.length > 3 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{o.cuadrillas.length - 3}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{o.rdos}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtM2(o.m2)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtARS(o.costoTotal)}</TableCell>
                  <TableCell className="tabular-nums">{fmtFecha(o.ultimoDia)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Mobile card list */}
      {obras.length > 0 && (
        <div className="md:hidden space-y-2">
          {obras.map((o) => (
            <div
              key={o.frente}
              className="rounded-lg border bg-card p-3 active:bg-muted/40 cursor-pointer"
              onClick={() => setSelected(o.frente)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate" title={o.frente}>
                    {o.frente}
                  </p>
                  <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                    Último día: {fmtFecha(o.ultimoDia)} · {o.rdos} RDOs
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold tabular-nums leading-tight">
                    {fmtM2(o.m2)}
                  </p>
                  <p className="text-[11px] tabular-nums text-muted-foreground mt-0.5">
                    {fmtARS(o.costoTotal)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t">
                {o.cuadrillas.slice(0, 4).map((c) => (
                  <Badge key={c} variant="outline" className="text-[10px]">
                    {c}
                  </Badge>
                ))}
                {o.cuadrillas.length > 4 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{o.cuadrillas.length - 4}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ObraDrawer frente={selected} rdos={rdos} onClose={() => setSelected(null)} />
    </div>
  );
}
