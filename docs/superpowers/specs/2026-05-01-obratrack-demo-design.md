# ObraTrack — Demo Design Spec

- **Fecha**: 2026-05-01
- **Autor**: Tomás Otegui
- **Estado**: Draft pendiente revisión
- **Repo destino**: github.com/maachii22/obratrack

## 1. Contexto

Cliente potencial: constructora especializada en veredas en CABA. Toda la operación se controla hoy en un Excel multi-hoja (`Veredas.2 Prueba.xlsx`) con los siguientes dominios:

- **RDO (Reporte Diario de Obra)**: registro día por día por dirección/frente, con cuadrilla, m² ejecutados, tipo de trabajo (baldosas/hormigón) y consumo de 11 materiales (caños, baldosas, bolsón, volquetes, arena, cal, cemento, plantera, cordón, protector pluvial, tapas pluviales).
- **Costos por Obra**: los mismos datos del RDO valorizados, con costo total por día/frente.
- **Resúmenes**: agregaciones por cuadrilla y por mes (costo/m², m², costos totales).
- **Outs por Mes**: caja mensual con impuestos (Ganancias, IVA), planes de pago de financiación, costos fijos (contador, seguros) y costos variables.
- **Catálogos de precios**: costos por cuadrilla y por material **versionados con vigencia desde**.

**Pain points observados en el archivo:**

- Filas vacías y errores `#N/A` por fórmulas frágiles.
- Tablas resumen que no actualizan correctamente (ej. ResumenCuadrilla con valores inconsistentes).
- Sin carga desde celular (los capataces probablemente reportan al final del día, propenso a olvidos).
- Sin evidencia visual (foto) de la obra.
- Sin proyección de caja consolidada.
- Sin georeferencia (las obras son direcciones de CABA, naturalmente mapeables).
- 4 cuadrillas (Adrian, Mario, Tyson, Matías) sin comparativa de productividad clara.

## 2. Objetivo de la demo

Demostración **clickeable y deployada en URL pública** que un amigo/socio pueda mostrarle a la empresa para convencerlos de contratar el desarrollo del sistema productivo.

**No es** un MVP funcional: no hay persistencia, auth, ni backend. Es una pieza de venta.

**Criterio de éxito**: que el responsable operativo de la constructora vea la demo y diga "esto es exactamente lo que necesito, ¿cuándo arrancamos?".

## 3. Alcance (in scope)

7 pantallas + 1 mini-mapa embebido como wow visual:

1. Dashboard (KPIs, mini-mapa, gráficos clave)
2. RDO (listado + formulario de carga)
3. Obras (vista por frente)
4. Cuadrillas (comparativa de productividad)
5. Resumen Mensual (la hoja Resumen del Excel, mejorada)
6. Finanzas (cash flow proyectado a 12 meses)
7. Precios (catálogo versionado por cuadrilla y material)

Branding genérico: **ObraTrack**. Posicionamiento: "Software de gestión para empresas constructoras de veredas y obra civil menor".

## 4. Fuera de scope (out of scope) — para evitar scope creep

- Login / autenticación
- Persistencia real (no DB, no Supabase, no localStorage como sistema central)
- API backend
- App móvil nativa (mobile-responsive sí, app no)
- Carga real de fotos (placeholders sí)
- Multi-tenant / multi-empresa
- Roles y permisos
- Integraciones (AFIP, contadores, ERPs)
- Notificaciones / alertas push
- Estado de obras (planificada / en curso / finalizada) — descartado por simplicidad: el Excel actual no lo trackea y agregarlo sin discutirlo con el cliente sería inventar.

## 5. Stack técnico

| Capa | Elección | Por qué |
|------|----------|---------|
| Framework | Next.js 15 + App Router + TypeScript | Standard, deploy 1-click en Vercel, SSG donde se pueda |
| UI | shadcn/ui + Tailwind v4 | Look profesional consistente, evita aspecto "AI-generated" |
| Charts | Recharts | Liviano, suficiente para la demo, integrable con shadcn |
| Mapa | React-Leaflet + OpenStreetMap | Sin API key, suficiente para visual de pins en CABA |
| Datos | JSON estático tipado en `/data` | Refleja datos reales del Excel, anonimizable, sin DB |
| Estado | React useState + Context para "carga simulada" | El form de RDO simula guardar (agrega a estado en memoria, no persiste al refrescar) |
| Tema | next-themes (light/dark) | Polish que se nota en la demo |
| Deploy | Vercel | URL pública compartible |

## 6. Modelo de datos (TypeScript)

Tipos centrales que reflejan el Excel y son el "contrato" para la futura DB.

```ts
type Cuadrilla = "Adrian" | "Mario" | "Tyson" | "Matias";
type TipoTrabajo = "Baldosas" | "Hormigon";

type RDO = {
  id: string;
  fecha: string;            // ISO YYYY-MM-DD
  frente: string;           // "Arias 4187"
  cuadrilla: Cuadrilla | string; // soporta "Tyson/Adrian" cuando colaboran
  m2: number;
  trabajo: TipoTrabajo;
  materiales: {
    caños: number;
    bolson: number;
    volquetes: number;
    palletBaldosas: number;
    arena: number;
    cal: number;
    cemento: number;
    mlPlantera: number;
    protectorPluvial: number;
    tapasCamaraPluvial: number;
    cordon: number;
  };
  notas?: string;
  fotoUrl?: string;         // placeholder en demo
};

type PrecioCuadrilla = { cuadrilla: Cuadrilla; vigenciaDesde: string; precioM2: number };
type PrecioMaterial  = { material: string; vigenciaDesde: string; precio: number; unidad: "m²" | "u" };

type EgresoMensual = {
  mes: string;              // "2026-01"
  impuestos: { concepto: string; vencimiento: string; monto: number }[];
  planesPago: { concepto: string; monto: number }[];
  costosFijos: { concepto: string; monto: number }[];
  costosVariablesEstimados: number;
};
```

Una pequeña capa derivada calcula sobre la marcha:

- **Costo por RDO**: aplica precios vigentes a la fecha del RDO.
- **Resumen mensual**: agrega RDOs del mes.
- **Cuadrillas**: agrupa por cuadrilla y mes.

Esta lógica vive en `lib/calc.ts` con tests unitarios. Es el pedazo que migra 1:1 cuando exista backend.

## 7. Pantallas

### 7.1 Dashboard (`/`)

Lo que ve la empresa al abrir. Densidad alta pero ordenada.

- **Header**: filtro de mes (default: mes en curso). Toggle dark/light.
- **KPI cards (4)**: m² ejecutados del mes, costo/m² promedio, obras activas, total egresos del mes.
- **Mini-mapa de CABA** con pin por cada frente activo (con tooltip: dirección + cuadrilla + m²).
- **Gráfico 1**: evolución mensual del costo/m² (line chart, 6 meses).
- **Gráfico 2**: m² ejecutados por cuadrilla (bar chart agrupado por mes).
- **Tabla "Top 3 obras del mes"** por costo total.

### 7.2 RDO (`/rdo`)

- Tabla con filtros por fecha, cuadrilla, frente, tipo de trabajo.
- Cada fila expandible muestra el desglose de materiales.
- Botón **"Cargar RDO"** abre un dialog con formulario claro: secciones colapsables (Datos generales / Materiales / Notas y foto). Al guardar: toast de confirmación + agrega al state en memoria. Aclaración visible "Demo: los datos se reinician al recargar".
- Botón **"Exportar CSV"** sobre la tabla filtrada.

### 7.3 Obras (`/obras`)

- Listado de frentes únicos con: dirección, cuadrilla(s) que pasaron, días trabajados, m² totales, costo total acumulado, último día con actividad.
- Click en una obra → drawer lateral con: timeline de RDOs de esa obra, materiales totales consumidos, foto placeholder.

### 7.4 Cuadrillas (`/cuadrillas`)

- Card por cuadrilla (4 cards) con: avatar/inicial, m² del mes, costo/m² del mes, tendencia vs mes anterior, productividad (m²/día).
- Tabla comparativa abajo: cuadrilla × mes con costo/m² (la hoja "ResumenCuadrilla" pero limpia).
- Bar chart: m² por cuadrilla por mes.

### 7.5 Resumen Mensual (`/resumen`)

- Tabla principal: una fila por mes con M², MO, costo materiales, costo total, costo/m². Lo mismo que la hoja "Resumen" pero formateada y con conditional formatting (rojo si el costo/m² está fuera del rango histórico ±20%).
- Footer con promedios del trimestre (replica el bloque "PROMEDIO COSTOS 1ER TRIMESTRE" del Excel).
- Botón "Exportar PDF" (visual, demo).

### 7.6 Finanzas (`/finanzas`)

- Tabla mensual a 12 meses con secciones agrupadas: **Impuestos**, **Planes de Pago**, **Costos Fijos**, **Costos Variables**, **Total a Pagar**.
- Gráfico de barras stacked: egresos proyectados por categoría, mes a mes.
- Card resumen arriba: total egresos del mes en curso, próximos 30 días, próximo gran vencimiento (PP.V725328 etc).
- Tab secundario "Vencimientos" con timeline de vencimientos próximos.

### 7.7 Precios (`/precios`)

- Dos tablas:
  - **Cuadrillas**: cuadrilla × vigencia desde × precio/m². Permite agregar nueva vigencia (modal demo).
  - **Materiales**: material × vigencia desde × precio × unidad.
- Histórico clickeable: ver evolución de precio de un ítem en line chart.

## 8. Estructura de carpetas

```
obratrack/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx               # Dashboard
│   │   ├── rdo/page.tsx
│   │   ├── obras/page.tsx
│   │   ├── cuadrillas/page.tsx
│   │   ├── resumen/page.tsx
│   │   ├── finanzas/page.tsx
│   │   └── precios/page.tsx
│   ├── layout.tsx                 # Sidebar + theme toggle
│   └── globals.css
├── components/
│   ├── ui/                        # shadcn primitives
│   ├── kpi-card.tsx
│   ├── obras-map.tsx              # Leaflet
│   ├── rdo-form.tsx
│   ├── rdo-table.tsx
│   ├── charts/
│   │   ├── costo-m2-trend.tsx
│   │   ├── m2-cuadrilla-bars.tsx
│   │   └── egresos-stacked.tsx
│   └── sidebar.tsx
├── data/
│   ├── rdos.json                  # 33+ filas reales del Excel
│   ├── precios-cuadrilla.json
│   ├── precios-material.json
│   ├── egresos.json               # Outs X Mes
│   └── frentes-geocoded.json      # direcciones + lat/lng pre-calculadas
├── lib/
│   ├── calc.ts                    # cálculos derivados (con tests)
│   ├── formatters.ts              # ARS, %, m², fechas es-AR
│   └── types.ts
├── docs/superpowers/specs/2026-05-01-obratrack-demo-design.md
├── README.md
└── package.json
```

## 9. Datos simulados

Origen: `Veredas.2 Prueba.xlsx` provisto por Tomás. Se importan **tal cual** para que la demo se vea con datos reales (33 filas de RDO, precios versionados, egresos de 12 meses).

**Limpieza requerida** (en script `scripts/seed-from-xlsx.ts` que se corre una vez):

- Descartar filas vacías y filas con `#N/A`.
- Normalizar fechas a ISO.
- Las direcciones se geocodean **al hacer build** con Nominatim (free) y se guardan en `frentes-geocoded.json`. Si una dirección no se puede geocodear, fallback a coordenadas aproximadas del barrio.
- Anonimizar si fuera necesario (no parece haber datos sensibles más allá de direcciones públicas; el cliente quiere mostrarle a la empresa el archivo así que lo dejamos como está).
- **Datos sintéticos abril-mayo 2026**: el Excel sólo tiene datos hasta marzo. Para que la demo se sienta "viva" al mostrarse en mayo 2026, el script de seed extiende RDOs y egresos para abril y mayo manteniendo la distribución estadística (cuadrillas, m² promedio, mix de materiales). Se loggea en consola para que sea claro que son datos generados.

## 10. Diseño visual

- **Paleta**: tokens semánticos (background, foreground, primary, muted, etc.) vía CSS variables shadcn. Primary: azul construcción (`oklch(0.45 0.15 250)`) o grafito según se vea mejor en mockup. Acentos: ámbar para alertas, verde para "en regla".
- **Tipografía**: Inter (default shadcn). Variable display para títulos del Dashboard (tamaño grande, peso 600).
- **Layout**: sidebar fijo izquierdo (200px), contenido con `max-w-7xl` y padding consistente.
- **Mobile**: sidebar colapsable en hamburger. Tablas con scroll horizontal. KPI cards 1 col en mobile, 2 col en tablet, 4 col en desktop.
- **Empty states** y **loading skeletons** en todas las pantallas (vende profesionalismo).
- **Micro-interacciones**: hover states, transiciones suaves, motion en charts al cargar.

## 11. Testing

- `lib/calc.ts` con Vitest: tests unitarios para los cálculos derivados (costo por RDO, agregación mensual, costo/m² por cuadrilla). El resto de la demo es UI sin lógica crítica → no se testea.
- Smoke test: `npm run build` en CI debe pasar sin warnings.

## 12. Deploy y entrega

- Repo: `github.com/maachii22/obratrack` (público).
- Vercel: import del repo, deploy automático, URL `obratrack.vercel.app` (o custom si está disponible).
- README con: descripción, screenshots, link a la demo, instrucciones para correr local.
- Commits limpios, en español, autor Tomás.

## 13. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Geocoding de direcciones falla (Nominatim caído / direcciones ambiguas) | Pre-calcular en build, commitear el JSON resultado. Fallback a coordenadas del barrio. |
| Mapa pesa demasiado en mobile | Lazy-load del componente Leaflet, solo cargar cuando el viewport del Dashboard lo requiere. |
| Datos del Excel inconsistentes (errores #N/A, fechas raras) | Script de seed con validaciones y log de filas descartadas. |
| Look "AI-generated" que no convence | shadcn correctamente tematizado + tipografía variable + densidad de info alta + microinteracciones. Evitar gradientes morados, evitar abuso de emojis. |
| Demo se ve vacía sin datos posteriores a marzo 2026 | Generar datos sintéticos plausibles para abril-mayo 2026 (script extiende RDOs con la misma distribución estadística). |

## 14. Plan de build (alto nivel — el detalle va al plan de implementación)

1. Bootstrap: Next.js + Tailwind + shadcn + Leaflet + Recharts.
2. Seed de datos: script que parsea el xlsx y emite los JSONs.
3. Geocoding de frentes (build-time).
4. `lib/calc.ts` + tests.
5. Layout + sidebar + theming.
6. Pantallas en orden de impacto visual: Dashboard → Finanzas → RDO → Obras → Cuadrillas → Resumen → Precios.
7. Mobile polish.
8. README + screenshots.
9. Deploy a Vercel + smoke test.
10. Push a `maachii22/obratrack`.
