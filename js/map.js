/**
 * CEREBRO // LIVE TACTICAL GRID (LEAFLET GEOSPATIAL COMMAND)
 * Geospatial tracking, Haversine proximity routing, closest responder calculation,
 * and high-risk geofenced auto-escalation engine.
 */

let tacticalMap = null;
let crisisMarkerLayer = null;
let heroMarkerLayer = null;
let geofenceLayer = null;
let trajectoryPolyline = null;
let selectedCrisisCase = null;

function initTacticalMap() {
  const mapElement = document.getElementById('tacticalMap');
  if (!mapElement) return;

  if (tacticalMap) {
    tacticalMap.invalidateSize();
    refreshTacticalGrid();
    return;
  }

  // Centered on New York (Midtown Manhattan / Stark Tower & Xavier Corridor)
  tacticalMap = L.map('tacticalMap', {
    center: [40.7580, -73.9855],
    zoom: 13,
    minZoom: 11,
    maxZoom: 18,
    zoomControl: false
  });

  // Zoom control repositioned to bottom right
  L.control.zoom({ position: 'bottomright' }).addTo(tacticalMap);

  // High-contrast tactical dark basemap (CartoDB Dark Matter)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> | S.H.I.E.L.D. TACTICAL GRID',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(tacticalMap);

  // Initialize Layer Groups
  geofenceLayer = L.layerGroup().addTo(tacticalMap);
  crisisMarkerLayer = L.layerGroup().addTo(tacticalMap);
  heroMarkerLayer = L.layerGroup().addTo(tacticalMap);

  // Render initial components
  renderGeofencePolygons();
  refreshTacticalGrid();

  // Map Click Listener to drop coordinates or dispatch incidents
  tacticalMap.on('click', (e) => {
    handleMapClick(e.latlng);
  });

  // Invalidate size once DOM stabilizes
  setTimeout(() => {
    tacticalMap.invalidateSize();
  }, 200);
}

function invalidateMapSize() {
  if (tacticalMap) {
    setTimeout(() => {
      tacticalMap.invalidateSize();
    }, 150);
  }
}

// ========================================================
// GEOFENCE POLYGONS & DYNAMIC SECURITY ZONES
// ========================================================
function renderGeofencePolygons() {
  if (!geofenceLayer) return;
  geofenceLayer.clearLayers();

  GEOFENCE_ZONES.forEach(zone => {
    const polygon = L.polygon(zone.polygon, {
      color: zone.color,
      fillColor: zone.fillColor,
      fillOpacity: 0.18,
      weight: 2,
      dashArray: '5, 8'
    });

    polygon.bindTooltip(`
      <div class="geofence-tooltip">
        <strong style="color: ${zone.color};">⚠️ ${escapeHtml(zone.name.toUpperCase())}</strong>
        <div class="geo-sub">RISK LEVEL: <strong>${zone.riskLevel}</strong></div>
        <div class="geo-desc">${escapeHtml(zone.description)}</div>
      </div>
    `, {
      sticky: true,
      className: 'tactical-leaflet-tooltip'
    });

    polygon.on('click', () => {
      showComicToast(`INSPECTING GEOFENCE: ${zone.name}`, 'info');
    });

    geofenceLayer.addLayer(polygon);
  });
}

// ========================================================
// REFRESH TACTICAL GRID (CRISIS & HERO MARKERS)
// ========================================================
function refreshTacticalGrid() {
  if (!tacticalMap) return;

  renderHeroMarkers();
  renderCrisisMarkers();
  renderTacticalConsoleStats();

  // If a case is selected, re-highlight closest responder
  if (selectedCrisisCase) {
    highlightClosestResponder(selectedCrisisCase);
  }
}

function renderHeroMarkers() {
  if (!heroMarkerLayer) return;
  heroMarkerLayer.clearLayers();

  const heroes = state.getHeroes();

  heroes.forEach(hero => {
    if (!hero.lat || !hero.lng) return;

    // Custom tactical DivIcon for superhero units
    const iconHtml = `
      <div class="map-hero-marker" style="--hero-border: ${hero.accentColor}">
        <span class="map-hero-avatar">${hero.avatar}</span>
        <span class="hero-status-dot ${hero.availability}"></span>
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'custom-leaflet-hero-icon',
      html: iconHtml,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -20]
    });

    const marker = L.marker([hero.lat, hero.lng], { icon: customIcon });

    marker.bindPopup(`
      <div class="tactical-marker-popup hero-popup">
        <div class="popup-header" style="border-left: 4px solid ${hero.accentColor};">
          <span class="popup-avatar">${hero.avatar}</span>
          <div>
            <h4 class="popup-title">${escapeHtml(hero.codename)}</h4>
            <span class="popup-sub">${escapeHtml(hero.name)}</span>
          </div>
        </div>
        <div class="popup-body">
          <div class="popup-row"><span>STATUS:</span> <strong class="text-cyan">${hero.availability.toUpperCase()}</strong></div>
          <div class="popup-row"><span>SPECIALTY:</span> <span>${escapeHtml(hero.specialty)}</span></div>
          <div class="popup-row"><span>VELOCITY:</span> <strong class="text-gold">${hero.speedKmH} km/h</strong></div>
          <div class="popup-row"><span>STATION:</span> <span>${escapeHtml(hero.stationName || 'Field Patrol')}</span></div>
        </div>
        <div class="popup-footer">
          <button class="comic-btn comic-btn-sm comic-btn-blue" onclick="assignHeroToNewCase('${hero.id}')">
            + DEPLOY TO MISSION
          </button>
        </div>
      </div>
    `, { className: 'tactical-leaflet-popup' });

    heroMarkerLayer.addLayer(marker);
  });
}

function renderCrisisMarkers() {
  if (!crisisMarkerLayer) return;
  crisisMarkerLayer.clearLayers();

  const cases = state.getCases().filter(c => c.status !== 'resolved');

  cases.forEach(c => {
    if (!c.lat || !c.lng) return;

    const villain = state.getVillainById(c.villainId);
    const threatLevel = villain ? villain.threatLevel : 3;

    // Custom pulsating radar ripple DivIcon for crisis
    const iconHtml = `
      <div class="map-crisis-marker threat-lvl-${threatLevel} ${c.autoEscalated ? 'is-geofence-breach' : ''}">
        <div class="crisis-radar-ring"></div>
        <div class="crisis-core-pin">
          <span class="crisis-num-badge">${threatLevel}</span>
        </div>
        ${c.autoEscalated ? '<span class="geofence-alert-icon" title="High-Risk Geofence Breach!">⚠️</span>' : ''}
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'custom-leaflet-crisis-icon',
      html: iconHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -20]
    });

    const marker = L.marker([c.lat, c.lng], { icon: customIcon });

    marker.on('click', () => {
      selectCrisisOnMap(c.id);
    });

    marker.bindPopup(`
      <div class="tactical-marker-popup crisis-popup">
        <div class="popup-header ${threatLevel === 5 ? 'threat-5-header' : ''}">
          <span class="popup-threat-badge">LVL ${threatLevel}</span>
          <div>
            <h4 class="popup-title">${escapeHtml(c.title)}</h4>
            <span class="popup-sub">TARGET: <strong>${escapeHtml(villain ? villain.codename : 'Unknown')}</strong></span>
          </div>
        </div>
        <div class="popup-body">
          <div class="popup-row"><span>STATUS:</span> <strong class="text-cyan">${c.status.toUpperCase()}</strong></div>
          <div class="popup-row"><span>PRIORITY:</span> <strong class="${c.priority === 'critical' ? 'text-crimson' : 'text-gold'}">${c.priority.toUpperCase()}</strong></div>
          <div class="popup-row"><span>COORDINATES:</span> <span>${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}</span></div>
          ${c.geofenceZone ? `
            <div class="popup-geofence-alert">
              <span>⚠️ GEOFENCE BREACH:</span> <strong>${escapeHtml(c.geofenceZone)}</strong>
            </div>
          ` : ''}
        </div>
        <div class="popup-footer">
          <button class="comic-btn comic-btn-sm comic-btn-yellow" onclick="selectCrisisOnMap('${c.id}')">
            🎯 ENGAGE CLOSEST HERO
          </button>
          <button class="comic-btn comic-btn-sm comic-btn-ghost" onclick="openCaseEditModal('${c.id}')">
            ⚙️ EDIT
          </button>
        </div>
      </div>
    `, { className: 'tactical-leaflet-popup' });

    crisisMarkerLayer.addLayer(marker);
  });
}

// ========================================================
// HAVERSINE PROXIMITY ROUTING & CLOSEST RESPONDER FLASH
// ========================================================

/**
 * Selects a crisis case on the map, calculates Haversine distances to all heroes,
 * draws a tactical vector line to the closest hero, and updates the flash card.
 */
function selectCrisisOnMap(caseId) {
  const caseItem = state.getCaseById(caseId);
  if (!caseItem || !caseItem.lat || !caseItem.lng) return;

  selectedCrisisCase = caseItem;

  // Pan to incident with smooth animation
  if (tacticalMap) {
    tacticalMap.flyTo([caseItem.lat, caseItem.lng], 14, { duration: 0.8 });
  }

  highlightClosestResponder(caseItem);
}

function highlightClosestResponder(caseItem) {
  // Clear any existing trajectory line
  if (trajectoryPolyline && tacticalMap) {
    tacticalMap.removeLayer(trajectoryPolyline);
    trajectoryPolyline = null;
  }

  // Calculate Haversine distance to all available heroes
  const rankedHeroes = state.getHeroesSortedByProximity(caseItem.lat, caseItem.lng);
  if (rankedHeroes.length === 0) return;

  const closestHero = rankedHeroes[0];

  // Draw tactical trajectory vector line
  if (tacticalMap) {
    trajectoryPolyline = L.polyline(
      [
        [closestHero.lat, closestHero.lng],
        [caseItem.lat, caseItem.lng]
      ],
      {
        color: '#00F0FF',
        weight: 3,
        opacity: 0.85,
        dashArray: '8, 8',
        className: 'tactical-trajectory-vector'
      }
    ).addTo(tacticalMap);
  }

  // Render "Closest Responder Flash" Card in the console
  const flashContainer = document.getElementById('closestResponderFlashCard');
  if (flashContainer) {
    flashContainer.innerHTML = `
      <div class="responder-flash-card ${caseItem.autoEscalated ? 'breach-active' : ''}">
        <div class="flash-header">
          <span class="flash-pulse-beacon">📡</span>
          <div class="flash-title-group">
            <span class="flash-label">CLOSEST RESPONDER IDENTIFIED</span>
            <h4 class="flash-hero-name">${closestHero.codename.toUpperCase()}</h4>
          </div>
          <span class="flash-eta-badge">⚡ ETA: ${closestHero.etaMinutes} MINS</span>
        </div>

        <div class="flash-body">
          <div class="flash-stat-row">
            <span class="f-label">STRAIGHT-LINE DISTANCE:</span>
            <span class="f-val text-gold">${closestHero.distanceKm} km (${closestHero.distanceMiles} mi)</span>
          </div>
          <div class="flash-stat-row">
            <span class="f-label">TRANSIT VELOCITY:</span>
            <span class="f-val text-cyan">${closestHero.speedKmH} km/h (${closestHero.specialty})</span>
          </div>
          <div class="flash-stat-row">
            <span class="f-label">INCIDENT TARGET:</span>
            <span class="f-val text-white">${escapeHtml(caseItem.title)}</span>
          </div>
          ${caseItem.geofenceZone ? `
            <div class="flash-geofence-warning">
              <span>⚠️ GEOFENCE BREACH: <strong>${escapeHtml(caseItem.geofenceZone)}</strong> (AUTO-ESCALATED)</span>
            </div>
          ` : ''}
        </div>

        <div class="flash-actions">
          <button class="comic-btn comic-btn-yellow" onclick="autoDispatchHero('${closestHero.id}', '${caseItem.id}')">
            ⚡ AUTO-DISPATCH UNIT
          </button>
          <button class="comic-btn comic-btn-ghost" onclick="clearClosestResponder()">
            DISMISS
          </button>
        </div>
      </div>
    `;
  }
}

function autoDispatchHero(heroId, caseId) {
  const caseItem = state.getCaseById(caseId);
  const hero = state.getHeroById(heroId);
  if (!caseItem || !hero) return;

  const assigned = new Set(caseItem.assignedHeroes);
  assigned.add(heroId);

  state.updateCase(caseId, {
    assignedHeroes: Array.from(assigned),
    status: 'assigned'
  });

  showComicToast(`TACTICAL DISPATCH: ${hero.codename.toUpperCase()} DEPLOYED TO INCIDENT!`, 'success');
  refreshTacticalGrid();
}

function clearClosestResponder() {
  selectedCrisisCase = null;
  if (trajectoryPolyline && tacticalMap) {
    tacticalMap.removeLayer(trajectoryPolyline);
    trajectoryPolyline = null;
  }
  const flashContainer = document.getElementById('closestResponderFlashCard');
  if (flashContainer) {
    flashContainer.innerHTML = `
      <div class="empty-flash-prompt">
        <span>SELECT ANY CRISIS PIN ON THE GRID TO CALCULATE CLOSEST HERO PROXIMITY & ETA</span>
      </div>
    `;
  }
}

// ========================================================
// INTERACTIVE MAP CLICK / NEW INCIDENT DISPATCH
// ========================================================
function handleMapClick(latlng) {
  const lat = parseFloat(latlng.lat.toFixed(4));
  const lng = parseFloat(latlng.lng.toFixed(4));

  const breachedZone = checkGeofenceBreach(lat, lng);

  const popupContent = `
    <div class="tactical-marker-popup map-click-popup">
      <h4 class="popup-title">TACTICAL TARGET LOCK</h4>
      <div class="popup-body">
        <div class="popup-row"><span>COORDINATES:</span> <strong class="text-cyan">${lat}, ${lng}</strong></div>
        ${breachedZone ? `
          <div class="popup-geofence-alert">
            <span>⚠️ ZONE BREACH:</span> <strong>${breachedZone.name}</strong>
          </div>
        ` : '<div>SECTOR: Open Tactical Airspace</div>'}
      </div>
      <div class="popup-footer">
        <button class="comic-btn comic-btn-sm comic-btn-yellow" onclick="openNewCaseAtCoordinates(${lat}, ${lng}, '${breachedZone ? breachedZone.name : ''}')">
          🚨 DISPATCH EMERGENCY HERE
        </button>
      </div>
    </div>
  `;

  L.popup({ className: 'tactical-leaflet-popup' })
    .setLatLng(latlng)
    .setContent(popupContent)
    .openOn(tacticalMap);
}

function openNewCaseAtCoordinates(lat, lng, zoneName) {
  if (tacticalMap) tacticalMap.closePopup();
  openCaseEditModal(null, null, { lat, lng, locationName: `Sector Grid [${lat}, ${lng}]` });
}

// ========================================================
// CITIZEN 911 EMERGENCY SIMULATION ENGINE
// ========================================================
function simulateCitizenEmergency() {
  // Pick random hotspot
  const hotspot = HOTSPOTS[Math.floor(Math.random() * HOTSPOTS.length)];
  const villains = state.getVillains().filter(v => !v.archived);
  const randomVillain = villains[Math.floor(Math.random() * villains.length)] || villains[0];

  const emergencyTitles = [
    'Emergency 911 Call: Seismic Shockwaves Detected',
    'Citizen Dispatch: High-Voltage Transformer Overload',
    'Tactical Alert: Holographic Sentinel Drone Sighting',
    'Police Backup Requested: Mutant Skirmish in Progress',
    'Catastrophic Threat: Unidentified Energy Signature'
  ];

  const randomTitle = emergencyTitles[Math.floor(Math.random() * emergencyTitles.length)];

  // Small random offset for realistic dispersion
  const offsetLat = hotspot.lat + (Math.random() - 0.5) * 0.006;
  const offsetLng = hotspot.lng + (Math.random() - 0.5) * 0.006;

  const newCase = state.addCase({
    title: `${randomTitle} (${hotspot.name})`,
    description: `Automated citizen 911 ticket ingested into Cerebro dispatch mainframe. Subject matches signature for ${randomVillain.name}. Coordinates: ${offsetLat.toFixed(4)}, ${offsetLng.toFixed(4)}.`,
    villainId: randomVillain.id,
    status: 'reported',
    lat: offsetLat,
    lng: offsetLng,
    locationName: hotspot.name,
    priority: 'high',
    assignedHeroes: []
  });

  showComicToast(`CITIZEN EMERGENCY REPORTED AT ${hotspot.name.toUpperCase()}!`, 'warning');

  // Switch to map view if not currently active
  if (state.currentTab !== 'map') {
    switchTab('map');
  }

  // Refresh and immediately lock on to the new emergency
  setTimeout(() => {
    refreshTacticalGrid();
    selectCrisisOnMap(newCase.id);
  }, 250);
}

// ========================================================
// TACTICAL CONSOLE STATS & ACTIVE LIST
// ========================================================
function renderTacticalConsoleStats() {
  const activeCrises = state.getCases().filter(c => c.status !== 'resolved');
  const geofenceBreaches = activeCrises.filter(c => c.geofenceZone !== null);

  const statCrisesEl = document.getElementById('mapStatCrises');
  if (statCrisesEl) statCrisesEl.textContent = activeCrises.length;

  const statBreachesEl = document.getElementById('mapStatBreaches');
  if (statBreachesEl) statBreachesEl.textContent = geofenceBreaches.length;

  // Active Crisis quick list on the side
  const crisisListContainer = document.getElementById('tacticalCrisesList');
  if (!crisisListContainer) return;

  if (activeCrises.length === 0) {
    crisisListContainer.innerHTML = '<div class="text-empty-muted">All city sectors clear. No active alerts.</div>';
    return;
  }

  crisisListContainer.innerHTML = activeCrises.map(c => {
    const villain = state.getVillainById(c.villainId);
    const threatLevel = villain ? villain.threatLevel : 3;

    return `
      <div class="tactical-crisis-quick-item ${selectedCrisisCase && selectedCrisisCase.id === c.id ? 'active-selection' : ''}" 
           onclick="selectCrisisOnMap('${c.id}')">
        <div class="t-crisis-left">
          <span class="threat-pill threat-lvl-${threatLevel}">LVL ${threatLevel}</span>
          ${c.geofenceZone ? '<span class="zone-breach-micro-tag">ZONE BREACH</span>' : ''}
        </div>
        <div class="t-crisis-center">
          <div class="t-crisis-title">${escapeHtml(c.title)}</div>
          <div class="t-crisis-sub">📍 ${escapeHtml(c.locationName || 'Manhattan')}</div>
        </div>
        <div class="t-crisis-right">
          <span class="status-pill status-${c.status}">${c.status.toUpperCase()}</span>
        </div>
      </div>
    `;
  }).join('');
}
