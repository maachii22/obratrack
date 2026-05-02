import type {
  PrecioCuadrilla,
  PrecioMaterial,
  RDO,
  Materiales,
} from "./types";
import { MATERIALES_KEYS } from "./types";

export function precioVigenteCuadrilla(
  precios: PrecioCuadrilla[],
  cuadrilla: string,
  fecha: string
): number {
  const candidatos = precios
    .filter((p) => p.cuadrilla === cuadrilla && p.vigenciaDesde <= fecha)
    .sort((a, b) => b.vigenciaDesde.localeCompare(a.vigenciaDesde));
  return candidatos[0]?.precioM2 ?? 0;
}

export function precioVigenteMaterial(
  precios: PrecioMaterial[],
  material: string,
  fecha: string
): number {
  const candidatos = precios
    .filter((p) => p.material === material && p.vigenciaDesde <= fecha)
    .sort((a, b) => b.vigenciaDesde.localeCompare(a.vigenciaDesde));
  return candidatos[0]?.precio ?? 0;
}

const MATERIAL_KEY_TO_PRICE_KEY: Record<keyof Materiales, string> = {
  caños: "Caños",
  bolson: "Bolson",
  volquetes: "Volquetes",
  palletBaldosas: "Baldosas",
  arena: "Arena",
  cal: "Cal",
  cemento: "Cemento",
  mlPlantera: "Plantera",
  protectorPluvial: "Protector",
  tapasCamaraPluvial: "Camara",
  cordon: "Cordon",
};

export type CostoRDO = { mo: number; materiales: number; total: number };

export function costoRDO(
  rdo: RDO,
  preciosC: PrecioCuadrilla[],
  preciosM: PrecioMaterial[]
): CostoRDO {
  const cuadrillas = rdo.cuadrilla.split("/").map((s) => s.trim());
  const precioM2Promedio =
    cuadrillas.reduce((sum, c) => sum + precioVigenteCuadrilla(preciosC, c, rdo.fecha), 0) /
    cuadrillas.length;
  const mo = rdo.m2 * precioM2Promedio;

  let materiales = 0;
  for (const k of MATERIALES_KEYS) {
    const cantidad = rdo.materiales[k] ?? 0;
    if (cantidad === 0) continue;
    const priceKey = MATERIAL_KEY_TO_PRICE_KEY[k];
    materiales += cantidad * precioVigenteMaterial(preciosM, priceKey, rdo.fecha);
  }

  return { mo, materiales, total: mo + materiales };
}

export type ResumenMes = {
  mes: string;
  rdos: number;
  m2: number;
  costoMO: number;
  costoMateriales: number;
  costoTotal: number;
  costoM2: number;
};

export function resumenMensual(
  rdos: RDO[],
  preciosC: PrecioCuadrilla[],
  preciosM: PrecioMaterial[]
): ResumenMes[] {
  const por: Record<string, ResumenMes> = {};
  for (const r of rdos) {
    const mes = r.fecha.slice(0, 7);
    const c = costoRDO(r, preciosC, preciosM);
    if (!por[mes]) {
      por[mes] = { mes, rdos: 0, m2: 0, costoMO: 0, costoMateriales: 0, costoTotal: 0, costoM2: 0 };
    }
    por[mes].rdos += 1;
    por[mes].m2 += r.m2;
    por[mes].costoMO += c.mo;
    por[mes].costoMateriales += c.materiales;
    por[mes].costoTotal += c.total;
  }
  return Object.values(por)
    .map((m) => ({ ...m, costoM2: m.m2 > 0 ? m.costoTotal / m.m2 : 0 }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
}

export type StatsCuadrilla = {
  cuadrilla: string;
  m2: number;
  rdos: number;
  costoTotal: number;
  costoM2: number;
  m2PorDia: number;
};

export function statsPorCuadrilla(
  rdos: RDO[],
  mes: string | null,
  preciosC: PrecioCuadrilla[],
  preciosM: PrecioMaterial[]
): StatsCuadrilla[] {
  const filtrados = mes ? rdos.filter((r) => r.fecha.startsWith(mes)) : rdos;
  const por: Record<string, StatsCuadrilla & { dias: Set<string> }> = {};
  for (const r of filtrados) {
    const principal = r.cuadrilla.split("/")[0].trim();
    if (!por[principal]) {
      por[principal] = {
        cuadrilla: principal,
        m2: 0, rdos: 0, costoTotal: 0, costoM2: 0, m2PorDia: 0,
        dias: new Set(),
      };
    }
    por[principal].m2 += r.m2;
    por[principal].rdos += 1;
    por[principal].costoTotal += costoRDO(r, preciosC, preciosM).total;
    por[principal].dias.add(r.fecha);
  }
  return Object.values(por).map((s) => ({
    cuadrilla: s.cuadrilla,
    m2: s.m2,
    rdos: s.rdos,
    costoTotal: s.costoTotal,
    costoM2: s.m2 > 0 ? s.costoTotal / s.m2 : 0,
    m2PorDia: s.dias.size > 0 ? s.m2 / s.dias.size : 0,
  }));
}

export type StatsObra = {
  frente: string;
  rdos: number;
  m2: number;
  costoTotal: number;
  cuadrillas: string[];
  ultimoDia: string;
};

export function statsPorObra(
  rdos: RDO[],
  preciosC: PrecioCuadrilla[],
  preciosM: PrecioMaterial[]
): StatsObra[] {
  const por: Record<string, {
    frente: string;
    rdos: number;
    m2: number;
    costoTotal: number;
    cuadrillas: Set<string>;
    ultimoDia: string;
  }> = {};
  for (const r of rdos) {
    if (!por[r.frente]) {
      por[r.frente] = {
        frente: r.frente, rdos: 0, m2: 0, costoTotal: 0,
        cuadrillas: new Set(), ultimoDia: r.fecha,
      };
    }
    por[r.frente].rdos += 1;
    por[r.frente].m2 += r.m2;
    por[r.frente].costoTotal += costoRDO(r, preciosC, preciosM).total;
    por[r.frente].cuadrillas.add(r.cuadrilla);
    if (r.fecha > por[r.frente].ultimoDia) por[r.frente].ultimoDia = r.fecha;
  }
  return Object.values(por).map((o) => ({
    frente: o.frente,
    rdos: o.rdos,
    m2: o.m2,
    costoTotal: o.costoTotal,
    cuadrillas: Array.from(o.cuadrillas),
    ultimoDia: o.ultimoDia,
  }));
}
