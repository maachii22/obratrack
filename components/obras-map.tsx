"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import frentes from "@/data/frentes-geocoded.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { useTheme } from "next-themes";
import type { RDO } from "@/lib/types";
import { MapPin } from "lucide-react";

type Props = {
  rdos: RDO[];
  mes?: string;
};

type Frente = { direccion: string; lat: number; lng: number };

export function ObrasMap({ rdos, mes }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const points = useMemo(() => {
    const filtered = mes ? rdos.filter((r) => r.fecha.startsWith(mes)) : rdos;
    const byFrente = new Map<string, { m2: number; cuadrillas: Set<string> }>();
    for (const r of filtered) {
      const cur = byFrente.get(r.frente) || { m2: 0, cuadrillas: new Set<string>() };
      cur.m2 += r.m2;
      cur.cuadrillas.add(r.cuadrilla);
      byFrente.set(r.frente, cur);
    }
    return (frentes as Frente[])
      .filter((f) => byFrente.has(f.direccion))
      .map((f) => ({
        ...f,
        m2: byFrente.get(f.direccion)!.m2,
        cuadrillas: Array.from(byFrente.get(f.direccion)!.cuadrillas).join(", "),
      }));
  }, [rdos, mes]);

  // Tiles B&N de CartoDB (sin API key)
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png";
  const labelsUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base leading-tight">Obras activas</CardTitle>
            <p className="text-xs text-muted-foreground">
              {points.length} frentes con actividad
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[280px] sm:h-[340px]" key={isDark ? "dark" : "light"}>
          <MapContainer
            center={[-34.5627, -58.4583]}
            zoom={13}
            style={{ height: "100%", width: "100%", background: "var(--color-muted)" }}
            scrollWheelZoom={false}
            attributionControl={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap &copy; CARTO'
              url={tileUrl}
              subdomains="abcd"
            />
            <TileLayer url={labelsUrl} subdomains="abcd" />
            {points.map((p) => (
              <CircleMarker
                key={p.direccion}
                center={[p.lat, p.lng]}
                radius={5 + Math.min(12, p.m2 / 25)}
                pathOptions={{
                  color: "var(--color-primary)",
                  weight: 2,
                  fillColor: "var(--color-primary)",
                  fillOpacity: 0.45,
                }}
              >
                <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                  <div className="text-xs leading-tight">
                    <div className="font-semibold mb-0.5">{p.direccion}</div>
                    <div className="text-[11px] opacity-80">{p.cuadrillas}</div>
                    <div className="text-[11px] font-medium mt-0.5">
                      {p.m2.toFixed(1)} m²
                    </div>
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
