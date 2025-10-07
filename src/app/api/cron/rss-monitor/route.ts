/**
 * RSS Feed Monitor Cron Job
 * 
 * Runs daily to check council news feeds for landlord-related announcements.
 * Creates alerts when relevant articles are found.
 * 
 * Triggers: Every day at 9 AM GMT
 * Duration: ~2-3 minutes for all councils with RSS feeds
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
  monitorCouncilFeed,
  determineAlertSeverity,
  determineAlertCategory,
  generateAlertTitle,
  COUNCIL_RSS_FEEDS,
} from '@/lib/rss-monitor'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('❌ Unauthorized RSS monitor attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('📰 Starting RSS feed monitoring...')
  const startTime = Date.now()

  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    articlesFound: 0,
    alertsCreated: 0,
    errors: [] as string[],
  }

  try {
    // Get councils with RSS feeds from database
    const councils = await prisma.councilData.findMany({
      where: {
        councilName: {
          in: Object.keys(COUNCIL_RSS_FEEDS),
        },
      },
    })

    results.total = councils.length
    console.log(`📋 Monitoring ${councils.length} council RSS feeds`)

    // Check each council's feed
    for (const council of councils) {
      const feedUrl = COUNCIL_RSS_FEEDS[council.councilName]

      if (!feedUrl) {
        continue
      }

      try {
        console.log(`\n🔍 Checking ${council.councilName}...`)

        // Monitor feed for last 7 days
        const relevantArticles = await monitorCouncilFeed(
          council.councilName,
          feedUrl,
          7
        )

        results.successful++
        results.articlesFound += relevantArticles.length

        // Create alerts for relevant articles
        for (const article of relevantArticles) {
          // Check if we already created an alert for this article
          const existingAlert = await prisma.regulatoryAlert.findFirst({
            where: {
              source: article.link,
            },
          })

          if (existingAlert) {
            console.log(`⏭️  Alert already exists for: ${article.title}`)
            continue
          }

          // Create new alert
          const alert = await prisma.regulatoryAlert.create({
            data: {
              councilId: council.id,
              alertType: 'POLICY_CHANGE',
              category: determineAlertCategory(article),
              title: generateAlertTitle(council.councilName, article),
              description: `${article.title}\n\n${article.description}\n\nKeywords: ${article.keywords.join(', ')}`,
              severity: determineAlertSeverity(article),
              status: 'ACTIVE',
              source: article.link,
              effectiveDate: article.pubDate,
            },
          })

          results.alertsCreated++
          console.log(
            `✅ Created alert for ${council.councilName}: ${article.title}`
          )
        }

        // Rate limiting: wait 2 seconds between feeds
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`❌ Error monitoring ${council.councilName}:`, error)
        results.failed++
        results.errors.push(
          `${council.councilName}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`\n✅ RSS monitoring completed in ${duration}s`)
    console.log(`📊 Results:`, results)

    return NextResponse.json({
      success: true,
      duration: `${duration}s`,
      ...results,
    })
  } catch (error) {
    console.error('❌ RSS monitoring failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        ...results,
      },
      { status: 500 }
    )
  }
}
