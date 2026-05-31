"use client";

import { Aperture, CircleDot, Maximize2, ScanLine } from "lucide-react";
import { motion } from "framer-motion";
import type { TelemetryPoint } from "@/lib/telemetry";
import { Panel } from "@/components/ui/Panel";

type CameraFeedProps = {
  telemetry: TelemetryPoint;
};

export function CameraFeed({ telemetry }: CameraFeedProps) {
  return (
    <Panel
      title="FPV Camera"
      eyebrow="Forward Optics"
      action={<Maximize2 size={16} className="text-slate-400" />}
      className="overflow-hidden"
    >
      <div className="scanline relative h-[278px] overflow-hidden bg-[#071018]">
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundPosition: ["0% 0%", "100% 70%"]
          }}
          transition={{ duration: 9, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(32,246,255,0.08), transparent 26%), linear-gradient(160deg, transparent 0 38%, rgba(66,255,191,0.08) 39% 42%, transparent 43% 100%), radial-gradient(circle at 65% 34%, rgba(32,246,255,0.24), transparent 7%), linear-gradient(170deg, #101923 0%, #0b1118 48%, #05070b 100%)",
            backgroundSize: "140% 140%"
          }}
        />
        <div className="absolute inset-x-12 top-1/2 h-px bg-cyanGlow/55" />
        <div className="absolute inset-y-9 left-1/2 w-px bg-cyanGlow/45" />
        <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyanGlow/40" />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyanGlow/20" />

        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-[6px] border border-redAlert/30 bg-redAlert/10 px-2.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-redAlert">
          <CircleDot size={13} className="animate-pulse" />
          Rec
        </div>
        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-[6px] border border-white/10 bg-black/35 px-2.5 py-1.5 text-xs text-slate-300 backdrop-blur-xl">
          <Aperture size={14} className="text-cyanGlow" />
          4K / 60
        </div>
        <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2 text-[11px]">
          <HudValue label="ALT" value={`${telemetry.altitude}m`} />
          <HudValue label="SPD" value={`${telemetry.speed}km/h`} />
          <HudValue label="SIG" value={`${telemetry.signal}%`} />
        </div>
        <ScanLine className="absolute bottom-20 right-5 text-cyanGlow/70" size={20} />
      </div>
    </Panel>
  );
}

function HudValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[6px] border border-white/10 bg-black/35 px-2 py-1.5 backdrop-blur-xl">
      <p className="font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
