"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { fmtFecha, fmtM2, fmtARS } from "@/lib/formatters";
import { costoRDO } from "@/lib/calc";
import type { RDO, PrecioCuadrilla, PrecioMaterial } from "@/lib/types";
import preciosC from "@/data/precios-cuadrilla.json";
import preciosM from "@/data/precios-material.json";

export function RdoTable({ rdos }: { rdos: RDO[] }) {
  const [q, setQ] = useState("");
  const [cuadrilla, setCuadrilla] = useState<string>("all");
  const [trabajo, setTrabajo] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const cuadrillas = useMemo(() => {
    const s = new Set(rdos.map((r) => r.cuadrilla.split("/")[0].trim()));
    return Array.from(s).filter(Boolean).sort();
  }, [rdos]);

  const filtered = useMemo(() => {
    return rdos
      .filter((r) => (q ? r.frente.toLowerCase().includes(q.toLowerCase()) : true))
      .filter((r) => (cuadrilla === "all" ? true : r.cuadrilla.startsWith(cuadrilla)))
      .filter((r) => (trabajo === "all" ? true : r.trabajo === trabajo))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [rdos, q, cuadrilla, trabajo]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Buscar por dirección..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select value={cuadrilla} onValueChange={(v) => v && setCuadrilla(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las cuadrillas</SelectItem>
            {cuadrillas.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={trabajo} onValueChange={(v) => v && setTrabajo(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo trabajo</SelectItem>
            <SelectItem value="Baldosas">Baldosas</SelectItem>
            <SelectItem value="Hormigon">Hormigón</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} reportes
        </span>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Fecha</TableHead>
              <TableHead>Frente</TableHead>
              <TableHead>Cuadrilla</TableHead>
              <TableHead className="text-right">M²</TableHead>
              <TableHead>Trabajo</TableHead>
              <TableHead className="text-right">Costo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => {
              const c = costoRDO(r, preciosC as PrecioCuadrilla[], preciosM as PrecioMaterial[]);
              const isOpen = expanded === r.id;
              return (
                <Fragment key={r.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                  >
                    <TableCell>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">{fmtFecha(r.fecha)}</TableCell>
                    <TableCell className="font-medium">{r.frente}</TableCell>
                    <TableCell>{r.cuadrilla}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtM2(r.m2)}</TableCell>
                    <TableCell>
                      <Badge variant={r.trabajo === "Baldosas" ? "default" : "secondary"}>
                        {r.trabajo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmtARS(c.total)}</TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell />
                      <TableCell colSpan={6}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs py-2">
                          {Object.entries(r.materiales)
                            .filter(([, v]) => v > 0)
                            .map(([k, v]) => (
                              <div key={k} className="flex justify-between">
                                <span className="text-muted-foreground">{k}</span>
                                <span className="font-medium tabular-nums">{v}</span>
                              </div>
                            ))}
                          {Object.values(r.materiales).every((v) => !v) && (
                            <span className="text-muted-foreground col-span-full">
                              Sin materiales registrados
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground border-t pt-2 mt-1">
                          MO:{" "}
                          <span className="text-foreground tabular-nums">{fmtARS(c.mo)}</span> ·
                          Materiales:{" "}
                          <span className="text-foreground tabular-nums">
                            {fmtARS(c.materiales)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
