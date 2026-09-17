/**
 * CEREBRO // CENTRAL STATE MANAGER
 * Reactive state store, CRUD actions, computed analytics, and event dispatch
 */

class CommandState {
  constructor() {
    this.villains = loadFromStorage(STORAGE_KEYS.VILLAINS, DEFAULT_VILLAINS);
    this.cases = loadFromStorage(STORAGE_KEYS.CASES, DEFAULT_CASES);
    this.heroes = loadFromStorage(STORAGE_KEYS.HEROES, DEFAULT_HEROES);
    this.listeners = [];
    
    // UI states
    this.currentTab = 'overview'; // overview, registry, kanban, heroes
    this.searchQuery = '';
    this.filterStatus = 'all'; // all, at_large, contained, incarcerated
    this.filterThreat = 'all'; // all, 1, 2, 3, 4, 5
    this.selectedVillainId = null;
    this.selectedCaseId = null;
    this.registryViewMode = 'grid'; // grid, table
  }

  // Subscribe to state updates
  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  notify(eventType, payload) {
    this.listeners.forEach(fn => fn(eventType, payload));
  }

  // Persistence
  save() {
    saveToStorage(STORAGE_KEYS.VILLAINS, this.villains);
    saveToStorage(STORAGE_KEYS.CASES, this.cases);
    saveToStorage(STORAGE_KEYS.HEROES, this.heroes);
  }

  resetDefaults() {
    resetStorageToDefault();
    this.villains = loadFromStorage(STORAGE_KEYS.VILLAINS, DEFAULT_VILLAINS);
    this.cases = loadFromStorage(STORAGE_KEYS.CASES, DEFAULT_CASES);
    this.heroes = loadFromStorage(STORAGE_KEYS.HEROES, DEFAULT_HEROES);
    this.notify('RESET', null);
  }

  // ==================== VILLAIN CRUD ====================
  getVillains(includeArchived = false) {
    return this.villains.filter(v => includeArchived ? true : !v.archived);
  }

  getFilteredVillains() {
    const query = this.searchQuery.toLowerCase().trim();
    return this.getVillains().filter(v => {
      const matchStatus = this.filterStatus === 'all' || v.status === this.filterStatus;
      const matchThreat = this.filterThreat === 'all' || v.threatLevel === parseInt(this.filterThreat, 10);
      const matchSearch = !query || 
        v.name.toLowerCase().includes(query) ||
        v.codename.toLowerCase().includes(query) ||
        (v.powers && v.powers.toLowerCase().includes(query)) ||
        (v.lastLocation && v.lastLocation.toLowerCase().includes(query));
      return matchStatus && matchThreat && matchSearch;
    });
  }

  getVillainById(id) {
    return this.villains.find(v => v.id === id);
  }

  addVillain(data) {
    const newVillain = {
      id: 'vil-' + Date.now().toString(36),
      name: data.name.trim(),
      codename: data.codename ? data.codename.trim() : data.name.split(' ')[0],
      threatLevel: parseInt(data.threatLevel, 10) || 3,
      status: data.status || 'at_large',
      lastLocation: data.lastLocation || 'Unknown Coordinates',
      powers: data.powers || 'Classified Mutant Abilties',
      associates: Array.isArray(data.associates) ? data.associates : [],
      notes: data.notes || '',
      avatar: data.avatar || '⚡',
      archived: false
    };

    this.villains.unshift(newVillain);
    this.save();
    this.notify('VILLAIN_ADDED', newVillain);
    return newVillain;
  }

  updateVillain(id, updates) {
    const index = this.villains.findIndex(v => v.id === id);
    if (index === -1) return null;

    const oldThreat = this.villains[index].threatLevel;
    const oldStatus = this.villains[index].status;

    this.villains[index] = {
      ...this.villains[index],
      ...updates,
      threatLevel: updates.threatLevel !== undefined ? parseInt(updates.threatLevel, 10) : this.villains[index].threatLevel
    };

    this.save();
    this.notify('VILLAIN_UPDATED', { villain: this.villains[index], oldThreat, oldStatus });
    return this.villains[index];
  }

  archiveVillain(id) {
    const v = this.getVillainById(id);
    if (!v) return;
    v.archived = !v.archived;
    this.save();
    this.notify('VILLAIN_ARCHIVED', v);
  }

  deleteVillain(id) {
    this.villains = this.villains.filter(v => v.id !== id);
    // Remove as associate from others
    this.villains.forEach(v => {
      v.associates = v.associates.filter(aid => aid !== id);
    });
    this.save();
    this.notify('VILLAIN_DELETED', id);
  }

  // ==================== CASE CRUD ====================
  getCases() {
    return this.cases;
  }

  getCaseById(id) {
    return this.cases.find(c => c.id === id);
  }

  getCasesForVillain(villainId) {
    return this.cases.filter(c => c.villainId === villainId);
  }

  addCase(data) {
    const lat = data.lat !== undefined && data.lat !== '' ? parseFloat(data.lat) : 40.7580;
    const lng = data.lng !== undefined && data.lng !== '' ? parseFloat(data.lng) : -73.9855;
    const locationName = data.locationName ? data.locationName.trim() : 'Manhattan Sector Grid';

    // Check geofence breach & dynamic auto-escalation
    const breachedZone = checkGeofenceBreach(lat, lng);
    let priority = data.priority || 'medium';
    let geofenceZone = null;
    let autoEscalated = false;

    if (breachedZone) {
      geofenceZone = breachedZone.name;
      priority = 'critical'; // Dynamic Priority Boosting overrides standard triage
      autoEscalated = true;
    }

    const newCase = {
      id: 'case-' + Date.now().toString(36),
      title: data.title.trim(),
      description: data.description ? data.description.trim() : '',
      villainId: data.villainId,
      status: data.status || 'reported',
      assignedHeroes: Array.isArray(data.assignedHeroes) ? data.assignedHeroes : [],
      openedAt: data.openedAt || new Date().toISOString().split('T')[0],
      resolvedAt: data.status === 'resolved' ? new Date().toISOString().split('T')[0] : null,
      priority: priority,
      lat: lat,
      lng: lng,
      locationName: locationName,
      geofenceZone: geofenceZone,
      autoEscalated: autoEscalated
    };

    this.cases.unshift(newCase);
    this.save();
    this.notify('CASE_ADDED', newCase);

    if (autoEscalated) {
      this.notify('GEOFENCE_BREACH', { caseItem: newCase, zone: breachedZone });
    }

    return newCase;
  }

  updateCase(id, updates) {
    const index = this.cases.findIndex(c => c.id === id);
    if (index === -1) return null;

    if (updates.status === 'resolved' && this.cases[index].status !== 'resolved') {
      updates.resolvedAt = updates.resolvedAt || new Date().toISOString().split('T')[0];
    } else if (updates.status && updates.status !== 'resolved') {
      updates.resolvedAt = null;
    }

    // If coordinates changed, re-evaluate geofencing
    if (updates.lat !== undefined && updates.lng !== undefined) {
      const lat = parseFloat(updates.lat);
      const lng = parseFloat(updates.lng);
      const breachedZone = checkGeofenceBreach(lat, lng);
      if (breachedZone) {
        updates.geofenceZone = breachedZone.name;
        updates.priority = 'critical'; // Auto-escalate
        updates.autoEscalated = true;
      } else {
        updates.geofenceZone = null;
      }
    }

    this.cases[index] = {
      ...this.cases[index],
      ...updates
    };

    this.save();
    this.notify('CASE_UPDATED', this.cases[index]);
    return this.cases[index];
  }

  updateCaseStatus(id, newStatus) {
    return this.updateCase(id, { status: newStatus });
  }

  deleteCase(id) {
    this.cases = this.cases.filter(c => c.id !== id);
    this.save();
    this.notify('CASE_DELETED', id);
  }

  // ==================== GEOSPATIAL PROXIMITY ====================
  getHeroesSortedByProximity(targetLat, targetLng) {
    return this.heroes.map(hero => {
      const dist = calculateHaversineDistance(targetLat, targetLng, hero.lat, hero.lng);
      // ETA in minutes = (distance in km / speed in km/h) * 60
      const speed = hero.speedKmH || 100;
      const etaMinutes = parseFloat(((dist.km / speed) * 60).toFixed(1));

      return {
        ...hero,
        distanceKm: dist.km,
        distanceMiles: dist.miles,
        etaMinutes: etaMinutes < 0.2 ? 0.2 : etaMinutes
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }

  // ==================== HERO ROSTER ====================
  getHeroes() {
    return this.heroes;
  }

  getHeroById(id) {
    return this.heroes.find(h => h.id === id);
  }

  // ==================== COMPUTED METRICS ====================
  getAlerts() {
    // A rule that runs whenever villain data changes:
    // if villain.threatLevel === 5 && villain.status === 'at_large', push a persistent red banner
    return this.villains.filter(v => !v.archived && v.threatLevel === 5 && v.status === 'at_large');
  }

  getStats() {
    const activeVillains = this.villains.filter(v => !v.archived && v.status === 'at_large').length;
    const containedVillains = this.villains.filter(v => !v.archived && (v.status === 'contained' || v.status === 'incarcerated')).length;
    const openCases = this.cases.filter(c => c.status !== 'resolved').length;
    const resolvedCases = this.cases.filter(c => c.status === 'resolved').length;

    // Unique heroes assigned to active (unresolved) cases
    const deployedHeroIds = new Set();
    this.cases.forEach(c => {
      if (c.status !== 'resolved') {
        c.assignedHeroes.forEach(hid => deployedHeroIds.add(hid));
      }
    });

    const level5Alerts = this.getAlerts().length;

    return {
      activeVillains,
      containedVillains,
      openCases,
      resolvedCases,
      heroesDeployed: deployedHeroIds.size,
      totalHeroes: this.heroes.length,
      level5Alerts
    };
  }

  // Group cases into weekly intervals for the Stacked Bar Chart
  getChartWeeklyData() {
    // Generate 5 weekly intervals: Wk -4, Wk -3, Wk -2, Wk -1, Current Wk
    const weeks = [
      { label: '4 Weeks Ago', minDays: 22, maxDays: 40 },
      { label: '3 Weeks Ago', minDays: 15, maxDays: 21 },
      { label: '2 Weeks Ago', minDays: 8, maxDays: 14 },
      { label: 'Last Week', minDays: 2, maxDays: 7 },
      { label: 'Current Week', minDays: 0, maxDays: 1 }
    ];

    const today = new Date();

    // Map each threat level (1 to 5) to an array of counts for each week
    const countsByLevel = {
      1: [0, 0, 0, 0, 0],
      2: [0, 0, 0, 0, 0],
      3: [0, 0, 0, 0, 0],
      4: [0, 0, 0, 0, 0],
      5: [0, 0, 0, 0, 0]
    };

    this.cases.forEach(c => {
      const openedDate = new Date(c.openedAt);
      const diffTime = Math.abs(today - openedDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // find which week bucket
      let weekIndex = -1;
      for (let i = 0; i < weeks.length; i++) {
        if (diffDays >= weeks[i].minDays && diffDays <= weeks[i].maxDays) {
          weekIndex = i;
          break;
        }
      }
      if (weekIndex === -1 && diffDays > 40) {
        weekIndex = 0; // fold older into earliest week
      } else if (weekIndex === -1) {
        weekIndex = 4;
      }

      // get villain's threat level
      const villain = this.getVillainById(c.villainId);
      const threat = villain ? villain.threatLevel : 3;
      if (countsByLevel[threat]) {
        countsByLevel[threat][weekIndex] += 1;
      }
    });

    return {
      labels: weeks.map(w => w.label),
      countsByLevel
    };
  }
}

// Global state instance
const state = new CommandState();
