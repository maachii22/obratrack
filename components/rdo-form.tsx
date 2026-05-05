"use client";

import { useState, useEffect } from "react";
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
import { Plus, Pencil } from "lucide-react";
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

type Props = {
  rdo?: RDO;
  trigger?: React.ReactElement;
};

export function RdoForm({ rdo, trigger }: Props) {
  const { addRDO, updateRDO } = useStore();
  const isEdit = !!rdo;
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [fecha, setFecha] = useState(rdo?.fecha ?? new Date().toISOString().slice(0, 10));
  const [frente, setFrente] = useState(rdo?.frente ?? "");
  const [cuadrilla, setCuadrilla] = useState<string>(rdo?.cuadrilla ?? CUADRILLAS[0]);
  const [m2, setM2] = useState<number>(rdo?.m2 ?? 0);
  const [trabajo, setTrabajo] = useState<TipoTrabajo>(rdo?.trabajo ?? "Baldosas");
  const [materiales, setMateriales] = useState<Materiales>(rdo?.materiales ?? emptyMateriales());
  const [notas, setNotas] = useState(rdo?.notas ?? "");

  // Reset form to RDO snapshot whenever opened in edit mode
  useEffect(() => {
    if (open && rdo) {
      setFecha(rdo.fecha);
      setFrente(rdo.frente);
      setCuadrilla(rdo.cuadrilla);
      setM2(rdo.m2);
      setTrabajo(rdo.trabajo);
      setMateriales(rdo.materiales);
      setNotas(rdo.notas ?? "");
    }
    if (!open) setSubmitted(false);
  }, [open, rdo]);

  const reset = () => {
    setFecha(new Date().toISOString().slice(0, 10));
    setFrente("");
    setCuadrilla(CUADRILLAS[0]);
    setM2(0);
    setTrabajo("Baldosas");
    setMateriales(emptyMateriales());
    setNotas("");
    setSubmitted(false);
  };

  const frenteInvalid = submitted && !frente.trim();
  const m2Invalid = submitted && m2 <= 0;

  const submit = () => {
    setSubmitted(true);
    if (!frente.trim() || m2 <= 0) {
      toast.error("Completá frente y m².");
      return;
    }
    const payload: RDO = {
      id: rdo?.id ?? `rdo-${Date.now()}`,
      fecha,
      frente: frente.trim(),
      cuadrilla,
      m2,
      trabajo,
      materiales,
      notas: notas.trim() || undefined,
    };
    if (isEdit) {
      updateRDO(rdo!.id, payload);
      toast.success("RDO actualizado", {
        description: "Demo: los cambios se reinician al recargar.",
      });
    } else {
      addRDO(payload);
      toast.success("RDO guardado", {
        description: "Demo: los datos se reinician al recargar.",
      });
      reset();
    }
    setOpen(false);
  };

  const defaultTrigger = isEdit ? (
    <Button variant="ghost" size="sm">
      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
    </Button>
  ) : (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Cargar RDO
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? defaultTrigger} />
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar RDO" : "Nuevo Reporte Diario de Obra"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modificá los campos que necesites. Los cambios se reflejan en todos los reportes."
              : "Cargá los datos del trabajo del día. Materiales que no se usaron quedan en 0."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <Label htmlFor="frente">
                Frente / dirección <span className="text-destructive">*</span>
              </Label>
              <Input
                id="frente"
                placeholder="Av. Cabildo 1234"
                value={frente}
                onChange={(e) => setFrente(e.target.value)}
                aria-invalid={frenteInvalid}
                className={frenteInvalid ? "border-destructive focus-visible:ring-destructive/30" : ""}
              />
              {frenteInvalid && (
                <p className="text-xs text-destructive">Indicá la dirección.</p>
              )}
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
              <Label htmlFor="m2">
                M² ejecutados <span className="text-destructive">*</span>
              </Label>
              <Input
                id="m2"
                type="number"
                min={0}
                step={0.1}
                value={m2 || ""}
                onChange={(e) => setM2(parseFloat(e.target.value) || 0)}
                placeholder="0"
                aria-invalid={m2Invalid}
                className={m2Invalid ? "border-destructive focus-visible:ring-destructive/30" : ""}
              />
              {m2Invalid && (
                <p className="text-xs text-destructive">M² debe ser mayor a 0.</p>
              )}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {MATERIALES_KEYS.map((k) => (
                <div key={k} className="space-y-1">
                  <Label htmlFor={k} className="text-[11px] capitalize text-muted-foreground">
                    {k}
                  </Label>
                  <Input
                    id={k}
                    type="number"
                    min={0}
                    step={0.1}
                    value={materiales[k] || ""}
                    onChange={(e) =>
                      setMateriales((m) => ({
                        ...m,
                        [k]: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
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
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={submit} className="w-full sm:w-auto">
            {isEdit ? "Guardar cambios" : "Guardar RDO"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
