"use client";

import { useEffect, useRef } from "react";
import L, { type LatLngExpression, type Map as LeafletMap } from "leaflet";
import { Panel } from "@/components/ui/Panel";
import { missionWaypoints } from "@/lib/telemetry";

type LiveMapProps = {
  position: [number, number];
  path: [number, number][];
};

const droneIcon = L.divIcon({
  className: "drone-marker",
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const waypointIcon = L.divIcon({
  className: "waypoint-marker",
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

export function LiveMap({ position, path }: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const droneRef = useRef<L.Marker | null>(null);
  const pathRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      center: position,
      zoom: 15,
      zoomControl: false,
      attributionControl: true
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap &copy; CARTO"
    }).addTo(map);

    missionWaypoints.forEach((waypoint, index) => {
      L.marker(waypoint as LatLngExpression, { icon: waypointIcon })
        .bindTooltip(`WP-${String(index + 1).padStart(2, "0")}`, {
          direction: "top",
          className: "text-xs"
        })
        .addTo(map);
    });

    pathRef.current = L.polyline(path, {
      color: "#20f6ff",
      weight: 3,
      opacity: 0.9,
      lineCap: "round"
    }).addTo(map);

    droneRef.current = L.marker(position, { icon: droneIcon }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      droneRef.current = null;
      pathRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !droneRef.current || !pathRef.current) {
      return;
    }

    droneRef.current.setLatLng(position);
    pathRef.current.setLatLngs(path);
    mapRef.current.panTo(position, { animate: true, duration: 0.7 });
  }, [position, path]);

  return (
    <Panel
      title="Live Mission Map"
      eyebrow="GPS Flight Path"
      action={<span className="rounded-[6px] bg-mint/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-mint">Tracking</span>}
      className="h-full overflow-hidden"
    >
      <div className="relative h-[430px] min-h-[360px] lg:h-[calc(100%-57px)]">
        <div ref={containerRef} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-radar-grid bg-[length:44px_44px] opacity-35" />
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-[8px] border border-white/10 bg-black/45 px-3 py-2 backdrop-blur-xl">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Mission</p>
          <p className="mt-1 font-mono text-xs text-cyanGlow">SF-ORBIT / GRID-7</p>
        </div>
      </div>
    </Panel>
  );
}
