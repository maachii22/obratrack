# ObraTrack

Software de gestión para empresas constructoras de veredas y obra civil menor.

> Demo. Reemplaza un Excel multi-hoja por una aplicación web profesional.

## Qué resuelve

- **RDO (Reporte Diario de Obra)** — carga rápida, filtros por fecha/cuadrilla/frente, materiales y costo por día.
- **Obras** — vista por frente con timeline, materiales acumulados y costo total.
- **Cuadrillas** — comparativa de productividad (m²/día) y costo/m² mes a mes.
- **Resumen mensual** — agregaciones automáticas con alertas de desvío (±20% del promedio).
- **Finanzas** — cash flow proyectado a 12 meses: impuestos + planes de pago + costos fijos + costos variables.
- **Precios** — catálogo de costos por cuadrilla y material, versionados por fecha de vigencia, con histórico.
- **Mapa** — obras activas plotteadas en CABA con CircleMarker proporcional a m².
- **Dark mode** + mobile-responsive.

## Stack

- Next.js 16 + TypeScript + App Router
- Tailwind v4 + shadcn/ui
- Recharts (gráficos) · React-Leaflet (mapa)
- next-themes (dark/light)
- Vitest (tests de la capa de cálculo)
- Deploy: Vercel

## Correr local

```bash
npm install
npm run dev
```

Abrí http://localhost:3000.

## Tests

```bash
npm test
```

La capa de cálculo (`lib/calc.ts`) tiene tests unitarios con Vitest. Es el código que migra 1:1 cuando exista backend — la UI se construye encima.

## Re-seedear desde un xlsx

Los datos vienen de un xlsx real anonimizable. Para regenerarlos:

```bash
python3 scripts/seed-from-xlsx.py /path/to/Veredas.xlsx
npm run geocode
```

El primer comando parsea el xlsx y emite los JSONs en `/data`. Genera además datos sintéticos para abril-mayo 2026 manteniendo la distribución estadística (para que la demo se vea "viva").

El segundo geocodifica las direcciones contra Nominatim (OpenStreetMap, sin API key) — respeta el rate limit de 1 req/s.

## Estado

Demo, sin backend ni persistencia. El formulario de RDO simula guardar (los datos se reinician al recargar). En la versión productiva se monta sobre la misma capa de cálculo más una DB (Supabase / Postgres).

## Estructura

```
obratrack/
├── app/                # Next.js App Router
│   ├── (app)/          # Layout con sidebar + páginas
│   │   ├── page.tsx    # Dashboard
│   │   ├── rdo/
│   │   ├── obras/
│   │   ├── cuadrillas/
│   │   ├── resumen/
│   │   ├── finanzas/
│   │   └── precios/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/             # shadcn primitives
│   ├── charts/         # Recharts
│   ├── obras-map.tsx   # Leaflet
│   ├── kpi-card.tsx
│   ├── sidebar.tsx
│   ├── rdo-table.tsx
│   ├── rdo-form.tsx
│   └── obra-drawer.tsx
├── data/               # Seeded JSONs
├── lib/
│   ├── types.ts
│   ├── calc.ts         # Cálculos derivados (con tests)
│   ├── calc.test.ts
│   ├── formatters.ts   # ARS / m² / fechas es-AR
│   └── store.tsx       # React Context (state demo)
├── scripts/
│   ├── seed-from-xlsx.py
│   └── geocode-frentes.ts
└── docs/superpowers/   # Spec + plan de implementación
```
