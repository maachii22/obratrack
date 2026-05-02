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
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { fmtARS, fmtFecha } from "@/lib/formatters";
import { PriceHistoryChart } from "@/components/price-history-chart";
import preciosCuadrillaSeed from "@/data/precios-cuadrilla.json";
import preciosMaterialSeed from "@/data/precios-material.json";
import { toast } from "sonner";
import type { PrecioCuadrilla, PrecioMaterial } from "@/lib/types";

const pcAll = preciosCuadrillaSeed as PrecioCuadrilla[];
const pmAll = preciosMaterialSeed as PrecioMaterial[];

export default function PreciosPage() {
  const [selCuadrilla, setSelCuadrilla] = useState<string | null>(null);
  const [selMaterial, setSelMaterial] = useState<string | null>(null);

  const pcGrouped = useMemo(() => {
    const m = new Map<string, PrecioCuadrilla[]>();
    for (const p of pcAll) m.set(p.cuadrilla, [...(m.get(p.cuadrilla) ?? []), p]);
    return m;
  }, []);

  const pmGrouped = useMemo(() => {
    const m = new Map<string, PrecioMaterial[]>();
    for (const p of pmAll) m.set(p.material, [...(m.get(p.material) ?? []), p]);
    return m;
  }, []);

  const histCuadrilla = selCuadrilla
    ? (pcGrouped.get(selCuadrilla) ?? [])
        .map((p) => ({ vigenciaDesde: p.vigenciaDesde, precio: p.precioM2 }))
        .sort((a, b) => a.vigenciaDesde.localeCompare(b.vigenciaDesde))
    : [];

  const histMaterial = selMaterial
    ? (pmGrouped.get(selMaterial) ?? [])
        .map((p) => ({ vigenciaDesde: p.vigenciaDesde, precio: p.precio }))
        .sort((a, b) => a.vigenciaDesde.localeCompare(b.vigenciaDesde))
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Precios</h1>
          <p className="text-sm text-muted-foreground">
            Costos por cuadrilla y material, versionados con vigencia desde.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => toast.info("Edición — disponible en la versión completa")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva vigencia
        </Button>
      </div>

      <Tabs defaultValue="cuadrillas">
        <TabsList>
          <TabsTrigger value="cuadrillas">Cuadrillas</TabsTrigger>
          <TabsTrigger value="materiales">Materiales</TabsTrigger>
        </TabsList>

        <TabsContent value="cuadrillas" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Costos por cuadrilla</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cuadrilla</TableHead>
                      <TableHead>Vigencia desde</TableHead>
                      <TableHead className="text-right">Precio / m²</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pcAll.map((p, i) => (
                      <TableRow
                        key={i}
                        className="cursor-pointer"
                        onClick={() => setSelCuadrilla(p.cuadrilla)}
                      >
                        <TableCell className="font-medium">{p.cuadrilla}</TableCell>
                        <TableCell className="tabular-nums">
                          {fmtFecha(p.vigenciaDesde)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fmtARS(p.precioM2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Histórico {selCuadrilla ? `· ${selCuadrilla}` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selCuadrilla && (
                  <p className="text-sm text-muted-foreground">
                    Click en una fila para ver la evolución del costo.
                  </p>
                )}
                {selCuadrilla && histCuadrilla.length > 0 && (
                  <PriceHistoryChart data={histCuadrilla} />
                )}
                {selCuadrilla && histCuadrilla.length === 1 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Solo una vigencia registrada. La evolución se verá cuando se cargue
                    una nueva.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="materiales" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Costos por material</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Vigencia desde</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pmAll.map((p, i) => (
                      <TableRow
                        key={i}
                        className="cursor-pointer"
                        onClick={() => setSelMaterial(p.material)}
                      >
                        <TableCell className="font-medium">{p.material}</TableCell>
                        <TableCell className="tabular-nums">
                          {fmtFecha(p.vigenciaDesde)}
                        </TableCell>
                        <TableCell>{p.unidad}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fmtARS(p.precio)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Histórico {selMaterial ? `· ${selMaterial}` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selMaterial && (
                  <p className="text-sm text-muted-foreground">
                    Click en una fila para ver la evolución del costo.
                  </p>
                )}
                {selMaterial && histMaterial.length > 0 && (
                  <PriceHistoryChart data={histMaterial} />
                )}
                {selMaterial && histMaterial.length === 1 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Solo una vigencia registrada.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
