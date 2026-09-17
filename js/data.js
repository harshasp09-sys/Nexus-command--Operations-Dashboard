/**
 * CEREBRO // S.H.I.E.L.D. TACTICAL COMMAND DATA STORE
 * Marvel & X-Men Canonical Mock Data with Relational Entities & Geospatial Tracking
 */

const STORAGE_KEYS = {
  VILLAINS: 'cerebro_villains_v2',
  CASES: 'cerebro_cases_v2',
  HEROES: 'cerebro_heroes_v2'
};

// Helper to generate dates relative to today
function getDateDaysAgo(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// Tactical Geofence Zones (High-Risk Defense Sectors in New York theater)
const GEOFENCE_ZONES = [
  {
    id: 'zone-alpha',
    name: 'Zone Alpha: Stark / Midtown Core',
    description: 'High-density civilian & tactical infrastructure. Houses Stark Tower & Arc Reactor grid.',
    color: '#FF0055',
    fillColor: '#FF0055',
    riskLevel: 'CRITICAL',
    // Polygon coordinates: [lat, lng]
    polygon: [
      [40.7650, -73.9920],
      [40.7670, -73.9730],
      [40.7460, -73.9680],
      [40.7440, -73.9870]
    ]
  },
  {
    id: 'zone-beta',
    name: 'Zone Beta: The Raft Supermax Perimeter',
    description: 'Submerged super-villain containment fortress in East River. Restricted military airspace.',
    color: '#8B5CF6',
    fillColor: '#8B5CF6',
    riskLevel: 'OMEGA CONTAINMENT',
    polygon: [
      [40.7980, -73.9180],
      [40.7980, -73.8820],
      [40.7620, -73.8820],
      [40.7620, -73.9180]
    ]
  },
  {
    id: 'zone-gamma',
    name: 'Zone Gamma: Central Park Sanctuary',
    description: 'High-density public park corridor & emergency evacuation muster zone.',
    color: '#F59E0B',
    fillColor: '#F59E0B',
    riskLevel: 'ELEVATED CIV-POP',
    polygon: [
      [40.8005, -73.9580],
      [40.7968, -73.9490],
      [40.7645, -73.9728],
      [40.7680, -73.9820]
    ]
  }
];

// Preset Hotspots for quick testing & case dispatch
const HOTSPOTS = [
  { name: 'Times Square Defense Grid', lat: 40.7580, lng: -73.9855, zone: 'Zone Alpha' },
  { name: 'Stark Tower Core (Midtown)', lat: 40.7527, lng: -73.9772, zone: 'Zone Alpha' },
  { name: 'The Raft Kinetic Vault (East River)', lat: 40.7831, lng: -73.9000, zone: 'Zone Beta' },
  { name: 'Columbus Circle Gateway', lat: 40.7680, lng: -73.9820, zone: 'Zone Alpha' },
  { name: 'Ryker’s High-Tech Annex', lat: 40.7750, lng: -73.9100, zone: 'Zone Beta' },
  { name: 'Central Park Naumburg Bandshell', lat: 40.7725, lng: -73.9715, zone: 'Zone Gamma' },
  { name: 'Federal Plaza / Triskelion Annex', lat: 40.7128, lng: -74.0060, zone: null },
  { name: 'Hell’s Kitchen Pier 84', lat: 40.7638, lng: -73.9980, zone: null },
  { name: 'Brooklyn Navy Yard Tech Wharf', lat: 40.7020, lng: -73.9712, zone: null },
  { name: 'Queens Expressway Corridor', lat: 40.7420, lng: -73.9350, zone: null }
];

const DEFAULT_HEROES = [
  {
    id: 'hero-1',
    name: 'Wolverine (Logan)',
    codename: 'Wolverine',
    specialty: 'Regeneration & Adamantium Claws',
    division: 'X-Men Strike Force',
    availability: 'active',
    avatar: '🐺',
    accentColor: '#FFCC00',
    speedKmH: 90, // Combat Bike
    lat: 40.7638,
    lng: -73.9918,
    stationName: 'Hell’s Kitchen Safehouse'
  },
  {
    id: 'hero-2',
    name: 'Cyclops (Scott Summers)',
    codename: 'Cyclops',
    specialty: 'Tactical Command & Concussive Optic Blasts',
    division: 'X-Men Field Commander',
    availability: 'active',
    avatar: '👓',
    accentColor: '#00F0FF',
    speedKmH: 220, // Tactical Rover
    lat: 40.7850,
    lng: -73.9682,
    stationName: 'Central Park West HQ'
  },
  {
    id: 'hero-3',
    name: 'Storm (Ororo Munroe)',
    codename: 'Storm',
    specialty: 'Atmospheric Weather Manipulation',
    division: 'X-Men Tactical Lead',
    availability: 'active',
    avatar: '⚡',
    accentColor: '#A78BFA',
    speedKmH: 420, // Atmospheric Flight
    lat: 40.7484,
    lng: -73.9857,
    stationName: 'Empire Sky Corridor'
  },
  {
    id: 'hero-4',
    name: 'Jean Grey',
    codename: 'Phoenix',
    specialty: 'Omega-Level Telepathy & Telekinesis',
    division: 'X-Men High Council',
    availability: 'on_mission',
    avatar: '🔥',
    accentColor: '#FF4D00',
    speedKmH: 600, // Telekinetic Flight
    lat: 40.7589,
    lng: -73.9851,
    stationName: 'Times Square Airborne Watch'
  },
  {
    id: 'hero-5',
    name: 'Spider-Man (Peter Parker)',
    codename: 'Spider-Man',
    specialty: 'Spider-Sense, Web-Slinging & Agility',
    division: 'Avengers Urban Response',
    availability: 'active',
    avatar: '🕷️',
    accentColor: '#EF4444',
    speedKmH: 130, // Web-Slinging Velocity
    lat: 40.7308,
    lng: -73.9973,
    stationName: 'Greenwich Rooftop Roost'
  },
  {
    id: 'hero-6',
    name: 'Iron Man (Tony Stark)',
    codename: 'Iron Man',
    specialty: 'Nanotech Armor, Repulsors & Tactical AI',
    division: 'Avengers Tech Ops',
    availability: 'active',
    avatar: '🤖',
    accentColor: '#F59E0B',
    speedKmH: 980, // Supersonic Mark 85
    lat: 40.7527,
    lng: -73.9772,
    stationName: 'Stark Tower Penthouse Helipad'
  },
  {
    id: 'hero-7',
    name: 'Rogue (Anna Marie)',
    codename: 'Rogue',
    specialty: 'Power Absorption & Superhuman Flight',
    division: 'X-Men Alpha Squad',
    availability: 'active',
    avatar: '🧤',
    accentColor: '#10B981',
    speedKmH: 380, // Superhuman Flight
    lat: 40.7020,
    lng: -73.9712,
    stationName: 'Brooklyn Navy Yard Post'
  },
  {
    id: 'hero-8',
    name: 'Captain Marvel (Carol Danvers)',
    codename: 'Captain Marvel',
    specialty: 'Cosmic Photonic Blasts & Binary Power',
    division: 'S.W.O.R.D. Orbital Defense',
    availability: 'on_mission',
    avatar: '⭐',
    accentColor: '#3B82F6',
    speedKmH: 1400, // Hypersonic Cosmic Flight
    lat: 40.6892,
    lng: -74.0445,
    stationName: 'Liberty Island Airspace'
  }
];

const DEFAULT_VILLAINS = [
  {
    id: 'vil-1',
    name: 'Magneto (Max Eisenhardt)',
    codename: 'Magneto',
    threatLevel: 5,
    status: 'at_large',
    lastLocation: 'Asteroid M / Low Earth Geosync',
    powers: 'Omega-Level Magnetism & Magnetic Force-Fields',
    associates: ['vil-3', 'vil-4', 'vil-5'],
    notes: 'Supreme leader of the Brotherhood. Detected redirecting planetary magnetic lines. Threat to global communications.',
    avatar: '🧲',
    archived: false
  },
  {
    id: 'vil-2',
    name: 'Apocalypse (En Sabah Nur)',
    codename: 'Apocalypse',
    threatLevel: 5,
    status: 'at_large',
    lastLocation: 'Celestial Citadel (Cairo Outskirts)',
    powers: 'Molecular Restructuring, Techno-Organic Mastery, Immortality',
    associates: ['vil-4'],
    notes: 'Ancient mutant titan initiating the Evolutionary Purge protocol. Four Horsemen heralds deployed.',
    avatar: '🏺',
    archived: false
  },
  {
    id: 'vil-3',
    name: 'Mystique (Raven Darkhölme)',
    codename: 'Mystique',
    threatLevel: 4,
    status: 'at_large',
    lastLocation: 'Federal District (Manhattan Sublevel)',
    powers: 'Metamorphic Cellular Shapeshifting & Black Ops Espionage',
    associates: ['vil-1', 'vil-5', 'vil-8'],
    notes: 'Infiltrated Triskelion command floor. Retrieved classified mutant gene-mapping files.',
    avatar: '🎭',
    archived: false
  },
  {
    id: 'vil-4',
    name: 'Juggernaut (Cain Marko)',
    codename: 'Juggernaut',
    threatLevel: 4,
    status: 'contained',
    lastLocation: 'The Raft / Kinetic Vault B-7',
    powers: 'Unstoppable Mystic Momentum & Crimson Gem Invulnerability',
    associates: ['vil-1', 'vil-2'],
    notes: 'Currently immobilized in magnetic suspension field at The Raft. Constant telepathic monitoring engaged.',
    avatar: '🛡️',
    archived: false
  },
  {
    id: 'vil-5',
    name: 'Sabretooth (Victor Creed)',
    codename: 'Sabretooth',
    threatLevel: 4,
    status: 'at_large',
    lastLocation: 'Yukon Canadian Perimeter',
    powers: 'Apex Feral Physiology, Hyper-Regeneration & Scent Tracking',
    associates: ['vil-1', 'vil-3'],
    notes: 'S.H.I.E.L.D. outpost Delta slaughtered. Tracking Wolverine through northern corridor.',
    avatar: '🐾',
    archived: false
  },
  {
    id: 'vil-6',
    name: 'Green Goblin (Norman Osborn)',
    codename: 'Green Goblin',
    threatLevel: 3,
    status: 'incarcerated',
    lastLocation: 'Ravencroft Institute / Max Isolation Cell 4',
    powers: 'Superhuman Strength, Glider Arsenal, Pumpkin Bombs',
    associates: ['vil-7'],
    notes: 'Subject sedated with neuro-inhibitors. Oscorp manufacturing plants locked under federal quarantine.',
    avatar: '🎃',
    archived: false
  },
  {
    id: 'vil-7',
    name: 'Doctor Octopus (Otto Octavius)',
    codename: 'Doc Ock',
    threatLevel: 3,
    status: 'contained',
    lastLocation: 'Ryker’s Island / High-Tech Ward',
    powers: 'Four Telepathically Controlled Titanium-Steel Tentacles',
    associates: ['vil-6'],
    notes: 'Tentacle rig decoupled. Subject currently serving as tactical intelligence asset under guard.',
    avatar: '🐙',
    archived: false
  },
  {
    id: 'vil-8',
    name: 'Toad (Mortimer Toynbee)',
    codename: 'Toad',
    threatLevel: 2,
    status: 'incarcerated',
    lastLocation: 'Triskelion Minimum Ward',
    powers: 'Enhanced Leap, Prehensile Tongue, Caustic Mucus',
    associates: ['vil-1', 'vil-3'],
    notes: 'Brotherhood courier. Intercepted during smuggling attempt at Queens harbor.',
    avatar: '🐸',
    archived: false
  }
];

const DEFAULT_CASES = [
  {
    id: 'case-101',
    title: 'Operation Ironclad: Times Square Magnetic Surge',
    description: 'Electromagnetic anomaly jamming digital grids and traffic relays across Midtown. Magneto signature verified.',
    villainId: 'vil-1',
    status: 'investigating',
    assignedHeroes: ['hero-2', 'hero-3', 'hero-4'],
    openedAt: getDateDaysAgo(2),
    resolvedAt: null,
    priority: 'critical',
    lat: 40.7580,
    lng: -73.9855,
    locationName: 'Times Square Defense Grid',
    geofenceZone: 'Zone Alpha'
  },
  {
    id: 'case-102',
    title: 'Stark Tower Sub-Vault Seismic Incursion',
    description: 'Celestial nanotech tremors activating underneath the Stark energy grid. Ancient hieroglyphic radiation detected.',
    villainId: 'vil-2',
    status: 'reported',
    assignedHeroes: ['hero-6'],
    openedAt: getDateDaysAgo(1),
    resolvedAt: null,
    priority: 'critical',
    lat: 40.7527,
    lng: -73.9772,
    locationName: 'Stark Tower Core (Midtown)',
    geofenceZone: 'Zone Alpha'
  },
  {
    id: 'case-103',
    title: 'Project Wideawake: Federal Plaza Impostor',
    description: 'Senior Director simulated by metamorphous infiltrator. Weaponized Sentinel blueprints downloaded from mainframe.',
    villainId: 'vil-3',
    status: 'assigned',
    assignedHeroes: ['hero-1', 'hero-7'],
    openedAt: getDateDaysAgo(6),
    resolvedAt: null,
    priority: 'high',
    lat: 40.7128,
    lng: -74.0060,
    locationName: 'Federal Plaza / Triskelion Annex',
    geofenceZone: null
  },
  {
    id: 'case-104',
    title: 'The Raft Kinetic Vault Rupture Threat',
    description: 'Cain Marko generated repeated kinetic shocks against cell dampening coils. Superstructure reinforcement required.',
    villainId: 'vil-4',
    status: 'resolved',
    assignedHeroes: ['hero-2', 'hero-6'],
    openedAt: getDateDaysAgo(22),
    resolvedAt: getDateDaysAgo(20),
    priority: 'critical',
    lat: 40.7831,
    lng: -73.9000,
    locationName: 'The Raft Kinetic Vault (East River)',
    geofenceZone: 'Zone Beta'
  },
  {
    id: 'case-105',
    title: 'Columbus Circle Feral Stalker Protocol',
    description: 'S.H.I.E.L.D. monitoring vehicle Echo-4 dismantled. Weapon X tracking beacons severed by high-caliber claw lacerations.',
    villainId: 'vil-5',
    status: 'investigating',
    assignedHeroes: ['hero-1'],
    openedAt: getDateDaysAgo(10),
    resolvedAt: null,
    priority: 'critical',
    lat: 40.7680,
    lng: -73.9820,
    locationName: 'Columbus Circle Gateway',
    geofenceZone: 'Zone Alpha'
  },
  {
    id: 'case-106',
    title: 'Queens Expressway Pumpkin Blitz',
    description: 'Stark Industries munitions shipment hijacked along midtown transit corridor. Osborn tech signatures verified.',
    villainId: 'vil-6',
    status: 'resolved',
    assignedHeroes: ['hero-5', 'hero-6'],
    openedAt: getDateDaysAgo(29),
    resolvedAt: getDateDaysAgo(26),
    priority: 'medium',
    lat: 40.7420,
    lng: -73.9350,
    locationName: 'Queens Expressway Corridor',
    geofenceZone: null
  },
  {
    id: 'case-107',
    title: 'East River Sub-Aquatic Cable Tap',
    description: 'Autonomous cybernetic tentacles detected splicing into transatlantic fiber network off Ryker’s perimeter.',
    villainId: 'vil-7',
    status: 'assigned',
    assignedHeroes: ['hero-5', 'hero-7'],
    openedAt: getDateDaysAgo(14),
    resolvedAt: null,
    priority: 'critical',
    lat: 40.7750,
    lng: -73.9100,
    locationName: 'Ryker’s High-Tech Annex',
    geofenceZone: 'Zone Beta'
  },
  {
    id: 'case-108',
    title: 'Red Hook Terminal Smuggling Intercept',
    description: 'Low-frequency mutant hormonal stimulants trafficked through southern pier container yard.',
    villainId: 'vil-8',
    status: 'resolved',
    assignedHeroes: ['hero-5'],
    openedAt: getDateDaysAgo(34),
    resolvedAt: getDateDaysAgo(32),
    priority: 'low',
    lat: 40.6800,
    lng: -74.0100,
    locationName: 'Red Hook Terminal',
    geofenceZone: null
  },
  {
    id: 'case-109',
    title: 'Central Park Evacuation Warning',
    description: 'Crowd panic triggered by seismic disruption radiating from midtown faultline. Rapid hero response needed.',
    villainId: 'vil-1',
    status: 'reported',
    assignedHeroes: ['hero-3', 'hero-5'],
    openedAt: getDateDaysAgo(3),
    resolvedAt: null,
    priority: 'critical',
    lat: 40.7725,
    lng: -73.9715,
    locationName: 'Central Park Naumburg Bandshell',
    geofenceZone: 'Zone Gamma'
  }
];

// ========================================================
// MATHEMATICAL HAVERSINE FORMULA & GEOSPATIAL UTILITIES
// ========================================================

/**
 * Calculates Great-Circle Distance between two coordinates using the Haversine Formula.
 * Formula:
 * a = sin²(Δφ/2) + cos(φ1) * cos(φ2) * sin²(Δλ/2)
 * c = 2 * atan2(√a, √(1−a))
 * d = R * c
 *
 * @param {number} lat1 Latitude of point 1 (in degrees)
 * @param {number} lon1 Longitude of point 1 (in degrees)
 * @param {number} lat2 Latitude of point 2 (in degrees)
 * @param {number} lon2 Longitude of point 2 (in degrees)
 * @returns {{ km: number, miles: number }} Distance in km and miles
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in kilometers
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;
  const miles = km * 0.621371;

  return {
    km: parseFloat(km.toFixed(2)),
    miles: parseFloat(miles.toFixed(2))
  };
}

/**
 * Tests if a point (lat, lng) falls inside a 2D polygon using the Ray-Casting algorithm.
 * @param {[number, number]} point [lat, lng]
 * @param {Array<[number, number]>} polygon Array of [lat, lng] vertices
 * @returns {boolean}
 */
function isPointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Evaluates whether coordinates breach any designated high-risk geofence zone.
 * @param {number} lat 
 * @param {number} lng 
 * @returns {object|null} Returns breached zone object or null
 */
function checkGeofenceBreach(lat, lng) {
  if (lat === undefined || lng === undefined || lat === null || lng === null) return null;
  const point = [parseFloat(lat), parseFloat(lng)];

  for (const zone of GEOFENCE_ZONES) {
    if (isPointInPolygon(point, zone.polygon)) {
      return zone;
    }
  }
  return null;
}

// LocalStorage helpers
function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return JSON.parse(JSON.stringify(fallback));
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading ${key} from storage:`, err);
    return JSON.parse(JSON.stringify(fallback));
  }
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

function resetStorageToDefault() {
  localStorage.setItem(STORAGE_KEYS.VILLAINS, JSON.stringify(DEFAULT_VILLAINS));
  localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(DEFAULT_CASES));
  localStorage.setItem(STORAGE_KEYS.HEROES, JSON.stringify(DEFAULT_HEROES));
}

// Global sanitization helper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
