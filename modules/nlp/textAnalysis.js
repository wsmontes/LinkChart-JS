// NLP Text Analysis Submodule
// Handles sentiment analysis, language detection, text summarization, and statistical analysis

// Sentiment analysis lexicon (simplified - in production use proper sentiment analysis libraries)
const SENTIMENT_LEXICON = {
  positive: new Set([
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'brilliant',
    'outstanding', 'perfect', 'beautiful', 'love', 'like', 'enjoy', 'happy', 'pleased',
    'satisfied', 'delighted', 'thrilled', 'excited', 'successful', 'achievement', 'progress',
    'benefit', 'advantage', 'opportunity', 'growth', 'improvement', 'win', 'victory',
    'effective', 'efficient', 'productive', 'valuable', 'useful', 'helpful', 'positive'
  ]),
  negative: new Set([
    'bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate', 'dislike', 'angry',
    'mad', 'furious', 'upset', 'disappointed', 'frustrated', 'annoyed', 'irritated',
    'sad', 'depressed', 'worried', 'concerned', 'anxious', 'afraid', 'scared', 'nervous',
    'problem', 'issue', 'trouble', 'difficulty', 'challenge', 'obstacle', 'failure',
    'loss', 'damage', 'harm', 'risk', 'danger', 'threat', 'crisis', 'disaster',
    'wrong', 'incorrect', 'false', 'mistake', 'error', 'fault', 'blame', 'negative'
  ]),
  intensifiers: new Set([
    'very', 'extremely', 'really', 'quite', 'rather', 'pretty', 'fairly', 'somewhat',
    'incredibly', 'absolutely', 'totally', 'completely', 'entirely', 'utterly'
  ]),
  negators: new Set([
    'not', 'no', 'never', 'none', 'nothing', 'nobody', 'nowhere', 'neither',
    'nor', 'hardly', 'scarcely', 'barely', 'seldom', 'rarely'
  ])
};

export async function analyzeSentiment(text) {
  if (!text || typeof text !== 'string') {
    return { sentiment: 'neutral', score: 0, confidence: 0 };
  }

  const words = tokenizeText(text);
  let score = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  let intensifierMultiplier = 1;
  let isNegated = false;

  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    
    // Check for negators
    if (SENTIMENT_LEXICON.negators.has(word)) {
      isNegated = true;
      continue;
    }
    
    // Check for intensifiers
    if (SENTIMENT_LEXICON.intensifiers.has(word)) {
      intensifierMultiplier = 1.5;
      continue;
    }
    
    // Check sentiment
    let wordScore = 0;
    if (SENTIMENT_LEXICON.positive.has(word)) {
      wordScore = 1;
      positiveCount++;
    } else if (SENTIMENT_LEXICON.negative.has(word)) {
      wordScore = -1;
      negativeCount++;
    }
    
    // Apply modifiers
    if (wordScore !== 0) {
      wordScore *= intensifierMultiplier;
      if (isNegated) {
        wordScore *= -1;
      }
      score += wordScore;
      
      // Reset modifiers
      intensifierMultiplier = 1;
      isNegated = false;
    }
  }

  // Normalize score
  const totalSentimentWords = positiveCount + negativeCount;
  const normalizedScore = totalSentimentWords > 0 ? score / totalSentimentWords : 0;
  
  // Determine sentiment category
  let sentiment = 'neutral';
  if (normalizedScore > 0.1) sentiment = 'positive';
  else if (normalizedScore < -0.1) sentiment = 'negative';
  
  // Calculate confidence based on sentiment word density
  const confidence = Math.min(1, totalSentimentWords / words.length * 5);

  return {
    sentiment,
    score: normalizedScore,
    confidence,
    details: {
      positiveWords: positiveCount,
      negativeWords: negativeCount,
      totalWords: words.length,
      sentimentWords: totalSentimentWords
    }
  };
}

export async function detectLanguage(text) {
  if (!text || typeof text !== 'string') {
    return { language: 'unknown', confidence: 0 };
  }

  // Language detection patterns (simplified)
  const languagePatterns = {
    en: {
      commonWords: ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
      patterns: [/\b(?:the|and|or|but|in|on|at|to|for|of|with|by)\b/gi]
    },
    es: {
      commonWords: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no', 'te', 'lo'],
      patterns: [/\b(?:el|la|de|que|y|en|un|es|se|no|te|lo)\b/gi]
    },
    fr: {
      commonWords: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour'],
      patterns: [/\b(?:le|de|et|à|un|il|être|et|en|avoir|que|pour)\b/gi]
    },
    de: {
      commonWords: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf'],
      patterns: [/\b(?:der|die|und|in|den|von|zu|das|mit|sich|des|auf)\b/gi]
    }
  };

  const words = tokenizeText(text);
  const scores = {};

  // Calculate scores for each language
  for (const [lang, data] of Object.entries(languagePatterns)) {
    let score = 0;
    const commonWordCount = words.filter(word => 
      data.commonWords.includes(word.toLowerCase())
    ).length;
    
    score = commonWordCount / words.length;
    scores[lang] = score;
  }

  // Find the language with highest score
  const bestMatch = Object.entries(scores).reduce((best, [lang, score]) => 
    score > best.score ? { language: lang, score } : best,
    { language: 'unknown', score: 0 }
  );

  return {
    language: bestMatch.language,
    confidence: Math.min(1, bestMatch.score * 3), // Scale confidence
    scores
  };
}

export async function summarizeText(text, maxSentences = 3) {
  if (!text || typeof text !== 'string') {
    return { summary: '', sentences: [], method: 'none' };
  }

  const sentences = splitIntoSentences(text);
  
  if (sentences.length <= maxSentences) {
    return {
      summary: text,
      sentences: sentences,
      method: 'full_text'
    };
  }

  // Score sentences based on various factors
  const scoredSentences = sentences.map((sentence, index) => {
    let score = 0;
    
    // Position score (first and last sentences often important)
    if (index === 0 || index === sentences.length - 1) score += 2;
    
    // Length score (medium length sentences preferred)
    const words = tokenizeText(sentence);
    if (words.length >= 10 && words.length <= 30) score += 1;
    
    // Keyword score (sentences with important words)
    const importantWords = ['important', 'significant', 'key', 'main', 'primary', 'conclusion', 'result'];
    const hasImportantWords = importantWords.some(word => 
      sentence.toLowerCase().includes(word)
    );
    if (hasImportantWords) score += 2;
    
    // Entity score (sentences with entities are often important)
    const hasCapitalizedWords = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/.test(sentence);
    if (hasCapitalizedWords) score += 1;
    
    // Number/date score
    const hasNumbers = /\d/.test(sentence);
    if (hasNumbers) score += 1;

    return { sentence, score, index };
  });

  // Select top sentences
  const topSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index);

  const summary = topSentences.map(s => s.sentence).join(' ');

  return {
    summary,
    sentences: topSentences.map(s => s.sentence),
    method: 'extractive',
    scores: scoredSentences
  };
}

function tokenizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);
}

function splitIntoSentences(text) {
  return text
    .split(/[.!?]+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0);
}

// Advanced text analysis functions

export function analyzeReadability(text) {
  if (!text || typeof text !== 'string') {
    return { score: 0, level: 'unknown', metrics: {} };
  }

  const sentences = splitIntoSentences(text);
  const words = tokenizeText(text);
  const syllables = words.reduce((total, word) => total + countSyllables(word), 0);

  // Flesch Reading Ease Score
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  
  // Flesch-Kincaid Grade Level
  const gradeLevel = (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59;

  let readabilityLevel = 'Graduate';
  if (fleschScore >= 90) readabilityLevel = 'Very Easy';
  else if (fleschScore >= 80) readabilityLevel = 'Easy';
  else if (fleschScore >= 70) readabilityLevel = 'Fairly Easy';
  else if (fleschScore >= 60) readabilityLevel = 'Standard';
  else if (fleschScore >= 50) readabilityLevel = 'Fairly Difficult';
  else if (fleschScore >= 30) readabilityLevel = 'Difficult';

  return {
    score: Math.max(0, Math.min(100, fleschScore)),
    level: readabilityLevel,
    gradeLevel: Math.max(0, gradeLevel),
    metrics: {
      sentences: sentences.length,
      words: words.length,
      syllables,
      avgSentenceLength,
      avgSyllablesPerWord,
      avgWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length
    }
  };
}

function countSyllables(word) {
  // Simple syllable counting (not perfect but reasonable)
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  const vowels = 'aeiouy';
  let syllableCount = 0;
  let previousWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      syllableCount++;
    }
    previousWasVowel = isVowel;
  }
  
  // Adjust for silent 'e'
  if (word.endsWith('e') && syllableCount > 1) {
    syllableCount--;
  }
  
  return Math.max(1, syllableCount);
}

export function extractKeywords(text, maxKeywords = 10) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const words = tokenizeText(text);
  const stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
    'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
    'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its',
    'our', 'their', 'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves',
    'yourselves', 'themselves'
  ]);

  // Count word frequencies
  const wordCounts = {};
  const filteredWords = words.filter(word => 
    word.length > 2 && !stopWords.has(word) && /^[a-z]+$/.test(word)
  );

  filteredWords.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });

  // Calculate TF (Term Frequency)
  const maxCount = Math.max(...Object.values(wordCounts));
  const keywords = Object.entries(wordCounts)
    .map(([word, count]) => ({
      word,
      frequency: count,
      tf: count / maxCount,
      score: count / maxCount // Simplified scoring
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxKeywords);

  return keywords;
}

export function analyzeTextComplexity(text) {
  if (!text || typeof text !== 'string') {
    return { complexity: 'unknown', factors: {} };
  }

  const words = tokenizeText(text);
  const sentences = splitIntoSentences(text);
  
  // Lexical diversity (unique words / total words)
  const uniqueWords = new Set(words);
  const lexicalDiversity = uniqueWords.size / words.length;
  
  // Average word length
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  
  // Sentence length variance
  const sentenceLengths = sentences.map(s => tokenizeText(s).length);
  const avgSentenceLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentenceLengths.length;
  const sentenceLengthVariance = sentenceLengths.reduce((sum, len) => 
    sum + Math.pow(len - avgSentenceLength, 2), 0) / sentenceLengths.length;
  
  // Complex words (3+ syllables)
  const complexWords = words.filter(word => countSyllables(word) >= 3);
  const complexWordRatio = complexWords.length / words.length;
  
  // Calculate overall complexity score
  let complexityScore = 0;
  complexityScore += lexicalDiversity * 25; // Max 25 points
  complexityScore += Math.min(avgWordLength * 5, 25); // Max 25 points
  complexityScore += Math.min(Math.sqrt(sentenceLengthVariance) * 3, 25); // Max 25 points
  complexityScore += complexWordRatio * 25; // Max 25 points
  
  let complexityLevel = 'Simple';
  if (complexityScore > 75) complexityLevel = 'Very Complex';
  else if (complexityScore > 60) complexityLevel = 'Complex';
  else if (complexityScore > 45) complexityLevel = 'Moderate';
  else if (complexityScore > 30) complexityLevel = 'Fairly Simple';

  return {
    complexity: complexityLevel,
    score: complexityScore,
    factors: {
      lexicalDiversity,
      avgWordLength,
      avgSentenceLength,
      sentenceLengthVariance,
      complexWordRatio,
      uniqueWordCount: uniqueWords.size,
      totalWords: words.length,
      complexWords: complexWords.length
    }
  };
}

// AI/Dev Note: This text analysis module provides comprehensive text processing capabilities.
// For production use, consider integrating with advanced NLP libraries like NLTK, spaCy,
// or cloud-based services for more accurate sentiment analysis and language detection.
