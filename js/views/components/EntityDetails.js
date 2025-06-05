/**
 * Component handling the entity details panel
 */
class EntityDetailsComponent {
    /**
     * Initialize the entity details component
     */
    constructor() {
        this.detailsForm = document.querySelector('.details-form');
        this.noSelectionMessage = document.querySelector('.no-selection-message');
        this.entityType = document.getElementById('entity-type');
        this.entityName = document.getElementById('entity-name');
        this.entityDescription = document.getElementById('entity-description');
        this.propertiesTable = document.getElementById('properties-table');
        this.addPropertyBtn = document.querySelector('.entity-details .btn');
        
        this.setupEventListeners();
        this.hide();
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for entity selection events
        eventBus.on('entity:selected', (data) => this.displayEntityDetails(data));
        eventBus.on('selection:cleared', () => this.hide());
        
        // Update entity when name changes
        this.entityName.addEventListener('change', () => {
            eventBus.emit('entity:update', { 
                id: this.currentEntityId,
                field: 'label',
                value: this.entityName.value
            });
        });
        
        // Update entity when description changes
        this.entityDescription.addEventListener('change', () => {
            eventBus.emit('entity:update', { 
                id: this.currentEntityId,
                field: 'properties.description',
                value: this.entityDescription.value
            });
        });
        
        // Add new property button
        this.addPropertyBtn.addEventListener('click', () => {
            this.addNewPropertyRow();
        });
    }
    
    /**
     * Display entity details in the panel
     * @param {Object} data - Entity data
     */
    displayEntityDetails(data) {
        this.currentEntityId = data.id;
        this.show();
        
        // Display basic entity info
        this.entityType.value = data.type;
        this.entityName.value = data.label || '';
        this.entityDescription.value = data.properties.description || '';
        
        // Display properties
        this.renderPropertiesTable(data.properties);
    }
    
    /**
     * Render the properties table
     * @param {Object} properties - Entity properties
     */
    renderPropertiesTable(properties) {
        this.propertiesTable.innerHTML = '';
        
        // Skip description as it's shown in a separate field
        Object.keys(properties).filter(key => key !== 'description').forEach(key => {
            const value = properties[key];
            this.addPropertyRow(key, value);
        });
    }
    
    /**
     * Add a property row to the table
     * @param {string} name - Property name
     * @param {string} value - Property value
     */
    addPropertyRow(name, value) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="text" class="form-control form-control-sm property-name" value="${name}">
            </td>
            <td>
                <input type="text" class="form-control form-control-sm property-value" value="${value}">
            </td>
            <td>
                <button class="btn btn-sm btn-outline-danger remove-property">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;
        
        // Add change listeners
        const nameInput = row.querySelector('.property-name');
        const valueInput = row.querySelector('.property-value');
        const removeBtn = row.querySelector('.remove-property');
        
        nameInput.addEventListener('change', () => {
            const oldName = name;
            const newName = nameInput.value;
            
            eventBus.emit('entity:property:rename', {
                id: this.currentEntityId,
                oldName: oldName,
                newName: newName
            });
        });
        
        valueInput.addEventListener('change', () => {
            eventBus.emit('entity:update', {
                id: this.currentEntityId,
                field: `properties.${nameInput.value}`,
                value: valueInput.value
            });
        });
        
        removeBtn.addEventListener('click', () => {
            eventBus.emit('entity:property:remove', {
                id: this.currentEntityId,
                name: nameInput.value
            });
            row.remove();
        });
        
        this.propertiesTable.appendChild(row);
    }
    
    /**
     * Add a new property row
     */
    addNewPropertyRow() {
        this.addPropertyRow('newProperty', '');
    }
    
    /**
     * Show the details form
     */
    show() {
        this.noSelectionMessage.style.display = 'none';
        this.detailsForm.style.display = 'block';
    }
    
    /**
     * Hide the details form
     */
    hide() {
        this.noSelectionMessage.style.display = 'block';
        this.detailsForm.style.display = 'none';
    }
}
