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
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Obras</h1>
        <p className="text-sm text-muted-foreground">
          {obras.length} frentes con actividad. Click en una fila para ver el detalle.
        </p>
      </div>

      <Input
        placeholder="Buscar obra..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-xs"
      />

      <div className="rounded-md border overflow-x-auto">
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
                <TableCell className="font-medium">{o.frente}</TableCell>
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

      <ObraDrawer frente={selected} rdos={rdos} onClose={() => setSelected(null)} />
    </div>
  );
}
