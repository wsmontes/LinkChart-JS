// Submodule for data cleaning and transformation
export function showDataCleaningModal(rows, onCleaned) {
  // Simple modal to preview, edit, and remove rows
  const oldModal = document.getElementById('dataCleaningModal');
  if (oldModal) oldModal.remove();
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'dataCleaningModal';
  modal.tabIndex = -1;
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Clean & Transform Data</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body" style="max-height:60vh;overflow:auto;">
          <table class="table table-sm table-bordered" id="cleanTable">
            <thead><tr>${Object.keys(rows[0]).map(k=>`<th>${k}</th>`).join('')}<th>Remove</th></tr></thead>
            <tbody>
              ${rows.map((row,i)=>`<tr>${Object.keys(row).map(k=>`<td contenteditable="true">${row[k]}</td>`).join('')}<td><button class="btn btn-danger btn-sm" data-row="${i}">X</button></td></tr>`).join('')}
            </tbody>
          </table>
          <div class="mb-2">
            <label>Regex Replace (all fields): </label>
            <input type="text" id="regexFind" placeholder="Find regex" class="form-control form-control-sm d-inline w-25">
            <input type="text" id="regexReplace" placeholder="Replace with" class="form-control form-control-sm d-inline w-25">
            <button class="btn btn-outline-secondary btn-sm" id="applyRegex">Apply</button>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary" id="confirmClean">Confirm</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();
  // Remove row
  modal.querySelector('tbody').onclick = (e) => {
    if (e.target.tagName === 'BUTTON') {
      e.target.closest('tr').remove();
    }
  };
  // Regex replace
  modal.querySelector('#applyRegex').onclick = () => {
    const find = modal.querySelector('#regexFind').value;
    const replace = modal.querySelector('#regexReplace').value;
    if (!find) return;
    const re = new RegExp(find, 'g');
    modal.querySelectorAll('tbody td[contenteditable]')
      .forEach(td => td.textContent = td.textContent.replace(re, replace));
  };
  // Confirm
  modal.querySelector('#confirmClean').onclick = () => {
    const cleaned = [];
    const headers = Object.keys(rows[0]);
    modal.querySelectorAll('tbody tr').forEach(tr => {
      const obj = {};
      tr.querySelectorAll('td[contenteditable]').forEach((td, i) => {
        obj[headers[i]] = td.textContent;
      });
      if (Object.values(obj).some(v => v !== '')) cleaned.push(obj);
    });
    bsModal.hide();
    setTimeout(() => modal.remove(), 500);
    onCleaned(cleaned);
  };
  modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

// Submodule for field mapping
export function showFieldMappingModal(roles, onConfirm) {
  // Remove any existing modal
  const oldModal = document.getElementById('fieldMappingModal');
  if (oldModal) oldModal.remove();

  // Possible roles
  const roleOptions = ['id', 'name', 'from', 'to', 'type', 'date', 'amount', 'other'];

  // Build modal HTML
  const modal = document.createElement('div');
  modal.className = 'modal fade';
  modal.id = 'fieldMappingModal';
  modal.tabIndex = -1;
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Assign Field Roles</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form id="fieldMappingForm">
            ${Object.keys(roles).map(key => `
              <div class="mb-2">
                <label class="form-label">${key}</label>
                <select class="form-select" name="${key}">
                  ${roleOptions.map(opt => `<option value="${opt}"${roles[key] === opt ? ' selected' : ''}>${opt}</option>`).join('')}
                </select>
              </div>
            `).join('')}
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary" id="confirmFieldMapping">Confirm</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Show modal using Bootstrap
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();

  // Confirm handler
  modal.querySelector('#confirmFieldMapping').onclick = () => {
    const form = modal.querySelector('#fieldMappingForm');
    const userRoles = {};
    for (const el of form.elements) {
      if (el.tagName === 'SELECT') userRoles[el.name] = el.value;
    }
    bsModal.hide();
    setTimeout(() => modal.remove(), 500);
    onConfirm(userRoles);
  };

  // Remove modal from DOM on close
  modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

// Submodule for normalization
export function normalizeData(rows, roles) {
  const nodes = [];
  const edges = [];
  const nodeMap = {};
  
  // First pass: collect all entity rows (those with id but no from/to)
  for (const row of rows) {
    if (row.id && (!row.from || !row.to)) {
      const id = row.id;
      if (!nodeMap[id]) {
        nodeMap[id] = true;
        nodes.push({
          id,
          name: row.name || id,
          type: row.type || row.category || '',
          label: row.name || id,
          amount: row.amount || 0,
          date: row.date || '',
          location: row.location || '',
          category: row.category || '',
          ...row
        });
      }
    }
  }
  
  // Second pass: collect all relationship rows (those with from/to)
  for (const row of rows) {
    if (row.from && row.to) {
      edges.push({
        id: `${row.from}-${row.to}-${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: row.from,
        target: row.to,
        label: row.label || row.type || 'connected',
        type: row.type || 'relationship',
        weight: row.weight || 1,
        amount: row.amount || 0,
        date: row.date || '',
        ...row
      });
    }
  }
  
  // Ensure we have nodes for all edge endpoints
  for (const edge of edges) {
    [edge.source, edge.target].forEach(nodeId => {
      if (!nodeMap[nodeId]) {
        nodeMap[nodeId] = true;
        nodes.push({
          id: nodeId,
          name: nodeId,
          type: 'Unknown',
          label: nodeId
        });
      }
    });
  }
  
  console.log('Normalized data:', { nodes: nodes.length, edges: edges.length });
  return { nodes, edges };
}

// Submodule for field role guessing
export function getFieldRoles(rows) {
  if (!rows.length) return {};
  const sample = rows[0];
  const roles = {};
  for (const key of Object.keys(sample)) {
    if (/id/i.test(key)) roles[key] = 'id';
    else if (/name/i.test(key)) roles[key] = 'name';
    else if (/from|source|sender/i.test(key)) roles[key] = 'from';
    else if (/to|target|receiver/i.test(key)) roles[key] = 'to';
    else if (/type|category/i.test(key)) roles[key] = 'type';
    else if (/date|time/i.test(key)) roles[key] = 'date';
    else if (/amount|value/i.test(key)) roles[key] = 'amount';
    else roles[key] = 'other';
  }
  return roles;
}

// Data lineage submodule
export let originalData = null;
export let cleanedData = null;
export function setOriginalData(data) { originalData = data; }
export function setCleanedData(data) { cleanedData = data; }
export function getDataLineage() { return { originalData, cleanedData }; }
