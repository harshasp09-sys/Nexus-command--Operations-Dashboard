/**
 * CEREBRO // TACTICAL COMMAND APPLICATION CONTROLLER
 * Full view routing, modal handling, alerts management, villain network tracing, and CRUD forms
 */

// Alert rotation state
let alertCurrentIndex = 0;
let alertIntervalTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Navigation tabs
  setupNavigation();

  // Search & Filter listeners
  setupFilters();

  // Modal event listeners
  setupModals();

  // Initial renders
  renderAllViews();

  // Subscribe to state changes for reactive rendering
  state.subscribe((eventType, payload) => {
    renderAlertBanner();
    renderOverviewStats();
    updateThreatTrendChart();
    renderVillainRegistry();
    renderKanbanBoard();
    renderHeroRoster();
    if (typeof refreshTacticalGrid === 'function') {
      refreshTacticalGrid();
    }
  });

  // Start periodic alert cycle
  startAlertCycle();

  // Initialize chart on first load
  setTimeout(() => {
    initThreatTrendChart();
  }, 100);
}

// ========================================================
// NAVIGATION
// ========================================================
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-tab-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Quick Action Buttons in Top Bar
  const btnNewVillain = document.getElementById('btnQuickNewVillain');
  if (btnNewVillain) {
    btnNewVillain.addEventListener('click', () => openVillainEditModal());
  }

  const btnNewCase = document.getElementById('btnQuickNewCase');
  if (btnNewCase) {
    btnNewCase.addEventListener('click', () => openCaseEditModal());
  }

  const btnSimulate = document.getElementById('btnSimulateEmergency');
  if (btnSimulate) {
    btnSimulate.addEventListener('click', () => simulateCitizenEmergency());
  }

  const btnResetData = document.getElementById('btnResetData');
  if (btnResetData) {
    btnResetData.addEventListener('click', () => {
      if (confirm('RESET PROTOCOL: Restore Cerebro database to canonical Marvel/X-Men factory baseline?')) {
        state.resetDefaults();
        showComicToast('CEREBRO MAINFRAME RESTORED TO BASELINE!', 'warning');
      }
    });
  }
}

function switchTab(tabName) {
  state.currentTab = tabName;

  // Update nav buttons
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });

  // Update views
  document.querySelectorAll('.view-section').forEach(section => {
    section.classList.toggle('active-view', section.id === `view-${tabName}`);
  });

  // Render or refresh specific views
  if (tabName === 'overview') {
    renderOverviewStats();
    setTimeout(() => updateThreatTrendChart(), 50);
  } else if (tabName === 'map') {
    if (typeof initTacticalMap === 'function') {
      initTacticalMap();
    }
    if (typeof invalidateMapSize === 'function') {
      invalidateMapSize();
    }
  } else if (tabName === 'registry') {
    renderVillainRegistry();
  } else if (tabName === 'kanban') {
    renderKanbanBoard();
  } else if (tabName === 'heroes') {
    renderHeroRoster();
  }
}

function renderAllViews() {
  renderAlertBanner();
  renderOverviewStats();
  renderVillainRegistry();
  renderKanbanBoard();
  renderHeroRoster();
  renderEmergencyFeed();
}

// ========================================================
// PERSISTENT LEVEL 5 AT-LARGE ALERT BANNER
// ========================================================
function renderAlertBanner() {
  const container = document.getElementById('persistentAlertContainer');
  if (!container) return;

  const alerts = state.getAlerts(); // threatLevel === 5 && status === 'at_large'

  if (alerts.length === 0) {
    container.innerHTML = `
      <div class="alert-banner alert-banner-clear">
        <div class="alert-content-inner">
          <span class="alert-icon">🛡️</span>
          <span class="alert-title">ALL OMEGA THREATS CONTAINED OR TRACKED</span>
          <span class="alert-sub">No Level 5 threats currently at large. Threat condition: DEFCON 3.</span>
        </div>
      </div>
    `;
    return;
  }

  if (alertCurrentIndex >= alerts.length) {
    alertCurrentIndex = 0;
  }

  const currentVillain = alerts[alertCurrentIndex];

  container.innerHTML = `
    <div class="alert-banner alert-banner-active" onclick="openVillainDetailModal('${currentVillain.id}')" title="CLICK TO OPEN FUGITIVE DOSSIER">
      <div class="alert-content-inner">
        <span class="alert-siren-icon">🚨</span>
        <div class="alert-text-block">
          <div class="alert-headline">
            <span class="alert-flashing-tag">CRITICAL ALERT</span>
            <strong class="alert-villain-name">${escapeHtml(currentVillain.name.toUpperCase())}</strong>
            <span class="alert-threat-badge">THREAT LEVEL 5 // OMEGA</span>
            <span class="alert-status-badge">AT LARGE</span>
          </div>
          <div class="alert-location-text">
            📍 LAST RADAR FIX: <span class="loc-highlight">${escapeHtml(currentVillain.lastLocation)}</span>
            <span class="click-hint">⚡ CLICK TO VIEW DOSSIER & DEPLOY X-MEN</span>
          </div>
        </div>
      </div>
      
      ${alerts.length > 1 ? `
        <div class="alert-controls" onclick="event.stopPropagation();">
          <span class="alert-counter">${alertCurrentIndex + 1} OF ${alerts.length} OMEGAS</span>
          <button class="alert-ctrl-btn" onclick="prevAlert();" title="Previous Alert">◀</button>
          <button class="alert-ctrl-btn" onclick="nextAlert();" title="Next Alert">▶</button>
        </div>
      ` : ''}
    </div>
  `;
}

function startAlertCycle() {
  if (alertIntervalTimer) clearInterval(alertIntervalTimer);
  alertIntervalTimer = setInterval(() => {
    const alerts = state.getAlerts();
    if (alerts.length > 1) {
      alertCurrentIndex = (alertCurrentIndex + 1) % alerts.length;
      renderAlertBanner();
    }
  }, 6000);
}

function nextAlert() {
  const alerts = state.getAlerts();
  if (alerts.length > 0) {
    alertCurrentIndex = (alertCurrentIndex + 1) % alerts.length;
    renderAlertBanner();
  }
}

function prevAlert() {
  const alerts = state.getAlerts();
  if (alerts.length > 0) {
    alertCurrentIndex = (alertCurrentIndex - 1 + alerts.length) % alerts.length;
    renderAlertBanner();
  }
}

// ========================================================
// OVERVIEW VIEW: STATS & DISPATCH FEED
// ========================================================
function renderOverviewStats() {
  const stats = state.getStats();

  const elActive = document.getElementById('statActiveVillains');
  if (elActive) elActive.textContent = stats.activeVillains;

  const elCases = document.getElementById('statOpenCases');
  if (elCases) elCases.textContent = stats.openCases;

  const elHeroes = document.getElementById('statHeroesDeployed');
  if (elHeroes) elHeroes.textContent = `${stats.heroesDeployed}/${stats.totalHeroes}`;

  const elContained = document.getElementById('statContained');
  if (elContained) elContained.textContent = stats.containedVillains;

  const elResolved = document.getElementById('statResolvedCases');
  if (elResolved) elResolved.textContent = stats.resolvedCases;
}

function renderEmergencyFeed() {
  const feedContainer = document.getElementById('emergencyFeedList');
  if (!feedContainer) return;

  const recentCases = state.getCases().slice(0, 5);

  feedContainer.innerHTML = recentCases.map(c => {
    const villain = state.getVillainById(c.villainId);
    const vName = villain ? villain.codename : 'Unknown Fugitive';
    const threatLevel = villain ? villain.threatLevel : 3;

    return `
      <div class="feed-item" onclick="openCaseEditModal('${c.id}')">
        <div class="feed-badge-col">
          <span class="feed-status-pill status-${c.status}">${c.status.toUpperCase()}</span>
          <span class="threat-pill threat-lvl-${threatLevel}">LVL ${threatLevel}</span>
        </div>
        <div class="feed-body">
          <div class="feed-title">${escapeHtml(c.title)}</div>
          <div class="feed-sub">Target: <strong>${escapeHtml(vName)}</strong> • Opened: ${c.openedAt}</div>
        </div>
        <div class="feed-arrow">➔</div>
      </div>
    `;
  }).join('');
}

// ========================================================
// VILLAIN REGISTRY: FILTERS, CARDS & TABLE VIEW
// ========================================================
function setupFilters() {
  const searchInput = document.getElementById('villainSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderVillainRegistry();
    });
  }

  const statusFilter = document.getElementById('villainStatusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      state.filterStatus = e.target.value;
      renderVillainRegistry();
    });
  }

  const threatFilter = document.getElementById('villainThreatFilter');
  if (threatFilter) {
    threatFilter.addEventListener('change', (e) => {
      state.filterThreat = e.target.value;
      renderVillainRegistry();
    });
  }

  const btnViewGrid = document.getElementById('btnViewGrid');
  const btnViewTable = document.getElementById('btnViewTable');

  if (btnViewGrid && btnViewTable) {
    btnViewGrid.addEventListener('click', () => {
      state.registryViewMode = 'grid';
      btnViewGrid.classList.add('active');
      btnViewTable.classList.remove('active');
      renderVillainRegistry();
    });

    btnViewTable.addEventListener('click', () => {
      state.registryViewMode = 'table';
      btnViewTable.classList.add('active');
      btnViewGrid.classList.remove('active');
      renderVillainRegistry();
    });
  }
}

function renderVillainRegistry() {
  const container = document.getElementById('villainRegistryContent');
  if (!container) return;

  const villains = state.getFilteredVillains();
  const countBadge = document.getElementById('villainMatchCount');
  if (countBadge) {
    countBadge.textContent = `${villains.length} LOCATED`;
  }

  if (villains.length === 0) {
    container.innerHTML = `
      <div class="empty-results-box">
        <span class="empty-icon">📡</span>
        <h3>NO ROGUES MATCH SEARCH CRITERIA</h3>
        <p>Adjust threat filters or search keywords in Cerebro database.</p>
        <button class="comic-btn comic-btn-yellow" onclick="clearVillainFilters()">CLEAR ALL FILTERS</button>
      </div>
    `;
    return;
  }

  if (state.registryViewMode === 'table') {
    renderVillainTable(container, villains);
  } else {
    renderVillainGrid(container, villains);
  }
}

function clearVillainFilters() {
  state.searchQuery = '';
  state.filterStatus = 'all';
  state.filterThreat = 'all';

  const sInput = document.getElementById('villainSearchInput');
  if (sInput) sInput.value = '';
  const sFilter = document.getElementById('villainStatusFilter');
  if (sFilter) sFilter.value = 'all';
  const tFilter = document.getElementById('villainThreatFilter');
  if (tFilter) tFilter.value = 'all';

  renderVillainRegistry();
}

function renderVillainGrid(container, villains) {
  container.innerHTML = `
    <div class="villains-card-grid">
      ${villains.map(v => {
        const linkedCases = state.getCasesForVillain(v.id);
        const activeCasesCount = linkedCases.filter(c => c.status !== 'resolved').length;
        const associates = v.associates.map(aid => state.getVillainById(aid)).filter(Boolean);

        return `
          <div class="villain-card ${v.threatLevel === 5 && v.status === 'at_large' ? 'omega-pulsing-border' : ''}" 
               onclick="openVillainDetailModal('${v.id}')"
               role="button"
               tabindex="0"
               title="Click to view full dossier">
            
            <div class="villain-card-header">
              <span class="villain-avatar-bubble">${v.avatar || '⚡'}</span>
              <div class="villain-id-info">
                <h3 class="villain-codename">${escapeHtml(v.codename)}</h3>
                <span class="villain-realname">${escapeHtml(v.name)}</span>
              </div>
              <span class="threat-pill threat-lvl-${v.threatLevel}">
                LVL ${v.threatLevel}
              </span>
            </div>

            <div class="villain-card-middle">
              <div class="villain-status-row">
                <span class="status-pill status-${v.status}">
                  ${v.status.replace('_', ' ').toUpperCase()}
                </span>
                <span class="cases-metric-pill">
                  📂 ${activeCasesCount} Active / ${linkedCases.length} Total
                </span>
              </div>

              <div class="villain-location-box">
                <span class="loc-icon">📍</span>
                <span class="loc-val">${escapeHtml(v.lastLocation)}</span>
              </div>

              <div class="villain-powers-snippet">
                <strong>POWERS:</strong> ${escapeHtml(v.powers || 'Classified')}
              </div>
            </div>

            <div class="villain-card-footer">
              <div class="villain-associates-preview">
                <span class="assoc-label">SYNDICATE (${associates.length}):</span>
                <div class="assoc-mini-chips">
                  ${associates.slice(0, 3).map(a => `
                    <span class="mini-assoc-chip" onclick="event.stopPropagation(); openVillainDetailModal('${a.id}')" title="${a.codename}">
                      ${a.codename}
                    </span>
                  `).join('')}
                  ${associates.length > 3 ? `<span class="mini-assoc-more">+${associates.length - 3}</span>` : ''}
                </div>
              </div>

              <div class="villain-card-actions">
                <button class="icon-btn" title="Edit Dossier" onclick="event.stopPropagation(); openVillainEditModal('${v.id}')">
                  ✏️
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderVillainTable(container, villains) {
  container.innerHTML = `
    <div class="table-responsive-container">
      <table class="comic-data-table">
        <thead>
          <tr>
            <th>THREAT</th>
            <th>CODENAME / ALIAS</th>
            <th>STATUS</th>
            <th>LAST KNOWN RADAR FIX</th>
            <th>ACTIVE CASES</th>
            <th>SYNDICATE ASSOCIATES</th>
            <th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          ${villains.map(v => {
            const linkedCases = state.getCasesForVillain(v.id);
            const activeCasesCount = linkedCases.filter(c => c.status !== 'resolved').length;
            const associates = v.associates.map(aid => state.getVillainById(aid)).filter(Boolean);

            return `
              <tr onclick="openVillainDetailModal('${v.id}')" class="table-villain-row ${v.threatLevel === 5 && v.status === 'at_large' ? 'row-omega-threat' : ''}">
                <td>
                  <span class="threat-pill threat-lvl-${v.threatLevel}">
                    LVL ${v.threatLevel}
                  </span>
                </td>
                <td>
                  <div class="table-name-cell">
                    <span class="tbl-avatar">${v.avatar || '⚡'}</span>
                    <div>
                      <strong>${escapeHtml(v.codename)}</strong>
                      <div class="tbl-sub">${escapeHtml(v.name)}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="status-pill status-${v.status}">
                    ${v.status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td>
                  <span class="tbl-location">📍 ${escapeHtml(v.lastLocation)}</span>
                </td>
                <td>
                  <span class="tbl-case-count">${activeCasesCount} open (${linkedCases.length} total)</span>
                </td>
                <td>
                  <div class="assoc-mini-chips">
                    ${associates.map(a => `
                      <span class="mini-assoc-chip" onclick="event.stopPropagation(); openVillainDetailModal('${a.id}')">
                        ${a.codename}
                      </span>
                    `).join('') || '<span class="text-muted">Lone Operative</span>'}
                  </div>
                </td>
                <td onclick="event.stopPropagation();">
                  <div class="tbl-action-group">
                    <button class="tbl-btn" title="View Dossier" onclick="openVillainDetailModal('${v.id}')">👁️</button>
                    <button class="tbl-btn" title="Edit Profile" onclick="openVillainEditModal('${v.id}')">✏️</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ========================================================
// VILLAIN DETAIL MODAL WITH NETWORK ASSOCIATE CHIPS
// ========================================================
function openVillainDetailModal(villainId) {
  const villain = state.getVillainById(villainId);
  if (!villain) return;

  state.selectedVillainId = villainId;

  const modal = document.getElementById('villainDetailModal');
  const modalContent = document.getElementById('villainDetailModalContent');
  if (!modal || !modalContent) return;

  const linkedCases = state.getCasesForVillain(villain.id);
  const associates = villain.associates.map(aid => state.getVillainById(aid)).filter(Boolean);

  modalContent.innerHTML = `
    <div class="dossier-header ${villain.threatLevel === 5 ? 'dossier-omega-header' : ''}">
      <div class="dossier-hero-banner">
        <div class="dossier-avatar-large">${villain.avatar || '⚡'}</div>
        <div class="dossier-title-block">
          <div class="dossier-badge-row">
            <span class="threat-pill threat-lvl-${villain.threatLevel}">
              THREAT LEVEL ${villain.threatLevel} // ${villain.threatLevel === 5 ? 'OMEGA MUTANT' : 'ALPHA CLASS'}
            </span>
            <span class="status-pill status-${villain.status}">
              STATUS: ${villain.status.replace('_', ' ').toUpperCase()}
            </span>
            ${villain.archived ? '<span class="status-pill status-archived">ARCHIVED DOSSIER</span>' : ''}
          </div>
          <h2 class="dossier-codename">${escapeHtml(villain.codename.toUpperCase())}</h2>
          <div class="dossier-realname">LEGAL IDENTITY: <strong>${escapeHtml(villain.name)}</strong></div>
        </div>
      </div>
      <button class="modal-close-btn" onclick="closeModals()">✕</button>
    </div>

    <div class="dossier-body">
      <div class="dossier-grid-layout">
        
        <!-- Left Column: Dossier Intel -->
        <div class="dossier-intel-col">
          <div class="dossier-panel-box">
            <h4 class="panel-box-title">📍 LAST DETECTED COORDINATES</h4>
            <p class="panel-box-content highlight-loc">${escapeHtml(villain.lastLocation)}</p>
          </div>

          <div class="dossier-panel-box">
            <h4 class="panel-box-title">⚡ MUTANT / SUPERHUMAN ABILITIES</h4>
            <p class="panel-box-content">${escapeHtml(villain.powers || 'Information restricted under S.H.I.E.L.D. Level 7 clearance.')}</p>
          </div>

          <div class="dossier-panel-box">
            <h4 class="panel-box-title">📝 CEREBRO TACTICAL BRIEFING</h4>
            <p class="panel-box-content briefing-text">${escapeHtml(villain.notes || 'No tactical anomalies recorded.')}</p>
          </div>

          <!-- Quick Status Override Bar -->
          <div class="dossier-panel-box status-override-box">
            <h4 class="panel-box-title">⚡ RAPID STATUS UPDATE</h4>
            <div class="quick-status-buttons">
              <button class="status-btn ${villain.status === 'at_large' ? 'active-st' : ''}" 
                      onclick="updateVillainStatusDirectly('${villain.id}', 'at_large')">
                🚨 AT LARGE
              </button>
              <button class="status-btn ${villain.status === 'contained' ? 'active-st' : ''}" 
                      onclick="updateVillainStatusDirectly('${villain.id}', 'contained')">
                🛡️ CONTAINED
              </button>
              <button class="status-btn ${villain.status === 'incarcerated' ? 'active-st' : ''}" 
                      onclick="updateVillainStatusDirectly('${villain.id}', 'incarcerated')">
                🔒 INCARCERATED
              </button>
            </div>
          </div>
        </div>

        <!-- Right Column: Network & Linked Cases -->
        <div class="dossier-network-col">
          
          <!-- ASSOCIATE NETWORK CHIPS (CLICK TO PIVOT) -->
          <div class="dossier-panel-box">
            <h4 class="panel-box-title">
              🕸️ CRIMINAL NETWORK & KNOWN ASSOCIATES (${associates.length})
              <span class="panel-title-hint">Click chip to trace syndicate</span>
            </h4>
            <div class="associate-chips-wall">
              ${associates.length > 0 ? associates.map(a => `
                <div class="network-associate-chip threat-border-${a.threatLevel}" 
                     onclick="openVillainDetailModal('${a.id}')"
                     title="Pivot to ${a.codename} (Threat Level ${a.threatLevel})">
                  <span class="assoc-chip-avatar">${a.avatar || '⚡'}</span>
                  <div class="assoc-chip-details">
                    <span class="assoc-chip-name">${escapeHtml(a.codename)}</span>
                    <span class="assoc-chip-threat">LVL ${a.threatLevel} • ${a.status.replace('_', ' ')}</span>
                  </div>
                  <span class="assoc-jump-arrow">➔</span>
                </div>
              `).join('') : '<div class="text-empty-muted">No documented associates in current network trace.</div>'}
            </div>
          </div>

          <!-- LINKED CASES -->
          <div class="dossier-panel-box">
            <div class="panel-box-header-row">
              <h4 class="panel-box-title">📂 LINKED INCIDENT CASES (${linkedCases.length})</h4>
              <button class="comic-btn comic-btn-sm comic-btn-yellow" onclick="openNewCaseForVillain('${villain.id}')">
                + NEW INCIDENT
              </button>
            </div>

            <div class="dossier-cases-list">
              ${linkedCases.length > 0 ? linkedCases.map(c => {
                const assignedHeroes = c.assignedHeroes.map(hid => state.getHeroById(hid)).filter(Boolean);

                return `
                  <div class="dossier-case-item" onclick="openCaseEditModal('${c.id}')">
                    <div class="dossier-case-top">
                      <span class="status-pill status-${c.status}">${c.status.toUpperCase()}</span>
                      <span class="priority-pill priority-${c.priority}">${c.priority.toUpperCase()}</span>
                      <span class="case-date-tag">${c.openedAt}</span>
                    </div>
                    <h5 class="dossier-case-title">${escapeHtml(c.title)}</h5>
                    <div class="dossier-case-heroes">
                      <span class="heroes-label">HEROES:</span>
                      ${assignedHeroes.length > 0 ? assignedHeroes.map(h => `
                        <span class="hero-micro-tag" style="border-color: ${h.accentColor}">
                          ${h.avatar} ${h.codename}
                        </span>
                      `).join('') : '<span class="text-muted">None deployed</span>'}
                    </div>
                  </div>
                `;
              }).join('') : '<div class="text-empty-muted">No active or archived incidents recorded against this subject.</div>'}
            </div>
          </div>

        </div>

      </div>

      <!-- Dossier Actions Footer -->
      <div class="dossier-footer-actions">
        <button class="comic-btn comic-btn-blue" onclick="openVillainEditModal('${villain.id}')">
          ✏️ EDIT FULL DOSSIER
        </button>
        <button class="comic-btn comic-btn-yellow" onclick="openNewCaseForVillain('${villain.id}')">
          🚨 FILE INCIDENT CASE
        </button>
        <button class="comic-btn ${villain.archived ? 'comic-btn-green' : 'comic-btn-crimson'}" onclick="toggleArchiveVillain('${villain.id}')">
          ${villain.archived ? '📂 RESTORE ARCHIVED DOSSIER' : '🗄️ ARCHIVE DOSSIER'}
        </button>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function updateVillainStatusDirectly(villainId, newStatus) {
  state.updateVillain(villainId, { status: newStatus });
  openVillainDetailModal(villainId);
  showComicToast(`SUBJECT STATUS UPDATED TO: ${newStatus.toUpperCase()}!`, 'success');
}

function toggleArchiveVillain(villainId) {
  state.archiveVillain(villainId);
  openVillainDetailModal(villainId);
  showComicToast('VILLAIN ARCHIVE STATUS MODIFIED!', 'warning');
}

function openNewCaseForVillain(villainId) {
  closeModals();
  openCaseEditModal(null, villainId);
}

// ========================================================
// CASE CREATE / EDIT MODAL (WITH GEOSPATIAL COORDINATES)
// ========================================================
function openCaseEditModal(caseId = null, preselectedVillainId = null, coordinatesData = null) {
  const modal = document.getElementById('caseEditModal');
  const modalContent = document.getElementById('caseEditModalContent');
  if (!modal || !modalContent) return;

  const existingCase = caseId ? state.getCaseById(caseId) : null;
  const villains = state.getVillains();
  const heroes = state.getHeroes();

  const selectedVillain = existingCase ? existingCase.villainId : (preselectedVillainId || (villains[0] ? villains[0].id : ''));
  const selectedHeroes = existingCase ? existingCase.assignedHeroes : [];

  const initialLat = coordinatesData ? coordinatesData.lat : (existingCase ? existingCase.lat : 40.7580);
  const initialLng = coordinatesData ? coordinatesData.lng : (existingCase ? existingCase.lng : -73.9855);
  const initialLocName = coordinatesData ? coordinatesData.locationName : (existingCase ? (existingCase.locationName || 'Times Square Defense Grid') : 'Times Square Defense Grid');

  const initialBreach = checkGeofenceBreach(initialLat, initialLng);

  modalContent.innerHTML = `
    <div class="modal-comic-header">
      <h3 class="modal-comic-title">
        ${existingCase ? 'TACTICAL CASE FILE // EDIT INCIDENT' : 'LOG NEW EMERGENCY INCIDENT'}
      </h3>
      <button class="modal-close-btn" onclick="closeModals()">✕</button>
    </div>

    <form id="caseEditForm" onsubmit="handleCaseFormSubmit(event, '${existingCase ? existingCase.id : ''}')">
      <div class="form-group">
        <label class="comic-label">INCIDENT CODENAME / TITLE *</label>
        <input type="text" id="caseFormTitle" class="comic-input" required 
               placeholder="e.g. Operation Asteroid M Defense" 
               value="${existingCase ? escapeHtml(existingCase.title) : ''}">
      </div>

      <div class="form-row-2">
        <div class="form-group">
          <label class="comic-label">LINKED SUSPECT / VILLAIN *</label>
          <select id="caseFormVillain" class="comic-select" required>
            ${villains.map(v => `
              <option value="${v.id}" ${v.id === selectedVillain ? 'selected' : ''}>
                ${escapeHtml(v.codename)} (Threat Level ${v.threatLevel} - ${v.status.replace('_', ' ')})
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="comic-label">TACTICAL STATUS *</label>
          <select id="caseFormStatus" class="comic-select" required>
            <option value="reported" ${existingCase && existingCase.status === 'reported' ? 'selected' : ''}>Reported (Incoming)</option>
            <option value="investigating" ${existingCase && existingCase.status === 'investigating' ? 'selected' : ''}>Investigating (Field Recon)</option>
            <option value="assigned" ${existingCase && existingCase.status === 'assigned' ? 'selected' : ''}>Hero Assigned (Engaged)</option>
            <option value="resolved" ${existingCase && existingCase.status === 'resolved' ? 'selected' : ''}>Resolved (Contained)</option>
          </select>
        </div>
      </div>

      <!-- GEOSPATIAL LOCATION & GEOFENCE AUTO-DETECTION -->
      <div class="form-group" style="background: #0B1024; border: 1.5px solid #23325C; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <label class="comic-label" style="color: var(--cerebro-cyan);">🛰️ GEOSPATIAL TARGET COORDINATES & TACTICAL GEOFENCE</label>
        
        <div style="margin-bottom: 10px;">
          <label style="font-size: 10px; color: #94A3B8; display: block; margin-bottom: 4px;">QUICK SELECT MARVEL HOTSPOT:</label>
          <select id="caseFormHotspotSelect" class="comic-select" style="width: 100%;" onchange="onCaseHotspotSelectChange(this.value)">
            <option value="">-- Or Choose Predefined Tactical Sector --</option>
            ${HOTSPOTS.map(h => `
              <option value="${h.name}">${h.name} (${h.zone ? '⚠️ ' + h.zone : 'Open Sector'})</option>
            `).join('')}
          </select>
        </div>

        <div class="form-row-3">
          <div>
            <label style="font-size: 10px; color: #94A3B8; display: block; margin-bottom: 2px;">LATITUDE</label>
            <input type="number" step="0.0001" id="caseFormLat" class="comic-input" value="${initialLat}" oninput="updateCaseFormGeofencePreview()">
          </div>
          <div>
            <label style="font-size: 10px; color: #94A3B8; display: block; margin-bottom: 2px;">LONGITUDE</label>
            <input type="number" step="0.0001" id="caseFormLng" class="comic-input" value="${initialLng}" oninput="updateCaseFormGeofencePreview()">
          </div>
          <div>
            <label style="font-size: 10px; color: #94A3B8; display: block; margin-bottom: 2px;">SECTOR / LOCATION NAME</label>
            <input type="text" id="caseFormLocationName" class="comic-input" value="${escapeHtml(initialLocName)}">
          </div>
        </div>

        <div id="caseFormGeofenceAlert" style="margin-top: 8px;">
          ${initialBreach ? `
            <div class="flash-geofence-warning">
              ⚠️ HIGH-RISK BREACH: <strong>${escapeHtml(initialBreach.name)}</strong> — Auto-escalated to CRITICAL!
            </div>
          ` : '<div style="font-size: 10px; color: #10B981; font-family: var(--font-mono);">✓ Sector Clear: No restricted geofence perimeter breach.</div>'}
        </div>
      </div>

      <div class="form-row-2">
        <div class="form-group">
          <label class="comic-label">PRIORITY SEVERITY</label>
          <select id="caseFormPriority" class="comic-select">
            <option value="critical" ${(existingCase && existingCase.priority === 'critical') || initialBreach ? 'selected' : ''}>CRITICAL (Omega Threat)</option>
            <option value="high" ${existingCase && existingCase.priority === 'high' && !initialBreach ? 'selected' : ''}>HIGH (Immediate Strike)</option>
            <option value="medium" ${(!existingCase && !initialBreach) || (existingCase && existingCase.priority === 'medium') ? 'selected' : ''}>MEDIUM (Tactical Recon)</option>
            <option value="low" ${existingCase && existingCase.priority === 'low' && !initialBreach ? 'selected' : ''}>LOW (Containment Watch)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="comic-label">DATE OPENED</label>
          <input type="date" id="caseFormOpenedAt" class="comic-input" 
                 value="${existingCase ? existingCase.openedAt : new Date().toISOString().split('T')[0]}">
        </div>
      </div>

      <div class="form-group">
        <label class="comic-label">INCIDENT BRIEFING & SITUATION REPORT</label>
        <textarea id="caseFormDescription" class="comic-textarea" rows="3" 
                  placeholder="Provide tactical intelligence, damage assessments, coordinates...">${existingCase ? escapeHtml(existingCase.description) : ''}</textarea>
      </div>

      <!-- HEROES MULTI-SELECT TAGS -->
      <div class="form-group">
        <label class="comic-label">DEPLOYED HEROES (MULTI-SELECT SQUAD)</label>
        <div class="hero-selector-grid">
          ${heroes.map(h => {
            const isAssigned = selectedHeroes.includes(h.id);
            return `
              <label class="hero-select-label ${isAssigned ? 'selected' : ''}">
                <input type="checkbox" name="assignedHeroesCheckbox" value="${h.id}" ${isAssigned ? 'checked' : ''} onchange="this.parentElement.classList.toggle('selected', this.checked)">
                <span class="hero-select-avatar">${h.avatar}</span>
                <span class="hero-select-info">
                  <strong>${h.codename}</strong>
                  <small>${h.specialty}</small>
                </span>
              </label>
            `;
          }).join('')}
        </div>
      </div>

      <div class="modal-form-actions">
        ${existingCase ? `
          <button type="button" class="comic-btn comic-btn-crimson" onclick="deleteCaseHandler('${existingCase.id}')">
            🗑️ DELETE CASE
          </button>
        ` : ''}
        <button type="button" class="comic-btn comic-btn-ghost" onclick="closeModals()">
          CANCEL
        </button>
        <button type="submit" class="comic-btn comic-btn-yellow">
          ${existingCase ? '💾 SAVE CASE FILE' : '⚡ DISPATCH INCIDENT'}
        </button>
      </div>
    </form>
  `;

  modal.classList.add('active');
}

function onCaseHotspotSelectChange(hotspotName) {
  const hotspot = HOTSPOTS.find(h => h.name === hotspotName);
  if (!hotspot) return;

  const latInput = document.getElementById('caseFormLat');
  const lngInput = document.getElementById('caseFormLng');
  const locInput = document.getElementById('caseFormLocationName');

  if (latInput) latInput.value = hotspot.lat;
  if (lngInput) lngInput.value = hotspot.lng;
  if (locInput) locInput.value = hotspot.name;

  updateCaseFormGeofencePreview();
}

function updateCaseFormGeofencePreview() {
  const latInput = document.getElementById('caseFormLat');
  const lngInput = document.getElementById('caseFormLng');
  const alertContainer = document.getElementById('caseFormGeofenceAlert');
  const prioritySelect = document.getElementById('caseFormPriority');
  if (!latInput || !lngInput || !alertContainer) return;

  const lat = parseFloat(latInput.value);
  const lng = parseFloat(lngInput.value);

  const breach = checkGeofenceBreach(lat, lng);

  if (breach) {
    alertContainer.innerHTML = `
      <div class="flash-geofence-warning">
        ⚠️ HIGH-RISK BREACH: <strong>${escapeHtml(breach.name)}</strong> (${breach.riskLevel}) — Standard triage overridden, auto-escalated to CRITICAL!
      </div>
    `;
    if (prioritySelect) {
      prioritySelect.value = 'critical';
    }
  } else {
    alertContainer.innerHTML = `
      <div style="font-size: 10px; color: #10B981; font-family: var(--font-mono);">
        ✓ Sector Clear: No restricted geofence perimeter breach.
      </div>
    `;
  }
}

function handleCaseFormSubmit(event, caseId) {
  event.preventDefault();

  const title = document.getElementById('caseFormTitle').value;
  const villainId = document.getElementById('caseFormVillain').value;
  const status = document.getElementById('caseFormStatus').value;
  const priority = document.getElementById('caseFormPriority').value;
  const openedAt = document.getElementById('caseFormOpenedAt').value;
  const description = document.getElementById('caseFormDescription').value;

  const lat = parseFloat(document.getElementById('caseFormLat').value) || 40.7580;
  const lng = parseFloat(document.getElementById('caseFormLng').value) || -73.9855;
  const locationName = document.getElementById('caseFormLocationName').value || 'Manhattan Sector';

  const heroCheckboxes = document.querySelectorAll('input[name="assignedHeroesCheckbox"]:checked');
  const assignedHeroes = Array.from(heroCheckboxes).map(cb => cb.value);

  const payload = {
    title,
    villainId,
    status,
    priority,
    openedAt,
    description,
    assignedHeroes,
    lat,
    lng,
    locationName
  };

  let resultCase = null;
  if (caseId) {
    resultCase = state.updateCase(caseId, payload);
    showComicToast('CASE UPDATED ON TACTICAL BOARD!', 'success');
  } else {
    resultCase = state.addCase(payload);
    showComicToast('NEW INCIDENT DISPATCHED TO CEREBRO GRID!', 'success');
  }

  closeModals();

  // If on map view or dispatching, lock on to the new case
  if (resultCase && typeof selectCrisisOnMap === 'function' && state.currentTab === 'map') {
    selectCrisisOnMap(resultCase.id);
  }
}

function deleteCaseHandler(caseId) {
  if (confirm('TERMINATE FILE: Are you sure you want to permanently purge this incident record?')) {
    state.deleteCase(caseId);
    closeModals();
    showComicToast('CASE RECORD PURGED FROM DATABASE!', 'warning');
  }
}

// ========================================================
// VILLAIN CREATE / EDIT MODAL
// ========================================================
function openVillainEditModal(villainId = null) {
  const modal = document.getElementById('villainEditModal');
  const modalContent = document.getElementById('villainEditModalContent');
  if (!modal || !modalContent) return;

  const existingVillain = villainId ? state.getVillainById(villainId) : null;
  const allOtherVillains = state.getVillains(true).filter(v => !existingVillain || v.id !== existingVillain.id);
  const currentAssociates = existingVillain ? existingVillain.associates : [];

  const avatarsList = ['🧲', '🏺', '🎭', '🛡️', '🐾', '🎃', '🐙', '🐸', '⚡', '💀', '🔥', '🕷️', '🧬', '💥'];

  modalContent.innerHTML = `
    <div class="modal-comic-header">
      <h3 class="modal-comic-title">
        ${existingVillain ? 'UPDATE VILLAIN PROFILE' : 'REGISTER NEW ROGUE / THREAT TARGET'}
      </h3>
      <button class="modal-close-btn" onclick="closeModals()">✕</button>
    </div>

    <form id="villainEditForm" onsubmit="handleVillainFormSubmit(event, '${existingVillain ? existingVillain.id : ''}')">
      <div class="form-row-2">
        <div class="form-group">
          <label class="comic-label">CODENAME / ALIAS *</label>
          <input type="text" id="vilFormCodename" class="comic-input" required 
                 placeholder="e.g. Magneto" 
                 value="${existingVillain ? escapeHtml(existingVillain.codename) : ''}">
        </div>

        <div class="form-group">
          <label class="comic-label">LEGAL NAME / TRUE IDENTITY *</label>
          <input type="text" id="vilFormName" class="comic-input" required 
                 placeholder="e.g. Max Eisenhardt" 
                 value="${existingVillain ? escapeHtml(existingVillain.name) : ''}">
        </div>
      </div>

      <div class="form-row-3">
        <div class="form-group">
          <label class="comic-label">THREAT LEVEL (1 - 5) *</label>
          <select id="vilFormThreat" class="comic-select" required>
            <option value="1" ${existingVillain && existingVillain.threatLevel === 1 ? 'selected' : ''}>1 - Low Threat</option>
            <option value="2" ${existingVillain && existingVillain.threatLevel === 2 ? 'selected' : ''}>2 - Guarded</option>
            <option value="3" ${(!existingVillain || existingVillain.threatLevel === 3) ? 'selected' : ''}>3 - Elevated</option>
            <option value="4" ${existingVillain && existingVillain.threatLevel === 4 ? 'selected' : ''}>4 - Severe Threat</option>
            <option value="5" ${existingVillain && existingVillain.threatLevel === 5 ? 'selected' : ''}>5 - OMEGA LEVEL (RED ALERT)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="comic-label">CONTAINMENT STATUS *</label>
          <select id="vilFormStatus" class="comic-select" required>
            <option value="at_large" ${(!existingVillain || existingVillain.status === 'at_large') ? 'selected' : ''}>At Large (Fugitive)</option>
            <option value="contained" ${existingVillain && existingVillain.status === 'contained' ? 'selected' : ''}>Contained (Field Custody)</option>
            <option value="incarcerated" ${existingVillain && existingVillain.status === 'incarcerated' ? 'selected' : ''}>Incarcerated (Max Security)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="comic-label">AVATAR ICON</label>
          <select id="vilFormAvatar" class="comic-select">
            ${avatarsList.map(a => `
              <option value="${a}" ${existingVillain && existingVillain.avatar === a ? 'selected' : ''}>${a}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="comic-label">LAST KNOWN RADAR LOCATION / COORDINATES *</label>
        <input type="text" id="vilFormLocation" class="comic-input" required 
               placeholder="e.g. Asteroid M Orbital Platform" 
               value="${existingVillain ? escapeHtml(existingVillain.lastLocation) : ''}">
      </div>

      <div class="form-group">
        <label class="comic-label">MUTANT / SUPERHUMAN POWERS</label>
        <input type="text" id="vilFormPowers" class="comic-input" 
               placeholder="e.g. Omega-Level Magnetism, Force Fields" 
               value="${existingVillain ? escapeHtml(existingVillain.powers) : ''}">
      </div>

      <div class="form-group">
        <label class="comic-label">CEREBRO DOSSIER NOTES</label>
        <textarea id="vilFormNotes" class="comic-textarea" rows="3" 
                  placeholder="Tactical history, psych evaluation, weapon capabilities...">${existingVillain ? escapeHtml(existingVillain.notes) : ''}</textarea>
      </div>

      <!-- ASSOCIATE NETWORK MULTI-SELECT -->
      <div class="form-group">
        <label class="comic-label">KNOWN ASSOCIATES & SYNDICATE LINKS</label>
        <div class="associates-select-grid">
          ${allOtherVillains.map(v => {
            const isAssoc = currentAssociates.includes(v.id);
            return `
              <label class="assoc-checkbox-pill ${isAssoc ? 'selected' : ''}">
                <input type="checkbox" name="villainAssociatesCheckbox" value="${v.id}" ${isAssoc ? 'checked' : ''} onchange="this.parentElement.classList.toggle('selected', this.checked)">
                <span class="pill-avatar">${v.avatar || '⚡'}</span>
                <span>${v.codename} (LVL ${v.threatLevel})</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>

      <div class="modal-form-actions">
        ${existingVillain ? `
          <button type="button" class="comic-btn comic-btn-crimson" onclick="deleteVillainHandler('${existingVillain.id}')">
            🗑️ DELETE VILLAIN
          </button>
        ` : ''}
        <button type="button" class="comic-btn comic-btn-ghost" onclick="closeModals()">
          CANCEL
        </button>
        <button type="submit" class="comic-btn comic-btn-yellow">
          ${existingVillain ? '💾 SAVE DOSSIER' : '⚡ REGISTER VILLAIN'}
        </button>
      </div>
    </form>
  `;

  modal.classList.add('active');
}

function handleVillainFormSubmit(event, villainId) {
  event.preventDefault();

  const codename = document.getElementById('vilFormCodename').value;
  const name = document.getElementById('vilFormName').value;
  const threatLevel = document.getElementById('vilFormThreat').value;
  const status = document.getElementById('vilFormStatus').value;
  const avatar = document.getElementById('vilFormAvatar').value;
  const lastLocation = document.getElementById('vilFormLocation').value;
  const powers = document.getElementById('vilFormPowers').value;
  const notes = document.getElementById('vilFormNotes').value;

  const associateCheckboxes = document.querySelectorAll('input[name="villainAssociatesCheckbox"]:checked');
  const associates = Array.from(associateCheckboxes).map(cb => cb.value);

  const payload = {
    codename,
    name,
    threatLevel,
    status,
    avatar,
    lastLocation,
    powers,
    notes,
    associates
  };

  if (villainId) {
    state.updateVillain(villainId, payload);
    showComicToast('VILLAIN DOSSIER UPDATED!', 'success');
  } else {
    state.addVillain(payload);
    showComicToast('NEW VILLAIN LOGGED IN CEREBRO!', 'success');
  }

  closeModals();
}

function deleteVillainHandler(villainId) {
  if (confirm('CRITICAL ACTION: Hard delete villain from database? Case links will be preserved.')) {
    state.deleteVillain(villainId);
    closeModals();
    showComicToast('VILLAIN EXPUNGED FROM CEREBRO!', 'warning');
  }
}

// ========================================================
// HERO ROSTER VIEW
// ========================================================
function renderHeroRoster() {
  const container = document.getElementById('heroesGridContent');
  if (!container) return;

  const heroes = state.getHeroes();
  const cases = state.getCases();

  container.innerHTML = `
    <div class="heroes-card-grid">
      ${heroes.map(h => {
        // find cases assigned to this hero
        const assignedCases = cases.filter(c => c.assignedHeroes.includes(h.id));
        const activeCases = assignedCases.filter(c => c.status !== 'resolved');

        const availBadge = {
          active: { text: 'READY FOR DISPATCH', class: 'hero-avail-ready' },
          on_mission: { text: 'IN COMBAT / MISSION', class: 'hero-avail-mission' },
          standby: { text: 'STANDBY / RESERVE', class: 'hero-avail-standby' }
        }[h.availability] || { text: 'UNKNOWN', class: 'hero-avail-standby' };

        return `
          <div class="hero-card" style="--hero-accent: ${h.accentColor}">
            <div class="hero-card-header">
              <span class="hero-card-avatar">${h.avatar}</span>
              <div class="hero-card-name-group">
                <h3 class="hero-card-codename">${escapeHtml(h.codename)}</h3>
                <span class="hero-card-realname">${escapeHtml(h.name)}</span>
              </div>
              <span class="hero-avail-pill ${availBadge.class}">
                ${availBadge.text}
              </span>
            </div>

            <div class="hero-card-body">
              <div class="hero-field">
                <span class="hero-label">SPECIALTY:</span>
                <span class="hero-val">${escapeHtml(h.specialty)}</span>
              </div>
              <div class="hero-field">
                <span class="hero-label">DIVISION:</span>
                <span class="hero-val">${escapeHtml(h.division)}</span>
              </div>
              <div class="hero-field">
                <span class="hero-label">ACTIVE OPERATIONS:</span>
                <span class="hero-val active-ops-count">${activeCases.length} Deployed</span>
              </div>

              <div class="hero-assigned-cases-list">
                ${activeCases.length > 0 ? activeCases.map(c => `
                  <div class="hero-mini-case-item" onclick="openCaseEditModal('${c.id}')" title="Click to view case">
                    <span class="status-pill status-${c.status}">${c.status}</span>
                    <span class="hero-case-title">${escapeHtml(c.title)}</span>
                  </div>
                `).join('') : '<div class="no-assigned-text">No active deployments. Ready for Cerebro directive.</div>'}
              </div>
            </div>

            <div class="hero-card-footer">
              <button class="comic-btn comic-btn-sm comic-btn-blue" onclick="assignHeroToNewCase('${h.id}')">
                + ASSIGN TO MISSION
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function assignHeroToNewCase(heroId) {
  openCaseEditModal();
  // check this hero in the form after rendering
  setTimeout(() => {
    const cb = document.querySelector(`input[name="assignedHeroesCheckbox"][value="${heroId}"]`);
    if (cb) {
      cb.checked = true;
      cb.parentElement.classList.add('selected');
    }
  }, 50);
}

// ========================================================
// MODAL CONTROLS & COMIC TOASTS
// ========================================================
function setupModals() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModals();
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModals();
    }
  });
}

function closeModals() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.classList.remove('active');
  });
}

function showComicToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const badges = {
    success: 'BAM!',
    warning: 'ALERT!',
    info: 'INTEL!'
  };

  const toast = document.createElement('div');
  toast.className = `comic-toast comic-toast-${type}`;
  toast.innerHTML = `
    <span class="toast-burst-tag">${badges[type] || 'NOTICE!'}</span>
    <span class="toast-msg-text">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 400);
  }, 3500);
}
