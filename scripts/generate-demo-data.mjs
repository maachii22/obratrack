// Script de generación 1-shot de datos sintéticos para la demo.
// Ejecutar: node scripts/generate-demo-data.mjs
// Genera: data/rdos.json, data/frentes-geocoded.json, data/egresos.json
// (precios-cuadrilla.json y precios-material.json se editan a mano)

import { writeFileSync } from "node:fs";

// PRNG determinístico para que la demo sea estable
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260505);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (lo, hi) => lo + rand() * (hi - lo);
const int = (lo, hi) => Math.floor(between(lo, hi + 1));
const round1 = (n) => Math.round(n * 10) / 10;

// Cuadrillas anonimizadas (apellidos comunes argentinos sin asociación)
const CUADRILLAS = ["Sosa", "Gomez", "Pereyra", "Ramirez"];
const CUADRILLAS_DIST = [0.32, 0.28, 0.24, 0.16]; // probabilidad acumulada

function pickCuadrilla() {
  const r = rand();
  let acc = 0;
  for (let i = 0; i < CUADRILLAS.length; i++) {
    acc += CUADRILLAS_DIST[i];
    if (r < acc) return CUADRILLAS[i];
  }
  return CUADRILLAS[0];
}

// Direcciones plausibles en CABA. Calles reales pero sin asociar a la empresa
// (números aleatorios), distribuídas en 5 zonas.
const ZONAS = [
  {
    nombre: "Belgrano/Núñez",
    lat: -34.5612, lng: -58.4555, jitterLat: 0.012, jitterLng: 0.014,
    calles: ["Av. Cabildo", "Juramento", "Olleros", "Mendoza", "Echeverría", "La Pampa", "Sucre"],
  },
  {
    nombre: "Palermo",
    lat: -34.5829, lng: -58.4243, jitterLat: 0.010, jitterLng: 0.013,
    calles: ["Av. Santa Fe", "Soler", "Gorriti", "Honduras", "Charcas", "Bonpland", "Thames"],
  },
  {
    nombre: "Caballito",
    lat: -34.6190, lng: -58.4426, jitterLat: 0.008, jitterLng: 0.012,
    calles: ["Av. Rivadavia", "Acoyte", "Rojas", "Yerbal", "Senillosa", "Av. La Plata"],
  },
  {
    nombre: "Villa Urquiza",
    lat: -34.5750, lng: -58.4910, jitterLat: 0.010, jitterLng: 0.011,
    calles: ["Av. Triunvirato", "Bauness", "Bucarelli", "Roosevelt", "Quesada", "Pareja"],
  },
  {
    nombre: "Barracas/San Telmo",
    lat: -34.6396, lng: -58.3820, jitterLat: 0.011, jitterLng: 0.013,
    calles: ["Av. Patricios", "California", "Iguazú", "Brandsen", "Brasil", "Defensa"],
  },
];

function generarFrentes(cantidad) {
  const set = new Set();
  const frentes = [];
  while (frentes.length < cantidad) {
    const z = pick(ZONAS);
    const calle = pick(z.calles);
    const numero = int(100, 4900);
    const direccion = `${calle} ${numero}`;
    if (set.has(direccion)) continue;
    set.add(direccion);
    frentes.push({
      direccion,
      lat: round6(z.lat + (rand() - 0.5) * z.jitterLat * 2),
      lng: round6(z.lng + (rand() - 0.5) * z.jitterLng * 2),
    });
  }
  return frentes;
}

function round6(n) { return Math.round(n * 1e6) / 1e6; }

const FRENTES = generarFrentes(38);

// Materiales — el código usa estas keys (lib/types.ts)
function generarMateriales(m2, trabajo) {
  const baldosas = trabajo === "Baldosas";
  return {
    caños: rand() < 0.25 ? int(1, 6) : 0,
    bolson: rand() < 0.7 ? round1(between(0.5, 3)) : 0,
    volquetes: rand() < 0.4 ? int(1, 2) : 0,
    palletBaldosas: baldosas ? round1(between(0.5, 3)) : 0,
    arena: rand() < 0.65 ? round1(between(2, 12)) : 0,
    cal: rand() < 0.55 ? round1(between(2, 18)) : 0,
    cemento: rand() < 0.7 ? round1(between(2, 16)) : 0,
    mlPlantera: rand() < 0.3 ? round1(between(3, 12)) : 0,
    protectorPluvial: rand() < 0.1 ? int(1, 2) : 0,
    tapasCamaraPluvial: rand() < 0.08 ? int(1, 2) : 0,
    cordon: rand() < 0.35 ? round1(between(2, 9)) : 0,
  };
}

function fechaISO(d) { return d.toISOString().slice(0, 10); }

function generarRDOs() {
  const rdos = [];
  // Distribución: cada frente tiene 2-6 RDOs en fechas distintas
  // entre 2026-01-15 y 2026-05-29
  const start = new Date("2026-01-15");
  const endMs = new Date("2026-05-29").getTime();
  const startMs = start.getTime();

  let id = 1;
  for (const f of FRENTES) {
    const cantidadRdos = int(2, 6);
    const cuadrillaPrincipal = pickCuadrilla();
    const fechas = new Set();
    while (fechas.size < cantidadRdos) {
      const ms = startMs + Math.floor(rand() * (endMs - startMs));
      const d = new Date(ms);
      // Sin domingos (día 0)
      if (d.getUTCDay() === 0) continue;
      fechas.add(fechaISO(d));
    }
    const trabajo = rand() < 0.85 ? "Baldosas" : "Hormigon";
    for (const fecha of [...fechas].sort()) {
      // 90% trabaja la cuadrilla principal, 10% otra
      const cuadrilla = rand() < 0.9 ? cuadrillaPrincipal : pickCuadrilla();
      const m2 = round1(between(28, 95));
      rdos.push({
        id: `rdo-${String(id).padStart(4, "0")}`,
        fecha,
        frente: f.direccion,
        cuadrilla,
        m2,
        trabajo,
        materiales: generarMateriales(m2, trabajo),
        notas: rand() < 0.12
          ? pick([
              "Lluvia por la tarde, se cubrió con polietileno.",
              "Faltó un albañil, día corto.",
              "Vecino reclamó por ruido, OK con propietario.",
              "Se reemplazaron 3 baldosas rotas del lote.",
              "Inspección municipal — pasó sin observaciones.",
            ])
          : undefined,
      });
      id++;
    }
  }
  // Ordenar por fecha desc para que la tabla muestre lo más reciente arriba
  rdos.sort((a, b) => b.fecha.localeCompare(a.fecha));
  return rdos;
}

const RDOS = generarRDOs();

// Egresos — 14 meses (2026-01 → 2027-02), conceptos genéricos
function generarEgresos() {
  const meses = [];
  for (let m = 0; m < 14; m++) {
    const year = 2026 + Math.floor((m) / 12);
    const month = ((m) % 12) + 1;
    meses.push(`${year}-${String(month).padStart(2, "0")}`);
  }

  // Inflación mensual estimada para que crezca un poco mes a mes
  const factorInf = (i) => Math.pow(1.025, i);

  return meses.map((mes, i) => {
    const f = factorInf(i);
    const impuestos = [];
    // IVA todos los meses
    impuestos.push({
      concepto: "IVA",
      vencimiento: "20/mes",
      monto: Math.round(between(2200000, 3800000) * f),
    });
    // Ganancias 1 vez al trimestre
    if (i % 3 === 0) {
      impuestos.push({
        concepto: "Ganancias",
        vencimiento: "fin de mes",
        monto: Math.round(between(1500000, 2400000) * f),
      });
    }

    const planesPago = [];
    // 2 planes activos
    if (mes <= "2026-10") {
      planesPago.push({
        concepto: "Plan AFIP 84/2024",
        vencimiento: "16 y 26/mes",
        monto: Math.round(720000 * f),
      });
    }
    planesPago.push({
      concepto: "Plan AFIP 12/2025",
      vencimiento: "16 y 26/mes",
      monto: Math.round(580000 * f),
    });
    if (i >= 4 && i <= 11) {
      planesPago.push({
        concepto: "Refinanciación moratoria",
        vencimiento: "10/mes",
        monto: Math.round(420000 * f),
      });
    }

    const costosFijos = [
      {
        concepto: "Honorarios contables",
        vencimiento: null,
        monto: Math.round(120000 * f),
      },
      {
        concepto: "Seguro vehículo liviano",
        vencimiento: "28/mes",
        monto: Math.round(80000 * f),
      },
      {
        concepto: "Seguro vehículo utilitario",
        vencimiento: "28/mes",
        monto: Math.round(103000 * f),
      },
      {
        concepto: "Alquiler depósito",
        vencimiento: "5/mes",
        monto: Math.round(450000 * f),
      },
    ];

    // Variables: solo para meses con actividad real (mismas fechas que los RDOs)
    const tieneActividad = RDOS.some((r) => r.fecha.startsWith(mes));
    const costosVariablesEstimados = tieneActividad
      ? Math.round(between(4500000, 8500000) * f)
      : 0;

    return { mes, impuestos, planesPago, costosFijos, costosVariablesEstimados };
  });
}

const EGRESOS = generarEgresos();

writeFileSync("data/rdos.json", JSON.stringify(RDOS, null, 2) + "\n");
writeFileSync("data/frentes-geocoded.json", JSON.stringify(FRENTES, null, 2) + "\n");
writeFileSync("data/egresos.json", JSON.stringify(EGRESOS, null, 2) + "\n");

console.log(`Generado: ${RDOS.length} RDOs, ${FRENTES.length} frentes, ${EGRESOS.length} meses egresos`);
console.log(`Cuadrillas: ${CUADRILLAS.join(", ")}`);
console.log(`Rango fechas: ${RDOS[RDOS.length - 1].fecha} → ${RDOS[0].fecha}`);
