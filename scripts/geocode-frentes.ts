import { promises as fs } from "fs";
import path from "path";

type RDO = { frente: string };

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const SLEEP_MS = 1100;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const FALLBACK_BARRIOS: Record<string, [number, number]> = {
  belgrano: [-34.5627, -58.4583],
  nuñez: [-34.5469, -58.4615],
  saavedra: [-34.5556, -58.4862],
  colegiales: [-34.5731, -58.4488],
  default: [-34.5627, -58.4583],
};

async function geocode(direccion: string): Promise<[number, number] | null> {
  const q = `${direccion}, CABA, Argentina`;
  const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=1`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ObraTrack-Demo/1.0 (contacto@obratrack.demo)" },
    });
    if (!res.ok) return null;
    const arr = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!arr.length) return null;
    const lat = parseFloat(arr[0].lat);
    const lon = parseFloat(arr[0].lon);
    if (lat < -35 || lat > -34 || lon < -59 || lon > -58) return null;
    return [lat, lon];
  } catch {
    return null;
  }
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const rdosPath = path.join(root, "data", "rdos.json");
  const outPath = path.join(root, "data", "frentes-geocoded.json");

  const rdos: RDO[] = JSON.parse(await fs.readFile(rdosPath, "utf8"));
  const frentes = Array.from(new Set(rdos.map((r) => r.frente).filter(Boolean)));

  let cache: Record<string, [number, number]> = {};
  try {
    const existing = JSON.parse(await fs.readFile(outPath, "utf8")) as { direccion: string; lat: number; lng: number }[];
    cache = existing.reduce((acc, f) => {
      acc[f.direccion] = [f.lat, f.lng];
      return acc;
    }, {} as Record<string, [number, number]>);
  } catch {
    // no cache yet
  }

  const out: { direccion: string; lat: number; lng: number }[] = [];
  let hits = 0;
  let fallbacks = 0;
  let cached = 0;
  for (const dir of frentes) {
    if (cache[dir]) {
      out.push({ direccion: dir, lat: cache[dir][0], lng: cache[dir][1] });
      cached++;
      continue;
    }
    process.stdout.write(`  geocoding: ${dir.padEnd(40)} ... `);
    let coords = await geocode(dir);
    if (coords) {
      hits++;
      console.log(`OK [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]`);
    } else {
      const jitter = (Math.random() - 0.5) * 0.02;
      const [lat, lng] = FALLBACK_BARRIOS.default;
      coords = [lat + jitter, lng + jitter];
      fallbacks++;
      console.log("FALLBACK");
    }
    out.push({ direccion: dir, lat: coords[0], lng: coords[1] });
    await sleep(SLEEP_MS);
  }

  await fs.writeFile(outPath, JSON.stringify(out, null, 2));
  console.log(`\nDONE: ${out.length} frentes (cached: ${cached}, hits: ${hits}, fallbacks: ${fallbacks})`);
  console.log(`Output: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
