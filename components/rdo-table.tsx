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
        <div className="relative w-full sm:max-w-xs sm:flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por dirección..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={cuadrilla} onValueChange={(v) => v && setCuadrilla(v)}>
          <SelectTrigger className="flex-1 sm:flex-initial sm:w-[160px]">
            <SelectValue>{(v) => (v === "all" ? "Todas las cuadrillas" : (v as string))}</SelectValue>
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
          <SelectTrigger className="flex-1 sm:flex-initial sm:w-[140px]">
            <SelectValue>{(v) => (v === "all" ? "Todo trabajo" : v === "Hormigon" ? "Hormigón" : (v as string))}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo trabajo</SelectItem>
            <SelectItem value="Baldosas">Baldosas</SelectItem>
            <SelectItem value="Hormigon">Hormigón</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground sm:ml-auto w-full sm:w-auto text-right">
          {filtered.length} reporte{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg border bg-card h-32 flex items-center justify-center text-sm text-muted-foreground">
          Sin reportes que coincidan con los filtros.
        </div>
      )}

      {/* Desktop / tablet view */}
      {filtered.length > 0 && (
        <div className="hidden md:block rounded-lg border overflow-x-auto bg-card">
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
                      <TableCell className="font-medium max-w-[260px] truncate" title={r.frente}>
                        {r.frente}
                      </TableCell>
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
      )}

      {/* Mobile card list */}
      {filtered.length > 0 && (
        <div className="md:hidden space-y-2">
          {filtered.map((r) => {
            const c = costoRDO(r, preciosCuadrilla, preciosMaterial);
            const isOpen = expanded === r.id;
            return (
              <div
                key={r.id}
                className="rounded-lg border bg-card overflow-hidden"
              >
                <div
                  className="flex items-start gap-2 p-3 cursor-pointer active:bg-muted/40"
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                >
                  <div className="mt-0.5">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {fmtFecha(r.fecha)}
                      </span>
                      <Badge
                        variant={r.trabajo === "Baldosas" ? "default" : "secondary"}
                        className="text-[10px] py-0 px-1.5"
                      >
                        {r.trabajo}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm truncate" title={r.frente}>
                      {r.frente}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {r.cuadrilla}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums leading-tight">
                      {fmtM2(r.m2)}
                    </p>
                    <p className="text-[11px] tabular-nums text-muted-foreground mt-0.5">
                      {fmtARS(c.total)}
                    </p>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t bg-muted/30 px-3 py-2.5 space-y-2">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      {Object.entries(r.materiales)
                        .filter(([, v]) => v > 0)
                        .map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-muted-foreground truncate">{k}</span>
                            <span className="font-medium tabular-nums">{v}</span>
                          </div>
                        ))}
                      {Object.values(r.materiales).every((v) => !v) && (
                        <span className="text-muted-foreground col-span-2">
                          Sin materiales registrados
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-t pt-2">
                      <span>
                        MO:{" "}
                        <span className="text-foreground tabular-nums font-medium">
                          {fmtARS(c.mo)}
                        </span>
                      </span>
                      <span>
                        Mat:{" "}
                        <span className="text-foreground tabular-nums font-medium">
                          {fmtARS(c.materiales)}
                        </span>
                      </span>
                    </div>
                    {r.notas && (
                      <p className="text-xs text-muted-foreground italic border-t pt-2">
                        {r.notas}
                      </p>
                    )}
                    <div className="flex items-center justify-end gap-1 pt-1 border-t">
                      <RdoForm rdo={r} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(r.id, r.frente);
                        }}
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
