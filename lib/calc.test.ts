import { describe, expect, it } from "vitest";
import { precioVigenteCuadrilla, precioVigenteMaterial, costoRDO, resumenMensual, statsPorCuadrilla } from "./calc";
import type { PrecioCuadrilla, PrecioMaterial, RDO } from "./types";

const preciosCuadrilla: PrecioCuadrilla[] = [
  { cuadrilla: "Adrian", vigenciaDesde: "2026-01-01", precioM2: 1000 },
  { cuadrilla: "Adrian", vigenciaDesde: "2026-03-01", precioM2: 1500 },
];

const preciosMaterial: PrecioMaterial[] = [
  { material: "Volquetes", vigenciaDesde: "2026-01-01", precio: 50000, unidad: "m²" },
  { material: "Cemento", vigenciaDesde: "2026-01-01", precio: 8000, unidad: "u" },
];

describe("precioVigenteCuadrilla", () => {
  it("devuelve el precio vigente más reciente antes/igual a la fecha", () => {
    expect(precioVigenteCuadrilla(preciosCuadrilla, "Adrian", "2026-02-15")).toBe(1000);
    expect(precioVigenteCuadrilla(preciosCuadrilla, "Adrian", "2026-03-15")).toBe(1500);
  });

  it("devuelve 0 si no hay precio vigente para esa fecha", () => {
    expect(precioVigenteCuadrilla(preciosCuadrilla, "Adrian", "2025-12-31")).toBe(0);
  });

  it("devuelve 0 si la cuadrilla no existe", () => {
    expect(precioVigenteCuadrilla(preciosCuadrilla, "Mario", "2026-02-15")).toBe(0);
  });
});

describe("precioVigenteMaterial", () => {
  it("devuelve precio vigente por material y fecha", () => {
    expect(precioVigenteMaterial(preciosMaterial, "Volquetes", "2026-02-01")).toBe(50000);
  });

  it("devuelve 0 si no hay match", () => {
    expect(precioVigenteMaterial(preciosMaterial, "Arena", "2026-02-01")).toBe(0);
  });
});

const rdo: RDO = {
  id: "r1",
  fecha: "2026-02-10",
  frente: "Test 100",
  cuadrilla: "Adrian",
  m2: 50,
  trabajo: "Baldosas",
  materiales: {
    caños: 0, bolson: 0, volquetes: 2, palletBaldosas: 0, arena: 0,
    cal: 0, cemento: 5, mlPlantera: 0, protectorPluvial: 0,
    tapasCamaraPluvial: 0, cordon: 0,
  },
};

describe("costoRDO", () => {
  it("suma MO + materiales según precios vigentes", () => {
    const c = costoRDO(rdo, preciosCuadrilla, preciosMaterial);
    expect(c.mo).toBe(50 * 1000);
    expect(c.materiales).toBe(2 * 50000 + 5 * 8000);
    expect(c.total).toBe(c.mo + c.materiales);
  });

  it("maneja cuadrillas combinadas (split 50/50)", () => {
    const split: RDO = { ...rdo, cuadrilla: "Adrian/Mario" };
    const preciosConMario: PrecioCuadrilla[] = [
      ...preciosCuadrilla,
      { cuadrilla: "Mario", vigenciaDesde: "2026-01-01", precioM2: 800 },
    ];
    const c = costoRDO(split, preciosConMario, preciosMaterial);
    expect(c.mo).toBe(50 * (1000 + 800) / 2);
  });
});

describe("resumenMensual", () => {
  const rdos: RDO[] = [
    { ...rdo, id: "a", fecha: "2026-02-01", m2: 30 },
    { ...rdo, id: "b", fecha: "2026-02-20", m2: 70 },
    { ...rdo, id: "c", fecha: "2026-03-01", m2: 100 },
  ];

  it("agrupa por mes y suma m² + costos", () => {
    const res = resumenMensual(rdos, preciosCuadrilla, preciosMaterial);
    const feb = res.find((r) => r.mes === "2026-02")!;
    expect(feb.m2).toBe(100);
    expect(feb.rdos).toBe(2);
    expect(feb.costoTotal).toBeGreaterThan(0);
    expect(feb.costoM2).toBe(feb.costoTotal / feb.m2);
  });
});

describe("statsPorCuadrilla", () => {
  it("agrupa por cuadrilla principal (primer nombre antes de /)", () => {
    const rdos: RDO[] = [
      { ...rdo, id: "a", cuadrilla: "Adrian", m2: 50 },
      { ...rdo, id: "b", cuadrilla: "Adrian/Mario", m2: 40 },
    ];
    const stats = statsPorCuadrilla(rdos, "2026-02", preciosCuadrilla, preciosMaterial);
    const adrian = stats.find((s) => s.cuadrilla === "Adrian");
    expect(adrian).toBeDefined();
    expect(adrian!.m2).toBe(50 + 40);
  });
});
