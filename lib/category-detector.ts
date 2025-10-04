// 🌟 DIVINE CATEGORY DETECTION UTILITY 🌟
// Automatically detects the best category for content based on title and content

export const CONTENT_CATEGORIES = {
  consciousness: {
    id: 'consciousness',
    label: 'Consciousness & Awakening',
    emoji: '🧠',
    keywords: [
      'consciousness', 'awakening', 'enlightenment', 'meditation', 'mindfulness',
      'spiritual awakening', 'inner journey', 'higher consciousness', 'transcendence',
      'soul', 'awareness', 'mind', 'conscious', 'spiritual', 'enlightened'
    ]
  },
  ancient_wisdom: {
    id: 'ancient_wisdom', 
    label: 'Ancient Wisdom & Mysteries',
    emoji: '🏛️',
    keywords: [
      'ancient', 'wisdom', 'mysteries', 'esoteric', 'occult', 'secret',
      'mystical', 'sacred', 'energy', 'chakra', 'aura', 'crystal',
      'tarot', 'astrology', 'numerology', 'mysterious', 'hidden'
    ]
  },
  ai_technology: {
    id: 'ai_technology',
    label: 'AI & Conscious Technology', 
    emoji: '🤖',
    keywords: [
      'ai', 'artificial intelligence', 'technology', 'future', 'innovation',
      'digital', 'conscious technology', 'machine learning', 'robotics',
      'automation', 'tech', 'neural', 'algorithm', 'intelligent'
    ]
  },
  crypto_decentralized: {
    id: 'crypto_decentralized',
    label: 'Crypto & Decentralized Sovereignty',
    emoji: '💰', 
    keywords: [
      'crypto', 'bitcoin', 'blockchain', 'decentralized', 'decentralization',
      'sovereignty', 'financial freedom', 'defi', 'nft', 'digital assets',
      'ethereum', 'wallet', 'mining', 'cryptocurrency'
    ]
  },
  divine_lifestyle: {
    id: 'divine_lifestyle',
    label: 'Divine Lifestyle & New Earth',
    emoji: '🌱',
    keywords: [
      'lifestyle', 'wellness', 'harmony', 'balance', 'healthy', 'new earth',
      'sustainable', 'natural', 'holistic', 'healing', 'life', 'peace',
      'zen', 'wellbeing', 'vitality', 'thriving'
    ]
  },
  mythology_archetypes: {
    id: 'mythology_archetypes',
    label: 'Mythology & Archetypes',
    emoji: '⚡',
    keywords: [
      'mythology', 'archetype', 'legend', 'myth', 'archetypal', 'symbolic',
      'symbolism', 'goddess', 'god', 'pantheon', 'ancient gods', 'hero',
      'journey', 'transformation', 'initiation'
    ]
  },
  global_shifts: {
    id: 'global_shifts',
    label: 'Global Shifts & Conscious Culture',
    emoji: '🌍',
    keywords: [
      'global', 'culture', 'society', 'civilization', 'movement', 'shift',
      'evolution', 'transformation', 'change', 'world', 'humanity',
      'collective awakening', 'paradigm', 'revolution'
    ]
  }
} as const

export type CategoryId = keyof typeof CONTENT_CATEGORIES

/**
 * Detects the best category for content based on title and content analysis
 */
export function detectCategory(title: string, content: string): CategoryId {
  const titleLower = title.toLowerCase()
  const contentLower = content.toLowerCase()
  const combinedText = `${titleLower} ${contentLower}`
  
  // Score each category based on keyword matches
  const categoryScores: Record<CategoryId, number> = {
    consciousness: 0,
    ancient_wisdom: 0,
    ai_technology: 0,
    crypto_decentralized: 0,
    divine_lifestyle: 0,
    mythology_archetypes: 0,
    global_shifts: 0
  }
  
  // Calculate scores for each category
  Object.entries(CONTENT_CATEGORIES).forEach(([categoryId, category]) => {
    const keywords = category.keywords
    let score = 0
    
    // Title matches get higher weight
    keywords.forEach(keyword => {
      if (titleLower.includes(keyword)) {
        score += 3 // Higher weight for title matches
      }
      if (contentLower.includes(keyword)) {
        score += 1 // Lower weight for content matches
      }
    })
    
    categoryScores[categoryId as CategoryId] = score
  })
  
  // Find the category with the highest score
  const bestCategory = Object.entries(categoryScores).reduce((best, [category, score]) => {
    return score > categoryScores[best] ? category as CategoryId : best
  }, 'consciousness' as CategoryId)
  
  // Only return a category if it has a meaningful score (at least 1)
  return categoryScores[bestCategory] > 0 ? bestCategory : 'consciousness'
}

/**
 * Gets category info by ID
 */
export function getCategoryInfo(categoryId: CategoryId) {
  return CONTENT_CATEGORIES[categoryId]
}

/**
 * Gets all categories as array
 */
export function getAllCategories() {
  return Object.values(CONTENT_CATEGORIES)
}

/**
 * Formats category for display
 */
export function formatCategory(categoryId: CategoryId) {
  const category = getCategoryInfo(categoryId)
  return `${category.emoji} ${category.label}`
}
