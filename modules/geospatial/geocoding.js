// Geospatial Geocoding Submodule
// Handles address-to-coordinate conversion, reverse geocoding, and location field detection

// Mock geocoding service (replace with real service like OpenCage, Google, etc.)
const GEOCODING_CACHE = new Map();

export async function geocodeAddress(address) {
  if (!address || typeof address !== 'string') {
    throw new Error('Invalid address provided');
  }

  // Check cache first
  const cacheKey = address.toLowerCase().trim();
  if (GEOCODING_CACHE.has(cacheKey)) {
    return GEOCODING_CACHE.get(cacheKey);
  }

  // Mock geocoding with common locations for demo purposes
  const mockLocations = {
    'new york': { lat: 40.7128, lng: -74.0060, address: 'New York, NY, USA' },
    'london': { lat: 51.5074, lng: -0.1278, address: 'London, UK' },
    'paris': { lat: 48.8566, lng: 2.3522, address: 'Paris, France' },
    'tokyo': { lat: 35.6762, lng: 139.6503, address: 'Tokyo, Japan' },
    'san francisco': { lat: 37.7749, lng: -122.4194, address: 'San Francisco, CA, USA' },
    'chicago': { lat: 41.8781, lng: -87.6298, address: 'Chicago, IL, USA' },
    'boston': { lat: 42.3601, lng: -71.0589, address: 'Boston, MA, USA' },
    'washington dc': { lat: 38.9072, lng: -77.0369, address: 'Washington, DC, USA' },
    'berlin': { lat: 52.5200, lng: 13.4050, address: 'Berlin, Germany' },
    'sydney': { lat: -33.8688, lng: 151.2093, address: 'Sydney, Australia' }
  };

  // Check for exact matches
  const exactMatch = mockLocations[cacheKey];
  if (exactMatch) {
    GEOCODING_CACHE.set(cacheKey, exactMatch);
    return exactMatch;
  }

  // Check for partial matches
  for (const [key, location] of Object.entries(mockLocations)) {
    if (cacheKey.includes(key) || key.includes(cacheKey)) {
      GEOCODING_CACHE.set(cacheKey, location);
      return location;
    }
  }

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // In a real implementation, you would call an external geocoding service here
  // For demo purposes, generate random coordinates
  const mockResult = {
    lat: (Math.random() - 0.5) * 180,
    lng: (Math.random() - 0.5) * 360,
    address: address,
    confidence: 0.5
  };

  GEOCODING_CACHE.set(cacheKey, mockResult);
  return mockResult;
}

export async function reverseGeocode(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('Invalid coordinates provided');
  }

  // Check cache
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (GEOCODING_CACHE.has(cacheKey)) {
    return GEOCODING_CACHE.get(cacheKey);
  }

  // Mock reverse geocoding
  const mockAddress = {
    lat,
    lng,
    address: `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    city: 'Unknown City',
    country: 'Unknown Country',
    confidence: 0.7
  };

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));

  GEOCODING_CACHE.set(cacheKey, mockAddress);
  return mockAddress;
}

export function detectLocationFields(nodes) {
  if (!nodes || !Array.isArray(nodes)) {
    return [];
  }

  const locationKeywords = [
    'location', 'address', 'city', 'country', 'state', 'region',
    'place', 'venue', 'site', 'coordinates', 'lat', 'lng',
    'latitude', 'longitude', 'geo', 'position', 'zip', 'postal'
  ];

  const possibleFields = new Set();

  // Analyze field names
  nodes.forEach(node => {
    if (node && typeof node === 'object') {
      Object.keys(node).forEach(key => {
        const lowerKey = key.toLowerCase();
        
        // Check for exact matches
        if (locationKeywords.includes(lowerKey)) {
          possibleFields.add(key);
          return;
        }

        // Check for partial matches
        if (locationKeywords.some(keyword => 
          lowerKey.includes(keyword) || keyword.includes(lowerKey)
        )) {
          possibleFields.add(key);
        }
      });
    }
  });

  // Analyze field values for location-like data
  const fieldScores = {};
  Array.from(possibleFields).forEach(field => {
    fieldScores[field] = 0;
    
    nodes.forEach(node => {
      const value = node[field];
      if (value && typeof value === 'string') {
        // Check for coordinate patterns
        if (/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(value)) {
          fieldScores[field] += 10;
        }
        // Check for postal codes
        else if (/^\d{5}(-\d{4})?$/.test(value) || /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(value)) {
          fieldScores[field] += 5;
        }
        // Check for common location words
        else if (/\b(street|avenue|road|drive|lane|boulevard|st|ave|rd|dr)\b/i.test(value)) {
          fieldScores[field] += 3;
        }
        // Check for city/state patterns
        else if (/,/.test(value) && value.split(',').length === 2) {
          fieldScores[field] += 2;
        }
      }
    });
  });

  // Return fields sorted by likelihood of being location data
  return Object.entries(fieldScores)
    .sort(([,a], [,b]) => b - a)
    .map(([field]) => field);
}

export function extractCoordinates(locationString) {
  if (!locationString || typeof locationString !== 'string') {
    return null;
  }

  // Try various coordinate formats
  const patterns = [
    // Decimal degrees: "40.7128, -74.0060"
    /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/,
    // With parentheses: "(40.7128, -74.0060)"
    /^\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)$/,
    // Degrees minutes seconds: "40°42'46.0"N 74°00'21.6"W"
    /^(\d+)°(\d+)'([\d.]+)"([NS])\s+(\d+)°(\d+)'([\d.]+)"([EW])$/i
  ];

  for (const pattern of patterns) {
    const match = locationString.match(pattern);
    if (match) {
      if (pattern.source.includes('°')) {
        // DMS format
        const lat = parseFloat(match[1]) + parseFloat(match[2])/60 + parseFloat(match[3])/3600;
        const lng = parseFloat(match[5]) + parseFloat(match[6])/60 + parseFloat(match[7])/3600;
        
        return {
          lat: match[4].toUpperCase() === 'S' ? -lat : lat,
          lng: match[8].toUpperCase() === 'W' ? -lng : lng
        };
      } else {
        // Decimal format
        return {
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2])
        };
      }
    }
  }

  return null;
}

export function validateCoordinates(lat, lng) {
  return {
    valid: typeof lat === 'number' && typeof lng === 'number' && 
           lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180,
    lat: typeof lat === 'number' && lat >= -90 && lat <= 90,
    lng: typeof lng === 'number' && lng >= -180 && lng <= 180
  };
}

export function formatAddress(addressComponents) {
  if (!addressComponents || typeof addressComponents !== 'object') {
    return '';
  }

  const parts = [];
  
  if (addressComponents.number) parts.push(addressComponents.number);
  if (addressComponents.street) parts.push(addressComponents.street);
  if (addressComponents.city) parts.push(addressComponents.city);
  if (addressComponents.state) parts.push(addressComponents.state);
  if (addressComponents.postal) parts.push(addressComponents.postal);
  if (addressComponents.country) parts.push(addressComponents.country);

  return parts.join(', ');
}

// Geocoding service configuration
export const GeocodingConfig = {
  cacheTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxCacheSize: 1000,
  rateLimitDelay: 100, // ms between requests
  
  // Configure external service (replace with actual API keys)
  services: {
    nominatim: {
      url: 'https://nominatim.openstreetmap.org/search',
      enabled: true,
      rateLimit: 1000 // ms
    },
    opencage: {
      url: 'https://api.opencagedata.com/geocode/v1/json',
      apiKey: '', // Add your API key
      enabled: false
    }
  }
};

// AI/Dev Note: This geocoding module provides comprehensive address handling capabilities.
// For production use, integrate with real geocoding services by adding API keys and 
// implementing proper rate limiting and error handling.
