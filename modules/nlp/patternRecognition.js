// NLP Pattern Recognition Submodule
// Handles pattern detection, anomaly detection, and text categorization

// Pattern definitions for various investigative contexts
const INVESTIGATION_PATTERNS = {
  financial: {
    patterns: [
      /\b(?:wire|transfer|payment|deposit|withdrawal|transaction)\s+(?:of\s+)?\$[\d,]+(?:\.\d{2})?\b/gi,
      /\b(?:account|routing)\s+number\s*:?\s*\d+\b/gi,
      /\b(?:bitcoin|cryptocurrency|crypto|wallet|exchange)\b/gi,
      /\b(?:laundering|offshore|shell\s+company|suspicious\s+activity)\b/gi
    ],
    keywords: ['money', 'bank', 'financial', 'payment', 'transaction', 'account', 'funds']
  },
  communication: {
    patterns: [
      /\b(?:called|texted|emailed|messaged|contacted|met\s+with|spoke\s+to)\b/gi,
      /\b(?:phone\s+call|meeting|conversation|discussion|communication)\b/gi,
      /\b(?:encrypted|secure|private|confidential|coded)\s+(?:message|communication)\b/gi
    ],
    keywords: ['call', 'message', 'contact', 'communicate', 'speak', 'meet']
  },
  movement: {
    patterns: [
      /\b(?:traveled|flew|drove|went|arrived|departed|left|returned)\s+(?:to|from|at)\s+[\w\s,]+\b/gi,
      /\b(?:flight|train|car|vehicle|transportation)\b/gi,
      /\b(?:border|customs|immigration|passport|visa)\b/gi
    ],
    keywords: ['travel', 'flight', 'move', 'location', 'transportation', 'journey']
  },
  temporal: {
    patterns: [
      /\b(?:before|after|during|while|when|at\s+the\s+time|simultaneously|concurrently)\b/gi,
      /\b(?:daily|weekly|monthly|regularly|frequently|occasionally|repeatedly)\b/gi,
      /\b(?:timeline|sequence|chronology|order|pattern|routine)\b/gi
    ],
    keywords: ['time', 'when', 'schedule', 'pattern', 'routine', 'sequence']
  },
  social: {
    patterns: [
      /\b(?:associate|friend|colleague|partner|relationship|connection)\b/gi,
      /\b(?:family|relative|spouse|sibling|parent|child)\b/gi,
      /\b(?:network|group|organization|team|circle|crew)\b/gi
    ],
    keywords: ['relationship', 'friend', 'family', 'associate', 'partner', 'connection']
  }
};

// Anomaly detection patterns
const ANOMALY_PATTERNS = [
  {
    type: 'frequency_anomaly',
    description: 'Unusual frequency of events or mentions',
    detector: (text, context) => detectFrequencyAnomalies(text, context)
  },
  {
    type: 'temporal_anomaly',
    description: 'Unusual timing patterns',
    detector: (text, context) => detectTemporalAnomalies(text, context)
  },
  {
    type: 'linguistic_anomaly',
    description: 'Unusual language patterns or inconsistencies',
    detector: (text, context) => detectLinguisticAnomalies(text, context)
  },
  {
    type: 'behavioral_anomaly',
    description: 'Unusual behavior patterns',
    detector: (text, context) => detectBehavioralAnomalies(text, context)
  }
];

export async function findPatterns(textFields) {
  const patterns = [];
  let patternId = 0;

  for (const field of textFields) {
    const text = field.text;
    
    // Search for investigation-specific patterns
    for (const [category, config] of Object.entries(INVESTIGATION_PATTERNS)) {
      for (const pattern of config.patterns) {
        const matches = [...text.matchAll(pattern)];
        
        for (const match of matches) {
          patterns.push({
            id: patternId++,
            type: 'investigation_pattern',
            category,
            text: match[0],
            position: match.index,
            confidence: calculatePatternConfidence(match[0], category),
            source: {
              sourceId: field.sourceId,
              field: field.field
            },
            context: extractContext(text, match.index, match[0].length)
          });
        }
      }
      
      // Check for keyword clustering
      const keywordMatches = findKeywordClusters(text, config.keywords);
      if (keywordMatches.length > 0) {
        patterns.push({
          id: patternId++,
          type: 'keyword_cluster',
          category,
          keywords: keywordMatches,
          confidence: Math.min(1.0, keywordMatches.length * 0.2),
          source: {
            sourceId: field.sourceId,
            field: field.field
          },
          description: `High concentration of ${category} keywords`
        });
      }
    }
  }

  // Find sequential patterns across documents
  const sequentialPatterns = findSequentialPatterns(textFields);
  patterns.push(...sequentialPatterns);

  // Find recurring patterns
  const recurringPatterns = findRecurringPatterns(patterns);
  
  return [...patterns, ...recurringPatterns]
    .filter(p => p.confidence > 0.3)
    .sort((a, b) => b.confidence - a.confidence);
}

export async function detectAnomalies(textFields) {
  const anomalies = [];
  let anomalyId = 0;

  for (const pattern of ANOMALY_PATTERNS) {
    for (const field of textFields) {
      try {
        const detectedAnomalies = await pattern.detector(field.text, { field, textFields });
        
        detectedAnomalies.forEach(anomaly => {
          anomalies.push({
            id: anomalyId++,
            type: pattern.type,
            description: pattern.description,
            severity: calculateAnomalySeverity(anomaly),
            details: anomaly,
            source: {
              sourceId: field.sourceId,
              field: field.field
            }
          });
        });
      } catch (error) {
        console.warn(`Anomaly detection failed for ${pattern.type}:`, error);
      }
    }
  }

  return anomalies
    .filter(a => a.severity > 0.4)
    .sort((a, b) => b.severity - a.severity);
}

export async function categorizeText(textFields) {
  const categories = {
    financial: 0,
    legal: 0,
    personal: 0,
    business: 0,
    criminal: 0,
    communication: 0,
    travel: 0,
    technical: 0
  };

  const categoryKeywords = {
    financial: ['money', 'bank', 'payment', 'transaction', 'account', 'finance', 'investment', 'loan'],
    legal: ['court', 'law', 'legal', 'attorney', 'judge', 'case', 'lawsuit', 'contract'],
    personal: ['family', 'friend', 'personal', 'private', 'home', 'relationship', 'emotion'],
    business: ['company', 'business', 'corporate', 'meeting', 'contract', 'office', 'work'],
    criminal: ['crime', 'illegal', 'suspect', 'investigation', 'evidence', 'arrest', 'police'],
    communication: ['call', 'email', 'message', 'contact', 'communicate', 'phone', 'letter'],
    travel: ['travel', 'flight', 'hotel', 'trip', 'destination', 'airport', 'transportation'],
    technical: ['computer', 'software', 'technology', 'data', 'system', 'network', 'digital']
  };

  for (const field of textFields) {
    const words = tokenizeText(field.text);
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matchCount = words.filter(word => 
        keywords.some(keyword => word.includes(keyword) || keyword.includes(word))
      ).length;
      
      categories[category] += matchCount / words.length;
    }
  }

  // Normalize scores
  const totalFields = textFields.length;
  for (const category in categories) {
    categories[category] /= totalFields;
  }

  // Return sorted categories
  return Object.entries(categories)
    .map(([category, score]) => ({ category, score }))
    .sort((a, b) => b.score - a.score)
    .filter(item => item.score > 0);
}

function calculatePatternConfidence(text, category) {
  let confidence = 0.5; // Base confidence
  
  // Increase confidence based on pattern specificity
  if (text.length > 10) confidence += 0.1;
  if (/\d/.test(text)) confidence += 0.1; // Contains numbers
  if (/[A-Z]/.test(text)) confidence += 0.1; // Contains capitals
  
  // Category-specific adjustments
  switch (category) {
    case 'financial':
      if (/\$[\d,]+(?:\.\d{2})?/.test(text)) confidence += 0.3;
      break;
    case 'communication':
      if (/\b(?:called|emailed|texted)\b/i.test(text)) confidence += 0.2;
      break;
    case 'movement':
      if (/\b(?:from|to)\s+[A-Z][a-z]+/.test(text)) confidence += 0.2;
      break;
  }
  
  return Math.min(1.0, confidence);
}

function findKeywordClusters(text, keywords) {
  const words = tokenizeText(text);
  const matches = [];
  
  words.forEach((word, index) => {
    if (keywords.some(keyword => word.includes(keyword) || keyword.includes(word))) {
      matches.push({ word, index });
    }
  });
  
  // Find clusters (keywords close to each other)
  const clusters = [];
  let currentCluster = [];
  
  matches.forEach((match, i) => {
    if (i === 0 || match.index - matches[i-1].index <= 10) {
      currentCluster.push(match);
    } else {
      if (currentCluster.length >= 2) {
        clusters.push([...currentCluster]);
      }
      currentCluster = [match];
    }
  });
  
  if (currentCluster.length >= 2) {
    clusters.push(currentCluster);
  }
  
  return clusters.flat();
}

function findSequentialPatterns(textFields) {
  const patterns = [];
  
  // Look for patterns that appear across multiple documents in sequence
  const commonPhrases = findCommonPhrases(textFields);
  
  commonPhrases.forEach((phrase, index) => {
    if (phrase.occurrences.length >= 2) {
      patterns.push({
        id: `seq_${index}`,
        type: 'sequential_pattern',
        phrase: phrase.text,
        occurrences: phrase.occurrences,
        confidence: Math.min(1.0, phrase.occurrences.length * 0.2),
        description: `Phrase appears in ${phrase.occurrences.length} documents`
      });
    }
  });
  
  return patterns;
}

function findCommonPhrases(textFields, minLength = 3, maxLength = 8) {
  const phraseMap = new Map();
  
  textFields.forEach(field => {
    const words = tokenizeText(field.text);
    
    for (let length = minLength; length <= maxLength; length++) {
      for (let i = 0; i <= words.length - length; i++) {
        const phrase = words.slice(i, i + length).join(' ');
        
        if (!phraseMap.has(phrase)) {
          phraseMap.set(phrase, {
            text: phrase,
            occurrences: []
          });
        }
        
        phraseMap.get(phrase).occurrences.push({
          sourceId: field.sourceId,
          field: field.field,
          position: i
        });
      }
    }
  });
  
  return Array.from(phraseMap.values());
}

function findRecurringPatterns(patterns) {
  const recurringPatterns = [];
  const patternGroups = new Map();
  
  // Group similar patterns
  patterns.forEach(pattern => {
    const key = `${pattern.type}_${pattern.category}`;
    if (!patternGroups.has(key)) {
      patternGroups.set(key, []);
    }
    patternGroups.get(key).push(pattern);
  });
  
  // Find groups with multiple occurrences
  patternGroups.forEach((group, key) => {
    if (group.length >= 3) {
      recurringPatterns.push({
        id: `recurring_${key}`,
        type: 'recurring_pattern',
        baseType: group[0].type,
        category: group[0].category,
        count: group.length,
        confidence: Math.min(1.0, group.length * 0.15),
        patterns: group,
        description: `Recurring ${group[0].type} pattern (${group.length} occurrences)`
      });
    }
  });
  
  return recurringPatterns;
}

function extractContext(text, position, length) {
  const start = Math.max(0, position - 50);
  const end = Math.min(text.length, position + length + 50);
  
  return {
    before: text.substring(start, position),
    match: text.substring(position, position + length),
    after: text.substring(position + length, end),
    full: text.substring(start, end)
  };
}

// Anomaly detection functions
function detectFrequencyAnomalies(text, context) {
  const anomalies = [];
  const words = tokenizeText(text);
  const wordCounts = {};
  
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Find words with unusually high frequency
  const avgFrequency = words.length / Object.keys(wordCounts).length;
  const threshold = avgFrequency * 3;
  
  Object.entries(wordCounts).forEach(([word, count]) => {
    if (count > threshold && word.length > 3) {
      anomalies.push({
        type: 'high_frequency_word',
        word,
        frequency: count,
        expected: avgFrequency,
        ratio: count / avgFrequency
      });
    }
  });
  
  return anomalies;
}

function detectTemporalAnomalies(text, context) {
  const anomalies = [];
  
  // Extract dates and times
  const timePatterns = [
    /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\b/g,
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/g,
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g
  ];
  
  const timeReferences = [];
  timePatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    timeReferences.push(...matches.map(m => m[0]));
  });
  
  // Check for unusual patterns
  if (timeReferences.length > 5) {
    anomalies.push({
      type: 'excessive_time_references',
      count: timeReferences.length,
      references: timeReferences
    });
  }
  
  return anomalies;
}

function detectLinguisticAnomalies(text, context) {
  const anomalies = [];
  
  // Check for style inconsistencies
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceLengths = sentences.map(s => tokenizeText(s).length);
  
  if (sentenceLengths.length > 1) {
    const avgLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentenceLengths.length;
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
    
    if (variance > avgLength * 2) {
      anomalies.push({
        type: 'inconsistent_sentence_length',
        variance,
        avgLength,
        ratio: variance / avgLength
      });
    }
  }
  
  return anomalies;
}

function detectBehavioralAnomalies(text, context) {
  const anomalies = [];
  
  // Check for unusual behavior patterns
  const behaviorPatterns = [
    /\b(?:never|always|constantly|continuously|perpetually)\s+\w+/gi,
    /\b(?:suddenly|immediately|instantly|abruptly|unexpectedly)\s+\w+/gi
  ];
  
  behaviorPatterns.forEach((pattern, index) => {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 2) {
      anomalies.push({
        type: 'repetitive_behavior_language',
        pattern: pattern.source,
        matches: matches.map(m => m[0]),
        count: matches.length
      });
    }
  });
  
  return anomalies;
}

function calculateAnomalySeverity(anomaly) {
  let severity = 0.5;
  
  switch (anomaly.type) {
    case 'high_frequency_word':
      severity = Math.min(1.0, anomaly.ratio * 0.2);
      break;
    case 'excessive_time_references':
      severity = Math.min(1.0, anomaly.count * 0.1);
      break;
    case 'inconsistent_sentence_length':
      severity = Math.min(1.0, anomaly.ratio * 0.3);
      break;
    case 'repetitive_behavior_language':
      severity = Math.min(1.0, anomaly.count * 0.2);
      break;
  }
  
  return severity;
}

function tokenizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);
}

// AI/Dev Note: This pattern recognition module provides sophisticated pattern detection
// capabilities for investigative analysis. For production use, consider integrating with
// machine learning models for more accurate pattern recognition and anomaly detection.
