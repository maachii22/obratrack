"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Tag, Hammer } from "lucide-react";
import { fmtARS, fmtFecha } from "@/lib/formatters";
import { PriceHistoryChart } from "@/components/price-history-chart";
import { toast } from "sonner";
import { CUADRILLAS, type Cuadrilla, type PrecioCuadrilla, type PrecioMaterial } from "@/lib/types";

const MATERIAL_OPTIONS = [
  "Baldosas",
  "Volquetes",
  "Caños",
  "Arena",
  "Cal",
  "Cemento",
  "Polietileno",
  "Bolson",
  "Plantera",
  "Cordon",
];

function NuevaVigenciaCuadrilla() {
  const { addPrecioCuadrilla } = useStore();
  const [open, setOpen] = useState(false);
  const [cuadrilla, setCuadrilla] = useState<Cuadrilla>(CUADRILLAS[0]);
  const [vigenciaDesde, setVigenciaDesde] = useState(new Date().toISOString().slice(0, 10));
  const [precio, setPrecio] = useState<number>(0);

  const submit = () => {
    if (precio <= 0) {
      toast.error("Ingresá un precio mayor a 0.");
      return;
    }
    addPrecioCuadrilla({ cuadrilla, vigenciaDesde, precioM2: precio });
    toast.success(`Precio actualizado para ${cuadrilla}`, {
      description: `${fmtARS(precio)} / m² desde ${fmtFecha(vigenciaDesde)}`,
    });
    setPrecio(0);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva vigencia
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva vigencia · cuadrilla</DialogTitle>
          <DialogDescription>
            Registrá un cambio de precio. Aplica a partir de la fecha indicada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Cuadrilla</Label>
            <Select value={cuadrilla} onValueChange={(v) => v && setCuadrilla(v as Cuadrilla)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUADRILLAS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vig-c">Vigencia desde</Label>
            <Input
              id="vig-c"
              type="date"
              value={vigenciaDesde}
              onChange={(e) => setVigenciaDesde(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prec-c">Precio por m² (ARS)</Label>
            <Input
              id="prec-c"
              type="number"
              min={0}
              step={100}
              value={precio}
              onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
              placeholder="ej. 2500"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={submit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NuevaVigenciaMaterial() {
  const { addPrecioMaterial } = useStore();
  const [open, setOpen] = useState(false);
  const [material, setMaterial] = useState<string>(MATERIAL_OPTIONS[0]);
  const [vigenciaDesde, setVigenciaDesde] = useState(new Date().toISOString().slice(0, 10));
  const [precio, setPrecio] = useState<number>(0);
  const [unidad, setUnidad] = useState<"m²" | "u">("u");

  const submit = () => {
    if (precio <= 0) {
      toast.error("Ingresá un precio mayor a 0.");
      return;
    }
    addPrecioMaterial({ material, vigenciaDesde, precio, unidad });
    toast.success(`Precio actualizado · ${material}`, {
      description: `${fmtARS(precio)} / ${unidad} desde ${fmtFecha(vigenciaDesde)}`,
    });
    setPrecio(0);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva vigencia
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva vigencia · material</DialogTitle>
          <DialogDescription>
            Registrá un cambio de precio de material.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Material</Label>
            <Select value={material} onValueChange={(v) => v && setMaterial(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATERIAL_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vig-m">Vigencia desde</Label>
              <Input
                id="vig-m"
                type="date"
                value={vigenciaDesde}
                onChange={(e) => setVigenciaDesde(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unidad</Label>
              <Select value={unidad} onValueChange={(v) => v && setUnidad(v as "m²" | "u")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m²">m²</SelectItem>
                  <SelectItem value="u">unidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prec-m">Precio (ARS)</Label>
            <Input
              id="prec-m"
              type="number"
              min={0}
              step={100}
              value={precio}
              onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
              placeholder="ej. 8500"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={submit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PreciosPage() {
  const { preciosCuadrilla, preciosMaterial } = useStore();
  const [selCuadrilla, setSelCuadrilla] = useState<string | null>(null);
  const [selMaterial, setSelMaterial] = useState<string | null>(null);

  const pcGrouped = useMemo(() => {
    const m = new Map<string, PrecioCuadrilla[]>();
    for (const p of preciosCuadrilla) m.set(p.cuadrilla, [...(m.get(p.cuadrilla) ?? []), p]);
    return m;
  }, [preciosCuadrilla]);

  const pmGrouped = useMemo(() => {
    const m = new Map<string, PrecioMaterial[]>();
    for (const p of preciosMaterial) m.set(p.material, [...(m.get(p.material) ?? []), p]);
    return m;
  }, [preciosMaterial]);

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
      <header className="flex flex-wrap items-end justify-between gap-3 pb-2 border-b">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
            Catálogo · costos versionados
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Precios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cada precio aplica desde una fecha. El costo de un RDO se calcula con la
            vigencia activa al día del trabajo.
          </p>
        </div>
      </header>

      <Tabs defaultValue="cuadrillas">
        <TabsList>
          <TabsTrigger value="cuadrillas">Cuadrillas</TabsTrigger>
          <TabsTrigger value="materiales">Materiales</TabsTrigger>
        </TabsList>

        <TabsContent value="cuadrillas" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Hammer className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base leading-tight">
                      Costos por cuadrilla
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Click en una fila para ver el histórico
                    </p>
                  </div>
                </div>
                <NuevaVigenciaCuadrilla />
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
                    {preciosCuadrilla.map((p, i) => (
                      <TableRow
                        key={`${p.cuadrilla}-${p.vigenciaDesde}-${i}`}
                        className={`cursor-pointer ${
                          selCuadrilla === p.cuadrilla ? "bg-primary/5" : ""
                        }`}
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
                <CardTitle className="text-base leading-tight">
                  Histórico {selCuadrilla ? `· ${selCuadrilla}` : ""}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {selCuadrilla
                    ? `${histCuadrilla.length} vigencia${histCuadrilla.length !== 1 ? "s" : ""} registrada${histCuadrilla.length !== 1 ? "s" : ""}`
                    : "Seleccioná una cuadrilla"}
                </p>
              </CardHeader>
              <CardContent>
                {!selCuadrilla && (
                  <div className="h-[200px] flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                    <Tag className="h-6 w-6 opacity-40" />
                    Click en una fila para ver la evolución del costo
                  </div>
                )}
                {selCuadrilla && histCuadrilla.length > 0 && (
                  <PriceHistoryChart data={histCuadrilla} />
                )}
                {selCuadrilla && histCuadrilla.length === 1 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Solo una vigencia registrada. Cargá una nueva para ver la
                    evolución.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="materiales" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Tag className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base leading-tight">
                      Costos por material
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Click en una fila para ver el histórico
                    </p>
                  </div>
                </div>
                <NuevaVigenciaMaterial />
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
                    {preciosMaterial.map((p, i) => (
                      <TableRow
                        key={`${p.material}-${p.vigenciaDesde}-${i}`}
                        className={`cursor-pointer ${
                          selMaterial === p.material ? "bg-primary/5" : ""
                        }`}
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
                <CardTitle className="text-base leading-tight">
                  Histórico {selMaterial ? `· ${selMaterial}` : ""}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {selMaterial
                    ? `${histMaterial.length} vigencia${histMaterial.length !== 1 ? "s" : ""} registrada${histMaterial.length !== 1 ? "s" : ""}`
                    : "Seleccioná un material"}
                </p>
              </CardHeader>
              <CardContent>
                {!selMaterial && (
                  <div className="h-[200px] flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                    <Tag className="h-6 w-6 opacity-40" />
                    Click en una fila para ver la evolución del costo
                  </div>
                )}
                {selMaterial && histMaterial.length > 0 && (
                  <PriceHistoryChart data={histMaterial} />
                )}
                {selMaterial && histMaterial.length === 1 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
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
