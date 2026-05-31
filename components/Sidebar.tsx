import { BatteryCharging, Gauge, Map, Radio, Settings, ClipboardList, Route, SlidersHorizontal } from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: Gauge, active: true },
  { label: "Flight Logs", icon: ClipboardList },
  { label: "Missions", icon: Route },
  { label: "Drone Settings", icon: Settings }
];

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-[246px] shrink-0 border-r border-white/10 bg-black/30 px-4 py-5 backdrop-blur-2xl lg:block">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-[8px] border border-cyanGlow/30 bg-cyanGlow/10 text-cyanGlow shadow-neon">
          <Map size={20} />
        </div>
        <div>
          <p className="text-sm font-bold tracking-[0.18em] text-white">ASTRAOPS</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Drone Command</p>
        </div>
      </div>

      <nav className="mt-9 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`flex h-11 w-full items-center gap-3 rounded-[8px] px-3 text-left text-sm font-medium transition ${
              item.active
                ? "border border-cyanGlow/30 bg-cyanGlow/10 text-white shadow-neon"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
            }`}
          >
            <item.icon size={17} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-10 rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          <span>Link</span>
          <Radio size={15} className="text-mint" />
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-cyanGlow to-mint shadow-[0_0_18px_rgba(32,246,255,0.5)]" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div className="rounded-[6px] bg-white/[0.04] p-2">
            <BatteryCharging size={15} className="mb-1 text-mint" />
            <span>6S LiDAR</span>
          </div>
          <div className="rounded-[6px] bg-white/[0.04] p-2">
            <SlidersHorizontal size={15} className="mb-1 text-cyanGlow" />
            <span>Armed</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
