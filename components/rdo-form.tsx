"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  CUADRILLAS,
  MATERIALES_KEYS,
  type RDO,
  type Materiales,
  type TipoTrabajo,
} from "@/lib/types";

const emptyMateriales = (): Materiales =>
  MATERIALES_KEYS.reduce((acc, k) => ({ ...acc, [k]: 0 }), {} as Materiales);

export function RdoForm() {
  const { addRDO } = useStore();
  const [open, setOpen] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [frente, setFrente] = useState("");
  const [cuadrilla, setCuadrilla] = useState<string>(CUADRILLAS[0]);
  const [m2, setM2] = useState<number>(0);
  const [trabajo, setTrabajo] = useState<TipoTrabajo>("Baldosas");
  const [materiales, setMateriales] = useState<Materiales>(emptyMateriales);
  const [notas, setNotas] = useState("");

  const reset = () => {
    setFecha(new Date().toISOString().slice(0, 10));
    setFrente("");
    setCuadrilla(CUADRILLAS[0]);
    setM2(0);
    setTrabajo("Baldosas");
    setMateriales(emptyMateriales());
    setNotas("");
  };

  const submit = () => {
    if (!frente.trim() || m2 <= 0) {
      toast.error("Completá frente y m².");
      return;
    }
    const r: RDO = {
      id: `rdo-${Date.now()}`,
      fecha,
      frente: frente.trim(),
      cuadrilla,
      m2,
      trabajo,
      materiales,
      notas: notas.trim() || undefined,
    };
    addRDO(r);
    toast.success("RDO guardado", {
      description: "Demo: los datos se reinician al recargar.",
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Cargar RDO
          </Button>
        }
      />
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Reporte Diario de Obra</DialogTitle>
          <DialogDescription>
            Cargá los datos del trabajo del día. Materiales que no se usaron quedan en 0.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="frente">Frente / dirección</Label>
              <Input
                id="frente"
                placeholder="Av. Cabildo 1234"
                value={frente}
                onChange={(e) => setFrente(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cuadrilla</Label>
              <Select value={cuadrilla} onValueChange={(v) => v && setCuadrilla(v)}>
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
              <Label htmlFor="m2">M² ejecutados</Label>
              <Input
                id="m2"
                type="number"
                min={0}
                step={0.1}
                value={m2}
                onChange={(e) => setM2(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Tipo de trabajo</Label>
              <Select value={trabajo} onValueChange={(v) => v && setTrabajo(v as TipoTrabajo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baldosas">Baldosas</SelectItem>
                  <SelectItem value="Hormigon">Hormigón</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Materiales</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MATERIALES_KEYS.map((k) => (
                <div key={k} className="space-y-1">
                  <Label htmlFor={k} className="text-xs capitalize">
                    {k}
                  </Label>
                  <Input
                    id={k}
                    type="number"
                    min={0}
                    step={0.1}
                    value={materiales[k]}
                    onChange={(e) =>
                      setMateriales((m) => ({
                        ...m,
                        [k]: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="h-9"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones, incidencias..."
            />
          </div>

          <p className="text-xs text-muted-foreground">
            En la versión completa, acá se sube foto desde el celular y queda
            georreferenciada.
          </p>
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
