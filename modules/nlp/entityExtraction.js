// NLP Entity Extraction Submodule
// Handles named entity recognition, relationship extraction, and document processing

// Mock entity recognition patterns (in production, use proper NLP libraries)
const ENTITY_PATTERNS = {
  PERSON: [
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // "John Smith"
    /\b(?:Mr|Mrs|Ms|Dr|Prof)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g // "Dr. Jane Doe"
  ],
  ORGANIZATION: [
    /\b[A-Z][a-z]*(?:\s+[A-Z][a-z]*)*\s+(?:Inc|Corp|LLC|Ltd|Company|Corporation|Organization)\b/g,
    /\b(?:FBI|CIA|NSA|IRS|NASA|NATO|UN|EU)\b/g
  ],
  LOCATION: [
    /\b[A-Z][a-z]+,\s*[A-Z]{2}\b/g, // "Boston, MA"
    /\b\d+\s+[A-Z][a-z]+\s+(?:Street|Avenue|Road|Drive|Lane|Boulevard|St|Ave|Rd|Dr)\b/g
  ],
  DATE: [
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // "12/31/2023"
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/g
  ],
  PHONE: [
    /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g
  ],
  EMAIL: [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  ],
  MONEY: [
    /\$[0-9,]+(?:\.[0-9]{2})?\b/g,
    /\b[0-9,]+(?:\.[0-9]{2})?\s*(?:dollars?|USD|EUR|GBP)\b/g
  ],
  ID_NUMBER: [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
    /\b[A-Z]{1,2}\d{6,8}\b/g // License pattern
  ]
};

const RELATIONSHIP_PATTERNS = [
  {
    pattern: /(\w+(?:\s+\w+)*)\s+(?:works?\s+(?:at|for)|employed\s+by)\s+(\w+(?:\s+\w+)*)/gi,
    type: 'EMPLOYMENT',
    subject: 1,
    object: 2,
    predicate: 'works_for'
  },
  {
    pattern: /(\w+(?:\s+\w+)*)\s+(?:owns?|founded)\s+(\w+(?:\s+\w+)*)/gi,
    type: 'OWNERSHIP',
    subject: 1,
    object: 2,
    predicate: 'owns'
  },
  {
    pattern: /(\w+(?:\s+\w+)*)\s+(?:lives?\s+(?:in|at)|resides?\s+(?:in|at))\s+(\w+(?:\s+\w+)*)/gi,
    type: 'RESIDENCE',
    subject: 1,
    object: 2,
    predicate: 'lives_in'
  },
  {
    pattern: /(\w+(?:\s+\w+)*)\s+(?:married\s+to|spouse\s+of)\s+(\w+(?:\s+\w+)*)/gi,
    type: 'FAMILY',
    subject: 1,
    object: 2,
    predicate: 'married_to'
  },
  {
    pattern: /(\w+(?:\s+\w+)*)\s+(?:called|contacted|met\s+with)\s+(\w+(?:\s+\w+)*)/gi,
    type: 'COMMUNICATION',
    subject: 1,
    object: 2,
    predicate: 'contacted'
  },
  {
    pattern: /(\w+(?:\s+\w+)*)\s+(?:transferred|sent|paid)\s+.*?\s+to\s+(\w+(?:\s+\w+)*)/gi,
    type: 'TRANSACTION',
    subject: 1,
    object: 2,
    predicate: 'transferred_to'
  }
];

export async function extractEntities(textFields) {
  const entities = [];
  let entityId = 0;

  for (const field of textFields) {
    const text = field.text;
    
    for (const [entityType, patterns] of Object.entries(ENTITY_PATTERNS)) {
      for (const pattern of patterns) {
        const matches = [...text.matchAll(pattern)];
        
        for (const match of matches) {
          const entityText = match[0].trim();
          
          // Skip very short or common words
          if (entityText.length < 3 || isCommonWord(entityText)) {
            continue;
          }

          // Check for duplicates
          const existing = entities.find(e => 
            e.text.toLowerCase() === entityText.toLowerCase() && 
            e.type === entityType
          );

          if (existing) {
            existing.occurrences.push({
              sourceId: field.sourceId,
              field: field.field,
              position: match.index
            });
            existing.confidence = Math.min(1.0, existing.confidence + 0.1);
          } else {
            entities.push({
              id: entityId++,
              text: entityText,
              type: entityType,
              confidence: calculateEntityConfidence(entityText, entityType),
              occurrences: [{
                sourceId: field.sourceId,
                field: field.field,
                position: match.index
              }],
              originalText: text.substring(
                Math.max(0, match.index - 20),
                Math.min(text.length, match.index + match[0].length + 20)
              )
            });
          }
        }
      }
    }
  }

  // Post-process entities
  return entities
    .filter(entity => entity.confidence > 0.3)
    .sort((a, b) => b.confidence - a.confidence);
}

export async function extractRelationships(textFields, entities) {
  const relationships = [];
  let relationshipId = 0;

  for (const field of textFields) {
    const text = field.text;
    
    for (const pattern of RELATIONSHIP_PATTERNS) {
      const matches = [...text.matchAll(pattern.pattern)];
      
      for (const match of matches) {
        const subjectText = match[pattern.subject]?.trim();
        const objectText = match[pattern.object]?.trim();
        
        if (!subjectText || !objectText) continue;

        // Find corresponding entities
        const subjectEntity = findMatchingEntity(entities, subjectText);
        const objectEntity = findMatchingEntity(entities, objectText);
        
        if (subjectEntity && objectEntity && subjectEntity.id !== objectEntity.id) {
          relationships.push({
            id: relationshipId++,
            type: pattern.type,
            subject: subjectEntity.text,
            subjectId: subjectEntity.id,
            predicate: pattern.predicate,
            object: objectEntity.text,
            objectId: objectEntity.id,
            confidence: calculateRelationshipConfidence(match[0], pattern.type),
            source: {
              sourceId: field.sourceId,
              field: field.field,
              text: match[0],
              context: text.substring(
                Math.max(0, match.index - 50),
                Math.min(text.length, match.index + match[0].length + 50)
              )
            }
          });
        }
      }
    }
  }

  return relationships
    .filter(rel => rel.confidence > 0.4)
    .sort((a, b) => b.confidence - a.confidence);
}

export async function processDocuments(files) {
  const documents = [];
  
  for (const file of files) {
    try {
      const text = await readFileAsText(file);
      const entities = await extractEntities([{
        id: file.name,
        sourceId: file.name,
        field: 'content',
        text: text
      }]);
      
      documents.push({
        id: file.name,
        name: file.name,
        type: file.type,
        size: file.size,
        content: text,
        entities: entities,
        processedAt: new Date().toISOString(),
        wordCount: countWords(text),
        language: detectLanguageSimple(text)
      });
    } catch (error) {
      console.error(`Failed to process document ${file.name}:`, error);
    }
  }
  
  return documents;
}

function calculateEntityConfidence(text, type) {
  let confidence = 0.5; // Base confidence
  
  // Increase confidence based on entity type characteristics
  switch (type) {
    case 'PERSON':
      if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(text)) confidence += 0.3;
      if (/\b(?:Mr|Mrs|Ms|Dr|Prof)\.?/.test(text)) confidence += 0.2;
      break;
    case 'ORGANIZATION':
      if (/\b(?:Inc|Corp|LLC|Ltd|Company|Corporation)\b/.test(text)) confidence += 0.4;
      break;
    case 'LOCATION':
      if (/,\s*[A-Z]{2}$/.test(text)) confidence += 0.3;
      break;
    case 'EMAIL':
      confidence += 0.4; // Email patterns are quite specific
      break;
    case 'PHONE':
      confidence += 0.3;
      break;
  }
  
  // Decrease confidence for very common or short entities
  if (text.length < 4) confidence -= 0.2;
  if (isCommonWord(text)) confidence -= 0.3;
  
  return Math.max(0.1, Math.min(1.0, confidence));
}

function calculateRelationshipConfidence(text, type) {
  let confidence = 0.6; // Base confidence
  
  // Increase confidence based on relationship type
  switch (type) {
    case 'EMPLOYMENT':
      if (/\b(?:employee|manager|director|CEO|president)\b/i.test(text)) confidence += 0.2;
      break;
    case 'OWNERSHIP':
      if (/\b(?:owner|founder|established|created)\b/i.test(text)) confidence += 0.2;
      break;
    case 'FAMILY':
      if (/\b(?:husband|wife|spouse|married|family)\b/i.test(text)) confidence += 0.3;
      break;
  }
  
  return Math.max(0.3, Math.min(1.0, confidence));
}

function findMatchingEntity(entities, text) {
  const normalizedText = text.toLowerCase().trim();
  
  // Look for exact matches first
  let match = entities.find(entity => 
    entity.text.toLowerCase() === normalizedText
  );
  
  if (match) return match;
  
  // Look for partial matches
  match = entities.find(entity => 
    entity.text.toLowerCase().includes(normalizedText) ||
    normalizedText.includes(entity.text.toLowerCase())
  );
  
  return match;
}

function isCommonWord(word) {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'can', 'may', 'might', 'must', 'shall', 'from', 'up', 'about', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'between', 'among', 'all', 'any',
    'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now'
  ]);
  
  return commonWords.has(word.toLowerCase());
}

async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e.target.error);
    reader.readAsText(file);
  });
}

function countWords(text) {
  return text.trim().split(/\s+/).length;
}

function detectLanguageSimple(text) {
  // Simple language detection based on common words
  const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with'];
  const words = text.toLowerCase().split(/\s+/);
  const englishCount = words.filter(word => englishWords.includes(word)).length;
  
  return englishCount / words.length > 0.1 ? 'en' : 'unknown';
}

// Named Entity Recognition enhancement functions
export function enhanceEntityExtraction(entities, customPatterns = {}) {
  // Allow custom patterns to be added
  const enhancedPatterns = { ...ENTITY_PATTERNS, ...customPatterns };
  
  // Re-classify entities based on context
  return entities.map(entity => {
    const enhancedEntity = { ...entity };
    
    // Contextual refinement
    if (entity.type === 'PERSON' && entity.originalText.includes('Company')) {
      enhancedEntity.type = 'ORGANIZATION';
      enhancedEntity.confidence *= 0.8;
    }
    
    // Add semantic tags
    enhancedEntity.semanticTags = generateSemanticTags(entity);
    
    return enhancedEntity;
  });
}

function generateSemanticTags(entity) {
  const tags = [];
  
  switch (entity.type) {
    case 'PERSON':
      if (/\b(?:CEO|President|Director|Manager)\b/i.test(entity.originalText)) {
        tags.push('executive');
      }
      if (/\b(?:Dr|Prof|PhD)\b/i.test(entity.originalText)) {
        tags.push('academic');
      }
      break;
    case 'ORGANIZATION':
      if (/\b(?:Bank|Financial|Investment)\b/i.test(entity.originalText)) {
        tags.push('financial');
      }
      if (/\b(?:Government|Federal|State)\b/i.test(entity.originalText)) {
        tags.push('government');
      }
      break;
    case 'LOCATION':
      if (/\b(?:Street|Avenue|Road)\b/i.test(entity.text)) {
        tags.push('address');
      }
      if (/\b(?:City|County|State)\b/i.test(entity.originalText)) {
        tags.push('administrative');
      }
      break;
  }
  
  return tags;
}

// AI/Dev Note: This entity extraction module provides comprehensive named entity recognition
// and relationship extraction. For production use, consider integrating with advanced NLP
// libraries like spaCy, Stanford NLP, or cloud-based services for better accuracy.
