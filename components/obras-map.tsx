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

type Frente = { direccion: string; lat: number; lng: number };

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
    return (frentes as Frente[])
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
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {points.map((p) => (
              <CircleMarker
                key={p.direccion}
                center={[p.lat, p.lng]}
                radius={6 + Math.min(10, p.m2 / 30)}
                pathOptions={{
                  color: "var(--color-primary)",
                  fillColor: "var(--color-primary)",
                  fillOpacity: 0.6,
                }}
              >
                <Tooltip>
                  <div className="text-xs leading-tight">
                    <strong>{p.direccion}</strong>
                    <br />
                    {p.cuadrillas}
                    <br />
                    {p.m2.toFixed(1)} m²
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
