// Submodule for case notes and tagging

export function showNotesModal(entity, onSave) {
  // UI for adding/editing notes and tags for a case entity or link
  const existingModal = document.getElementById('notesModal');
  if (existingModal) existingModal.remove();
  
  // Get existing notes and tags
  const existingData = getEntityNotesAndTags(entity.id) || {
    notes: '',
    tags: [],
    priority: 'medium',
    category: 'general'
  };
  
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'notesModal';
  modal.tabIndex = -1;
  
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fas fa-sticky-note"></i> Notes & Tags: ${entity.name || entity.id}
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <!-- Entity Info -->
          <div class="card mb-3">
            <div class="card-body">
              <h6 class="card-title">Entity Information</h6>
              <div class="row">
                <div class="col-md-6">
                  <strong>ID:</strong> ${entity.id}<br>
                  <strong>Name:</strong> ${entity.name || 'N/A'}<br>
                  <strong>Type:</strong> ${entity.type || 'N/A'}
                </div>
                <div class="col-md-6">
                  ${entity.amount ? `<strong>Amount:</strong> ${entity.amount}<br>` : ''}
                  ${entity.date ? `<strong>Date:</strong> ${entity.date}<br>` : ''}
                  ${entity.location ? `<strong>Location:</strong> ${entity.location}<br>` : ''}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Priority and Category -->
          <div class="row mb-3">
            <div class="col-md-6">
              <label class="form-label">Priority</label>
              <select class="form-select" id="prioritySelect">
                <option value="low" ${existingData.priority === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${existingData.priority === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${existingData.priority === 'high' ? 'selected' : ''}>High</option>
                <option value="critical" ${existingData.priority === 'critical' ? 'selected' : ''}>Critical</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Category</label>
              <select class="form-select" id="categorySelect">
                <option value="general" ${existingData.category === 'general' ? 'selected' : ''}>General</option>
                <option value="suspect" ${existingData.category === 'suspect' ? 'selected' : ''}>Suspect</option>
                <option value="witness" ${existingData.category === 'witness' ? 'selected' : ''}>Witness</option>
                <option value="evidence" ${existingData.category === 'evidence' ? 'selected' : ''}>Evidence</option>
                <option value="location" ${existingData.category === 'location' ? 'selected' : ''}>Location</option>
                <option value="financial" ${existingData.category === 'financial' ? 'selected' : ''}>Financial</option>
                <option value="communication" ${existingData.category === 'communication' ? 'selected' : ''}>Communication</option>
              </select>
            </div>
          </div>
          
          <!-- Tags -->
          <div class="mb-3">
            <label class="form-label">Tags</label>
            <div class="input-group">
              <input type="text" class="form-control" id="tagInput" placeholder="Add a tag and press Enter">
              <button class="btn btn-outline-secondary" type="button" id="addTagBtn">
                <i class="fas fa-plus"></i>
              </button>
            </div>
            <div id="tagContainer" class="mt-2">
              ${renderTagBadges(existingData.tags)}
            </div>
            <div class="form-text">
              Popular tags: 
              <span class="popular-tags">
                <a href="#" class="badge bg-light text-dark me-1" data-tag="important">important</a>
                <a href="#" class="badge bg-light text-dark me-1" data-tag="follow-up">follow-up</a>
                <a href="#" class="badge bg-light text-dark me-1" data-tag="verified">verified</a>
                <a href="#" class="badge bg-light text-dark me-1" data-tag="suspicious">suspicious</a>
                <a href="#" class="badge bg-light text-dark me-1" data-tag="connected">connected</a>
              </span>
            </div>
          </div>
          
          <!-- Notes -->
          <div class="mb-3">
            <label class="form-label">Notes</label>
            <textarea class="form-control" id="notesTextarea" rows="6" 
                      placeholder="Add detailed notes about this entity...">${existingData.notes}</textarea>
            <div class="form-text">
              <span id="charCount">${existingData.notes.length}</span> characters
            </div>
          </div>
          
          <!-- Timeline -->
          <div class="mb-3">
            <h6>Activity Timeline</h6>
            <div id="activityTimeline" style="max-height: 200px; overflow-y: auto;">
              ${renderActivityTimeline(entity.id)}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-danger" id="deleteNotesBtn">
            <i class="fas fa-trash"></i> Delete All
          </button>
          <button type="button" class="btn btn-primary" id="saveNotesBtn">
            <i class="fas fa-save"></i> Save Notes
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
  
  // Event listeners
  setupNotesModalEventListeners(modal, entity, onSave, bsModal);
  
  // Clean up on close
  modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

function setupNotesModalEventListeners(modal, entity, onSave, bsModal) {
  const tagInput = modal.querySelector('#tagInput');
  const addTagBtn = modal.querySelector('#addTagBtn');
  const tagContainer = modal.querySelector('#tagContainer');
  const notesTextarea = modal.querySelector('#notesTextarea');
  const charCount = modal.querySelector('#charCount');
  const saveBtn = modal.querySelector('#saveNotesBtn');
  const deleteBtn = modal.querySelector('#deleteNotesBtn');
  const popularTags = modal.querySelector('.popular-tags');
  
  let currentTags = getEntityNotesAndTags(entity.id)?.tags || [];
  
  // Character count
  notesTextarea.addEventListener('input', () => {
    charCount.textContent = notesTextarea.value.length;
  });
  
  // Add tag functionality
  function addTag(tagText) {
    const tag = tagText.trim().toLowerCase();
    if (tag && !currentTags.includes(tag)) {
      currentTags.push(tag);
      tagContainer.innerHTML = renderTagBadges(currentTags);
      setupTagRemoval();
    }
    tagInput.value = '';
  }
  
  tagInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput.value);
    }
  });
  
  addTagBtn.addEventListener('click', () => addTag(tagInput.value));
  
  // Popular tags
  popularTags.addEventListener('click', (e) => {
    if (e.target.dataset.tag) {
      e.preventDefault();
      addTag(e.target.dataset.tag);
    }
  });
  
  // Tag removal
  function setupTagRemoval() {
    tagContainer.querySelectorAll('.remove-tag').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tagToRemove = e.target.dataset.tag;
        currentTags = currentTags.filter(tag => tag !== tagToRemove);
        tagContainer.innerHTML = renderTagBadges(currentTags);
        setupTagRemoval();
      });
    });
  }
  
  setupTagRemoval();
  
  // Save functionality
  saveBtn.addEventListener('click', () => {
    const notesData = {
      notes: notesTextarea.value,
      tags: currentTags,
      priority: modal.querySelector('#prioritySelect').value,
      category: modal.querySelector('#categorySelect').value,
      lastModified: new Date().toISOString(),
      entityId: entity.id
    };
    
    saveEntityNotesAndTags(entity.id, notesData);
    
    // Add to activity timeline
    addToActivityTimeline(entity.id, 'notes_updated', 'Notes and tags updated');
    
    if (onSave) onSave(notesData);
    
    bsModal.hide();
    
    // Show success message
    showToast('Notes saved successfully!', 'success');
  });
  
  // Delete functionality
  deleteBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all notes and tags for this entity?')) {
      deleteEntityNotesAndTags(entity.id);
      addToActivityTimeline(entity.id, 'notes_deleted', 'Notes and tags deleted');
      
      if (onSave) onSave(null);
      bsModal.hide();
      showToast('Notes deleted successfully!', 'warning');
    }
  });
}

function renderTagBadges(tags) {
  if (!tags || tags.length === 0) {
    return '<span class="text-muted">No tags added</span>';
  }
  
  return tags.map(tag => `
    <span class="badge bg-primary me-1">
      ${tag}
      <button type="button" class="btn-close btn-close-white ms-1 remove-tag" 
              data-tag="${tag}" style="font-size: 0.6em;"></button>
    </span>
  `).join('');
}

function renderActivityTimeline(entityId) {
  const activities = getEntityActivities(entityId);
  
  if (!activities || activities.length === 0) {
    return '<p class="text-muted">No activities recorded</p>';
  }
  
  return activities.map(activity => `
    <div class="d-flex mb-2">
      <div class="flex-shrink-0">
        <i class="fas ${getActivityIcon(activity.type)} text-muted"></i>
      </div>
      <div class="flex-grow-1 ms-2">
        <div class="small">${activity.description}</div>
        <div class="text-muted" style="font-size: 0.75em;">
          ${new Date(activity.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  `).join('');
}

function getActivityIcon(activityType) {
  const icons = {
    'notes_updated': 'fa-sticky-note',
    'notes_deleted': 'fa-trash',
    'added_to_case': 'fa-plus-circle',
    'removed_from_case': 'fa-minus-circle',
    'analyzed': 'fa-search',
    'exported': 'fa-download',
    'viewed': 'fa-eye'
  };
  
  return icons[activityType] || 'fa-circle';
}

// Storage functions for notes and tags
function getEntityNotesAndTags(entityId) {
  const stored = localStorage.getItem(`entity_notes_${entityId}`);
  return stored ? JSON.parse(stored) : null;
}

function saveEntityNotesAndTags(entityId, data) {
  localStorage.setItem(`entity_notes_${entityId}`, JSON.stringify(data));
}

function deleteEntityNotesAndTags(entityId) {
  localStorage.removeItem(`entity_notes_${entityId}`);
  localStorage.removeItem(`entity_activities_${entityId}`);
}

// Activity timeline functions
function getEntityActivities(entityId) {
  const stored = localStorage.getItem(`entity_activities_${entityId}`);
  return stored ? JSON.parse(stored) : [];
}

function addToActivityTimeline(entityId, type, description) {
  const activities = getEntityActivities(entityId);
  activities.unshift({
    type,
    description,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 50 activities
  const limitedActivities = activities.slice(0, 50);
  localStorage.setItem(`entity_activities_${entityId}`, JSON.stringify(limitedActivities));
}

// Utility function for toast notifications
function showToast(message, type = 'info') {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'primary'} border-0`;
  toast.setAttribute('role', 'alert');
  
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
  
  // Remove after hiding
  toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

export function hasEntityNotes(entityId) {
  return !!getEntityNotesAndTags(entityId);
}

export function getEntityNotesCount() {
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('entity_notes_')) {
      count++;
    }
  }
  return count;
}

export function searchEntityNotes(query) {
  const results = [];
  const searchTerm = query.toLowerCase();
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('entity_notes_')) {
      const entityId = key.replace('entity_notes_', '');
      const data = JSON.parse(localStorage.getItem(key));
      
      const notesMatch = data.notes.toLowerCase().includes(searchTerm);
      const tagsMatch = data.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      
      if (notesMatch || tagsMatch) {
        results.push({
          entityId,
          ...data,
          matchType: notesMatch ? 'notes' : 'tags'
        });
      }
    }
  }
  
  return results;
}
