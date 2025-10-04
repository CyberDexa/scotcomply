/**
 * Open-Source Sanctions Lists Integration
 * 
 * FREE sources:
 * 1. OFAC (US Treasury) - https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.XML
 * 2. UN Consolidated List - https://scsanctions.un.org/resources/xml/en/consolidated.xml
 * 3. EU Sanctions - https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content
 * 4. UK Sanctions - https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets/consolidated-list-of-targets
 * 
 * Updates: These lists update daily/weekly
 */

import { MatchType, RiskLevel, ReviewStatus } from '@prisma/client'

export interface SanctionedEntity {
  id: string
  name: string
  aliases: string[]
  type: 'individual' | 'entity'
  programs: string[] // e.g., ['SYRIA', 'UKRAINE-EO13662']
  list: 'OFAC' | 'UN' | 'EU' | 'UK' | 'OTHER'
  dateOfBirth?: string
  placeOfBirth?: string
  nationality?: string[]
  addresses?: string[]
  identificationNumbers?: {
    type: string
    number: string
  }[]
  remarks?: string
  listUrl?: string
  lastUpdated: string
}

export interface SanctionsMatch {
  entity: SanctionedEntity
  matchScore: number
  matchType: MatchType
  matchReasons: string[]
}

/**
 * In-memory cache for sanctions lists
 * In production, consider using Redis or database
 */
let sanctionsCache: SanctionedEntity[] = []
let lastCacheUpdate: Date | null = null

/**
 * Load OFAC SDN (Specially Designated Nationals) List
 * This is a simplified parser - real implementation should use XML parser
 */
export async function loadOFACList(): Promise<SanctionedEntity[]> {
  try {
    // For now, return structured sample data
    // TODO: Implement XML parsing from OFAC API
    const ofacSampleData: SanctionedEntity[] = [
      {
        id: 'OFAC-001',
        name: 'PUTIN, Vladimir Vladimirovich',
        aliases: ['PUTIN, Vladimir', 'Putin Vladimir'],
        type: 'individual',
        programs: ['RUSSIA-EO14024'],
        list: 'OFAC',
        dateOfBirth: '1952-10-07',
        placeOfBirth: 'Leningrad, Russia',
        nationality: ['Russia'],
        remarks: 'President of the Russian Federation',
        listUrl: 'https://sanctionslistservice.ofac.treas.gov/',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'OFAC-002',
        name: 'ISLAMIC STATE IN IRAQ AND THE LEVANT',
        aliases: ['ISIS', 'ISIL', 'DAESH', 'Islamic State'],
        type: 'entity',
        programs: ['SDGT', 'FTO'],
        list: 'OFAC',
        nationality: [],
        remarks: 'Terrorist organization',
        listUrl: 'https://sanctionslistservice.ofac.treas.gov/',
        lastUpdated: new Date().toISOString(),
      },
    ]

    console.log(`✅ Loaded ${ofacSampleData.length} OFAC SDN entries (sample data)`)
    return ofacSampleData
  } catch (error) {
    console.error('Error loading OFAC list:', error)
    return []
  }
}

/**
 * Load UN Consolidated Sanctions List
 */
export async function loadUNList(): Promise<SanctionedEntity[]> {
  try {
    // Sample data - TODO: Implement XML parsing from UN API
    const unSampleData: SanctionedEntity[] = [
      {
        id: 'UN-001',
        name: 'AL-QAIDA',
        aliases: ['Al-Qaida', 'Al Qaeda', 'The Base'],
        type: 'entity',
        programs: ['UN Security Council Resolution 1267'],
        list: 'UN',
        nationality: [],
        remarks: 'Terrorist organization',
        listUrl: 'https://scsanctions.un.org/',
        lastUpdated: new Date().toISOString(),
      },
    ]

    console.log(`✅ Loaded ${unSampleData.length} UN sanctions entries (sample data)`)
    return unSampleData
  } catch (error) {
    console.error('Error loading UN list:', error)
    return []
  }
}

/**
 * Load EU Sanctions List
 */
export async function loadEUList(): Promise<SanctionedEntity[]> {
  try {
    // Sample data - TODO: Implement XML parsing from EU API
    const euSampleData: SanctionedEntity[] = [
      {
        id: 'EU-001',
        name: 'LUKASHENKO, Alexander',
        aliases: ['Lukashenka, Alyaksandr', 'Lukashenko, Aleksandr'],
        type: 'individual',
        programs: ['Belarus'],
        list: 'EU',
        dateOfBirth: '1954-08-30',
        nationality: ['Belarus'],
        remarks: 'President of Belarus',
        listUrl: 'https://webgate.ec.europa.eu/fsd/',
        lastUpdated: new Date().toISOString(),
      },
    ]

    console.log(`✅ Loaded ${euSampleData.length} EU sanctions entries (sample data)`)
    return euSampleData
  } catch (error) {
    console.error('Error loading EU list:', error)
    return []
  }
}

/**
 * Initialize and cache all sanctions lists
 */
export async function initializeSanctionsLists(): Promise<void> {
  console.log('🔄 Initializing sanctions lists...')
  
  try {
    const [ofac, un, eu] = await Promise.all([
      loadOFACList(),
      loadUNList(),
      loadEUList(),
    ])

    sanctionsCache = [...ofac, ...un, ...eu]
    lastCacheUpdate = new Date()

    console.log(`✅ Loaded ${sanctionsCache.length} total sanctions entries`)
    console.log(`   - OFAC: ${ofac.length}`)
    console.log(`   - UN: ${un.length}`)
    console.log(`   - EU: ${eu.length}`)
  } catch (error) {
    console.error('❌ Error initializing sanctions lists:', error)
  }
}

/**
 * Refresh sanctions lists (should be called daily)
 */
export async function refreshSanctionsLists(): Promise<void> {
  await initializeSanctionsLists()
}

/**
 * Get all cached sanctions
 */
export function getCachedSanctions(): SanctionedEntity[] {
  return sanctionsCache
}

/**
 * Check if cache needs refresh (older than 24 hours)
 */
export function needsCacheRefresh(): boolean {
  if (!lastCacheUpdate) return true
  
  const hoursSinceUpdate = (Date.now() - lastCacheUpdate.getTime()) / (1000 * 60 * 60)
  return hoursSinceUpdate > 24
}

/**
 * Search sanctions lists
 */
export async function searchSanctions(
  query: string,
  options: {
    dateOfBirth?: string
    nationality?: string
    type?: 'individual' | 'entity'
  } = {}
): Promise<SanctionsMatch[]> {
  // Ensure cache is initialized
  if (sanctionsCache.length === 0 || needsCacheRefresh()) {
    await initializeSanctionsLists()
  }

  const matches: SanctionsMatch[] = []
  const normalizedQuery = query.toLowerCase().trim()

  for (const entity of sanctionsCache) {
    const matchReasons: string[] = []
    let matchScore = 0

    // Check name match
    const nameScore = calculateNameSimilarity(normalizedQuery, entity.name)
    if (nameScore >= 70) {
      matchScore = nameScore
      matchReasons.push(`Name similarity: ${nameScore}%`)
    }

    // Check aliases
    for (const alias of entity.aliases) {
      const aliasScore = calculateNameSimilarity(normalizedQuery, alias)
      if (aliasScore > matchScore) {
        matchScore = aliasScore
        matchReasons.push(`Alias match: ${alias} (${aliasScore}%)`)
      }
    }

    // Must have at least 70% match to consider
    if (matchScore < 70) continue

    // Boost score for additional matches
    if (options.dateOfBirth && entity.dateOfBirth) {
      if (options.dateOfBirth === entity.dateOfBirth) {
        matchScore = Math.min(100, matchScore + 15)
        matchReasons.push('Date of birth exact match')
      }
    }

    if (options.nationality && entity.nationality) {
      if (entity.nationality.includes(options.nationality)) {
        matchScore = Math.min(100, matchScore + 10)
        matchReasons.push(`Nationality match: ${options.nationality}`)
      }
    }

    if (options.type && entity.type === options.type) {
      matchScore = Math.min(100, matchScore + 5)
      matchReasons.push(`Type match: ${options.type}`)
    }

    matches.push({
      entity,
      matchScore,
      matchType: MatchType.SANCTIONS,
      matchReasons,
    })
  }

  // Sort by match score (highest first)
  return matches.sort((a, b) => b.matchScore - a.matchScore)
}

/**
 * Calculate name similarity using simple algorithm
 * In production, use Levenshtein distance or similar
 */
function calculateNameSimilarity(name1: string, name2: string): number {
  const n1 = name1.toLowerCase().trim()
  const n2 = name2.toLowerCase().trim()

  // Exact match
  if (n1 === n2) return 100

  // Check if one contains the other
  if (n1.includes(n2) || n2.includes(n1)) return 90

  // Split into words and check overlap
  const words1 = n1.split(/\s+/)
  const words2 = n2.split(/\s+/)

  let matchedWords = 0
  for (const w1 of words1) {
    for (const w2 of words2) {
      // Exact word match
      if (w1 === w2) {
        matchedWords++
        break
      }
      // Partial word match (one contains the other)
      if (w1.length > 3 && w2.length > 3) {
        if (w1.includes(w2) || w2.includes(w1)) {
          matchedWords += 0.7
          break
        }
      }
    }
  }

  const overlapRatio = matchedWords / Math.max(words1.length, words2.length)
  return Math.round(overlapRatio * 85)
}

/**
 * Get statistics about loaded sanctions
 */
export function getSanctionsStats(): {
  total: number
  byList: Record<string, number>
  byType: Record<string, number>
  lastUpdated: string | null
} {
  const byList: Record<string, number> = {}
  const byType: Record<string, number> = {}

  for (const entity of sanctionsCache) {
    byList[entity.list] = (byList[entity.list] || 0) + 1
    byType[entity.type] = (byType[entity.type] || 0) + 1
  }

  return {
    total: sanctionsCache.length,
    byList,
    byType,
    lastUpdated: lastCacheUpdate?.toISOString() || null,
  }
}
