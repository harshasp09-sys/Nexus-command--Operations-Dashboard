# ⚡ CEREBRO // S.H.I.E.L.D. TACTICAL COMMAND CENTER
> **Marvel & X-Men Superhero / Rogue Tactical Operations Dashboard & Live Tactical Grid**

A high-energy, single-page command center application engineered with an authentic Marvel / X-Men comic aesthetic and real-time geospatial emergency dispatch capabilities.

---

## 🌟 Complete Feature Matrix

### 1. 🗺️ Live Tactical Grid (Leaflet Geospatial Command)
- **Interactive Military Map**: Built with **Leaflet.js** and CartoDB Dark Matter tiles, styled to mimic a military/tactical command interface with HUD reticle overlays and custom coordinate tracking.
- **Marker Differentiation**:
  - **Red Radar Ripple Markers**: Distinct pulsating concentric radar rings (`@keyframes radarPing`) for active crises, displaying threat levels 1–5 and geofence breach alert badges.
  - **Blue & Gold Hero Unit Markers**: Custom pins featuring superhero avatars (Wolverine, Cyclops, Storm, Phoenix, Spider-Man, Iron Man, Rogue, Captain Marvel), division, real-time availability indicator dots (`active`, `on_mission`, `standby`), and movement velocity (km/h).
- **Interactive Coordinate Lock**: Click anywhere on the map to inspect coordinates and dispatch an emergency ticket directly at that location.

### 2. ⚡ Haversine Formula & Automated Proximity Dispatch
- **Mathematical Distance Calculation**:
  - Implements the mathematical **Haversine great-circle formula** in pure JavaScript to compute the exact distance between incident coordinates and each superhero.
- **Travel Velocity & Real-Time ETA**:
  - Leverages individual hero transit speeds (e.g. Iron Man Mach 2 at 980 km/h, Storm at 420 km/h, Spider-Man web-slinging at 130 km/h, Wolverine at 90 km/h) to calculate estimated arrival times in minutes.
- **Closest Responder Flash Console**:
  - When an emergency ticket is submitted or clicked on the map, the system automatically evaluates all available superheroes, highlights the **Closest Responder**, draws an animated dashed tactical trajectory vector line, and provides a 1-click **"⚡ AUTO-DISPATCH UNIT"** button.

### 3. 🛡️ Geofenced High-Risk Zones & Dynamic Auto-Escalation
- **Geofenced Polygons**:
  - **Zone Alpha (Stark / Midtown Core)**: High-security critical infrastructure perimeter.
  - **Zone Beta (The Raft Supermax)**: Submerged super-villain containment fortress.
  - **Zone Gamma (Central Park Sanctuary)**: High-density civilian evacuation muster hub.
- **Ray-Casting Point-in-Polygon Algorithm**: Evaluates whether any coordinate falls inside a high-risk geofence.
- **Dynamic Priority Boosting**: If an incident falls inside a geofenced zone, standard triage is overridden, priority is automatically escalated to **CRITICAL**, and siren alerts are triggered.

### 4. 🚨 911 Citizen Emergency Simulation
- One-click **"🚨 911 Alert Test"** generates realistic simulated emergency tickets at random Marvel hotspots with automated geofence detection and closest hero targeting.

### 5. 🦹 Villain Registry (Full CRUD & Syndicate Network Tracing)
- Filterable by containment status (`At Large`, `Contained`, `Incarcerated`), threat level (1–5), and keyword search.
- Dual-view toggle: **Tactical Grid Cards** vs. **Compact Table**.
- **Villain Detail Dossier (Modal)**: Full intel, coordinates, powers, notes, and **clickable associate chips** that trace criminal networks (e.g., Brotherhood of Mutants, Sinister Six).
- **Rapid Status Override Bar**: 1-click status switcher between *At Large*, *Contained*, and *Incarcerated*.

### 6. 📋 Tactical Case Board (Native Drag-and-Drop Kanban)
- 4 Columns: `Reported` ➔ `Investigating` ➔ `Hero Assigned` ➔ `Resolved`.
- Native HTML5 drag-and-drop dynamically updates case status, persists to `localStorage`, and updates board stats.
- Case cards with priority tags, opened dates, linked villain badges, and assigned hero avatar stacks.

### 7. 📈 Threat Trend Analytics (Chart.js Stacked Bar)
- Stacked bar chart tracking weekly incident distributions, color-coded by threat levels 1–5.
- Real-time Emergency Dispatch Feed.

### 8. 🚨 Persistent Level 5 At-Large Alert Banner
- Flashing Danger Room red marquee when any Level 5 villain is at large, cycling between multiple fugitives with click-to-open dossier access.

### 9. 🎨 Vibrant Marvel & X-Men Comic Aesthetic
- Halftone dot matrix textured backgrounds.
- Mutant Gold (`#FFCC00`), Cerebro Cyan (`#00F0FF`), Danger Room Crimson (`#FF0055`), and ink blacks.
- Comic action sound notification toasts (`"BAM!"`, `"ALERT!"`, `"INTEL!"`).

---

## 🚀 How to Run

Zero build steps required. Runs out of the box in any modern browser.

### Option A: Open directly in your browser
Double-click [**`index.html`**](file:///C:/Users/Harsha/.gemini/antigravity/scratch/marvel-command-center/index.html) or open it with any web browser:
```
file:///C:/Users/Harsha/.gemini/antigravity/scratch/marvel-command-center/index.html
```

### Option B: Open via PowerShell
```powershell
Start-Process "C:\Users\Harsha\.gemini\antigravity\scratch\marvel-command-center\index.html"
```
