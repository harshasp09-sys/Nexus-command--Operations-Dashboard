/**
 * CEREBRO // TACTICAL CASE BOARD (KANBAN)
 * Native HTML5 Drag and Drop Kanban Board
 * Columns: reported -> investigating -> assigned -> resolved
 */

const KANBAN_COLUMNS = [
  { id: 'reported', label: 'Reported', badge: 'STATUS: INCOMING', icon: '📡', color: '#00F0FF' },
  { id: 'investigating', label: 'Investigating', badge: 'STATUS: FIELD RECON', icon: '🔍', color: '#F59E0B' },
  { id: 'assigned', label: 'Hero Assigned', badge: 'STATUS: ENGAGED', icon: '⚔️', color: '#FF0055' },
  { id: 'resolved', label: 'Resolved', badge: 'STATUS: CONTAINED', icon: '🛡️', color: '#10B981' }
];

let draggedCaseId = null;

function renderKanbanBoard(containerId = 'kanbanBoardContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const cases = state.getCases();

  // Group cases by column
  const grouped = {
    reported: [],
    investigating: [],
    assigned: [],
    resolved: []
  };

  cases.forEach(c => {
    if (grouped[c.status]) {
      grouped[c.status].push(c);
    } else {
      grouped.reported.push(c);
    }
  });

  container.innerHTML = `
    <div class="kanban-grid">
      ${KANBAN_COLUMNS.map(col => {
        const colCases = grouped[col.id] || [];
        return `
          <div class="kanban-column" data-status="${col.id}">
            <div class="kanban-column-header" style="--col-color: ${col.color};">
              <div class="kanban-column-title-group">
                <span class="kanban-column-icon">${col.icon}</span>
                <h3 class="kanban-column-title">${col.label}</h3>
              </div>
              <div class="kanban-column-badge">
                <span class="badge-count">${colCases.length}</span>
              </div>
            </div>
            
            <div class="kanban-card-list" data-status="${col.id}">
              ${colCases.length === 0 ? `
                <div class="kanban-empty-dropzone">
                  <span>DEPLOY CARDS HERE</span>
                </div>
              ` : colCases.map(c => renderKanbanCard(c)).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  attachKanbanDragEvents(container);
}

function renderKanbanCard(c) {
  const villain = state.getVillainById(c.villainId);
  const villainName = villain ? villain.codename : 'Unknown Fugitive';
  const threatLevel = villain ? villain.threatLevel : 3;

  const heroes = c.assignedHeroes.map(hid => state.getHeroById(hid)).filter(Boolean);

  const priorityClasses = {
    critical: 'priority-critical',
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low'
  };

  return `
    <div class="kanban-card" 
         draggable="true" 
         data-case-id="${c.id}"
         tabindex="0"
         role="button"
         aria-label="Case: ${escapeHtml(c.title)}">
      
      <div class="kanban-card-top">
        <span class="priority-pill ${priorityClasses[c.priority] || 'priority-medium'}">
          ${c.priority.toUpperCase()}
        </span>
        <span class="card-date">${c.openedAt}</span>
      </div>

      <h4 class="kanban-card-title">${escapeHtml(c.title)}</h4>

      ${c.description ? `
        <p class="kanban-card-desc">${escapeHtml(c.description.substring(0, 85))}${c.description.length > 85 ? '...' : ''}</p>
      ` : ''}

      <div class="kanban-card-villain" onclick="event.stopPropagation(); openVillainDetailModal('${c.villainId}')" title="Click to view Villain Dossier">
        <span class="threat-pill threat-lvl-${threatLevel}">
          LVL ${threatLevel}
        </span>
        <span class="villain-tag-name">🎯 ${escapeHtml(villainName)}</span>
      </div>

      <div class="kanban-card-footer">
        <div class="hero-avatar-stack" title="${heroes.map(h => h.codename).join(', ') || 'No heroes deployed'}">
          ${heroes.length > 0 ? heroes.slice(0, 3).map(h => `
            <span class="hero-chip-avatar" style="border-color: ${h.accentColor};" title="${h.codename} (${h.specialty})">
              ${h.avatar}
            </span>
          `).join('') : '<span class="no-hero-text">⚠️ No hero assigned</span>'}
          ${heroes.length > 3 ? `<span class="hero-chip-more">+${heroes.length - 3}</span>` : ''}
        </div>
        <button class="card-action-btn" title="Edit Case Details" onclick="event.stopPropagation(); openCaseEditModal('${c.id}')">
          ⚙️
        </button>
      </div>
    </div>
  `;
}

function attachKanbanDragEvents(container) {
  const cards = container.querySelectorAll('.kanban-card');
  const dropzones = container.querySelectorAll('.kanban-card-list');

  // Drag start & end on cards
  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedCaseId = card.getAttribute('data-case-id');
      card.classList.add('is-dragging');
      e.dataTransfer.setData('text/plain', draggedCaseId);
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('is-dragging');
      draggedCaseId = null;
      document.querySelectorAll('.kanban-card-list').forEach(dz => dz.classList.remove('drag-hover'));
    });

    // Card click opens edit modal
    card.addEventListener('click', (e) => {
      const caseId = card.getAttribute('data-case-id');
      openCaseEditModal(caseId);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const caseId = card.getAttribute('data-case-id');
        openCaseEditModal(caseId);
      }
    });
  });

  // Dropzones
  dropzones.forEach(dz => {
    dz.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      dz.classList.add('drag-hover');
    });

    dz.addEventListener('dragleave', (e) => {
      if (!dz.contains(e.relatedTarget)) {
        dz.classList.remove('drag-hover');
      }
    });

    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.classList.remove('drag-hover');
      const targetStatus = dz.getAttribute('data-status');
      const caseId = e.dataTransfer.getData('text/plain') || draggedCaseId;

      if (caseId && targetStatus) {
        const caseItem = state.getCaseById(caseId);
        if (caseItem && caseItem.status !== targetStatus) {
          state.updateCaseStatus(caseId, targetStatus);
          showComicToast(`CASE REASSIGNED: ${targetStatus.toUpperCase()}!`, 'success');
        }
      }
    });
  });
}
