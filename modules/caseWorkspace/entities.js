// Submodule for case entity management
export function addToCase(entity) {
  if (!window.caseEntities) window.caseEntities = [];
  if (!window.caseEntities.find(e => e.id === entity.id)) {
    window.caseEntities.push(entity);
    if (typeof renderCaseList === 'function') renderCaseList();
    if (typeof saveCase === 'function') saveCase();
    // Log collaboration activity
    if (window.collaborationManager) {
      window.collaborationManager.logActivity('entity_added', {
        caseId: typeof getCaseId === 'function' ? getCaseId() : undefined,
        entityId: entity.id,
        entityType: entity.type
      });
    }
  }
}

export function renderCaseList() {
  const caseListElement = document.getElementById('caseList');
  if (!caseListElement) {
    console.warn('Case list element not found');
    return;
  }
  
  // Get case entities from global state or module
  const entities = window.caseEntities || [];
  
  if (entities.length === 0) {
    caseListElement.innerHTML = `
      <li class="list-group-item text-muted text-center">
        <i class="fas fa-inbox"></i><br>
        No entities in case<br>
        <small>Right-click graph nodes to add</small>
      </li>
    `;
    return;
  }
  
  caseListElement.innerHTML = entities.map(entity => `
    <li class="list-group-item d-flex justify-content-between align-items-start" data-entity-id="${entity.id}">
      <div class="ms-2 me-auto">
        <div class="fw-bold">${entity.name || entity.id}</div>
        <small class="text-muted">${entity.type || 'Unknown type'}</small>
        ${entity.category ? `<br><small class="badge bg-secondary">${entity.category}</small>` : ''}
      </div>
      <div class="btn-group-vertical btn-group-sm">
        <button class="btn btn-outline-primary btn-sm notes-btn" data-entity-id="${entity.id}" title="Add notes">
          <i class="fas fa-sticky-note"></i>
        </button>
        <button class="btn btn-outline-danger btn-sm remove-btn" data-entity-id="${entity.id}" title="Remove from case">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </li>
  `).join('');
  
  // Add event listeners for notes and remove buttons
  caseListElement.querySelectorAll('.notes-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const entityId = e.currentTarget.dataset.entityId;
      const entity = entities.find(e => e.id === entityId);
      if (entity) {
        showCaseItemNotesUI(entity);
      }
    });
  });
  
  caseListElement.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const entityId = e.currentTarget.dataset.entityId;
      removeFromCase(entityId);
    });
  });
  
  // Add click handlers for entity selection
  caseListElement.querySelectorAll('.list-group-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // Don't trigger on button clicks
      if (e.target.closest('button')) return;
      
      const entityId = item.dataset.entityId;
      // Focus on entity in graph
      window.dispatchEvent(new CustomEvent('search:selected', {
        detail: { id: entityId }
      }));
    });
  });
}

// Submodule for notes/tags UI
export function showCaseItemNotesUI(entity, onSave) {
  // ...existing code from modules/caseWorkspace.js...
}
