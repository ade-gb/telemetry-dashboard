export type FlightMode = "AUTO" | "LOITER" | "RTL" | "MANUAL";

export type TelemetryPoint = {
  timestamp: string;
  altitude: number;
  speed: number;
  battery: number;
  latitude: number;
  longitude: number;
  signal: number;
  temperature: number;
  wind: number;
  flightMode: FlightMode;
};

export type AlertState = {
  id: string;
  title: string;
  detail: string;
  level: "warning" | "critical";
};

export const missionWaypoints: [number, number][] = [
  [37.7892, -122.3997],
  [37.7926, -122.3964],
  [37.7954, -122.4012],
  [37.7921, -122.4057],
  [37.7886, -122.4031]
];

const flightModes: FlightMode[] = ["AUTO", "AUTO", "LOITER", "AUTO", "RTL", "MANUAL"];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function createInitialTelemetry(): TelemetryPoint {
  const [latitude, longitude] = missionWaypoints[0];

  return {
    timestamp: "00:00:00",
    altitude: 390,
    speed: 42,
    battery: 92,
    latitude,
    longitude,
    signal: 97,
    temperature: 32,
    wind: 14,
    flightMode: "AUTO"
  };
}

export function createNextTelemetry(previous: TelemetryPoint, tick: number): TelemetryPoint {
  const waypoint = missionWaypoints[tick % missionWaypoints.length];
  const nextWaypoint = missionWaypoints[(tick + 1) % missionWaypoints.length];
  const progress = (Math.sin(tick / 7) + 1) / 2;
  const jitter = Math.sin(tick * 0.9) * 0.00028;

  const latitude = waypoint[0] + (nextWaypoint[0] - waypoint[0]) * progress + jitter;
  const longitude = waypoint[1] + (nextWaypoint[1] - waypoint[1]) * progress - jitter * 0.7;
  const batteryDrain = tick % 11 === 0 ? 0.42 : 0.16;

  return {
    timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
    altitude: Math.round(clamp(430 + Math.sin(tick / 3.3) * 90 + Math.cos(tick / 8) * 34, 210, 620)),
    speed: Math.round(clamp(44 + Math.sin(tick / 2.5) * 18 + Math.cos(tick / 7) * 7, 12, 76)),
    battery: Number(clamp(previous.battery - batteryDrain, 7, 100).toFixed(1)),
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
    signal: Math.round(clamp(88 + Math.sin(tick / 4) * 12 - Math.cos(tick / 9) * 6, 42, 100)),
    temperature: Math.round(clamp(33 + Math.sin(tick / 5) * 8 + Math.cos(tick / 2.2) * 3, 22, 49)),
    wind: Math.round(clamp(15 + Math.sin(tick / 6) * 14 + Math.cos(tick / 3) * 4, 4, 38)),
    flightMode: flightModes[Math.floor(tick / 9) % flightModes.length]
  };
}

export function getTelemetryAlerts(point: TelemetryPoint): AlertState[] {
  const alerts: AlertState[] = [];

  if (point.battery <= 22) {
    alerts.push({
      id: "battery",
      title: "Low battery warning",
      detail: `Power reserve at ${point.battery.toFixed(1)}%. Prepare return-to-base.`,
      level: point.battery <= 14 ? "critical" : "warning"
    });
  }

  if (point.signal <= 58) {
    alerts.push({
      id: "signal",
      title: "Weak signal alert",
      detail: `Command link dropped to ${point.signal}%. Adjust antenna heading.`,
      level: point.signal <= 48 ? "critical" : "warning"
    });
  }

  if (point.wind >= 29) {
    alerts.push({
      id: "wind",
      title: "High wind warning",
      detail: `Crosswind measured at ${point.wind} kt. Stabilizers compensating.`,
      level: point.wind >= 35 ? "critical" : "warning"
    });
  }

  return alerts;
}
