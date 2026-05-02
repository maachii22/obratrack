# ObraTrack Demo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una demo clickeable y deployada para una constructora de veredas, mostrando un sistema que reemplaza y mejora su Excel multi-hoja. La demo debe convencer a la empresa de contratar el sistema productivo.

**Architecture:** SPA estática Next.js 15 + App Router con datos seedeados desde un xlsx real. Sin backend, sin DB, sin auth. Estado UI en memoria con React Context. Los cálculos derivados (costo por RDO, agregaciones mensuales) viven en `lib/calc.ts` y son la única lógica con tests — esa capa migra 1:1 al backend cuando exista.

**Tech Stack:** Next.js 15 (App Router) · TypeScript strict · Tailwind v4 · shadcn/ui · Recharts · React-Leaflet · next-themes · Vitest · Vercel.

**Spec de referencia:** `docs/superpowers/specs/2026-05-01-obratrack-demo-design.md`

---

## File Structure

```
obratrack/
├── app/
│   ├── layout.tsx                          # Root layout, theme provider, fonts
│   ├── globals.css                         # Tailwind v4 + shadcn tokens
│   ├── (app)/
│   │   ├── layout.tsx                      # Sidebar + content shell
│   │   ├── page.tsx                        # Dashboard
│   │   ├── rdo/page.tsx
│   │   ├── obras/page.tsx
│   │   ├── cuadrillas/page.tsx
│   │   ├── resumen/page.tsx
│   │   ├── finanzas/page.tsx
│   │   └── precios/page.tsx
├── components/
│   ├── ui/                                 # shadcn primitives (auto-generated)
│   ├── sidebar.tsx                         # Navegación lateral
│   ├── theme-toggle.tsx                    # Switch dark/light
│   ├── kpi-card.tsx                        # Tarjeta KPI reutilizable
│   ├── obras-map.tsx                       # Mapa Leaflet (client-only)
│   ├── rdo-form.tsx                        # Form de carga RDO
│   ├── rdo-table.tsx                       # Tabla filtrable de RDOs
│   ├── obra-drawer.tsx                     # Detalle de obra
│   ├── price-history-chart.tsx
│   └── charts/
│       ├── costo-m2-trend.tsx
│       ├── m2-cuadrilla-bars.tsx
│       └── egresos-stacked.tsx
├── data/
│   ├── rdos.json                           # RDOs seedeados desde Excel
│   ├── precios-cuadrilla.json
│   ├── precios-material.json
│   ├── egresos.json
│   └── frentes-geocoded.json               # direcciones + lat/lng
├── lib/
│   ├── types.ts                            # Tipos TypeScript del modelo
│   ├── calc.ts                             # Cálculos derivados (con tests)
│   ├── calc.test.ts                        # Tests de calc
│   ├── formatters.ts                       # Format ARS / m² / fechas es-AR
│   └── store.tsx                           # React Context para state demo
├── scripts/
│   ├── seed-from-xlsx.py                   # Parsea xlsx → JSONs (one-time)
│   └── geocode-frentes.ts                  # Geocoding via Nominatim
├── public/
│   └── og.png                              # OG image para link previews
├── docs/superpowers/
│   ├── specs/2026-05-01-obratrack-demo-design.md
│   └── plans/2026-05-01-obratrack-demo.md
├── README.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── components.json                         # shadcn config
├── vitest.config.ts
└── .gitignore
```

**Decomposition rationale:** UI components son archivos chicos por responsabilidad (un chart por archivo, un drawer por archivo). La lógica derivada se concentra en `lib/calc.ts` para poder testearla sin tocar UI. Los datos viven en `/data` como JSON tipado para que el seed sea reproducible y las pantallas consuman directo via import.

---

## Task 1: Bootstrap Next.js + Tailwind v4

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `.gitignore`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `postcss.config.mjs`
- Modify: ninguno (proyecto vacío)

**Working dir:** `/Users/earth/obratrack` (ya inicializado con git, contiene `docs/`)

- [ ] **Step 1.1: Inicializar Next.js sin sobrescribir el repo**

Como ya hay archivos (`docs/`), no usamos `create-next-app` directamente. Creamos los archivos manualmente.

```bash
cd /Users/earth/obratrack
npm init -y
```

- [ ] **Step 1.2: Instalar dependencias core**

```bash
npm install next@latest react@latest react-dom@latest
npm install -D typescript @types/react @types/node @types/react-dom
npm install -D tailwindcss@latest @tailwindcss/postcss postcss
npm install -D eslint eslint-config-next
```

Expected: `package.json` y `node_modules/` populados, sin errores.

- [ ] **Step 1.3: Crear `package.json` scripts**

Reemplazar el `scripts` de package.json para tener:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest"
  }
}
```

- [ ] **Step 1.4: Crear `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 1.5: Crear `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
```

- [ ] **Step 1.6: Configurar Tailwind v4**

Crear `postcss.config.mjs`:

```js
export default {
  plugins: { "@tailwindcss/postcss": {} },
};
```

Crear `app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.15 0 0);
  --color-primary: oklch(0.45 0.15 250);
  --color-primary-foreground: oklch(0.98 0 0);
  --color-muted: oklch(0.96 0 0);
  --color-muted-foreground: oklch(0.45 0 0);
  --color-border: oklch(0.92 0 0);
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.15 0 0);
  --color-accent: oklch(0.96 0 0);
  --color-destructive: oklch(0.55 0.22 27);
  --color-success: oklch(0.6 0.18 145);
  --color-warning: oklch(0.7 0.15 70);
  --font-sans: "Inter", system-ui, sans-serif;
}

.dark {
  --color-background: oklch(0.12 0 0);
  --color-foreground: oklch(0.96 0 0);
  --color-primary: oklch(0.65 0.17 250);
  --color-primary-foreground: oklch(0.12 0 0);
  --color-muted: oklch(0.2 0 0);
  --color-muted-foreground: oklch(0.65 0 0);
  --color-border: oklch(0.25 0 0);
  --color-card: oklch(0.16 0 0);
  --color-card-foreground: oklch(0.96 0 0);
  --color-accent: oklch(0.22 0 0);
}

* { border-color: var(--color-border); }
body { background: var(--color-background); color: var(--color-foreground); font-family: var(--font-sans); }
```

- [ ] **Step 1.7: Crear `app/layout.tsx` mínimo**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ObraTrack",
  description: "Gestión de obra civil y veredas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 1.8: Crear `app/page.tsx` placeholder**

```tsx
export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold">ObraTrack</h1>
      <p className="text-muted-foreground">Bootstrap OK.</p>
    </main>
  );
}
```

- [ ] **Step 1.9: Actualizar `.gitignore`**

```
node_modules/
.next/
out/
.env*.local
.DS_Store
*.log
.vercel
```

- [ ] **Step 1.10: Verificar build local**

```bash
npm run build
```

Expected: build pasa sin errores, output en `.next/`.

```bash
npm run dev
```

Visitar http://localhost:3000 y ver "ObraTrack" + "Bootstrap OK". Detener (`Ctrl+C`).

- [ ] **Step 1.11: Commit**

```bash
git add .
git commit -m "feat(bootstrap): Next.js 15 + Tailwind v4 + TypeScript strict"
```

---

## Task 2: Instalar shadcn/ui y dependencias UI

**Files:**
- Create: `components.json`, `components/ui/*` (auto-generados)
- Modify: `package.json`

- [ ] **Step 2.1: Inicializar shadcn**

```bash
npx shadcn@latest init -d
```

Cuando pregunte:
- Style: New York
- Base color: Neutral
- CSS variables: Yes

Expected: crea `components.json`, `lib/utils.ts`, modifica `globals.css` adaptándose a los tokens existentes (si los pisa, reaplicar manualmente los `@theme` del Step 1.6).

- [ ] **Step 2.2: Agregar primitives shadcn que vamos a usar**

```bash
npx shadcn@latest add button card table dialog drawer input label select textarea badge tabs separator sheet sonner skeleton
```

Expected: archivos `components/ui/*.tsx` creados.

- [ ] **Step 2.3: Instalar resto de dependencias UI**

```bash
npm install recharts react-leaflet leaflet next-themes lucide-react date-fns clsx tailwind-merge class-variance-authority
npm install -D @types/leaflet
```

- [ ] **Step 2.4: Instalar Vitest**

```bash
npm install -D vitest @vitest/ui happy-dom
```

Crear `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 2.5: Smoke test de build**

```bash
npm run build
```

Expected: pasa.

- [ ] **Step 2.6: Commit**

```bash
git add .
git commit -m "feat(ui): shadcn/ui + Recharts + Leaflet + Vitest setup"
```

---

## Task 3: Tipos del dominio

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 3.1: Crear `lib/types.ts`**

```ts
export type Cuadrilla = "Adrian" | "Mario" | "Tyson" | "Matias";
export const CUADRILLAS: Cuadrilla[] = ["Adrian", "Mario", "Tyson", "Matias"];

export type TipoTrabajo = "Baldosas" | "Hormigon";

export type Materiales = {
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

export const MATERIALES_KEYS: (keyof Materiales)[] = [
  "caños", "bolson", "volquetes", "palletBaldosas", "arena", "cal",
  "cemento", "mlPlantera", "protectorPluvial", "tapasCamaraPluvial", "cordon",
];

export type RDO = {
  id: string;
  fecha: string;        // YYYY-MM-DD
  frente: string;
  cuadrilla: string;    // soporta "Tyson/Adrian" cuando colaboran
  m2: number;
  trabajo: TipoTrabajo;
  materiales: Materiales;
  notas?: string;
  fotoUrl?: string;
};

export type PrecioCuadrilla = {
  cuadrilla: Cuadrilla;
  vigenciaDesde: string;  // YYYY-MM-DD
  precioM2: number;       // ARS por m²
};

export type PrecioMaterial = {
  material: keyof Materiales;
  vigenciaDesde: string;
  precio: number;          // ARS
  unidad: "m²" | "u";
};

export type EgresoLinea = { concepto: string; vencimiento?: string; monto: number };

export type EgresoMensual = {
  mes: string;             // YYYY-MM
  impuestos: EgresoLinea[];
  planesPago: EgresoLinea[];
  costosFijos: EgresoLinea[];
  costosVariablesEstimados: number;
};

export type Frente = {
  direccion: string;
  lat: number;
  lng: number;
  barrio?: string;
};
```

- [ ] **Step 3.2: Commit**

```bash
git add lib/types.ts
git commit -m "feat(types): modelo de dominio (RDO, precios, egresos)"
```

---

## Task 4: Script de seed desde xlsx (Python)

**Files:**
- Create: `scripts/seed-from-xlsx.py`, `data/rdos.json`, `data/precios-cuadrilla.json`, `data/precios-material.json`, `data/egresos.json`

El xlsx fuente está en `/Users/earth/Downloads/Veredas.2 Prueba.xlsx`. Lo copiamos al repo durante el seed (efímero, no commiteado).

- [ ] **Step 4.1: Crear directorio data**

```bash
mkdir -p data scripts
```

- [ ] **Step 4.2: Crear `scripts/seed-from-xlsx.py`**

```python
"""
Parsea Veredas.2 Prueba.xlsx y genera los JSON en /data.
Genera datos sintéticos para abril-mayo 2026.
Run: python3 scripts/seed-from-xlsx.py /path/to/xlsx
"""
import json
import sys
import random
from datetime import datetime, timedelta
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

CUADRILLAS = ["Adrian", "Mario", "Tyson", "Matias"]

MATERIAL_FIELDS = [
    ("caños", "Caños"),
    ("bolson", "Bolson"),
    ("volquetes", "Volquetes"),
    ("palletBaldosas", "Pallet Baldosas"),
    ("arena", "Arena"),
    ("cal", "Cal"),
    ("cemento", "Cemento"),
    ("mlPlantera", "Ml Plantera"),
    ("protectorPluvial", "Protector Pluvial"),
    ("tapasCamaraPluvial", "Tapas con camara pluvial"),
    ("cordon", "Cordon"),
]

def to_date(v):
    if isinstance(v, datetime):
        return v.strftime("%Y-%m-%d")
    if isinstance(v, str) and v:
        try:
            return datetime.fromisoformat(v).strftime("%Y-%m-%d")
        except Exception:
            return None
    return None

def num(v, default=0):
    if v is None or v == "" or v == "#N/A":
        return default
    try:
        return float(v)
    except Exception:
        return default

def parse_rdos(ws):
    headers = [c.value for c in ws[1]]
    rows = []
    for r in range(2, ws.max_row + 1):
        row = {h: ws.cell(row=r, column=i + 1).value for i, h in enumerate(headers) if h}
        fecha = to_date(row.get("Fecha"))
        frente = row.get("Frente")
        if not fecha or not frente:
            continue
        rows.append({
            "id": f"rdo-{r:04d}",
            "fecha": fecha,
            "frente": str(frente).strip(),
            "cuadrilla": str(row.get("Cuadrilla") or "").strip(),
            "m2": num(row.get("M² Ejecutados")),
            "trabajo": "Hormigon" if str(row.get("Trabajo") or "").lower().startswith("hormigon") else "Baldosas",
            "materiales": {
                key: num(row.get(label)) for key, label in MATERIAL_FIELDS
            },
        })
    return rows

def synth_rdos(real_rdos, months_to_add=2):
    """Genera RDOs sintéticos para abril y mayo 2026 manteniendo la distribución."""
    if not real_rdos:
        return []
    frentes = list({r["frente"] for r in real_rdos})
    avg_m2 = sum(r["m2"] for r in real_rdos) / len(real_rdos)
    out = []
    rid = len(real_rdos) + 1
    base_month = datetime(2026, 4, 1)
    for m_offset in range(months_to_add):
        month_start = base_month + timedelta(days=30 * m_offset)
        for day in range(15):
            date = month_start + timedelta(days=day * 2)
            cuadrilla = random.choice(CUADRILLAS)
            m2 = round(random.uniform(avg_m2 * 0.5, avg_m2 * 1.5), 1)
            frente = random.choice(frentes) + " (" + str(random.randint(100, 9999)) + ")"
            out.append({
                "id": f"rdo-{rid:04d}",
                "fecha": date.strftime("%Y-%m-%d"),
                "frente": frente,
                "cuadrilla": cuadrilla,
                "m2": m2,
                "trabajo": "Baldosas" if random.random() > 0.15 else "Hormigon",
                "materiales": {
                    "caños": 0,
                    "bolson": round(random.uniform(0, 3), 1),
                    "volquetes": round(m2 / 20),
                    "palletBaldosas": round(m2 / 25),
                    "arena": round(random.uniform(1, 4)),
                    "cal": round(m2 / 5),
                    "cemento": round(m2 / 5),
                    "mlPlantera": round(random.uniform(0, 12), 1),
                    "protectorPluvial": random.randint(0, 3),
                    "tapasCamaraPluvial": random.randint(0, 2),
                    "cordon": round(random.uniform(0, 8), 1),
                },
            })
            rid += 1
    return out

def parse_precios_cuadrilla(ws):
    out = []
    for r in range(3, 7):
        cuadrilla = ws.cell(row=r, column=2).value
        fecha = to_date(ws.cell(row=r, column=3).value)
        precio = num(ws.cell(row=r, column=4).value, default=1)
        if cuadrilla and fecha:
            out.append({
                "cuadrilla": cuadrilla,
                "vigenciaDesde": fecha,
                "precioM2": precio,
            })
    return out

def parse_precios_material(ws):
    out = []
    unidad_map = {
        "Baldosas": "m²", "Volquetes": "m²", "Caños": "u", "Arena": "u",
        "Cal": "u", "Cemento": "u", "Polietileno": "u", "Seña Pallet": "u", "Bolson": "u",
    }
    for r in range(3, ws.max_row + 1):
        material = ws.cell(row=r, column=2).value
        fecha = to_date(ws.cell(row=r, column=3).value)
        precio = num(ws.cell(row=r, column=4).value, default=1)
        if material and fecha:
            out.append({
                "material": material,
                "vigenciaDesde": fecha,
                "precio": precio,
                "unidad": unidad_map.get(material, "u"),
            })
    return out

MES_MAP = {
    "ENERO": "2026-01", "FEBRERO": "2026-02", "MARZO": "2026-03",
    "ABRIL": "2026-04", "MAYO": "2026-05", "JUNIO": "2026-06",
    "JULIO": "2026-07", "AGOSTO": "2026-08", "SEPTIEMBRE": "2026-09",
    "OCTUBRE": "2026-10", "NOVIEMBRE": "2026-11", "DICIEMBRE": "2026-12",
    "ENERO2": "2027-01", "FEBRERO3": "2027-02",
}

def parse_egresos(ws):
    """Outs X Mes: 3 secciones (impuestos, fijos, variables) con header de meses."""
    headers = [ws.cell(row=2, column=c).value for c in range(3, 17)]
    meses_iso = [MES_MAP.get(str(h).strip().upper()) for h in headers]
    egresos_por_mes = {m: {"impuestos": [], "planesPago": [], "costosFijos": [], "costosVariablesEstimados": 0} for m in meses_iso if m}

    for r in range(3, 7):
        concepto = ws.cell(row=r, column=1).value
        venc = ws.cell(row=r, column=2).value
        if not concepto:
            continue
        for ci, mes in enumerate(meses_iso):
            if not mes:
                continue
            v = num(ws.cell(row=r, column=3 + ci).value)
            if v > 0:
                bucket = "planesPago" if str(concepto).startswith("PP.") else "impuestos"
                egresos_por_mes[mes][bucket].append({
                    "concepto": str(concepto).strip(),
                    "vencimiento": str(venc) if venc else None,
                    "monto": v,
                })

    for r in range(12, 15):
        concepto = ws.cell(row=r, column=1).value
        venc = ws.cell(row=r, column=2).value
        if not concepto:
            continue
        for ci, mes in enumerate(meses_iso):
            if not mes:
                continue
            v = num(ws.cell(row=r, column=3 + ci).value)
            if v > 0:
                egresos_por_mes[mes]["costosFijos"].append({
                    "concepto": str(concepto).strip(),
                    "vencimiento": str(venc) if venc else None,
                    "monto": v,
                })

    for r in range(21, 26):
        for ci, mes in enumerate(meses_iso):
            if not mes:
                continue
            v = num(ws.cell(row=r, column=3 + ci).value)
            egresos_por_mes[mes]["costosVariablesEstimados"] = max(
                egresos_por_mes[mes]["costosVariablesEstimados"], 0
            )

    return [
        {"mes": m, **data}
        for m, data in sorted(egresos_por_mes.items())
        if data["impuestos"] or data["planesPago"] or data["costosFijos"]
    ]

def main():
    if len(sys.argv) < 2:
        print("Usage: seed-from-xlsx.py /path/to/xlsx")
        sys.exit(1)
    src = Path(sys.argv[1]).resolve()
    if not src.exists():
        print(f"Not found: {src}")
        sys.exit(1)

    wb = openpyxl.load_workbook(src, data_only=True)

    rdos_real = parse_rdos(wb["RDO"])
    rdos_synth = synth_rdos(rdos_real)
    rdos = rdos_real + rdos_synth
    print(f"  RDOs real: {len(rdos_real)}, sintéticos: {len(rdos_synth)}, total: {len(rdos)}")

    precios_cuadrilla = parse_precios_cuadrilla(wb["COSTOS"])
    print(f"  Precios cuadrilla: {len(precios_cuadrilla)}")

    precios_material = parse_precios_material(wb["Hoja13"])
    print(f"  Precios material: {len(precios_material)}")

    egresos = parse_egresos(wb["Outs X Mes"])
    print(f"  Egresos: {len(egresos)} meses")

    DATA.mkdir(exist_ok=True)
    (DATA / "rdos.json").write_text(json.dumps(rdos, indent=2, ensure_ascii=False))
    (DATA / "precios-cuadrilla.json").write_text(json.dumps(precios_cuadrilla, indent=2, ensure_ascii=False))
    (DATA / "precios-material.json").write_text(json.dumps(precios_material, indent=2, ensure_ascii=False))
    (DATA / "egresos.json").write_text(json.dumps(egresos, indent=2, ensure_ascii=False))
    print(f"✔ JSONs escritos en {DATA}")

if __name__ == "__main__":
    main()
```

- [ ] **Step 4.3: Correr el seed**

```bash
python3 scripts/seed-from-xlsx.py "/Users/earth/Downloads/Veredas.2 Prueba.xlsx"
```

Expected: imprime contadores y crea 4 JSONs en `data/`. Si falla por falta de openpyxl: `pip3 install openpyxl`.

- [ ] **Step 4.4: Verificar JSONs**

```bash
ls -la data/
head -20 data/rdos.json
```

Expected: 4 archivos JSON, primer RDO con shape correcto.

- [ ] **Step 4.5: Commit**

```bash
git add scripts/ data/
git commit -m "feat(data): seed JSONs desde xlsx + datos sintéticos abr-may 2026"
```

---

## Task 5: Geocoding de frentes (build-time)

**Files:**
- Create: `scripts/geocode-frentes.ts`, `data/frentes-geocoded.json`
- Modify: `package.json` (script)

- [ ] **Step 5.1: Crear `scripts/geocode-frentes.ts`**

```ts
import { promises as fs } from "fs";
import path from "path";

type RDO = { frente: string };

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const SLEEP_MS = 1100;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const FALLBACKS: Record<string, [number, number]> = {
  belgrano: [-34.5627, -58.4583],
  nuñez: [-34.5469, -58.4615],
  saavedra: [-34.5556, -58.4862],
  default: [-34.5627, -58.4583],
};

async function geocode(direccion: string): Promise<[number, number] | null> {
  const q = `${direccion}, CABA, Argentina`;
  const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ObraTrack-Demo/1.0 (tomás@obratrack.demo)" },
  });
  if (!res.ok) return null;
  const arr = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!arr.length) return null;
  return [parseFloat(arr[0].lat), parseFloat(arr[0].lon)];
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const rdosPath = path.join(root, "data", "rdos.json");
  const outPath = path.join(root, "data", "frentes-geocoded.json");

  const rdos: RDO[] = JSON.parse(await fs.readFile(rdosPath, "utf8"));
  const frentes = Array.from(new Set(rdos.map((r) => r.frente).filter(Boolean)));

  let cache: Record<string, [number, number]> = {};
  try {
    cache = JSON.parse(await fs.readFile(outPath, "utf8")).reduce(
      (acc: Record<string, [number, number]>, f: { direccion: string; lat: number; lng: number }) => {
        acc[f.direccion] = [f.lat, f.lng];
        return acc;
      },
      {}
    );
  } catch {}

  const out: { direccion: string; lat: number; lng: number }[] = [];
  for (const dir of frentes) {
    if (cache[dir]) {
      out.push({ direccion: dir, lat: cache[dir][0], lng: cache[dir][1] });
      continue;
    }
    console.log(`  geocoding: ${dir}`);
    let coords = await geocode(dir);
    if (!coords) {
      console.log(`    ↳ no result, fallback to barrio default`);
      coords = FALLBACKS.default;
    }
    out.push({ direccion: dir, lat: coords[0], lng: coords[1] });
    await sleep(SLEEP_MS);
  }

  await fs.writeFile(outPath, JSON.stringify(out, null, 2));
  console.log(`✔ ${out.length} frentes geocoded → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 5.2: Agregar `tsx` para ejecutar TypeScript scripts**

```bash
npm install -D tsx
```

Agregar al `scripts` de `package.json`:

```json
"geocode": "tsx scripts/geocode-frentes.ts"
```

- [ ] **Step 5.3: Correr geocoding**

```bash
npm run geocode
```

Expected: itera frentes únicos con 1.1s de delay (respetar rate limit Nominatim), genera `data/frentes-geocoded.json`. Toma ~1-2 minutos.

- [ ] **Step 5.4: Verificar resultado**

```bash
head -15 data/frentes-geocoded.json
```

Expected: array de objetos con `direccion`, `lat`, `lng`. Lat ~-34.5, lng ~-58.4 (CABA).

- [ ] **Step 5.5: Commit**

```bash
git add scripts/geocode-frentes.ts data/frentes-geocoded.json package.json package-lock.json
git commit -m "feat(geocoding): coordenadas de frentes via Nominatim (build-time)"
```

---

## Task 6: lib/calc.ts con TDD

**Files:**
- Create: `lib/calc.ts`, `lib/calc.test.ts`

- [ ] **Step 6.1: Escribir tests primero — `lib/calc.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { precioVigenteCuadrilla, precioVigenteMaterial, costoRDO, resumenMensual, statsPorCuadrilla } from "./calc";
import type { PrecioCuadrilla, PrecioMaterial, RDO } from "./types";

const preciosCuadrilla: PrecioCuadrilla[] = [
  { cuadrilla: "Adrian", vigenciaDesde: "2026-01-01", precioM2: 1000 },
  { cuadrilla: "Adrian", vigenciaDesde: "2026-03-01", precioM2: 1500 },
];

const preciosMaterial: PrecioMaterial[] = [
  { material: "volquetes", vigenciaDesde: "2026-01-01", precio: 50000, unidad: "m²" },
  { material: "cemento", vigenciaDesde: "2026-01-01", precio: 8000, unidad: "u" },
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
    expect(precioVigenteMaterial(preciosMaterial, "volquetes", "2026-02-01")).toBe(50000);
  });

  it("devuelve 0 si no hay match", () => {
    expect(precioVigenteMaterial(preciosMaterial, "arena", "2026-02-01")).toBe(0);
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
    const preciosConMario = [...preciosCuadrilla, { cuadrilla: "Mario" as const, vigenciaDesde: "2026-01-01", precioM2: 800 }];
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
```

- [ ] **Step 6.2: Correr tests → deben fallar**

```bash
npm test -- --run
```

Expected: FAIL — `lib/calc.ts` no existe.

- [ ] **Step 6.3: Implementar `lib/calc.ts`**

```ts
import type {
  PrecioCuadrilla,
  PrecioMaterial,
  RDO,
  Materiales,
  Cuadrilla,
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
  material: keyof Materiales | string,
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
  mes: string;            // "2026-02"
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

export function statsPorObra(
  rdos: RDO[],
  preciosC: PrecioCuadrilla[],
  preciosM: PrecioMaterial[]
) {
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
    ...o,
    cuadrillas: Array.from(o.cuadrillas),
  }));
}
```

- [ ] **Step 6.4: Correr tests → deben pasar**

```bash
npm test -- --run
```

Expected: PASS — todos los tests verdes.

- [ ] **Step 6.5: Commit**

```bash
git add lib/calc.ts lib/calc.test.ts vitest.config.ts
git commit -m "feat(calc): cálculos derivados (RDO, resumen mensual, stats) con tests"
```

---

## Task 7: Formatters y helpers

**Files:**
- Create: `lib/formatters.ts`

- [ ] **Step 7.1: Crear `lib/formatters.ts`**

```ts
const ARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const ARS_2 = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
const NUM = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });
const PCT = new Intl.NumberFormat("es-AR", { style: "percent", maximumFractionDigits: 1 });

export const fmtARS = (v: number) => ARS.format(v);
export const fmtARS2 = (v: number) => ARS_2.format(v);
export const fmtNum = (v: number) => NUM.format(v);
export const fmtM2 = (v: number) => `${NUM.format(v)} m²`;
export const fmtPct = (v: number) => PCT.format(v);

export function fmtFecha(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function fmtMes(mes: string): string {
  const [y, m] = mes.split("-");
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${meses[parseInt(m, 10) - 1]} ${y}`;
}

export function mesActual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
```

- [ ] **Step 7.2: Commit**

```bash
git add lib/formatters.ts
git commit -m "feat(formatters): currency / fecha / m² helpers es-AR"
```

---

## Task 8: Theme provider y toggle

**Files:**
- Create: `components/theme-provider.tsx`, `components/theme-toggle.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 8.1: Crear `components/theme-provider.tsx`**

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange {...props}>
      {children}
    </NextThemesProvider>
  );
}
```

- [ ] **Step 8.2: Crear `components/theme-toggle.tsx`**

```tsx
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 dark:hidden" />
      <Moon className="h-4 w-4 hidden dark:block" />
    </Button>
  );
}
```

- [ ] **Step 8.3: Modificar `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ObraTrack",
  description: "Software de gestión para empresas constructoras de veredas y obra civil menor.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 8.4: Verificar que el dev server inicia sin errores**

```bash
npm run dev
```

Expected: arranca, no error de hidratación. Detener.

- [ ] **Step 8.5: Commit**

```bash
git add components/theme-provider.tsx components/theme-toggle.tsx app/layout.tsx
git commit -m "feat(theme): next-themes + toggle dark/light"
```

---

## Task 9: Sidebar y app shell

**Files:**
- Create: `components/sidebar.tsx`, `app/(app)/layout.tsx`

- [ ] **Step 9.1: Crear `components/sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Building2, Users, BarChart3, Wallet, Tag, Menu } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rdo", label: "RDO", icon: FileText },
  { href: "/obras", label: "Obras", icon: Building2 },
  { href: "/cuadrillas", label: "Cuadrillas", icon: Users },
  { href: "/resumen", label: "Resumen", icon: BarChart3 },
  { href: "/finanzas", label: "Finanzas", icon: Wallet },
  { href: "/precios", label: "Precios", icon: Tag },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              active
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Mobile trigger */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-2 border-b bg-background px-4 py-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu"><Menu className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <div className="px-5 py-4 border-b">
              <span className="font-semibold tracking-tight">ObraTrack</span>
            </div>
            <NavLinks onClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-semibold tracking-tight">ObraTrack</span>
        <ThemeToggle />
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col h-screen w-56 border-r bg-card sticky top-0">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <span className="font-semibold tracking-tight text-lg">ObraTrack</span>
          <ThemeToggle />
        </div>
        <NavLinks />
        <div className="mt-auto p-4 text-xs text-muted-foreground border-t">
          Demo · datos simulados
        </div>
      </aside>
    </>
  );
}
```

- [ ] **Step 9.2: Crear `app/(app)/layout.tsx`**

```tsx
import { Sidebar } from "@/components/sidebar";
import { StoreProvider } from "@/lib/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <div className="md:flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
        </main>
      </div>
    </StoreProvider>
  );
}
```

- [ ] **Step 9.3: Mover el placeholder home al grupo `(app)`**

```bash
mkdir -p "app/(app)"
mv app/page.tsx "app/(app)/page.tsx"
```

Editar `app/(app)/page.tsx`:

```tsx
export default function DashboardPage() {
  return <div className="space-y-2"><h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1><p className="text-muted-foreground">Próximamente.</p></div>;
}
```

- [ ] **Step 9.4: Crear el store (Step 9.2 lo importa)**

Crear `lib/store.tsx`:

```tsx
"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { RDO } from "./types";
import rdosSeed from "@/data/rdos.json";

type Store = {
  rdos: RDO[];
  addRDO: (r: RDO) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [rdos, setRdos] = useState<RDO[]>(rdosSeed as RDO[]);
  const value = useMemo<Store>(() => ({
    rdos,
    addRDO: (r) => setRdos((prev) => [r, ...prev]),
  }), [rdos]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore fuera de StoreProvider");
  return v;
}
```

- [ ] **Step 9.5: Smoke test**

```bash
npm run dev
```

Expected: sidebar visible en desktop, hamburger en mobile. Todos los links navegan a `/` (los otros aún no existen → 404, OK por ahora). Detener.

- [ ] **Step 9.6: Commit**

```bash
git add components/sidebar.tsx app/\(app\)/ lib/store.tsx
git commit -m "feat(shell): sidebar + app layout + store inicial"
```

---

## Task 10: KpiCard reutilizable

**Files:**
- Create: `components/kpi-card.tsx`

- [ ] **Step 10.1: Crear `components/kpi-card.tsx`**

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Props = {
  label: string;
  value: string;
  delta?: { pct: number; label?: string };
  hint?: string;
};

export function KpiCard({ label, value, delta, hint }: Props) {
  const Trend = !delta ? null : delta.pct > 0 ? TrendingUp : delta.pct < 0 ? TrendingDown : Minus;
  const trendColor = !delta ? "" : delta.pct > 0 ? "text-success" : delta.pct < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight mt-1">{value}</p>
        {delta && Trend && (
          <p className={`flex items-center gap-1 text-xs mt-2 ${trendColor}`}>
            <Trend className="h-3 w-3" />
            <span className="font-medium">{(delta.pct * 100).toFixed(1)}%</span>
            {delta.label && <span className="text-muted-foreground ml-1">{delta.label}</span>}
          </p>
        )}
        {hint && !delta && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 10.2: Commit**

```bash
git add components/kpi-card.tsx
git commit -m "feat(ui): KpiCard component con delta indicator"
```

---

## Task 11: Charts (3 componentes Recharts)

**Files:**
- Create: `components/charts/costo-m2-trend.tsx`, `components/charts/m2-cuadrilla-bars.tsx`, `components/charts/egresos-stacked.tsx`

- [ ] **Step 11.1: Crear `components/charts/costo-m2-trend.tsx`**

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { fmtARS, fmtMes } from "@/lib/formatters";
import type { ResumenMes } from "@/lib/calc";

export function CostoM2Trend({ data }: { data: ResumenMes[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Costo / m² mensual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" tickFormatter={fmtMes} stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis tickFormatter={(v) => fmtARS(v)} stroke="var(--color-muted-foreground)" fontSize={12} width={80} />
              <Tooltip
                formatter={(v: number) => [fmtARS(v), "Costo / m²"]}
                labelFormatter={fmtMes}
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
              />
              <Line type="monotone" dataKey="costoM2" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 11.2: Crear `components/charts/m2-cuadrilla-bars.tsx`**

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { fmtMes, fmtNum } from "@/lib/formatters";

type Row = { mes: string } & Record<string, number | string>;

export function M2CuadrillaBars({ data, cuadrillas }: { data: Row[]; cuadrillas: string[] }) {
  const colors = ["var(--color-primary)", "var(--color-warning)", "var(--color-success)", "var(--color-destructive)"];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">M² ejecutados por cuadrilla</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" tickFormatter={fmtMes} stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={fmtNum} />
              <Tooltip
                formatter={(v: number) => [`${fmtNum(v)} m²`, ""]}
                labelFormatter={fmtMes}
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {cuadrillas.map((c, i) => (
                <Bar key={c} dataKey={c} stackId="a" fill={colors[i % colors.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 11.3: Crear `components/charts/egresos-stacked.tsx`**

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { fmtARS, fmtMes } from "@/lib/formatters";

type Row = { mes: string; impuestos: number; planesPago: number; costosFijos: number; costosVariables: number };

export function EgresosStacked({ data }: { data: Row[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Egresos proyectados (12 meses)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" tickFormatter={fmtMes} stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis tickFormatter={fmtARS} stroke="var(--color-muted-foreground)" fontSize={11} width={90} />
              <Tooltip
                formatter={(v: number) => fmtARS(v)}
                labelFormatter={fmtMes}
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="impuestos" name="Impuestos" stackId="e" fill="var(--color-destructive)" />
              <Bar dataKey="planesPago" name="Planes de Pago" stackId="e" fill="var(--color-warning)" />
              <Bar dataKey="costosFijos" name="Costos Fijos" stackId="e" fill="var(--color-primary)" />
              <Bar dataKey="costosVariables" name="Costos Variables" stackId="e" fill="var(--color-success)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 11.4: Commit**

```bash
git add components/charts/
git commit -m "feat(charts): line trend / bars cuadrilla / stacked egresos"
```

---

## Task 12: Mapa de obras (Leaflet)

**Files:**
- Create: `components/obras-map.tsx`

- [ ] **Step 12.1: Importar CSS de Leaflet en globals**

Modificar `app/globals.css`, agregar al final:

```css
.leaflet-container {
  font-family: var(--font-sans);
  border-radius: 0.5rem;
}
```

- [ ] **Step 12.2: Crear `components/obras-map.tsx`**

```tsx
"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import frentes from "@/data/frentes-geocoded.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import type { RDO } from "@/lib/types";

type Props = {
  rdos: RDO[];
  mes?: string;
};

export function ObrasMap({ rdos, mes }: Props) {
  const points = useMemo(() => {
    const filtered = mes ? rdos.filter((r) => r.fecha.startsWith(mes)) : rdos;
    const byFrente = new Map<string, { m2: number; cuadrillas: Set<string> }>();
    for (const r of filtered) {
      const cur = byFrente.get(r.frente) || { m2: 0, cuadrillas: new Set<string>() };
      cur.m2 += r.m2;
      cur.cuadrillas.add(r.cuadrilla);
      byFrente.set(r.frente, cur);
    }
    return (frentes as { direccion: string; lat: number; lng: number }[])
      .filter((f) => byFrente.has(f.direccion))
      .map((f) => ({
        ...f,
        m2: byFrente.get(f.direccion)!.m2,
        cuadrillas: Array.from(byFrente.get(f.direccion)!.cuadrillas).join(", "),
      }));
  }, [rdos, mes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Obras activas en CABA</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] rounded-md overflow-hidden">
          <MapContainer
            center={[-34.5627, -58.4583]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {points.map((p) => (
              <CircleMarker
                key={p.direccion}
                center={[p.lat, p.lng]}
                radius={6 + Math.min(10, p.m2 / 30)}
                pathOptions={{ color: "var(--color-primary)", fillColor: "var(--color-primary)", fillOpacity: 0.6 }}
              >
                <Tooltip>
                  <div className="text-xs">
                    <strong>{p.direccion}</strong>
                    <br />{p.cuadrillas}
                    <br />{p.m2.toFixed(1)} m²
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 12.3: Commit**

```bash
git add components/obras-map.tsx app/globals.css
git commit -m "feat(map): mapa de obras con CircleMarker proporcional a m²"
```

---

## Task 13: Página Dashboard

**Files:**
- Create / Modify: `app/(app)/page.tsx`

- [ ] **Step 13.1: Reemplazar `app/(app)/page.tsx`**

```tsx
"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { resumenMensual, statsPorCuadrilla, statsPorObra } from "@/lib/calc";
import preciosCuadrilla from "@/data/precios-cuadrilla.json";
import preciosMaterial from "@/data/precios-material.json";
import egresos from "@/data/egresos.json";
import { KpiCard } from "@/components/kpi-card";
import { CostoM2Trend } from "@/components/charts/costo-m2-trend";
import { M2CuadrillaBars } from "@/components/charts/m2-cuadrilla-bars";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtARS, fmtM2, fmtMes, mesActual } from "@/lib/formatters";
import type { PrecioCuadrilla, PrecioMaterial, EgresoMensual } from "@/lib/types";

const ObrasMap = dynamic(() => import("@/components/obras-map").then((m) => m.ObrasMap), { ssr: false });

export default function DashboardPage() {
  const { rdos } = useStore();
  const [mes, setMes] = useState<string>(mesActual());

  const pc = preciosCuadrilla as PrecioCuadrilla[];
  const pm = preciosMaterial as PrecioMaterial[];

  const meses = useMemo(() => {
    const s = new Set(rdos.map((r) => r.fecha.slice(0, 7)));
    return Array.from(s).sort().reverse();
  }, [rdos]);

  const resumen = useMemo(() => resumenMensual(rdos, pc, pm), [rdos, pc, pm]);
  const resumenMesActual = resumen.find((r) => r.mes === mes);
  const resumenMesAnterior = (() => {
    const idx = resumen.findIndex((r) => r.mes === mes);
    return idx > 0 ? resumen[idx - 1] : undefined;
  })();

  const obrasActivas = useMemo(() => {
    const f = rdos.filter((r) => r.fecha.startsWith(mes));
    return new Set(f.map((r) => r.frente)).size;
  }, [rdos, mes]);

  const egresoMes = (egresos as EgresoMensual[]).find((e) => e.mes === mes);
  const totalEgreso = egresoMes
    ? [...egresoMes.impuestos, ...egresoMes.planesPago, ...egresoMes.costosFijos].reduce((s, l) => s + l.monto, 0)
    : 0;

  const m2DeltaPct = resumenMesAnterior && resumenMesAnterior.m2 > 0
    ? (resumenMesActual!.m2 - resumenMesAnterior.m2) / resumenMesAnterior.m2
    : 0;

  const cuadrillasDataChart = useMemo(() => {
    const meses6 = resumen.slice(-6);
    const cuadrillas = ["Adrian", "Mario", "Tyson", "Matias"];
    return meses6.map((r) => {
      const stats = statsPorCuadrilla(rdos, r.mes, pc, pm);
      const row: Record<string, string | number> = { mes: r.mes };
      for (const c of cuadrillas) row[c] = stats.find((s) => s.cuadrilla === c)?.m2 ?? 0;
      return row;
    });
  }, [rdos, pc, pm, resumen]);

  const top3 = useMemo(() => {
    const obras = statsPorObra(rdos.filter((r) => r.fecha.startsWith(mes)), pc, pm);
    return obras.sort((a, b) => b.costoTotal - a.costoTotal).slice(0, 3);
  }, [rdos, pc, pm, mes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Vista general de la operación · {fmtMes(mes)}</p>
        </div>
        <Select value={mes} onValueChange={setMes}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {meses.map((m) => <SelectItem key={m} value={m}>{fmtMes(m)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="M² ejecutados"
          value={fmtM2(resumenMesActual?.m2 ?? 0)}
          delta={resumenMesAnterior ? { pct: m2DeltaPct, label: "vs mes anterior" } : undefined}
        />
        <KpiCard
          label="Costo / m² promedio"
          value={fmtARS(resumenMesActual?.costoM2 ?? 0)}
          hint={`${resumenMesActual?.rdos ?? 0} reportes este mes`}
        />
        <KpiCard label="Obras activas" value={obrasActivas.toString()} hint="frentes únicos" />
        <KpiCard label="Egresos del mes" value={fmtARS(totalEgreso)} hint="impuestos + fijos + planes" />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <ObrasMap rdos={rdos} mes={mes} />
        <CostoM2Trend data={resumen} />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <M2CuadrillaBars data={cuadrillasDataChart} cuadrillas={["Adrian", "Mario", "Tyson", "Matias"]} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 3 obras del mes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {top3.length === 0 && <p className="text-sm text-muted-foreground">Sin obras este mes.</p>}
            {top3.map((o, i) => (
              <div key={o.frente} className="flex items-start gap-3 py-2 border-b last:border-0">
                <span className="text-2xl font-semibold text-muted-foreground tabular-nums w-8">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{o.frente}</p>
                  <p className="text-xs text-muted-foreground">{fmtM2(o.m2)} · {o.rdos} días · {o.cuadrillas.join(", ")}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums">{fmtARS(o.costoTotal)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 13.2: Smoke test**

```bash
npm run dev
```

Visitar http://localhost:3000. Expected: Dashboard con KPIs, mapa con pins, 2 charts, top 3. Detener.

- [ ] **Step 13.3: Commit**

```bash
git add app/\(app\)/page.tsx
git commit -m "feat(dashboard): KPIs + mapa + charts + top obras"
```

---

## Task 14: Página RDO con tabla y formulario

**Files:**
- Create: `app/(app)/rdo/page.tsx`, `components/rdo-table.tsx`, `components/rdo-form.tsx`

- [ ] **Step 14.1: Crear `components/rdo-table.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { fmtFecha, fmtM2, fmtARS } from "@/lib/formatters";
import { costoRDO } from "@/lib/calc";
import type { RDO, PrecioCuadrilla, PrecioMaterial } from "@/lib/types";
import preciosC from "@/data/precios-cuadrilla.json";
import preciosM from "@/data/precios-material.json";

export function RdoTable({ rdos }: { rdos: RDO[] }) {
  const [q, setQ] = useState("");
  const [cuadrilla, setCuadrilla] = useState<string>("all");
  const [trabajo, setTrabajo] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const cuadrillas = useMemo(() => {
    const s = new Set(rdos.map((r) => r.cuadrilla.split("/")[0].trim()));
    return Array.from(s).sort();
  }, [rdos]);

  const filtered = useMemo(() => {
    return rdos
      .filter((r) => (q ? r.frente.toLowerCase().includes(q.toLowerCase()) : true))
      .filter((r) => (cuadrilla === "all" ? true : r.cuadrilla.startsWith(cuadrilla)))
      .filter((r) => (trabajo === "all" ? true : r.trabajo === trabajo))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [rdos, q, cuadrilla, trabajo]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <Input placeholder="Buscar por dirección..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select value={cuadrilla} onValueChange={setCuadrilla}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las cuadrillas</SelectItem>
            {cuadrillas.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={trabajo} onValueChange={setTrabajo}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo trabajo</SelectItem>
            <SelectItem value="Baldosas">Baldosas</SelectItem>
            <SelectItem value="Hormigon">Hormigón</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} reportes</span>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Fecha</TableHead>
              <TableHead>Frente</TableHead>
              <TableHead>Cuadrilla</TableHead>
              <TableHead className="text-right">M²</TableHead>
              <TableHead>Trabajo</TableHead>
              <TableHead className="text-right">Costo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => {
              const c = costoRDO(r, preciosC as PrecioCuadrilla[], preciosM as PrecioMaterial[]);
              const isOpen = expanded === r.id;
              return (
                <>
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setExpanded(isOpen ? null : r.id)}>
                    <TableCell>{isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</TableCell>
                    <TableCell className="tabular-nums">{fmtFecha(r.fecha)}</TableCell>
                    <TableCell className="font-medium">{r.frente}</TableCell>
                    <TableCell>{r.cuadrilla}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtM2(r.m2)}</TableCell>
                    <TableCell><Badge variant={r.trabajo === "Baldosas" ? "default" : "secondary"}>{r.trabajo}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{fmtARS(c.total)}</TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow key={r.id + "-x"} className="bg-muted/50">
                      <TableCell />
                      <TableCell colSpan={6}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs py-2">
                          {Object.entries(r.materiales).filter(([, v]) => v > 0).map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                              <span className="text-muted-foreground">{k}</span>
                              <span className="font-medium tabular-nums">{v}</span>
                            </div>
                          ))}
                          {Object.values(r.materiales).every((v) => !v) && <span className="text-muted-foreground">Sin materiales registrados</span>}
                        </div>
                        <div className="text-xs text-muted-foreground border-t pt-2">
                          MO: <span className="text-foreground tabular-nums">{fmtARS(c.mo)}</span> · Materiales: <span className="text-foreground tabular-nums">{fmtARS(c.materiales)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

- [ ] **Step 14.2: Crear `components/rdo-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { CUADRILLAS, MATERIALES_KEYS, type RDO, type Materiales, type TipoTrabajo } from "@/lib/types";

const emptyMateriales: Materiales = MATERIALES_KEYS.reduce((acc, k) => ({ ...acc, [k]: 0 }), {} as Materiales);

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
    setMateriales(emptyMateriales);
    setNotas("");
  };

  const submit = () => {
    if (!frente.trim() || m2 <= 0) {
      toast.error("Completá frente y m².");
      return;
    }
    const r: RDO = {
      id: `rdo-${Date.now()}`,
      fecha, frente: frente.trim(), cuadrilla, m2, trabajo,
      materiales,
      notas: notas.trim() || undefined,
    };
    addRDO(r);
    toast.success("RDO guardado (demo · no persiste al recargar)");
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Cargar RDO</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Reporte Diario de Obra</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="frente">Frente / dirección</Label>
              <Input id="frente" placeholder="Av. Cabildo 1234" value={frente} onChange={(e) => setFrente(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Cuadrilla</Label>
              <Select value={cuadrilla} onValueChange={setCuadrilla}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CUADRILLAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m2">M² ejecutados</Label>
              <Input id="m2" type="number" min={0} step={0.1} value={m2} onChange={(e) => setM2(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Tipo de trabajo</Label>
              <Select value={trabajo} onValueChange={(v) => setTrabajo(v as TipoTrabajo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Label htmlFor={k} className="text-xs capitalize">{k}</Label>
                  <Input
                    id={k}
                    type="number"
                    min={0}
                    step={0.1}
                    value={materiales[k]}
                    onChange={(e) =>
                      setMateriales((m) => ({ ...m, [k]: parseFloat(e.target.value) || 0 }))
                    }
                    className="h-9"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea id="notas" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones, incidencias..." />
          </div>

          <p className="text-xs text-muted-foreground">
            En la versión completa, acá se sube foto desde el celular y queda georreferenciada.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 14.3: Crear `app/(app)/rdo/page.tsx`**

```tsx
"use client";

import { useStore } from "@/lib/store";
import { RdoTable } from "@/components/rdo-table";
import { RdoForm } from "@/components/rdo-form";

export default function RDOPage() {
  const { rdos } = useStore();
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Reportes diarios de obra</h1>
          <p className="text-sm text-muted-foreground">El RDO es el origen de toda la trazabilidad: m² ejecutados, materiales y mano de obra.</p>
        </div>
        <RdoForm />
      </div>
      <RdoTable rdos={rdos} />
    </div>
  );
}
```

- [ ] **Step 14.4: Smoke test**

```bash
npm run dev
```

Visitar `/rdo`. Expected: tabla con filas, expandibles, formulario en dialog que agrega un RDO al state.

- [ ] **Step 14.5: Commit**

```bash
git add components/rdo-table.tsx components/rdo-form.tsx app/\(app\)/rdo/
git commit -m "feat(rdo): tabla filtrable + formulario de carga (demo)"
```

---

## Task 15: Página Obras

**Files:**
- Create: `app/(app)/obras/page.tsx`, `components/obra-drawer.tsx`

- [ ] **Step 15.1: Crear `components/obra-drawer.tsx`**

```tsx
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { fmtFecha, fmtM2, fmtARS } from "@/lib/formatters";
import { costoRDO } from "@/lib/calc";
import type { RDO, PrecioCuadrilla, PrecioMaterial, Materiales } from "@/lib/types";
import { MATERIALES_KEYS } from "@/lib/types";
import preciosC from "@/data/precios-cuadrilla.json";
import preciosM from "@/data/precios-material.json";

type Props = {
  frente: string | null;
  rdos: RDO[];
  onClose: () => void;
};

export function ObraDrawer({ frente, rdos, onClose }: Props) {
  const open = !!frente;
  const obraRdos = rdos.filter((r) => r.frente === frente).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const m2Total = obraRdos.reduce((s, r) => s + r.m2, 0);
  const costoTotal = obraRdos.reduce((s, r) => s + costoRDO(r, preciosC as PrecioCuadrilla[], preciosM as PrecioMaterial[]).total, 0);
  const matsTotal: Materiales = MATERIALES_KEYS.reduce((acc, k) => {
    acc[k] = obraRdos.reduce((s, r) => s + (r.materiales[k] ?? 0), 0);
    return acc;
  }, { caños: 0, bolson: 0, volquetes: 0, palletBaldosas: 0, arena: 0, cal: 0, cemento: 0, mlPlantera: 0, protectorPluvial: 0, tapasCamaraPluvial: 0, cordon: 0 });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{frente}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-4">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">M² totales</p><p className="font-semibold tabular-nums">{fmtM2(m2Total)}</p></div>
            <div><p className="text-xs text-muted-foreground">Días</p><p className="font-semibold tabular-nums">{obraRdos.length}</p></div>
            <div><p className="text-xs text-muted-foreground">Costo total</p><p className="font-semibold tabular-nums">{fmtARS(costoTotal)}</p></div>
          </div>

          <div className="aspect-video rounded-md border-2 border-dashed flex items-center justify-center text-xs text-muted-foreground">
            Foto de obra (placeholder)
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Materiales acumulados</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {Object.entries(matsTotal).filter(([, v]) => v > 0).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b py-1">
                  <span className="text-muted-foreground capitalize">{k}</span>
                  <span className="font-medium tabular-nums">{v.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Timeline de RDOs</p>
            <div className="space-y-2">
              {obraRdos.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm border-l-2 border-primary pl-3 py-1">
                  <div>
                    <p className="font-medium">{fmtFecha(r.fecha)} <Badge variant="outline" className="ml-1 text-[10px]">{r.cuadrilla}</Badge></p>
                    <p className="text-xs text-muted-foreground">{r.trabajo} · {fmtM2(r.m2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 15.2: Crear `app/(app)/obras/page.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { statsPorObra } from "@/lib/calc";
import preciosC from "@/data/precios-cuadrilla.json";
import preciosM from "@/data/precios-material.json";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fmtFecha, fmtM2, fmtARS } from "@/lib/formatters";
import { ObraDrawer } from "@/components/obra-drawer";
import type { PrecioCuadrilla, PrecioMaterial } from "@/lib/types";

export default function ObrasPage() {
  const { rdos } = useStore();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const obras = useMemo(() => {
    return statsPorObra(rdos, preciosC as PrecioCuadrilla[], preciosM as PrecioMaterial[])
      .filter((o) => (q ? o.frente.toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => b.ultimoDia.localeCompare(a.ultimoDia));
  }, [rdos, q]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Obras</h1>
        <p className="text-sm text-muted-foreground">{obras.length} frentes con actividad</p>
      </div>

      <Input placeholder="Buscar obra..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Frente</TableHead>
              <TableHead>Cuadrillas</TableHead>
              <TableHead className="text-right">Días</TableHead>
              <TableHead className="text-right">M² totales</TableHead>
              <TableHead className="text-right">Costo total</TableHead>
              <TableHead>Último día</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {obras.map((o) => (
              <TableRow key={o.frente} className="cursor-pointer" onClick={() => setSelected(o.frente)}>
                <TableCell className="font-medium">{o.frente}</TableCell>
                <TableCell className="space-x-1">{o.cuadrillas.map((c) => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}</TableCell>
                <TableCell className="text-right tabular-nums">{o.rdos}</TableCell>
                <TableCell className="text-right tabular-nums">{fmtM2(o.m2)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmtARS(o.costoTotal)}</TableCell>
                <TableCell className="tabular-nums">{fmtFecha(o.ultimoDia)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ObraDrawer frente={selected} rdos={rdos} onClose={() => setSelected(null)} />
    </div>
  );
}
```

- [ ] **Step 15.3: Smoke test y commit**

```bash
npm run dev
```

Visitar `/obras`. Click en una fila → drawer con detalle.

```bash
git add components/obra-drawer.tsx app/\(app\)/obras/
git commit -m "feat(obras): listado por frente + drawer detalle"
```

---

## Task 16: Página Cuadrillas

**Files:**
- Create: `app/(app)/cuadrillas/page.tsx`

- [ ] **Step 16.1: Crear `app/(app)/cuadrillas/page.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { statsPorCuadrilla, resumenMensual } from "@/lib/calc";
import preciosC from "@/data/precios-cuadrilla.json";
import preciosM from "@/data/precios-material.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtARS, fmtM2, fmtMes, mesActual } from "@/lib/formatters";
import { M2CuadrillaBars } from "@/components/charts/m2-cuadrilla-bars";
import { CUADRILLAS, type PrecioCuadrilla, type PrecioMaterial } from "@/lib/types";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function CuadrillasPage() {
  const { rdos } = useStore();
  const [mes, setMes] = useState(mesActual());

  const meses = useMemo(() => {
    const s = new Set(rdos.map((r) => r.fecha.slice(0, 7)));
    return Array.from(s).sort().reverse();
  }, [rdos]);

  const stats = useMemo(() => statsPorCuadrilla(rdos, mes, preciosC as PrecioCuadrilla[], preciosM as PrecioMaterial[]), [rdos, mes]);

  const idxMesAnt = meses.indexOf(mes) + 1;
  const mesAnterior = meses[idxMesAnt];
  const statsAnt = useMemo(
    () => mesAnterior ? statsPorCuadrilla(rdos, mesAnterior, preciosC as PrecioCuadrilla[], preciosM as PrecioMaterial[]) : [],
    [rdos, mesAnterior]
  );

  const tabla = useMemo(() => {
    const meses6 = resumenMensual(rdos, preciosC as PrecioCuadrilla[], preciosM as PrecioMaterial[]).slice(-6).map((r) => r.mes);
    return CUADRILLAS.map((c) => {
      const row: Record<string, string | number> = { cuadrilla: c };
      for (const m of meses6) {
        const s = statsPorCuadrilla(rdos, m, preciosC as PrecioCuadrilla[], preciosM as PrecioMaterial[]).find((x) => x.cuadrilla === c);
        row[m] = s?.costoM2 ?? 0;
      }
      return { row, meses6 };
    });
  }, [rdos]);

  const meses6 = tabla[0]?.meses6 ?? [];

  const chartData = useMemo(() => {
    return meses6.map((m) => {
      const stats = statsPorCuadrilla(rdos, m, preciosC as PrecioCuadrilla[], preciosM as PrecioMaterial[]);
      const row: Record<string, string | number> = { mes: m };
      for (const c of CUADRILLAS) row[c] = stats.find((s) => s.cuadrilla === c)?.m2 ?? 0;
      return row;
    });
  }, [rdos, meses6]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Cuadrillas</h1>
          <p className="text-sm text-muted-foreground">Productividad y costo por cuadrilla · {fmtMes(mes)}</p>
        </div>
        <Select value={mes} onValueChange={setMes}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>{meses.map((m) => <SelectItem key={m} value={m}>{fmtMes(m)}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {CUADRILLAS.map((c) => {
          const s = stats.find((x) => x.cuadrilla === c);
          const sa = statsAnt.find((x) => x.cuadrilla === c);
          const delta = s && sa && sa.costoM2 > 0 ? (s.costoM2 - sa.costoM2) / sa.costoM2 : 0;
          const TrendIcon = delta < 0 ? TrendingDown : TrendingUp;
          const trendColor = delta < 0 ? "text-success" : delta > 0 ? "text-destructive" : "text-muted-foreground";
          return (
            <Card key={c}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {c[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{c}</p>
                    <p className="text-xs text-muted-foreground">{s?.rdos ?? 0} reportes</p>
                  </div>
                </div>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">M² del mes</dt><dd className="tabular-nums">{fmtM2(s?.m2 ?? 0)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Costo / m²</dt><dd className="tabular-nums">{fmtARS(s?.costoM2 ?? 0)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">M² / día</dt><dd className="tabular-nums">{(s?.m2PorDia ?? 0).toFixed(1)}</dd></div>
                </dl>
                {sa && delta !== 0 && (
                  <p className={`flex items-center gap-1 text-xs mt-3 ${trendColor}`}>
                    <TrendIcon className="h-3 w-3" />
                    {Math.abs(delta * 100).toFixed(1)}% vs mes anterior
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <M2CuadrillaBars data={chartData} cuadrillas={CUADRILLAS as unknown as string[]} />

      <Card>
        <CardHeader><CardTitle className="text-base">Costo / m² por cuadrilla por mes</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuadrilla</TableHead>
                  {meses6.map((m) => <TableHead key={m} className="text-right">{fmtMes(m)}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tabla.map(({ row }) => (
                  <TableRow key={row.cuadrilla as string}>
                    <TableCell className="font-medium">{row.cuadrilla}</TableCell>
                    {meses6.map((m) => <TableCell key={m} className="text-right tabular-nums">{(row[m] as number) > 0 ? fmtARS(row[m] as number) : "—"}</TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 16.2: Smoke test y commit**

```bash
npm run dev
```

```bash
git add app/\(app\)/cuadrillas/
git commit -m "feat(cuadrillas): cards productividad + tabla costo/m² histórico"
```

---

## Task 17: Página Resumen Mensual

**Files:**
- Create: `app/(app)/resumen/page.tsx`

- [ ] **Step 17.1: Crear `app/(app)/resumen/page.tsx`**

```tsx
"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { resumenMensual } from "@/lib/calc";
import preciosC from "@/data/precios-cuadrilla.json";
import preciosM from "@/data/precios-material.json";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fmtARS, fmtM2, fmtMes } from "@/lib/formatters";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { PrecioCuadrilla, PrecioMaterial } from "@/lib/types";

export default function ResumenPage() {
  const { rdos } = useStore();
  const resumen = useMemo(() => resumenMensual(rdos, preciosC as PrecioCuadrilla[], preciosM as PrecioMaterial[]), [rdos]);

  const promCostoM2 = resumen.length > 0
    ? resumen.reduce((s, r) => s + r.costoM2, 0) / resumen.length
    : 0;

  const totalM2 = resumen.reduce((s, r) => s + r.m2, 0);
  const totalCosto = resumen.reduce((s, r) => s + r.costoTotal, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Resumen mensual</h1>
          <p className="text-sm text-muted-foreground">Agregaciones por mes calculadas en vivo desde los RDOs.</p>
        </div>
        <Button variant="outline" onClick={() => toast.info("Exportar PDF — disponible en la versión completa")}>
          <Download className="h-4 w-4 mr-2" />Exportar PDF
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">RDOs</TableHead>
                  <TableHead className="text-right">M²</TableHead>
                  <TableHead className="text-right">MO</TableHead>
                  <TableHead className="text-right">Materiales</TableHead>
                  <TableHead className="text-right">Costo total</TableHead>
                  <TableHead className="text-right">Costo / m²</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumen.map((r) => {
                  const desviado = Math.abs(r.costoM2 - promCostoM2) > promCostoM2 * 0.2;
                  return (
                    <TableRow key={r.mes}>
                      <TableCell className="font-medium">{fmtMes(r.mes)}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.rdos}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtM2(r.m2)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtARS(r.costoMO)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtARS(r.costoMateriales)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{fmtARS(r.costoTotal)}</TableCell>
                      <TableCell className={`text-right tabular-nums ${desviado ? "text-warning font-semibold" : ""}`}>{fmtARS(r.costoM2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell />
                  <TableCell className="text-right tabular-nums font-semibold">{fmtM2(totalM2)}</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right tabular-nums font-semibold">{fmtARS(totalCosto)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{fmtARS(promCostoM2)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Costos / m² resaltados en ámbar son los que se desvían más de ±20% del promedio histórico.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 17.2: Smoke test y commit**

```bash
npm run dev
```

```bash
git add app/\(app\)/resumen/
git commit -m "feat(resumen): tabla mensual + alertas costo/m² desviado"
```

---

## Task 18: Página Finanzas

**Files:**
- Create: `app/(app)/finanzas/page.tsx`

- [ ] **Step 18.1: Crear `app/(app)/finanzas/page.tsx`**

```tsx
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fmtARS, fmtMes, mesActual } from "@/lib/formatters";
import { EgresosStacked } from "@/components/charts/egresos-stacked";
import { KpiCard } from "@/components/kpi-card";
import egresos from "@/data/egresos.json";
import type { EgresoMensual, EgresoLinea } from "@/lib/types";

const eg = egresos as EgresoMensual[];

function totalDe(e: EgresoMensual): number {
  return [...e.impuestos, ...e.planesPago, ...e.costosFijos].reduce((s, l) => s + l.monto, 0) + e.costosVariablesEstimados;
}

export default function FinanzasPage() {
  const mes = mesActual();
  const egMes = eg.find((e) => e.mes === mes);

  const proximos30 = useMemo(() => {
    const idx = eg.findIndex((e) => e.mes === mes);
    return idx >= 0 && idx + 1 < eg.length ? totalDe(eg[idx + 1]) : 0;
  }, [mes]);

  const granVencimiento = useMemo(() => {
    const lineas = eg
      .filter((e) => e.mes >= mes)
      .flatMap((e) => [...e.impuestos, ...e.planesPago].map((l) => ({ ...l, mes: e.mes })))
      .sort((a, b) => b.monto - a.monto);
    return lineas[0];
  }, [mes]);

  const chartData = useMemo(() => eg.map((e) => ({
    mes: e.mes,
    impuestos: e.impuestos.reduce((s, l) => s + l.monto, 0),
    planesPago: e.planesPago.reduce((s, l) => s + l.monto, 0),
    costosFijos: e.costosFijos.reduce((s, l) => s + l.monto, 0),
    costosVariables: e.costosVariablesEstimados,
  })), []);

  const totalMes = egMes ? totalDe(egMes) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Finanzas</h1>
        <p className="text-sm text-muted-foreground">Cash flow proyectado · 12 meses</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <KpiCard label="Egresos del mes" value={fmtARS(totalMes)} hint={fmtMes(mes)} />
        <KpiCard label="Próximos 30 días" value={fmtARS(proximos30)} hint="mes siguiente" />
        <KpiCard
          label="Próximo gran vencimiento"
          value={granVencimiento ? fmtARS(granVencimiento.monto) : "—"}
          hint={granVencimiento ? `${granVencimiento.concepto} · ${fmtMes(granVencimiento.mes)}` : ""}
        />
      </div>

      <EgresosStacked data={chartData} />

      <Tabs defaultValue="tabla">
        <TabsList>
          <TabsTrigger value="tabla">Tabla mensual</TabsTrigger>
          <TabsTrigger value="vencimientos">Vencimientos</TabsTrigger>
        </TabsList>

        <TabsContent value="tabla" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Egresos por categoría</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mes</TableHead>
                      <TableHead className="text-right">Impuestos</TableHead>
                      <TableHead className="text-right">Planes de Pago</TableHead>
                      <TableHead className="text-right">Costos Fijos</TableHead>
                      <TableHead className="text-right">Variables</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eg.map((e) => {
                      const i = e.impuestos.reduce((s, l) => s + l.monto, 0);
                      const p = e.planesPago.reduce((s, l) => s + l.monto, 0);
                      const f = e.costosFijos.reduce((s, l) => s + l.monto, 0);
                      const v = e.costosVariablesEstimados;
                      return (
                        <TableRow key={e.mes} className={e.mes === mes ? "bg-primary/5" : ""}>
                          <TableCell className="font-medium">{fmtMes(e.mes)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtARS(i)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtARS(p)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtARS(f)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtARS(v)}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">{fmtARS(i + p + f + v)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vencimientos" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Próximos vencimientos</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {eg
                .filter((e) => e.mes >= mes)
                .slice(0, 6)
                .flatMap((e) => [...e.impuestos, ...e.planesPago].map((l: EgresoLinea) => ({ ...l, mes: e.mes })))
                .sort((a, b) => a.mes.localeCompare(b.mes))
                .map((l, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 text-sm">
                    <div>
                      <p className="font-medium">{l.concepto}</p>
                      <p className="text-xs text-muted-foreground">{fmtMes(l.mes)} {l.vencimiento ? `· vence ${l.vencimiento}` : ""}</p>
                    </div>
                    <Badge variant="outline" className="tabular-nums">{fmtARS(l.monto)}</Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 18.2: Smoke test y commit**

```bash
npm run dev
```

```bash
git add app/\(app\)/finanzas/
git commit -m "feat(finanzas): cash flow proyectado + tabs tabla/vencimientos"
```

---

## Task 19: Página Precios

**Files:**
- Create: `app/(app)/precios/page.tsx`, `components/price-history-chart.tsx`

- [ ] **Step 19.1: Crear `components/price-history-chart.tsx`**

```tsx
"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { fmtARS, fmtFecha } from "@/lib/formatters";

type Punto = { vigenciaDesde: string; precio: number };

export function PriceHistoryChart({ data }: { data: Punto[] }) {
  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="vigenciaDesde" tickFormatter={fmtFecha} stroke="var(--color-muted-foreground)" fontSize={12} />
          <YAxis tickFormatter={fmtARS} stroke="var(--color-muted-foreground)" fontSize={11} width={80} />
          <Tooltip
            formatter={(v: number) => fmtARS(v)}
            labelFormatter={fmtFecha}
            contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }}
          />
          <Line type="stepAfter" dataKey="precio" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 19.2: Crear `app/(app)/precios/page.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    for (const p of pcAll) {
      m.set(p.cuadrilla, [...(m.get(p.cuadrilla) ?? []), p]);
    }
    return m;
  }, []);

  const pmGrouped = useMemo(() => {
    const m = new Map<string, PrecioMaterial[]>();
    for (const p of pmAll) {
      m.set(p.material, [...(m.get(p.material) ?? []), p]);
    }
    return m;
  }, []);

  const histCuadrilla = selCuadrilla
    ? (pcGrouped.get(selCuadrilla) ?? []).map((p) => ({ vigenciaDesde: p.vigenciaDesde, precio: p.precioM2 }))
    : [];
  const histMaterial = selMaterial
    ? (pmGrouped.get(selMaterial) ?? []).map((p) => ({ vigenciaDesde: p.vigenciaDesde, precio: p.precio }))
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Precios</h1>
          <p className="text-sm text-muted-foreground">Costos por cuadrilla y material, versionados con vigencia desde.</p>
        </div>
        <Button variant="outline" onClick={() => toast.info("Edición — disponible en la versión completa")}>
          <Plus className="h-4 w-4 mr-2" />Nueva vigencia
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
              <CardHeader><CardTitle className="text-base">Costos por cuadrilla</CardTitle></CardHeader>
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
                      <TableRow key={i} className="cursor-pointer" onClick={() => setSelCuadrilla(p.cuadrilla)}>
                        <TableCell className="font-medium">{p.cuadrilla}</TableCell>
                        <TableCell className="tabular-nums">{fmtFecha(p.vigenciaDesde)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtARS(p.precioM2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Histórico {selCuadrilla ? `· ${selCuadrilla}` : ""}</CardTitle></CardHeader>
              <CardContent>
                {!selCuadrilla && <p className="text-sm text-muted-foreground">Click en una fila para ver la evolución del costo.</p>}
                {selCuadrilla && histCuadrilla.length > 0 && <PriceHistoryChart data={histCuadrilla} />}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="materiales" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Costos por material</CardTitle></CardHeader>
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
                      <TableRow key={i} className="cursor-pointer" onClick={() => setSelMaterial(p.material)}>
                        <TableCell className="font-medium">{p.material}</TableCell>
                        <TableCell className="tabular-nums">{fmtFecha(p.vigenciaDesde)}</TableCell>
                        <TableCell>{p.unidad}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtARS(p.precio)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Histórico {selMaterial ? `· ${selMaterial}` : ""}</CardTitle></CardHeader>
              <CardContent>
                {!selMaterial && <p className="text-sm text-muted-foreground">Click en una fila para ver la evolución del costo.</p>}
                {selMaterial && histMaterial.length > 0 && <PriceHistoryChart data={histMaterial} />}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 19.3: Smoke test y commit**

```bash
npm run dev
```

```bash
git add components/price-history-chart.tsx app/\(app\)/precios/
git commit -m "feat(precios): catálogo versionado + histórico de precios"
```

---

## Task 20: Polish — empty states, skeletons, OG image, README

**Files:**
- Create: `README.md`, `public/og.png` (placeholder)
- Modify: `app/(app)/page.tsx` y demás (agregar skeletons donde aplique)

- [ ] **Step 20.1: Crear `README.md`**

```markdown
# ObraTrack

Software de gestión para empresas constructoras de veredas y obra civil menor.

**Demo en vivo**: https://obratrack.vercel.app *(actualizar con URL real)*

## Qué resuelve

Reemplaza el control en Excel multi-hoja por una aplicación web con:

- **RDO (Reporte Diario de Obra)**: carga rápida, filtros, materiales y costo por día
- **Obras**: vista por frente con timeline y materiales acumulados
- **Cuadrillas**: comparativa de productividad y costo/m²
- **Resumen mensual**: agregaciones automáticas con alertas de desvío
- **Finanzas**: cash flow proyectado a 12 meses (impuestos + planes de pago + fijos + variables)
- **Precios**: catálogo versionado con histórico

Adicional: mapa de obras activas en CABA, dashboard ejecutivo con KPIs, dark mode.

## Stack

- Next.js 15 + TypeScript + App Router
- Tailwind v4 + shadcn/ui
- Recharts (charts) · React-Leaflet (mapa)
- next-themes (dark/light)
- Vitest (tests de la capa de cálculo)
- Deploy: Vercel

## Correr local

```bash
npm install
npm run dev
```

## Re-seedear desde un xlsx

```bash
python3 scripts/seed-from-xlsx.py /path/to/Veredas.xlsx
npm run geocode
```

## Estado

Demo. Sin backend ni persistencia: el formulario de RDO simula guardar (los datos se reinician al recargar). En la versión productiva, la capa de cálculo en `lib/calc.ts` se reutiliza tal cual contra una DB.
```

- [ ] **Step 20.2: Crear `public/og.png` (placeholder)**

Por ahora dejar un placeholder simple:

```bash
mkdir -p public
# Crear un PNG 1200x630 minimalista usando ImageMagick o sips si está disponible
# Si no, dejar vacío y reemplazar en post
echo "(placeholder OG image)" > public/og.placeholder.txt
```

Agregar en `app/layout.tsx` el campo `openGraph` en `metadata` (placeholder por si después se agrega la imagen):

```tsx
export const metadata: Metadata = {
  title: "ObraTrack",
  description: "Software de gestión para empresas constructoras de veredas y obra civil menor.",
  openGraph: {
    title: "ObraTrack — Gestión de obra civil",
    description: "Reemplazá el Excel por un sistema profesional. Demo deployada.",
    type: "website",
  },
};
```

- [ ] **Step 20.3: Verificar build**

```bash
npm run build
```

Expected: build pasa sin errores ni warnings críticos.

- [ ] **Step 20.4: Commit**

```bash
git add README.md public/ app/layout.tsx
git commit -m "feat(polish): README + OG metadata + placeholder image"
```

---

## Task 21: Push a github.com/maachii22/obratrack

**Files:** ninguno

- [ ] **Step 21.1: Crear repo remoto via gh CLI**

```bash
gh repo create maachii22/obratrack --public --source=. --remote=origin --description="Demo: software de gestión para constructora de veredas (CABA)"
```

Si pide login: `gh auth login`. Si la cuenta `maachii22` no es la default, alternativa:

```bash
git remote add origin https://github.com/maachii22/obratrack.git
gh repo create maachii22/obratrack --public --source=. --description="Demo: software de gestión para constructora de veredas (CABA)" --push
```

- [ ] **Step 21.2: Push**

```bash
git push -u origin main
```

Expected: push exitoso, repo visible en `https://github.com/maachii22/obratrack`.

- [ ] **Step 21.3: Verificar**

```bash
git remote -v
gh repo view maachii22/obratrack --web   # opcional, abre en browser
```

---

## Task 22: Deploy a Vercel

**Files:** ninguno

- [ ] **Step 22.1: Importar en Vercel**

Desde la cuenta de Tomás (maachii22 / Weedable team según contexto):

```bash
npx vercel link
npx vercel --prod
```

O desde el dashboard web: New Project → Import `maachii22/obratrack` → Framework: Next.js (auto) → Deploy.

Expected: deploy exitoso, URL `obratrack-<hash>.vercel.app` o `obratrack.vercel.app` si está disponible.

- [ ] **Step 22.2: Smoke test del deploy**

Abrir la URL y verificar:
- Dashboard carga con KPIs y mapa.
- Sidebar funciona en desktop y mobile.
- Dark/light toggle.
- Formulario RDO agrega item al state.
- Todas las pantallas accesibles.

- [ ] **Step 22.3: Actualizar README con URL real**

Editar `README.md` reemplazando el placeholder de la URL.

```bash
git add README.md
git commit -m "docs: URL de deploy en README"
git push
```

---

## Self-Review

**Spec coverage check** (cada sección del spec → task que la implementa):

| Spec section | Task |
|--------------|------|
| §5 Stack: Next.js 15 + Tailwind v4 + shadcn | T1, T2 |
| §5 Stack: Recharts + Leaflet + next-themes + Vitest | T2 |
| §6 Modelo de datos (TS) | T3 |
| §7.1 Dashboard | T13 |
| §7.2 RDO | T14 |
| §7.3 Obras | T15 |
| §7.4 Cuadrillas | T16 |
| §7.5 Resumen | T17 |
| §7.6 Finanzas | T18 |
| §7.7 Precios | T19 |
| §8 Estructura de carpetas | T1, T2, ongoing |
| §9 Datos simulados + seed + sintéticos abr-may | T4 |
| §9 Geocoding build-time | T5 |
| §10 Diseño visual (paleta, tema, mobile) | T1 (tokens), T2 (shadcn), T8 (theme), T9 (sidebar mobile) |
| §11 Testing calc.ts | T6 |
| §12 Deploy + repo | T21, T22 |
| §13 Riesgos: lazy-load mapa | T13 (uses dynamic + ssr:false) |
| §13 Riesgos: fallback geocoding | T5 (FALLBACKS) |
| §13 Riesgos: datos sintéticos abr-may | T4 |

**Placeholder scan:** revisado — no hay TBD/TODO sin contenido. Cada step muestra el código completo necesario.

**Type consistency:** revisado:
- `RDO`, `Materiales`, `PrecioCuadrilla`, `PrecioMaterial`, `EgresoMensual`, `EgresoLinea` definidos en T3 y consistentes en T6, T13–T19.
- `costoRDO`, `resumenMensual`, `statsPorCuadrilla`, `statsPorObra`, `ResumenMes`, `StatsCuadrilla` definidos en T6 y consumidos consistentemente.
- `useStore` definido en T9 y consumido en T13–T19 con la misma firma.
- Formatters `fmtARS`, `fmtM2`, `fmtFecha`, `fmtMes`, `mesActual` definidos en T7 y consumidos consistentemente.
- `MATERIALES_KEYS` y `CUADRILLAS` definidos en T3 y consumidos en T4 (parser), T14 (form), T16 (cuadrillas page).

Sin gaps detectados. Plan listo para ejecutar.

---

## Execution Handoff

Plan complete y guardado en `docs/superpowers/plans/2026-05-01-obratrack-demo.md`. Dos opciones de ejecución:

**1. Subagent-Driven (recomendado)** — Despacho un sub-agente fresco por tarea, revisión entre tareas, iteración rápida.

**2. Inline Execution** — Ejecuto las tareas en esta sesión, batch con checkpoints de revisión.

¿Cuál preferís?
