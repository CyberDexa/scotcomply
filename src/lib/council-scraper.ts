/**
 * Council Website Scraper
 * 
 * Uses Puppeteer for browser automation to bypass anti-bot protection
 * and scrape council websites to detect changes in:
 * - Landlord registration fees
 * - HMO license fees
 * - Processing times
 * - Contact information
 * - Policy updates
 * 
 * Note: Uses puppeteer-core + @sparticuz/chromium for Vercel compatibility
 */

import * as cheerio from 'cheerio'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

interface CouncilScrapedData {
  registrationFee?: number
  renewalFee?: number
  hmoFee?: number
  processingTimeDays?: number
  contactEmail?: string
  contactPhone?: string
  lastChecked: Date
  dataSource: string
}

interface ScrapeResult {
  success: boolean
  data?: CouncilScrapedData
  error?: string
  changes?: string[]
}

/**
 * Scrape council website using Puppeteer (real browser)
 * This bypasses most anti-bot protection
 */
export async function scrapeCouncilWebsite(
  councilName: string,
  url: string
): Promise<ScrapeResult> {
  let browser = null
  
  try {
    console.log(`🔍 Scraping ${councilName} - ${url}`)

    // Determine if running on Vercel (serverless) or locally
    const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'

    // Launch headless browser with appropriate configuration
    browser = await puppeteer.launch({
      args: isProduction 
        ? chromium.args
        : [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
          ],
      defaultViewport: chromium.defaultViewport,
      executablePath: isProduction
        ? await chromium.executablePath()
        : process.platform === 'win32'
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : process.platform === 'darwin'
            ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
            : '/usr/bin/google-chrome',
      headless: chromium.headless,
    })

    const page = await browser.newPage()

    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    // Navigate to the page with timeout
    try {
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })
    } catch (navError) {
      await browser.close()
      return {
        success: false,
        error: `Navigation failed: ${navError instanceof Error ? navError.message : 'Timeout or network error'}`,
      }
    }

    // Get the HTML content
    const html = await page.content()
    await browser.close()

    // Parse with Cheerio
    const $ = cheerio.load(html)

    const scrapedData: CouncilScrapedData = {
      lastChecked: new Date(),
      dataSource: url,
    }

    // Extract fees using common patterns
    scrapedData.registrationFee = extractFee($, [
      'landlord registration fee',
      'registration fee',
      'application fee',
      'landlord fee',
    ])

    scrapedData.renewalFee = extractFee($, [
      'renewal fee',
      'three year renewal',
      'triennial fee',
    ])

    scrapedData.hmoFee = extractFee($, [
      'hmo fee',
      'hmo license fee',
      'hmo application fee',
      'house in multiple occupation fee',
    ])

    scrapedData.processingTimeDays = extractProcessingTime($)

    scrapedData.contactEmail = extractEmail($)
    scrapedData.contactPhone = extractPhone($)

    console.log(`✅ Scraped ${councilName}:`, scrapedData)

    return {
      success: true,
      data: scrapedData,
    }
  } catch (error) {
    // Make sure browser is closed on error
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        console.error('Failed to close browser:', closeError)
      }
    }
    
    console.error(`❌ Failed to scrape ${councilName}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Extract fee amounts from text using common patterns
 */
function extractFee($: cheerio.CheerioAPI, keywords: string[]): number | undefined {
  let foundFee: number | undefined

  // Search for patterns like "£88", "£1,095", "88.00"
  const feePattern = /£?([\d,]+)(?:\.00)?/g

  for (const keyword of keywords) {
    // Search in text content
    $('*').each((_, element) => {
      const text = $(element).text().toLowerCase()

      if (text.includes(keyword.toLowerCase())) {
        // Look for fee amount near the keyword
        const match = text.match(feePattern)
        if (match) {
          const feeStr = match[0].replace(/[£,]/g, '')
          const fee = parseInt(feeStr, 10)
          if (!isNaN(fee) && fee > 0 && fee < 10000) {
            foundFee = fee
            return false // Break the loop
          }
        }
      }
    })

    if (foundFee) break
  }

  return foundFee
}

/**
 * Extract processing time in days
 */
function extractProcessingTime($: cheerio.CheerioAPI): number | undefined {
  const patterns = [
    /(\d+)\s*weeks?/i,
    /(\d+)\s*days?/i,
    /(\d+)\s*working days?/i,
  ]

  let processingDays: number | undefined

  $('*').each((_, element) => {
    const text = $(element).text()

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        let days = parseInt(match[1], 10)
        // Convert weeks to days
        if (text.toLowerCase().includes('week')) {
          days *= 7
        }
        if (!isNaN(days) && days > 0 && days < 365) {
          processingDays = days
          return false
        }
      }
    }
  })

  return processingDays
}

/**
 * Extract email addresses
 */
function extractEmail($: cheerio.CheerioAPI): string | undefined {
  const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g
  let email: string | undefined

  // Check mailto links first
  $('a[href^="mailto:"]').each((_, element) => {
    const href = $(element).attr('href')
    if (href) {
      email = href.replace('mailto:', '')
      return false
    }
  })

  // Search in text if not found
  if (!email) {
    $('*').each((_, element) => {
      const text = $(element).text()
      const match = text.match(emailPattern)
      if (match && match[0].includes('@')) {
        email = match[0]
        return false
      }
    })
  }

  return email
}

/**
 * Extract phone numbers
 */
function extractPhone($: cheerio.CheerioAPI): string | undefined {
  const phonePatterns = [
    /\b0\d{3}\s?\d{3}\s?\d{4}\b/g, // 0131 123 4567
    /\b0\d{4}\s?\d{6}\b/g, // 01234 567890
    /\b\d{5}\s?\d{6}\b/g, // 03000 200292
  ]

  let phone: string | undefined

  // Check tel links first
  $('a[href^="tel:"]').each((_, element) => {
    const href = $(element).attr('href')
    if (href) {
      phone = href.replace('tel:', '').trim()
      return false
    }
  })

  // Search in text if not found
  if (!phone) {
    $('*').each((_, element) => {
      const text = $(element).text()

      for (const pattern of phonePatterns) {
        const match = text.match(pattern)
        if (match) {
          phone = match[0].trim()
          return false
        }
      }
    })
  }

  return phone
}

/**
 * Compare scraped data with existing data to detect changes
 */
export function detectChanges(
  existing: any,
  scraped: CouncilScrapedData
): string[] {
  const changes: string[] = []

  if (
    scraped.registrationFee &&
    existing.registrationFee !== scraped.registrationFee
  ) {
    changes.push(
      `Registration fee changed from £${existing.registrationFee} to £${scraped.registrationFee}`
    )
  }

  if (scraped.renewalFee && existing.renewalFee !== scraped.renewalFee) {
    changes.push(
      `Renewal fee changed from £${existing.renewalFee} to £${scraped.renewalFee}`
    )
  }

  if (scraped.hmoFee && existing.hmoFee !== scraped.hmoFee) {
    changes.push(
      `HMO fee changed from £${existing.hmoFee} to £${scraped.hmoFee}`
    )
  }

  if (
    scraped.processingTimeDays &&
    existing.processingTimeDays !== scraped.processingTimeDays
  ) {
    changes.push(
      `Processing time changed from ${existing.processingTimeDays} to ${scraped.processingTimeDays} days`
    )
  }

  if (scraped.contactEmail && existing.contactEmail !== scraped.contactEmail) {
    changes.push(
      `Contact email changed from ${existing.contactEmail} to ${scraped.contactEmail}`
    )
  }

  if (scraped.contactPhone && existing.contactPhone !== scraped.contactPhone) {
    changes.push(
      `Contact phone changed from ${existing.contactPhone} to ${scraped.contactPhone}`
    )
  }

  return changes
}

/**
 * Council-specific scrapers for better accuracy
 * Add custom scrapers for councils with unique website structures
 */
export const customScrapers = {
  'City of Edinburgh Council': async (url: string) => {
    // Custom scraper for Edinburgh - knows their specific HTML structure
    // This would be more accurate than the generic scraper
    return scrapeCouncilWebsite('City of Edinburgh Council', url)
  },

  'Glasgow City Council': async (url: string) => {
    // Custom scraper for Glasgow
    return scrapeCouncilWebsite('Glasgow City Council', url)
  },

  // Add more custom scrapers as needed
}

/**
 * Get the appropriate scraper for a council
 */
export async function scrapeCouncil(
  councilName: string,
  url: string
): Promise<ScrapeResult> {
  const customScraper = customScrapers[councilName as keyof typeof customScrapers]

  if (customScraper) {
    console.log(`Using custom scraper for ${councilName}`)
    return customScraper(url)
  }

  return scrapeCouncilWebsite(councilName, url)
}
