"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type {
  RDO,
  PrecioCuadrilla,
  PrecioMaterial,
  EgresoMensual,
  EgresoLinea,
} from "./types";
import rdosSeed from "@/data/rdos.json";
import preciosCSeed from "@/data/precios-cuadrilla.json";
import preciosMSeed from "@/data/precios-material.json";
import egresosSeed from "@/data/egresos.json";

type Store = {
  rdos: RDO[];
  preciosCuadrilla: PrecioCuadrilla[];
  preciosMaterial: PrecioMaterial[];
  egresos: EgresoMensual[];
  addRDO: (r: RDO) => void;
  updateRDO: (id: string, patch: Partial<RDO>) => void;
  removeRDO: (id: string) => void;
  addPrecioCuadrilla: (p: PrecioCuadrilla) => void;
  addPrecioMaterial: (p: PrecioMaterial) => void;
  updateEgresoLinea: (
    mes: string,
    bucket: "impuestos" | "planesPago" | "costosFijos",
    index: number,
    patch: Partial<EgresoLinea>
  ) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [rdos, setRdos] = useState<RDO[]>(rdosSeed as RDO[]);
  const [preciosCuadrilla, setPreciosC] = useState<PrecioCuadrilla[]>(
    preciosCSeed as PrecioCuadrilla[]
  );
  const [preciosMaterial, setPreciosM] = useState<PrecioMaterial[]>(
    preciosMSeed as PrecioMaterial[]
  );
  const [egresos, setEgresos] = useState<EgresoMensual[]>(egresosSeed as EgresoMensual[]);

  const value = useMemo<Store>(
    () => ({
      rdos,
      preciosCuadrilla,
      preciosMaterial,
      egresos,
      addRDO: (r) => setRdos((prev) => [r, ...prev]),
      updateRDO: (id, patch) =>
        setRdos((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
      removeRDO: (id) => setRdos((prev) => prev.filter((r) => r.id !== id)),
      addPrecioCuadrilla: (p) =>
        setPreciosC((prev) =>
          [...prev, p].sort(
            (a, b) =>
              a.cuadrilla.localeCompare(b.cuadrilla) ||
              a.vigenciaDesde.localeCompare(b.vigenciaDesde)
          )
        ),
      addPrecioMaterial: (p) =>
        setPreciosM((prev) =>
          [...prev, p].sort(
            (a, b) =>
              a.material.localeCompare(b.material) ||
              a.vigenciaDesde.localeCompare(b.vigenciaDesde)
          )
        ),
      updateEgresoLinea: (mes, bucket, index, patch) =>
        setEgresos((prev) =>
          prev.map((e) => {
            if (e.mes !== mes) return e;
            const nuevoBucket = e[bucket].map((l, i) =>
              i === index ? { ...l, ...patch } : l
            );
            return { ...e, [bucket]: nuevoBucket };
          })
        ),
    }),
    [rdos, preciosCuadrilla, preciosMaterial, egresos]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore fuera de StoreProvider");
  return v;
}
