# Telemetry Dashboard

A professional Kopter style drone operations platform built with Next.js, TypeScript, Tailwind CSS, Framer Motion, and Recharts.

The app simulates a cinematic dark mission-control interface for drone operators, with real-time telemetry, mission planning, flight replay, route analytics, alerting, and local mission history.

## Features

- Real time mock drone telemetry for altitude, speed, battery, GPS, signal strength, temperature, and flight mode
- Kopter-inspired route planning interface with dark glass panels and high-contrast mission controls
- Interactive waypoint creation by clicking the mission map
- Draggable waypoints with reorder controls and delete actions
- Animated flight route, waypoint labels, aircraft position, and replay mode
- Route distance, estimated flight time, and battery consumption estimation
- Mission summary panel with active warning status
- Save missions locally with browser `localStorage`
- Mission history sidebar for loading previous routes
- No-fly zone overlays and obstacle/terrain warning indicators
- Simulated FPV camera panel with telemetry overlay
- Flight analytics charts for battery, altitude, speed, and signal quality
- Working navigation pages for Dashboard/Overview, Routes, Logbook, Missions-style history, Drone Settings/Options, and Help
- Responsive high tech UI designed for professional drone operations workflows

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Leaflet dependencies available for map-based views
- Lucide React icons

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the app at:

```text
http://localhost:3000
```

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

## Project Structure

```text
app/
  globals.css       Global styles and mission UI effects
  layout.tsx        App metadata and root layout
  page.tsx          Main Kopter-style operations platform
components/        Reusable telemetry, chart, camera, map, and panel components
hooks/
  useTelemetry.ts   Real-time telemetry simulation hook
lib/
  telemetry.ts      Mock telemetry generation and alert logic
public/
  kopter-aerial-bg.png
  kopter-reference.png
```

## Mission Planning Workflow

1. Use the Routes page as the main mission planning workspace.
2. Click the map to create new waypoints.
3. Drag waypoints or use the reorder controls to adjust route order.
4. Review route distance, flight time, battery estimate, and warnings.
5. Toggle no-fly zones, obstacle warnings, waypoint visibility, and route options.
6. Save the mission locally and reload it later from mission history or Logbook.
7. Start replay mode to simulate the drone moving through the planned route.

## Notes

This is a frontend simulation. Telemetry, maps, FPV feed, alerts, mission saving, and replay are generated locally in the browser for demo and prototype use.
