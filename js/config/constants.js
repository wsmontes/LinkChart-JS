/**
 * Application constants
 */
const APP_CONFIG = {
    version: '1.0.0',
    name: 'LinkChart JS'
};

/**
 * Entity type definitions with colors and icons
 */
const ENTITY_TYPES = {
    person: { 
        color: '#e74c3c', 
        icon: 'fa-user',
        defaultProperties: {
            name: '',
            age: '',
            gender: ''
        }
    },
    organization: { 
        color: '#2ecc71', 
        icon: 'fa-building',
        defaultProperties: {
            name: '',
            type: '',
            industry: ''
        }
    },
    location: { 
        color: '#3498db', 
        icon: 'fa-map-marker-alt',
        defaultProperties: {
            address: '',
            city: '',
            country: ''
        }
    },
    event: { 
        color: '#9b59b6', 
        icon: 'fa-calendar-alt',
        defaultProperties: {
            date: '',
            description: ''
        }
    },
    document: { 
        color: '#f1c40f', 
        icon: 'fa-file-alt',
        defaultProperties: {
            title: '',
            date: '',
            source: ''
        }
    },
    vehicle: { 
        color: '#e67e22', 
        icon: 'fa-car',
        defaultProperties: {
            make: '',
            model: '',
            year: '',
            plate: ''
        }
    },
    phone: { 
        color: '#1abc9c', 
        icon: 'fa-phone',
        defaultProperties: {
            number: '',
            carrier: ''
        }
    },
    email: { 
        color: '#34495e', 
        icon: 'fa-envelope',
        defaultProperties: {
            address: '',
            provider: ''
        }
    }
};

/**
 * Link type definitions
 */
const LINK_TYPES = {
    associates: {
        label: 'Associates',
        color: '#7f8c8d',
        icon: 'fa-handshake'
    },
    owns: {
        label: 'Owns',
        color: '#16a085',
        icon: 'fa-key'
    },
    travels: {
        label: 'Travels',
        color: '#3498db',
        icon: 'fa-plane'
    },
    communicates: {
        label: 'Communicates',
        color: '#9b59b6',
        icon: 'fa-comments'
    },
    family: {
        label: 'Family',
        color: '#e74c3c',
        icon: 'fa-users'
    }
};

/**
 * Cytoscape style definitions
 */
const CYTOSCAPE_STYLES = [
    {
        selector: 'node',
        style: {
            'label': 'data(label)',
            'text-valign': 'center',
            'color': '#fff',
            'background-color': 'data(color)',
            'text-outline-width': 2,
            'text-outline-color': 'data(color)',
            'width': 40,
            'height': 40
        }
    },
    {
        selector: 'edge',
        style: {
            'width': 2,
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'text-rotation': 'autorotate',
            'text-margin-y': -10,
            'text-background-color': 'white',
            'text-background-opacity': 1,
            'text-background-padding': '3px'
        }
    },
    {
        selector: ':selected',
        style: {
            'border-width': 3,
            'border-color': '#3498db'
        }
    }
];
