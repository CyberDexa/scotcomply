/**
 * RSS Feed Monitor for Council News
 * 
 * Monitors council RSS/news feeds for landlord-related announcements
 * that may not yet be reflected on their main registration pages.
 */

import { load } from 'cheerio'
import { AlertSeverity, AlertCategory } from '@prisma/client'

export interface RSSItem {
  title: string
  description: string
  link: string
  pubDate: Date
  categories?: string[]
}

export interface RSSFeedResult {
  success: boolean
  items?: RSSItem[]
  error?: string
}

export interface RelevantArticle {
  title: string
  description: string
  link: string
  pubDate: Date
  keywords: string[]
  relevanceScore: number
}

/**
 * Keywords to detect landlord-related articles
 */
const LANDLORD_KEYWORDS = [
  'landlord',
  'landlords',
  'hmo',
  'houses in multiple occupation',
  'private rented sector',
  'rental',
  'letting',
  'tenancy',
  'registration fee',
  'license fee',
  'licensing scheme',
  'repairing standard',
  'property owner',
  'private landlord',
]

const FEE_KEYWORDS = [
  'fee increase',
  'fee change',
  'new fee',
  'cost increase',
  'price increase',
  'charge',
  'payment',
]

const POLICY_KEYWORDS = [
  'new requirement',
  'policy change',
  'regulation',
  'legislation',
  'compliance',
  'deadline',
  'must register',
  'mandatory',
]

/**
 * Parse an RSS feed and extract items
 */
export async function parseRSSFeed(feedUrl: string): Promise<RSSFeedResult> {
  try {
    console.log(`📡 Fetching RSS feed: ${feedUrl}`)

    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'ScotComply/1.0 (Compliance Monitoring)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const xml = await response.text()
    const $ = load(xml, { xmlMode: true })

    const items: RSSItem[] = []

    // Parse RSS 2.0 format
    $('item').each((_, element) => {
      const $item = $(element)

      const title = $item.find('title').text().trim()
      const description =
        $item.find('description').text().trim() ||
        $item.find('content\\:encoded').text().trim()
      const link = $item.find('link').text().trim()
      const pubDateStr = $item.find('pubDate').text().trim()

      const categories: string[] = []
      $item.find('category').each((_, cat) => {
        categories.push($(cat).text().trim())
      })

      if (title && link) {
        items.push({
          title,
          description,
          link,
          pubDate: pubDateStr ? new Date(pubDateStr) : new Date(),
          categories,
        })
      }
    })

    // Parse Atom format if no RSS items found
    if (items.length === 0) {
      $('entry').each((_, element) => {
        const $entry = $(element)

        const title = $entry.find('title').text().trim()
        const description =
          $entry.find('summary').text().trim() ||
          $entry.find('content').text().trim()
        const link = $entry.find('link').attr('href') || ''
        const pubDateStr = $entry.find('updated').text().trim()

        if (title && link) {
          items.push({
            title,
            description,
            link,
            pubDate: pubDateStr ? new Date(pubDateStr) : new Date(),
          })
        }
      })
    }

    console.log(`✅ Parsed ${items.length} items from RSS feed`)

    return {
      success: true,
      items,
    }
  } catch (error) {
    console.error('❌ Failed to parse RSS feed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Filter RSS items for landlord-related content
 */
export function filterRelevantArticles(
  items: RSSItem[],
  daysBack: number = 7
): RelevantArticle[] {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysBack)

  const relevantArticles: RelevantArticle[] = []

  for (const item of items) {
    // Skip articles older than cutoff
    if (item.pubDate < cutoffDate) {
      continue
    }

    const fullText = `${item.title} ${item.description}`.toLowerCase()
    const foundKeywords: string[] = []
    let relevanceScore = 0

    // Check for landlord keywords
    for (const keyword of LANDLORD_KEYWORDS) {
      if (fullText.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword)
        relevanceScore += 10
      }
    }

    // Boost score for fee-related keywords
    for (const keyword of FEE_KEYWORDS) {
      if (fullText.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword)
        relevanceScore += 20
      }
    }

    // Boost score for policy keywords
    for (const keyword of POLICY_KEYWORDS) {
      if (fullText.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword)
        relevanceScore += 15
      }
    }

    // Only include if we found landlord-related keywords
    if (foundKeywords.length > 0 && relevanceScore >= 10) {
      relevantArticles.push({
        title: item.title,
        description: item.description,
        link: item.link,
        pubDate: item.pubDate,
        keywords: foundKeywords,
        relevanceScore,
      })
    }
  }

  // Sort by relevance score (highest first)
  relevantArticles.sort((a, b) => b.relevanceScore - a.relevanceScore)

  return relevantArticles
}

/**
 * Determine alert severity based on keywords
 */
export function determineAlertSeverity(article: RelevantArticle): AlertSeverity {
  const text = `${article.title} ${article.description}`.toLowerCase()

  // High severity: Fee increases
  if (
    text.includes('fee increase') ||
    text.includes('price increase') ||
    text.includes('cost increase')
  ) {
    return AlertSeverity.HIGH
  }

  // Medium severity: Policy changes, deadlines
  if (
    text.includes('policy change') ||
    text.includes('new requirement') ||
    text.includes('deadline') ||
    text.includes('mandatory')
  ) {
    return AlertSeverity.MEDIUM
  }

  // Low severity: General information
  return AlertSeverity.LOW
}

/**
 * Determine alert category based on keywords
 */
export function determineAlertCategory(article: RelevantArticle): AlertCategory {
  const text = `${article.title} ${article.description}`.toLowerCase()

  if (text.includes('hmo') || text.includes('multiple occupation')) {
    return AlertCategory.HMO_LICENSING
  }

  if (text.includes('certificate') || text.includes('epc') || text.includes('energy performance')) {
    return AlertCategory.CERTIFICATES
  }

  if (
    text.includes('fee') ||
    text.includes('cost') ||
    text.includes('price') ||
    text.includes('payment')
  ) {
    return AlertCategory.FEES
  }

  if (
    text.includes('compliance') ||
    text.includes('regulation') ||
    text.includes('requirement') ||
    text.includes('mandatory')
  ) {
    return AlertCategory.COMPLIANCE
  }

  // Default to landlord registration
  return AlertCategory.LANDLORD_REGISTRATION
}

/**
 * Generate alert title from article
 */
export function generateAlertTitle(
  councilName: string,
  article: RelevantArticle
): string {
  const text = `${article.title} ${article.description}`.toLowerCase()

  if (text.includes('fee')) {
    return `Fee Update: ${councilName}`
  }

  if (text.includes('deadline') || text.includes('reminder')) {
    return `Important Deadline: ${councilName}`
  }

  if (text.includes('new') || text.includes('change')) {
    return `Policy Update: ${councilName}`
  }

  return `News Update: ${councilName}`
}

/**
 * Monitor a single council's RSS feed
 */
export async function monitorCouncilFeed(
  councilName: string,
  feedUrl: string,
  daysBack: number = 7
): Promise<RelevantArticle[]> {
  console.log(`\n🔍 Monitoring RSS feed for ${councilName}...`)

  const result = await parseRSSFeed(feedUrl)

  if (!result.success || !result.items) {
    console.error(`❌ Failed to fetch feed: ${result.error}`)
    return []
  }

  const relevantArticles = filterRelevantArticles(result.items, daysBack)

  console.log(
    `✅ Found ${relevantArticles.length} relevant articles for ${councilName}`
  )

  return relevantArticles
}

/**
 * Scottish Council RSS Feeds
 * Note: Not all councils have RSS feeds. This is a sample list.
 */
export const COUNCIL_RSS_FEEDS: Record<string, string> = {
  'City of Edinburgh Council':
    'https://www.edinburgh.gov.uk/news/feed/rss2.0',
  'Glasgow City Council': 'https://www.glasgow.gov.uk/news/feed',
  'Aberdeen City Council':
    'https://www.aberdeencity.gov.uk/news-and-events/rss-feeds',
  'Dundee City Council': 'https://www.dundeecity.gov.uk/news/rss',
  'Stirling Council': 'https://www.stirling.gov.uk/news/rss',
  'Fife Council': 'https://www.fife.gov.uk/news/feed',
  'Highland Council': 'https://www.highland.gov.uk/news/rss',
  'Aberdeenshire Council': 'https://www.aberdeenshire.gov.uk/news/feed',
  'Perth and Kinross Council':
    'https://www.pkc.gov.uk/news?format=feed&type=rss',
  'East Ayrshire Council': 'https://www.east-ayrshire.gov.uk/news/rss',
  // Add more councils as RSS feeds are discovered
}
