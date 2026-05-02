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
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Search,
} from "lucide-react";
import { fmtFecha, fmtM2, fmtARS } from "@/lib/formatters";
import { costoRDO } from "@/lib/calc";
import type { RDO } from "@/lib/types";
import { useStore } from "@/lib/store";
import { RdoForm } from "@/components/rdo-form";
import { toast } from "sonner";

export function RdoTable({ rdos }: { rdos: RDO[] }) {
  const { preciosCuadrilla, preciosMaterial, removeRDO } = useStore();
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

  const handleDelete = (id: string, frente: string) => {
    removeRDO(id);
    toast.success(`RDO eliminado · ${frente}`, {
      description: "Demo: se restaura al recargar.",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por dirección..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8"
          />
        </div>
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

      <div className="rounded-lg border overflow-x-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-8" />
              <TableHead>Fecha</TableHead>
              <TableHead>Frente</TableHead>
              <TableHead>Cuadrilla</TableHead>
              <TableHead className="text-right">M²</TableHead>
              <TableHead>Trabajo</TableHead>
              <TableHead className="text-right">Costo</TableHead>
              <TableHead className="text-right w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                  Sin reportes que coincidan con los filtros.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r) => {
              const c = costoRDO(r, preciosCuadrilla, preciosMaterial);
              const isOpen = expanded === r.id;
              return (
                <Fragment key={r.id}>
                  <TableRow className={isOpen ? "bg-muted/30" : ""}>
                    <TableCell
                      className="cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                    >
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <RdoForm rdo={r} />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(r.id, r.frente)}
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell />
                      <TableCell colSpan={7}>
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
                        <div className="text-xs text-muted-foreground border-t pt-2 mt-1 flex flex-wrap gap-x-4">
                          <span>
                            MO:{" "}
                            <span className="text-foreground tabular-nums font-medium">
                              {fmtARS(c.mo)}
                            </span>
                          </span>
                          <span>
                            Materiales:{" "}
                            <span className="text-foreground tabular-nums font-medium">
                              {fmtARS(c.materiales)}
                            </span>
                          </span>
                          {r.notas && (
                            <span className="basis-full mt-1">
                              Notas:{" "}
                              <span className="text-foreground italic">{r.notas}</span>
                            </span>
                          )}
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
