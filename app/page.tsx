"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BatteryFull,
  CircleHelp,
  Compass,
  Crosshair,
  Flag,
  Gauge,
  Grid3X3,
  Home,
  Lock,
  MapPin,
  Menu,
  Pause,
  Plane,
  Play,
  Route,
  Satellite,
  Save,
  Settings,
  SlidersHorizontal,
  Trash2,
  Wifi
} from "lucide-react";
import { useTelemetry } from "@/hooks/useTelemetry";
import type { TelemetryPoint } from "@/lib/telemetry";

const navItems = [
  ["Overview", Home],
  ["Routes", Route],
  ["Logbook", Grid3X3],
  ["Options", Settings],
  ["Help", CircleHelp]
] as const;

const sideTools = [MapPin, Satellite, Route, Settings];

type PageId = (typeof navItems)[number][0];

type Waypoint = {
  id: string;
  x: number;
  y: number;
  altitude: number;
};

type SavedMission = {
  id: string;
  name: string;
  savedAt: string;
  waypointCount: number;
  distanceMeters: number;
  flightTimeSeconds: number;
  batteryEstimate: number;
  waypoints: Waypoint[];
};

const initialWaypoints: Waypoint[] = [
  [18, 306],
  [108, 250],
  [276, 202],
  [192, 265],
  [112, 383],
  [278, 270],
  [472, 208],
  [356, 324],
  [260, 412],
  [438, 344],
  [574, 286],
  [500, 337],
  [406, 432],
  [584, 386],
  [746, 310],
  [622, 414],
  [526, 483],
  [662, 434],
  [870, 360],
  [810, 430],
  [698, 500],
  [850, 480],
  [958, 408]
].map(([x, y], index) => ({
  id: `wp-${index + 1}`,
  x,
  y,
  altitude: 118
}));

const noFlyZones = [
  { id: "NFZ-A", x: 630, y: 120, width: 170, height: 110 },
  { id: "NFZ-B", x: 930, y: 300, width: 150, height: 120 }
];

const obstacleZones = [
  { id: "Tree line", x: 345, y: 398, r: 52, severity: "medium" },
  { id: "Mast cluster", x: 710, y: 438, r: 48, severity: "high" },
  { id: "Terrain rise", x: 1030, y: 212, r: 62, severity: "medium" }
];

const pxToMeters = 5.8;
const cruiseSpeedMps = 13.5;

function distanceBetween(a: Waypoint, b: Waypoint) {
  return Math.hypot(a.x - b.x, a.y - b.y) * pxToMeters;
}

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function isPointInNoFlyZone(point: Waypoint) {
  return noFlyZones.some((zone) => point.x >= zone.x && point.x <= zone.x + zone.width && point.y >= zone.y && point.y <= zone.y + zone.height);
}

function isNearObstacle(point: Waypoint) {
  return obstacleZones.some((zone) => Math.hypot(point.x - zone.x, point.y - zone.y) <= zone.r + 26);
}

export default function DashboardPage() {
  const { current, history } = useTelemetry();
  const [activePage, setActivePage] = useState<PageId>("Routes");
  const [activeTool, setActiveTool] = useState(2);
  const [waypoints, setWaypoints] = useState<Waypoint[]>(initialWaypoints);
  const [savedMissions, setSavedMissions] = useState<SavedMission[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [isMissionLocked, setIsMissionLocked] = useState(false);
  const [isMarkerFlagged, setIsMarkerFlagged] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [perpendicularLines, setPerpendicularLines] = useState(false);
  const [reverseFlight, setReverseFlight] = useState(true);
  const [showWaypoints, setShowWaypoints] = useState(true);
  const [showNoFlyZones, setShowNoFlyZones] = useState(true);
  const [showObstacleWarnings, setShowObstacleWarnings] = useState(true);
  const [replayIndex, setReplayIndex] = useState(0);
  const [draggingWaypointId, setDraggingWaypointId] = useState<string | null>(null);
  const [reorderId, setReorderId] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("kopter-mission-history");
    if (stored) {
      setSavedMissions(JSON.parse(stored) as SavedMission[]);
    }
  }, []);

  const routeDistanceMeters = useMemo(
    () => waypoints.reduce((total, point, index) => (index === 0 ? 0 : total + distanceBetween(waypoints[index - 1], point)), 0),
    [waypoints]
  );
  const flightTimeSeconds = Math.max(0, routeDistanceMeters / cruiseSpeedMps + waypoints.length * 5);
  const batteryEstimate = Math.min(96, Math.round(routeDistanceMeters * 0.006 + waypoints.length * 0.85 + 7));
  const missionWarnings = useMemo(() => {
    const warnings: string[] = [];
    const noFlyCount = showNoFlyZones ? waypoints.filter(isPointInNoFlyZone).length : 0;
    const obstacleCount = showObstacleWarnings ? waypoints.filter(isNearObstacle).length : 0;

    if (noFlyCount > 0) warnings.push(`${noFlyCount} waypoint${noFlyCount > 1 ? "s" : ""} inside no-fly zone`);
    if (obstacleCount > 0) warnings.push(`${obstacleCount} waypoint${obstacleCount > 1 ? "s" : ""} near terrain or obstacles`);
    if (batteryEstimate > 72) warnings.push("Battery reserve below mission policy");
    if (warnings.length === 0) warnings.push("Route clear for pre-flight review");

    return warnings;
  }, [batteryEstimate, showNoFlyZones, showObstacleWarnings, waypoints]);
  const replayWaypoint = waypoints[Math.min(replayIndex, waypoints.length - 1)] ?? waypoints[0];

  useEffect(() => {
    if (!isReplayMode || isPaused || waypoints.length === 0) return;

    const replay = window.setInterval(() => {
      setReplayIndex((index) => (index + 1) % waypoints.length);
    }, 850);

    return () => window.clearInterval(replay);
  }, [isPaused, isReplayMode, waypoints.length]);

  function handleAddWaypoint(x: number, y: number) {
    if (isMissionLocked) return;
    setWaypoints((currentWaypoints) => [
      ...currentWaypoints,
      {
        id: `wp-${Date.now()}`,
        x,
        y,
        altitude: 118
      }
    ]);
  }

  function handleMoveWaypoint(id: string, x: number, y: number) {
    if (isMissionLocked) return;
    setWaypoints((currentWaypoints) =>
      currentWaypoints.map((point) => (point.id === id ? { ...point, x, y } : point))
    );
  }

  function handleDeleteWaypoint(id: string) {
    if (isMissionLocked) return;
    setWaypoints((currentWaypoints) => currentWaypoints.filter((point) => point.id !== id));
  }

  function handleReorder(targetId: string) {
    if (isMissionLocked) return;
    if (!reorderId || reorderId === targetId) return;
    setWaypoints((currentWaypoints) => {
      const fromIndex = currentWaypoints.findIndex((point) => point.id === reorderId);
      const toIndex = currentWaypoints.findIndex((point) => point.id === targetId);
      if (fromIndex < 0 || toIndex < 0) return currentWaypoints;
      const next = [...currentWaypoints];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function handleShiftWaypoint(id: string, direction: -1 | 1) {
    if (isMissionLocked) return;
    setWaypoints((currentWaypoints) => {
      const index = currentWaypoints.findIndex((point) => point.id === id);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= currentWaypoints.length) return currentWaypoints;
      const next = [...currentWaypoints];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }

  function handleSaveMission() {
    const mission: SavedMission = {
      id: `mission-${Date.now()}`,
      name: `Routes No ${savedMissions.length + 17}`,
      savedAt: new Date().toLocaleString("en-US", { hour12: false }),
      waypointCount: waypoints.length,
      distanceMeters: routeDistanceMeters,
      flightTimeSeconds,
      batteryEstimate,
      waypoints
    };
    const next = [mission, ...savedMissions].slice(0, 8);
    setSavedMissions(next);
    setSelectedMissionId(mission.id);
    window.localStorage.setItem("kopter-mission-history", JSON.stringify(next));
  }

  function handleLoadMission(mission: SavedMission) {
    setWaypoints(mission.waypoints);
    setSelectedMissionId(mission.id);
    setReplayIndex(0);
  }

  function handleResetMission() {
    setWaypoints(initialWaypoints);
    setReplayIndex(0);
    setSelectedMissionId(null);
    setIsReplayMode(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0d0d0d] text-[#f2f2f2]">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-55 grayscale-[68%] blur-[1.5px] brightness-[0.62] contrast-[0.82]"
        style={{ backgroundImage: "url('/kopter-aerial-bg.png')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,11,0.9)_0%,rgba(17,17,17,0.48)_22%,rgba(8,8,8,0.24)_54%,rgba(8,8,8,0.68)_100%)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <TopNav activePage={activePage} onPageChange={setActivePage} telemetry={current} />
        <RouteControls
          batteryEstimate={batteryEstimate}
          flightTimeSeconds={flightTimeSeconds}
          isMarkerFlagged={isMarkerFlagged}
          isMissionLocked={isMissionLocked}
          isPaused={isPaused}
          onFlagToggle={() => setIsMarkerFlagged((value) => !value)}
          onLockToggle={() => setIsMissionLocked((value) => !value)}
          onPauseToggle={() => setIsPaused((value) => !value)}
          onPerpendicularToggle={() => setPerpendicularLines((value) => !value)}
          onResetMission={handleResetMission}
          onReverseToggle={() => setReverseFlight((value) => !value)}
          onSaveMission={handleSaveMission}
          onShowWaypointsToggle={() => setShowWaypoints((value) => !value)}
          perpendicularLines={perpendicularLines}
          reverseFlight={reverseFlight}
          routeDistanceMeters={routeDistanceMeters}
          showWaypoints={showWaypoints}
          telemetry={current}
          waypointCount={waypoints.length}
        />

        <section className="relative min-h-[760px] flex-1 overflow-hidden md:min-h-[calc(100vh-286px)]">
          <ToolRail
            activeTool={activeTool}
            onToolSelect={(index) => {
              setActiveTool(index);
              if (index === 0) setActivePage("Overview");
              if (index === 2) setActivePage("Routes");
              if (index === 3) setActivePage("Options");
            }}
          />
          <LeftTelemetry telemetry={current} />
          <MissionCanvas
            draggingWaypointId={draggingWaypointId}
            onAddWaypoint={handleAddWaypoint}
            onMoveWaypoint={handleMoveWaypoint}
            replayWaypoint={replayWaypoint}
            setDraggingWaypointId={setDraggingWaypointId}
            showNoFlyZones={showNoFlyZones}
            showObstacleWarnings={showObstacleWarnings}
            telemetry={current}
            showWaypoints={showWaypoints}
            waypoints={waypoints}
          />
          <MissionPlannerPanel
            batteryEstimate={batteryEstimate}
            flightTimeSeconds={flightTimeSeconds}
            isReplayMode={isReplayMode}
            missionWarnings={missionWarnings}
            onDeleteWaypoint={handleDeleteWaypoint}
            onDropWaypoint={handleReorder}
            onLoadMission={handleLoadMission}
            onReplayToggle={() => {
              setReplayIndex(0);
              setIsReplayMode((value) => !value);
            }}
            onReorderStart={setReorderId}
            onSaveMission={handleSaveMission}
            onShiftWaypoint={handleShiftWaypoint}
            routeDistanceMeters={routeDistanceMeters}
            savedMissions={savedMissions}
            selectedMissionId={selectedMissionId}
            waypointCount={waypoints.length}
            waypoints={waypoints}
          />
          <MapWidgets telemetry={current} history={history} />
          {activePage !== "Routes" && (
            <PageOverlay
              activePage={activePage}
              batteryEstimate={batteryEstimate}
              current={current}
              flightTimeSeconds={flightTimeSeconds}
              missionWarnings={missionWarnings}
              onLoadMission={handleLoadMission}
              onPageChange={setActivePage}
              onPerpendicularToggle={() => setPerpendicularLines((value) => !value)}
              onReverseToggle={() => setReverseFlight((value) => !value)}
              onNoFlyToggle={() => setShowNoFlyZones((value) => !value)}
              onObstacleToggle={() => setShowObstacleWarnings((value) => !value)}
              onShowWaypointsToggle={() => setShowWaypoints((value) => !value)}
              perpendicularLines={perpendicularLines}
              reverseFlight={reverseFlight}
              routeDistanceMeters={routeDistanceMeters}
              savedMissions={savedMissions}
              showNoFlyZones={showNoFlyZones}
              showObstacleWarnings={showObstacleWarnings}
              showWaypoints={showWaypoints}
              waypointCount={waypoints.length}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function TopNav({
  activePage,
  onPageChange,
  telemetry
}: {
  activePage: PageId;
  onPageChange: (page: PageId) => void;
  telemetry: TelemetryPoint;
}) {
  return (
    <header className="flex h-[70px] items-center justify-between border-b border-white/10 bg-[#101010]/95 px-4 shadow-[0_1px_18px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-[7px] border border-white/10 bg-[#2a2a2a] text-[#a9bbef] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
            <Plane size={22} />
          </div>
          <span className="text-xl font-medium text-[#cdd6ff]">kopter</span>
        </div>
        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map(([label, Icon]) => (
            <button
              key={label}
              onClick={() => onPageChange(label)}
              className={`flex items-center gap-2 text-sm transition ${
                activePage === label ? "text-white" : "text-[#7d7d7d] hover:text-[#cfcfcf]"
              }`}
              type="button"
            >
              <Icon size={19} strokeWidth={2.4} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-5">
        <div className="hidden items-center gap-3 rounded-[5px] bg-[#1e1e1e] px-3 py-2 md:flex">
          <div className="grid h-7 w-7 place-items-center rounded-[5px] bg-[#2b3142] text-[#a9bbef]">
            <Satellite size={17} />
          </div>
          <div>
            <p className="text-sm leading-none text-white">Modelo AX3</p>
            <p className="mt-1 text-xs text-[#8b8b8b]">Connected</p>
          </div>
        </div>
        <StatusIcon icon={BatteryFull} value={`${Math.round(telemetry.battery)}%`} />
        <StatusIcon icon={Wifi} value={`${telemetry.signal}%`} />
      </div>
    </header>
  );
}

function StatusIcon({ icon: Icon, value }: { icon: typeof BatteryFull; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-white">
      <Icon size={20} />
      <span>{value}</span>
    </div>
  );
}

function RouteControls({
  batteryEstimate,
  flightTimeSeconds,
  isMarkerFlagged,
  isMissionLocked,
  isPaused,
  onFlagToggle,
  onLockToggle,
  onPauseToggle,
  onPerpendicularToggle,
  onResetMission,
  onReverseToggle,
  onSaveMission,
  onShowWaypointsToggle,
  perpendicularLines,
  reverseFlight,
  routeDistanceMeters,
  showWaypoints,
  telemetry,
  waypointCount
}: {
  batteryEstimate: number;
  flightTimeSeconds: number;
  isMarkerFlagged: boolean;
  isMissionLocked: boolean;
  isPaused: boolean;
  onFlagToggle: () => void;
  onLockToggle: () => void;
  onPauseToggle: () => void;
  onPerpendicularToggle: () => void;
  onResetMission: () => void;
  onReverseToggle: () => void;
  onSaveMission: () => void;
  onShowWaypointsToggle: () => void;
  perpendicularLines: boolean;
  reverseFlight: boolean;
  routeDistanceMeters: number;
  showWaypoints: boolean;
  telemetry: TelemetryPoint;
  waypointCount: number;
}) {
  const routeMetrics = [
    [
      ["Name", "Routes No 17"],
      ["Camera", "Aeria X"],
      ["Plan above", "AED"],
      ["Resolution", "2.5"],
      ["Lat. overlap", "75"]
    ],
    [
      ["Area", "9.0 ha, 0.09 km"],
      ["Flight, altitude", "118.3 m/AED"],
      ["Photos", String(Math.max(waypointCount * 6, 12))],
      ["Photo interval", "50 m"],
      ["Long. overlap", "68"]
    ],
    [
      ["Image coverage", "150x100 m"],
      ["Est. flight time", formatDuration(flightTimeSeconds)],
      ["Est. flight distance", formatDistance(routeDistanceMeters)],
      ["Battery estimate", `${batteryEstimate}%`],
      ["Waypoints", String(waypointCount)]
    ]
  ];

  return (
    <section className="grid gap-5 border-b border-black/60 bg-[#1b1b1b]/94 p-2 shadow-[0_14px_26px_rgba(0,0,0,0.35)] backdrop-blur-xl xl:grid-cols-[384px_1fr_178px]">
      <div className="rounded-[8px] bg-[#262626] p-3">
        <div className="grid grid-cols-[1fr_170px] gap-3">
          <div className="flex gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[5px] bg-[#444] text-white">
              <Route size={22} />
            </div>
            <div>
              <p className="text-base font-medium">Route No 17</p>
              <p className="text-sm text-[#b8b8b8]">Horizontal mapp.</p>
              <div className="mt-6 space-y-3 text-sm text-[#b8b8b8]">
                <p>11:34</p>
                <p>2.5 cm / px</p>
                <p>9.0 ha <span className="ml-12 text-[#777]">Low</span></p>
              </div>
            </div>
          </div>
          <div>
            <div className="rounded-[6px] border-2 border-[#bfc5cd] bg-[#aeb4b8] p-2 font-mono text-sm font-bold text-[#101010] shadow-[inset_0_0_0_2px_rgba(0,0,0,0.28)]">
              <div className="flex justify-between"><span>14,3 VOLT</span><span>{telemetry.temperature}°C</span></div>
              <div className="mt-1">2663 / 4366 MAH</div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <ControlButton active={isMissionLocked} icon={Lock} onClick={onLockToggle} />
              <ControlButton active={isMarkerFlagged} icon={Flag} onClick={onFlagToggle} />
              <ControlButton active={!isPaused} icon={isPaused ? Play : Pause} onClick={onPauseToggle} />
              <ControlButton active={isPaused} icon={Play} onClick={onPauseToggle} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-x-9 gap-y-1 xl:grid-cols-3">
        {routeMetrics.map((group, groupIndex) => (
          <div key={groupIndex} className="grid content-start gap-y-1.5">
            {group.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[94px_minmax(0,1fr)] items-center gap-3">
                <span className="text-sm leading-tight text-[#858585]">{label}</span>
                <RouteInput label={label} value={value} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <ToggleRow active={perpendicularLines} label="Perpendicular lines" onClick={onPerpendicularToggle} />
        <ToggleRow active={reverseFlight} label="Reverse flight" onClick={onReverseToggle} />
        <button className="rounded-[7px] bg-[#565656] py-2 text-sm font-medium text-white" onClick={onResetMission} type="button">
          Reset progress
        </button>
        <button className="rounded-[7px] bg-[#565656] py-2 text-sm font-medium text-white" onClick={onShowWaypointsToggle} type="button">
          {showWaypoints ? "Hide waypoints" : "Show waypoints"}
        </button>
        <button
          className="flex items-center justify-center gap-2 rounded-[7px] bg-[#f3a36f] py-2 text-sm font-semibold text-[#20130d]"
          onClick={onSaveMission}
          type="button"
        >
          <Save size={15} />
          Save mission
        </button>
      </div>
    </section>
  );
}

function RouteInput({ label, value }: { label: string; value: string }) {
  const isSegmented = label === "Camera" || label === "Plan above";
  const isSlider = label.includes("overlap") || label === "Resolution";

  if (isSegmented) {
    const values = label === "Camera" ? ["Aeria X", "COD 3D"] : ["AED", "EgTI", "Prot. 3"];
    return (
      <div
        className={`grid min-h-9 overflow-hidden rounded-[7px] bg-[#303030] text-sm text-[#bfbfbf] ${
          values.length === 3 ? "grid-cols-3" : "grid-cols-2"
        }`}
      >
        {values.map((item) => (
          <span key={item} className={`grid place-items-center whitespace-nowrap px-1 text-xs ${item === value ? "bg-[#555] text-white" : ""}`}>
            {item}
          </span>
        ))}
      </div>
    );
  }

  if (isSlider) {
    return (
      <div className="flex min-h-9 items-center gap-2 rounded-[7px] bg-[#303030] px-3 text-sm text-white">
        <span className="h-5 w-8 rounded-[5px] bg-[#3d3d3d]" />
        <span className="h-px flex-1 bg-[repeating-linear-gradient(90deg,#6a6a6a_0_1px,transparent_1px_17px)]" />
        <span className="w-8 text-right">{value}</span>
      </div>
    );
  }

  return (
    <div className="min-h-9 rounded-[7px] bg-[#303030] px-4 py-2 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      {value}
    </div>
  );
}

function ControlButton({
  icon: Icon,
  active,
  onClick
}: {
  icon: typeof Lock;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`grid h-[52px] place-items-center rounded-[8px] ${active ? "bg-[#a8b8eb] text-[#101010]" : "bg-[#555] text-white"}`}
      onClick={onClick}
      type="button"
    >
      <Icon size={21} fill={Icon === Flag ? "currentColor" : "none"} />
    </button>
  );
}

function ToggleRow({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button className="flex items-center justify-between gap-3 text-sm text-[#9a9a9a]" onClick={onClick} type="button">
      <span>{label}</span>
      <span className={`relative h-9 w-10 rounded-[7px] ${active ? "bg-[#f3a36f]" : "bg-[#4a4a4a]"}`}>
        <span className={`absolute top-1 h-7 w-4 rounded-[5px] bg-[#1f1f1f] ${active ? "right-1" : "left-1"}`} />
      </span>
    </button>
  );
}

function ToolRail({
  activeTool,
  onToolSelect
}: {
  activeTool: number;
  onToolSelect: (index: number) => void;
}) {
  return (
    <aside className="absolute left-0 top-0 z-20 hidden w-[70px] flex-col items-center gap-4 bg-[#111]/80 py-5 md:flex">
      {sideTools.map((Icon, index) => (
        <button
          key={index}
          className={`grid h-12 w-12 place-items-center rounded-[7px] ${activeTool === index ? "bg-[#3b3b3b] text-white" : "text-[#8b8b8b]"}`}
          onClick={() => onToolSelect(index)}
          type="button"
        >
          <Icon size={21} />
        </button>
      ))}
    </aside>
  );
}

function LeftTelemetry({ telemetry }: { telemetry: TelemetryPoint }) {
  return (
    <aside className="absolute bottom-3 left-3 top-8 z-20 flex w-[190px] flex-col gap-3 md:left-5 md:top-[370px]">
      <PanelShell>
        <SmallMetric icon={Gauge} label="Altitude ATO" value={`${Math.max(1, Math.round(telemetry.altitude / 390))} m`} />
        <div className="mt-3 h-[145px] overflow-hidden rounded-[7px] bg-[linear-gradient(180deg,#b7c1d4,#7b9466_45%,#42582f_46%,#15210d)]">
          <div className="relative h-full bg-[linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[length:24px_100%]">
            <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 rounded-full border border-white" />
            <div className="absolute bottom-8 left-8 right-8 border-t border-dotted border-white/80" />
          </div>
        </div>
        <SmallMetric icon={Crosshair} label="Bearing" value="0'N" />
      </PanelShell>
      <PanelShell>
        <SmallMetric icon={SlidersHorizontal} label="Ground Distance" value={`${(telemetry.speed / 10).toFixed(1)} m`} />
        <SmallMetric icon={Flag} label="Wind speed" value={`${(telemetry.wind / 50).toFixed(1)} m/s`} />
        <SmallMetric icon={Gauge} label="Ground speed" value={`${Math.max(0, Math.round(telemetry.speed / 18))} m/s`} />
        <SmallMetric icon={Gauge} label="Air speed" value={`${Math.max(0, Math.round(telemetry.speed / 20))} m/s`} />
      </PanelShell>
    </aside>
  );
}

function PanelShell({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[8px] border border-white/[0.08] bg-[#151515]/92 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.42)] backdrop-blur-md">{children}</div>;
}

function SmallMetric({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[6px] bg-[#2d2d2d] text-[#d8d8d8]">
        <Icon size={17} />
      </div>
      <div>
        <p className="text-xs text-[#aaa]">{label}</p>
        <p className="text-base font-semibold leading-tight text-white">{value}</p>
      </div>
    </div>
  );
}

function MissionCanvas({
  draggingWaypointId,
  onAddWaypoint,
  onMoveWaypoint,
  replayWaypoint,
  setDraggingWaypointId,
  showNoFlyZones,
  showObstacleWarnings,
  telemetry,
  showWaypoints,
  waypoints
}: {
  draggingWaypointId: string | null;
  onAddWaypoint: (x: number, y: number) => void;
  onMoveWaypoint: (id: string, x: number, y: number) => void;
  replayWaypoint: Waypoint;
  setDraggingWaypointId: (id: string | null) => void;
  showNoFlyZones: boolean;
  showObstacleWarnings: boolean;
  telemetry: TelemetryPoint;
  showWaypoints: boolean;
  waypoints: Waypoint[];
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const routePath = waypoints
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");

  function getSvgPoint(event: PointerEvent<SVGSVGElement> | MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.max(0, Math.min(1200, ((event.clientX - rect.left) / rect.width) * 1200)),
      y: Math.max(0, Math.min(640, ((event.clientY - rect.top) / rect.height) * 640))
    };
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!draggingWaypointId) return;
    const point = getSvgPoint(event);
    if (!point) return;
    onMoveWaypoint(draggingWaypointId, Math.round(point.x), Math.round(point.y));
  }

  return (
    <div className="absolute inset-0 z-10">
      <svg
        ref={svgRef}
        className="absolute inset-x-[13%] top-[15%] h-[72%] w-[82%] cursor-crosshair overflow-visible md:inset-x-[17%] md:top-[12%]"
        fill="none"
        onClick={(event) => {
          if ((event.target as Element).closest("[data-waypoint='true']")) return;
          const point = getSvgPoint(event);
          if (point) onAddWaypoint(Math.round(point.x), Math.round(point.y));
        }}
        onPointerLeave={() => setDraggingWaypointId(null)}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDraggingWaypointId(null)}
        viewBox="0 0 1200 640"
      >
        {showNoFlyZones && noFlyZones.map((zone) => (
          <g key={zone.id}>
            <rect
              className="no-fly-zone"
              height={zone.height}
              rx="18"
              width={zone.width}
              x={zone.x}
              y={zone.y}
            />
            <text x={zone.x + 14} y={zone.y + 28} className="fill-[#ff9c9c] text-[16px] font-semibold">
              {zone.id}
            </text>
          </g>
        ))}
        {showObstacleWarnings && obstacleZones.map((zone) => (
          <g key={zone.id}>
            <circle className="obstacle-zone" cx={zone.x} cy={zone.y} r={zone.r} />
            <AlertTriangle x={zone.x - 12} y={zone.y - 12} width={24} height={24} className="text-[#f3a36f]" />
          </g>
        ))}
        <path className="mission-path" d={routePath} />
        {showWaypoints && waypoints.map((point, index) => {
          const warning = (showNoFlyZones && isPointInNoFlyZone(point)) || (showObstacleWarnings && isNearObstacle(point));
          return (
            <g
              data-waypoint="true"
              key={point.id}
              onPointerDown={(event) => {
                event.preventDefault();
                setDraggingWaypointId(point.id);
              }}
              className="cursor-grab active:cursor-grabbing"
            >
              <line x1={point.x} y1={point.y} x2={point.x} y2={point.y + 118} stroke="rgba(220,226,239,0.20)" strokeWidth="2" />
              <rect
                x={point.x - 12}
                y={point.y - 12}
                width="24"
                height="24"
                rx="4"
                fill={warning ? "#f3a36f" : index % 3 === 0 ? "#33405b" : "#d9e4ff"}
              />
              <text x={point.x} y={point.y + 5} textAnchor="middle" className="pointer-events-none fill-[#111] text-[15px] font-bold">
                {index + 1}
              </text>
            </g>
          );
        })}
      </svg>

      <motion.div
        className="absolute left-[48%] top-[38%] z-20 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)]"
        animate={{
          left: `${17 + (replayWaypoint.x / 1200) * 82}%`,
          top: `${12 + (replayWaypoint.y / 640) * 72}%`,
          rotate: [-5, 2, -5]
        }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
      >
        <Plane size={58} strokeWidth={2.4} />
      </motion.div>
      <div className="absolute left-[50%] top-[27%] z-20 rounded-[8px] bg-[#676767]/80 px-4 py-3 text-sm shadow-lg backdrop-blur-md">
        <p className="text-[#ddd]">AMSL</p>
        <p className="font-semibold">{Math.max(1, telemetry.altitude / 320).toFixed(1)} m/ATD</p>
        <p className="mt-4 text-[#ddd]">GNSS status</p>
        <p className="font-semibold">{(telemetry.speed / 280).toFixed(2)} m/s</p>
      </div>
    </div>
  );
}

function MissionPlannerPanel({
  batteryEstimate,
  flightTimeSeconds,
  isReplayMode,
  missionWarnings,
  onDeleteWaypoint,
  onDropWaypoint,
  onLoadMission,
  onReplayToggle,
  onReorderStart,
  onSaveMission,
  onShiftWaypoint,
  routeDistanceMeters,
  savedMissions,
  selectedMissionId,
  waypointCount,
  waypoints
}: {
  batteryEstimate: number;
  flightTimeSeconds: number;
  isReplayMode: boolean;
  missionWarnings: string[];
  onDeleteWaypoint: (id: string) => void;
  onDropWaypoint: (targetId: string) => void;
  onLoadMission: (mission: SavedMission) => void;
  onReplayToggle: () => void;
  onReorderStart: (id: string | null) => void;
  onSaveMission: () => void;
  onShiftWaypoint: (id: string, direction: -1 | 1) => void;
  routeDistanceMeters: number;
  savedMissions: SavedMission[];
  selectedMissionId: string | null;
  waypointCount: number;
  waypoints: Waypoint[];
}) {
  return (
    <aside className="absolute right-5 top-5 z-30 hidden w-[315px] flex-col gap-3 xl:flex">
      <PanelShell>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#8b8b8b]">Mission planning</p>
            <h2 className="mt-1 text-lg font-medium text-white">Route No 17</h2>
          </div>
          <button
            className="flex h-9 items-center gap-2 rounded-[7px] bg-[#f3a36f] px-3 text-sm font-semibold text-[#21140f]"
            onClick={onSaveMission}
          >
            <Save size={15} />
            Save
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <SummaryCell label="Distance" value={formatDistance(routeDistanceMeters)} />
          <SummaryCell label="Est. time" value={formatDuration(flightTimeSeconds)} />
          <SummaryCell label="Battery use" value={`${batteryEstimate}%`} tone={batteryEstimate > 72 ? "warn" : "normal"} />
          <SummaryCell label="Waypoints" value={String(waypointCount)} />
        </div>

        <button
          className={`mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-[7px] text-sm font-medium ${
            isReplayMode ? "bg-[#a8b8eb] text-[#111]" : "bg-[#4a4a4a] text-white"
          }`}
          onClick={onReplayToggle}
        >
          {isReplayMode ? <Pause size={16} /> : <Play size={16} />}
          {isReplayMode ? "Replay running" : "Flight replay mode"}
        </button>
      </PanelShell>

      <PanelShell>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Waypoint stack</h3>
          <span className="text-xs text-[#8d8d8d]">drag to reorder</span>
        </div>
        <div className="max-h-[190px] space-y-1.5 overflow-auto pr-1">
          {waypoints.map((point, index) => {
            const warning = isPointInNoFlyZone(point) || isNearObstacle(point);
            return (
              <div
                draggable
                key={point.id}
                onDragEnd={() => onReorderStart(null)}
                onDragEnter={() => onDropWaypoint(point.id)}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  onReorderStart(point.id);
                }}
                onDrop={() => onDropWaypoint(point.id)}
                onPointerDown={() => onReorderStart(point.id)}
                onPointerEnter={() => onDropWaypoint(point.id)}
                onPointerUp={() => onReorderStart(null)}
                className={`grid grid-cols-[34px_1fr_52px_28px] items-center gap-2 rounded-[6px] border px-2 py-1.5 ${
                  warning ? "border-[#f3a36f]/40 bg-[#4a3428]/70" : "border-white/[0.07] bg-[#242424]/90"
                }`}
              >
                <span className="grid h-6 w-6 place-items-center rounded-[5px] bg-[#d9e4ff] text-xs font-bold text-[#111]">{index + 1}</span>
                <span className="font-mono text-xs text-[#d5d5d5]">
                  X {Math.round(point.x)} / Y {Math.round(point.y)}
                </span>
                <span className="flex items-center justify-end gap-1">
                  <button
                    className="grid h-6 w-6 place-items-center rounded-[5px] text-[#9b9b9b] hover:bg-[#3a3a3a]"
                    onClick={() => onShiftWaypoint(point.id, -1)}
                    onPointerDown={(event) => event.stopPropagation()}
                    type="button"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    className="grid h-6 w-6 place-items-center rounded-[5px] text-[#9b9b9b] hover:bg-[#3a3a3a]"
                    onClick={() => onShiftWaypoint(point.id, 1)}
                    onPointerDown={(event) => event.stopPropagation()}
                    type="button"
                  >
                    <ArrowDown size={13} />
                  </button>
                </span>
                <button
                  className="grid h-7 w-7 place-items-center rounded-[5px] text-[#9b9b9b] hover:bg-[#3a3a3a]"
                  onClick={() => onDeleteWaypoint(point.id)}
                  onPointerDown={(event) => event.stopPropagation()}
                  type="button"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </PanelShell>

      <PanelShell>
        <h3 className="mb-2 text-sm font-medium text-white">Terrain & airspace warnings</h3>
        <div className="space-y-2">
          {missionWarnings.map((warning) => (
            <div
              key={warning}
              className={`flex items-start gap-2 rounded-[6px] border px-2.5 py-2 text-xs ${
                warning.includes("clear") ? "border-[#8ba47a]/30 bg-[#263021]/80 text-[#cce6bb]" : "border-[#f3a36f]/35 bg-[#3a251b]/85 text-[#ffd0ad]"
              }`}
            >
              <AlertTriangle size={15} className={warning.includes("clear") ? "text-[#9bbf83]" : "text-[#f3a36f]"} />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      </PanelShell>

      <PanelShell>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Mission history</h3>
          <span className="text-xs text-[#8d8d8d]">{savedMissions.length} saved</span>
        </div>
        <div className="max-h-[160px] space-y-2 overflow-auto pr-1">
          {savedMissions.length === 0 ? (
            <p className="rounded-[6px] bg-[#242424] p-3 text-xs text-[#999]">Saved missions will appear here locally.</p>
          ) : (
            savedMissions.map((mission) => (
              <button
                key={mission.id}
                className={`w-full rounded-[6px] border p-2 text-left ${
                  selectedMissionId === mission.id ? "border-[#f3a36f]/50 bg-[#3a2b23]" : "border-white/[0.07] bg-[#242424]/90"
                }`}
                onClick={() => onLoadMission(mission)}
              >
                <div className="flex items-center justify-between text-sm text-white">
                  <span>{mission.name}</span>
                  <span>{mission.waypointCount} WP</span>
                </div>
                <p className="mt-1 text-xs text-[#8f8f8f]">
                  {formatDistance(mission.distanceMeters)} / {formatDuration(mission.flightTimeSeconds)} / {mission.batteryEstimate}%
                </p>
              </button>
            ))
          )}
        </div>
      </PanelShell>
    </aside>
  );
}

function SummaryCell({ label, tone = "normal", value }: { label: string; tone?: "normal" | "warn"; value: string }) {
  return (
    <div className="rounded-[6px] bg-[#282828] p-2">
      <p className="text-[11px] uppercase tracking-[0.1em] text-[#858585]">{label}</p>
      <p className={`mt-1 font-mono text-base font-semibold ${tone === "warn" ? "text-[#f3a36f]" : "text-white"}`}>{value}</p>
    </div>
  );
}

function PageOverlay({
  activePage,
  batteryEstimate,
  current,
  flightTimeSeconds,
  missionWarnings,
  onLoadMission,
  onNoFlyToggle,
  onObstacleToggle,
  onPageChange,
  onPerpendicularToggle,
  onReverseToggle,
  onShowWaypointsToggle,
  perpendicularLines,
  reverseFlight,
  routeDistanceMeters,
  savedMissions,
  showNoFlyZones,
  showObstacleWarnings,
  showWaypoints,
  waypointCount
}: {
  activePage: Exclude<PageId, "Routes">;
  batteryEstimate: number;
  current: TelemetryPoint;
  flightTimeSeconds: number;
  missionWarnings: string[];
  onLoadMission: (mission: SavedMission) => void;
  onNoFlyToggle: () => void;
  onObstacleToggle: () => void;
  onPageChange: (page: PageId) => void;
  onPerpendicularToggle: () => void;
  onReverseToggle: () => void;
  onShowWaypointsToggle: () => void;
  perpendicularLines: boolean;
  reverseFlight: boolean;
  routeDistanceMeters: number;
  savedMissions: SavedMission[];
  showNoFlyZones: boolean;
  showObstacleWarnings: boolean;
  showWaypoints: boolean;
  waypointCount: number;
}) {
  return (
    <div className="absolute inset-x-[86px] top-6 z-40 max-h-[calc(100%-48px)] overflow-auto rounded-[10px] border border-white/[0.08] bg-[#151515]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.58)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#8c8c8c]">Kopter operations</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{activePage}</h2>
        </div>
        <button
          className="rounded-[7px] bg-[#565656] px-4 py-2 text-sm font-medium text-white hover:bg-[#666]"
          onClick={() => onPageChange("Routes")}
          type="button"
        >
          Back to Routes
        </button>
      </div>

      {activePage === "Overview" && (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <PanelShell>
            <h3 className="text-lg font-medium text-white">Mission readiness</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <SummaryCell label="Distance" value={formatDistance(routeDistanceMeters)} />
              <SummaryCell label="Flight time" value={formatDuration(flightTimeSeconds)} />
              <SummaryCell label="Battery use" tone={batteryEstimate > 72 ? "warn" : "normal"} value={`${batteryEstimate}%`} />
              <SummaryCell label="Waypoints" value={String(waypointCount)} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <StatusBlock label="Aircraft" value="Modelo AX3" />
              <StatusBlock label="Signal" value={`${current.signal}%`} />
              <StatusBlock label="Mode" value={current.flightMode} />
            </div>
          </PanelShell>
          <PanelShell>
            <h3 className="text-lg font-medium text-white">Active warnings</h3>
            <div className="mt-3 space-y-2">
              {missionWarnings.map((warning) => (
                <div key={warning} className="rounded-[7px] border border-[#f3a36f]/25 bg-[#3a251b]/75 px-3 py-2 text-sm text-[#ffd7bb]">
                  {warning}
                </div>
              ))}
            </div>
          </PanelShell>
        </div>
      )}

      {activePage === "Logbook" && (
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <PanelShell>
            <h3 className="text-lg font-medium text-white">Saved missions</h3>
            <div className="mt-4 space-y-2">
              {savedMissions.length === 0 ? (
                <p className="rounded-[7px] bg-[#242424] p-4 text-sm text-[#999]">No saved missions yet. Save a route from the Routes page.</p>
              ) : (
                savedMissions.map((mission) => (
                  <button
                    key={mission.id}
                    className="grid w-full grid-cols-[1fr_auto] gap-3 rounded-[7px] border border-white/[0.07] bg-[#242424] p-3 text-left hover:bg-[#303030]"
                    onClick={() => {
                      onLoadMission(mission);
                      onPageChange("Routes");
                    }}
                    type="button"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-white">{mission.name}</span>
                      <span className="mt-1 block text-xs text-[#8e8e8e]">{mission.savedAt}</span>
                    </span>
                    <span className="text-right text-xs text-[#d8d8d8]">
                      {mission.waypointCount} WP
                      <br />
                      {formatDistance(mission.distanceMeters)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </PanelShell>
          <PanelShell>
            <h3 className="text-lg font-medium text-white">Flight events</h3>
            <div className="mt-4 space-y-2">
              {[
                "Route No 17 opened for planning",
                "Terrain model synced: Improved SRTM",
                "No-fly zones loaded: 2 active",
                "Aircraft connected: Modelo AX3",
                "Telemetry stream nominal"
              ].map((event, index) => (
                <div key={event} className="grid grid-cols-[70px_1fr] rounded-[7px] bg-[#242424] px-3 py-2 text-sm">
                  <span className="font-mono text-[#8f8f8f]">10:{String(index * 7 + 3).padStart(2, "0")}</span>
                  <span className="text-[#d7d7d7]">{event}</span>
                </div>
              ))}
            </div>
          </PanelShell>
        </div>
      )}

      {activePage === "Options" && (
        <div className="grid gap-4 xl:grid-cols-3">
          <PanelShell>
            <h3 className="text-lg font-medium text-white">Map layers</h3>
            <div className="mt-4 space-y-3">
              <OptionSwitch active={showWaypoints} label="Waypoint labels" onClick={onShowWaypointsToggle} />
              <OptionSwitch active={showNoFlyZones} label="No-fly overlays" onClick={onNoFlyToggle} />
              <OptionSwitch active={showObstacleWarnings} label="Obstacle warnings" onClick={onObstacleToggle} />
            </div>
          </PanelShell>
          <PanelShell>
            <h3 className="text-lg font-medium text-white">Flight path</h3>
            <div className="mt-4 space-y-3">
              <OptionSwitch active={perpendicularLines} label="Perpendicular lines" onClick={onPerpendicularToggle} />
              <OptionSwitch active={reverseFlight} label="Reverse flight" onClick={onReverseToggle} />
              <StatusBlock label="Cruise speed" value={`${cruiseSpeedMps.toFixed(1)} m/s`} />
            </div>
          </PanelShell>
          <PanelShell>
            <h3 className="text-lg font-medium text-white">Aircraft profile</h3>
            <div className="mt-4 space-y-3">
              <StatusBlock label="Drone" value="Modelo AX3" />
              <StatusBlock label="Camera" value="Aeria X" />
              <StatusBlock label="Battery policy" value="28% reserve" />
            </div>
          </PanelShell>
        </div>
      )}

      {activePage === "Help" && (
        <div className="grid gap-4 xl:grid-cols-2">
          <PanelShell>
            <h3 className="text-lg font-medium text-white">Mission controls</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-[#d0d0d0]">
              <p>Click the map to create a waypoint. Drag waypoint markers to reshape the route.</p>
              <p>Use the waypoint stack arrows or drag rows to reorder mission sequence.</p>
              <p>Save Mission stores the current route locally in this browser.</p>
              <p>Flight replay mode animates the aircraft through the planned route.</p>
            </div>
          </PanelShell>
          <PanelShell>
            <h3 className="text-lg font-medium text-white">Safety layers</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-[#d0d0d0]">
              <p>Red overlays mark no-fly zones. Orange rings mark terrain or obstacle warning areas.</p>
              <p>Warning cards update as waypoints enter protected or elevated areas.</p>
              <p>Battery estimate updates from route distance and waypoint count.</p>
            </div>
          </PanelShell>
        </div>
      )}
    </div>
  );
}

function StatusBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[7px] bg-[#282828] p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-[#858585]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function OptionSwitch({ active, label, onClick }: { active?: boolean; label: string; onClick: () => void }) {
  return (
    <button className="flex w-full items-center justify-between rounded-[7px] bg-[#282828] px-3 py-2 text-sm text-[#d8d8d8]" onClick={onClick} type="button">
      <span>{label}</span>
      <span className={`relative h-7 w-10 rounded-[6px] ${active ? "bg-[#f3a36f]" : "bg-[#555]"}`}>
        <span className={`absolute top-1 h-5 w-4 rounded-[4px] bg-[#161616] ${active ? "right-1" : "left-1"}`} />
      </span>
    </button>
  );
}

function MapWidgets({ telemetry, history }: { telemetry: TelemetryPoint; history: TelemetryPoint[] }) {
  const [isChartExpanded, setIsChartExpanded] = useState(true);
  const [isMapLocked, setIsMapLocked] = useState(false);

  return (
    <>
      <div className={`absolute bottom-5 right-5 z-20 w-[96%] max-w-[500px] rounded-[8px] bg-[#151515]/94 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.55)] backdrop-blur-md transition-all md:w-[29vw] ${isChartExpanded ? "" : "translate-y-[210px]"}`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Speed & altitude graph</h2>
          <div className="flex gap-5 text-sm text-[#aaa]"><span className="text-[#9fb4ef]">- Speed</span><span className="text-[#e8a06e]">- Altitude</span></div>
        </div>
        <div className="h-[210px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="altitudeKopter" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#e8a06e" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#e8a06e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis dataKey="timestamp" stroke="#777" tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "#191919", border: "1px solid #333", borderRadius: 8 }} />
              <Area dataKey="altitude" fill="url(#altitudeKopter)" stroke="#e8a06e" strokeWidth={2} dot={false} />
              <Line dataKey="speed" stroke="#9fb4ef" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="absolute right-5 top-[58%] z-20 hidden flex-col gap-2 md:flex">
        <button
          className={`grid h-12 w-12 place-items-center rounded-[8px] text-white ${isMapLocked ? "bg-[#a8b8eb] text-[#111]" : "bg-[#1c1c1c]/90"}`}
          onClick={() => setIsMapLocked((value) => !value)}
          title="Toggle aircraft follow"
          type="button"
        >
          <Crosshair size={22} />
        </button>
        <button
          className="grid h-12 w-12 place-items-center rounded-[8px] bg-[#1c1c1c]/90 text-white"
          onClick={() => setIsChartExpanded((value) => !value)}
          title="Toggle graph panel"
          type="button"
        >
          <Menu size={22} />
        </button>
        <div className="grid h-24 w-24 place-items-center rounded-[50%] bg-[#171717]/95 p-3 text-center text-[#f0a26d]">
          <Compass size={84} />
          <span className="absolute mt-1 text-sm font-semibold">{Math.round(telemetry.longitude * -2.55)}°<br />NW</span>
        </div>
      </div>
      <div className="absolute bottom-2 right-5 z-20 rounded-[5px] bg-[#1b1b1b]/85 px-3 py-1 text-xs text-[#d0d0d0]">
        46° 32&apos; 36.743&quot; N. 6° 31&apos; 01.777&quot; E, {telemetry.altitude} m/AMSL, Improved SRTM. GLONASS
      </div>
    </>
  );
}
