// Submodule for manual data entry and editing

/**
 * Show modal for manually adding/editing data entries
 * @param {Function} onSubmit - Callback when entry is submitted
 * @param {Object} existingData - Existing data to edit (optional)
 * @param {string} type - Type of entry ('entity' or 'relationship')
 */
export function showManualEntryModal(onSubmit, existingData = null, type = 'entity') {
  const modal = createManualEntryModal(type, existingData);
  document.body.appendChild(modal);
  
  // Show the modal
  const bootstrapModal = new bootstrap.Modal(modal);
  bootstrapModal.show();
  
  // Handle form submission
  const form = modal.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const entry = {};
    
    // Convert form data to object
    for (const [key, value] of formData.entries()) {
      entry[key] = value.trim();
    }
    
    // Add additional properties
    entry.id = existingData?.id || `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    entry.source = 'manual_entry';
    entry.created_at = new Date().toISOString();
    
    if (existingData) {
      entry.updated_at = new Date().toISOString();
    }
    
    // Validate required fields
    if (type === 'entity' && !entry.name) {
      showValidationError('Name is required for entities');
      return;
    }
    
    if (type === 'relationship' && (!entry.source_id || !entry.target_id)) {
      showValidationError('Source and target are required for relationships');
      return;
    }
    
    // Call the callback with the entry
    if (onSubmit) {
      onSubmit(entry, type);
    }
    
    // Close the modal
    bootstrapModal.hide();
    
    // Show success notification
    window.dispatchEvent(new CustomEvent('notification:show', {
      detail: {
        type: 'success',
        message: `${type === 'entity' ? 'Entity' : 'Relationship'} ${existingData ? 'updated' : 'added'} successfully`
      }
    }));
  });
  
  // Clean up when modal is hidden
  modal.addEventListener('hidden.bs.modal', () => {
    document.body.removeChild(modal);
  });
}

function createManualEntryModal(type, existingData) {
  const isEntity = type === 'entity';
  const title = `${existingData ? 'Edit' : 'Add'} ${isEntity ? 'Entity' : 'Relationship'}`;
  
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'manualEntryModal';
  modal.setAttribute('tabindex', '-1');
  
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${title}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form id="manualEntryForm">
            ${isEntity ? createEntityForm(existingData) : createRelationshipForm(existingData)}
          </form>
          <div id="validationError" class="alert alert-danger d-none"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="submit" form="manualEntryForm" class="btn btn-primary">
            ${existingData ? 'Update' : 'Add'} ${isEntity ? 'Entity' : 'Relationship'}
          </button>
        </div>
      </div>
    </div>
  `;
  
  return modal;
}

function createEntityForm(existingData) {
  return `
    <div class="row g-3">
      <div class="col-md-6">
        <label for="entityName" class="form-label">Name *</label>
        <input type="text" class="form-control" id="entityName" name="name" 
               value="${existingData?.name || ''}" required>
      </div>
      <div class="col-md-6">
        <label for="entityType" class="form-label">Type</label>
        <select class="form-select" id="entityType" name="type">
          <option value="">Select type...</option>
          <option value="person" ${existingData?.type === 'person' ? 'selected' : ''}>Person</option>
          <option value="company" ${existingData?.type === 'company' ? 'selected' : ''}>Company</option>
          <option value="location" ${existingData?.type === 'location' ? 'selected' : ''}>Location</option>
          <option value="event" ${existingData?.type === 'event' ? 'selected' : ''}>Event</option>
          <option value="document" ${existingData?.type === 'document' ? 'selected' : ''}>Document</option>
          <option value="other" ${existingData?.type === 'other' ? 'selected' : ''}>Other</option>
        </select>
      </div>
      <div class="col-md-6">
        <label for="entityEmail" class="form-label">Email</label>
        <input type="email" class="form-control" id="entityEmail" name="email" 
               value="${existingData?.email || ''}">
      </div>
      <div class="col-md-6">
        <label for="entityPhone" class="form-label">Phone</label>
        <input type="tel" class="form-control" id="entityPhone" name="phone" 
               value="${existingData?.phone || ''}">
      </div>
      <div class="col-md-6">
        <label for="entityAddress" class="form-label">Address</label>
        <input type="text" class="form-control" id="entityAddress" name="address" 
               value="${existingData?.address || ''}">
      </div>
      <div class="col-md-6">
        <label for="entityDate" class="form-label">Date</label>
        <input type="date" class="form-control" id="entityDate" name="date" 
               value="${existingData?.date || ''}">
      </div>
      <div class="col-12">
        <label for="entityDescription" class="form-label">Description</label>
        <textarea class="form-control" id="entityDescription" name="description" rows="3">${existingData?.description || ''}</textarea>
      </div>
      <div class="col-12">
        <label for="entityNotes" class="form-label">Notes</label>
        <textarea class="form-control" id="entityNotes" name="notes" rows="2">${existingData?.notes || ''}</textarea>
      </div>
    </div>
  `;
}

function createRelationshipForm(existingData) {
  return `
    <div class="row g-3">
      <div class="col-md-6">
        <label for="relationshipSource" class="form-label">Source Entity *</label>
        <input type="text" class="form-control" id="relationshipSource" name="source_id" 
               placeholder="Enter entity ID or name" value="${existingData?.source || existingData?.source_id || ''}" required>
      </div>
      <div class="col-md-6">
        <label for="relationshipTarget" class="form-label">Target Entity *</label>
        <input type="text" class="form-control" id="relationshipTarget" name="target_id" 
               placeholder="Enter entity ID or name" value="${existingData?.target || existingData?.target_id || ''}" required>
      </div>
      <div class="col-md-6">
        <label for="relationshipType" class="form-label">Relationship Type</label>
        <select class="form-select" id="relationshipType" name="type">
          <option value="">Select type...</option>
          <option value="associated_with" ${existingData?.type === 'associated_with' ? 'selected' : ''}>Associated With</option>
          <option value="employed_by" ${existingData?.type === 'employed_by' ? 'selected' : ''}>Employed By</option>
          <option value="owns" ${existingData?.type === 'owns' ? 'selected' : ''}>Owns</option>
          <option value="located_at" ${existingData?.type === 'located_at' ? 'selected' : ''}>Located At</option>
          <option value="related_to" ${existingData?.type === 'related_to' ? 'selected' : ''}>Related To</option>
          <option value="communicates_with" ${existingData?.type === 'communicates_with' ? 'selected' : ''}>Communicates With</option>
          <option value="other" ${existingData?.type === 'other' ? 'selected' : ''}>Other</option>
        </select>
      </div>
      <div class="col-md-6">
        <label for="relationshipStrength" class="form-label">Strength</label>
        <select class="form-select" id="relationshipStrength" name="strength">
          <option value="">Select strength...</option>
          <option value="weak" ${existingData?.strength === 'weak' ? 'selected' : ''}>Weak</option>
          <option value="medium" ${existingData?.strength === 'medium' ? 'selected' : ''}>Medium</option>
          <option value="strong" ${existingData?.strength === 'strong' ? 'selected' : ''}>Strong</option>
        </select>
      </div>
      <div class="col-md-6">
        <label for="relationshipDate" class="form-label">Date</label>
        <input type="date" class="form-control" id="relationshipDate" name="date" 
               value="${existingData?.date || ''}">
      </div>
      <div class="col-md-6">
        <label for="relationshipValue" class="form-label">Value</label>
        <input type="number" class="form-control" id="relationshipValue" name="value" 
               step="0.01" value="${existingData?.value || ''}">
      </div>
      <div class="col-12">
        <label for="relationshipDescription" class="form-label">Description</label>
        <textarea class="form-control" id="relationshipDescription" name="description" rows="3">${existingData?.description || ''}</textarea>
      </div>
      <div class="col-12">
        <label for="relationshipNotes" class="form-label">Notes</label>
        <textarea class="form-control" id="relationshipNotes" name="notes" rows="2">${existingData?.notes || ''}</textarea>
      </div>
    </div>
  `;
}

function showValidationError(message) {
  const errorDiv = document.getElementById('validationError');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
    
    // Hide after 5 seconds
    setTimeout(() => {
      errorDiv.classList.add('d-none');
    }, 5000);
  }
}
