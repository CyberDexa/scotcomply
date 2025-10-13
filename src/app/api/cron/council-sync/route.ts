/**
 * Council Data Sync Cron Job
 * 
 * Runs weekly to scrape council websites and update the database
 * with latest fees, processing times, and contact information.
 * 
 * Triggers: Every Monday at 3 AM GMT
 * Duration: ~10 minutes for all 32 councils
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { scrapeCouncil, detectChanges } from '@/lib/council-scraper'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for long-running cron job

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('❌ Unauthorized cron job attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('🚀 Starting council data sync...')
  const startTime = Date.now()

  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    changes: 0,
    alertsCreated: 0,
    errors: [] as string[],
  }

  try {
    // Get all councils from database
    const councils = await prisma.councilData.findMany({
      orderBy: { councilName: 'asc' },
    })

    results.total = councils.length
    console.log(`📋 Found ${councils.length} councils to check`)

    // Priority councils to scrape first (high traffic areas)
    const priorityCouncils = [
      'City of Edinburgh Council',
      'Glasgow City Council',
      'Aberdeen City Council',
      'Dundee City Council',
      'Stirling Council',
    ]

    // Sort councils with priority first
    const sortedCouncils = [
      ...councils.filter((c) => priorityCouncils.includes(c.councilName)),
      ...councils.filter((c) => !priorityCouncils.includes(c.councilName)),
    ]

    // Process each council
    for (const council of sortedCouncils) {
      try {
        // Skip councils without landlordRegUrl
        if (!council.landlordRegUrl) {
          console.log(`⏭️  Skipping ${council.councilName} - no URL`)
          results.failed++
          continue
        }

        console.log(`\n🔍 Checking ${council.councilName}...`)

        // Scrape the landlord registration URL
        const scrapeResult = await scrapeCouncil(
          council.councilName,
          council.landlordRegUrl
        )

        if (!scrapeResult.success) {
          console.error(
            `❌ Failed to scrape ${council.councilName}: ${scrapeResult.error}`
          )
          results.failed++
          results.errors.push(`${council.councilName}: ${scrapeResult.error}`)
          continue
        }

        results.successful++

        // Detect changes
        const changes = detectChanges(council, scrapeResult.data!)

        if (changes.length > 0) {
          console.log(`🔔 Changes detected for ${council.councilName}:`, changes)
          results.changes += changes.length

          // Update council data with only the fields that exist in the schema
          await prisma.councilData.update({
            where: { id: council.id },
            data: {
              registrationFee: scrapeResult.data.registrationFee ?? council.registrationFee,
              renewalFee: scrapeResult.data.renewalFee ?? council.renewalFee,
              hmoFee: scrapeResult.data.hmoFee ?? council.hmoFee,
              processingTimeDays: scrapeResult.data.processingTimeDays ?? council.processingTimeDays,
              contactEmail: scrapeResult.data.contactEmail ?? council.contactEmail,
              contactPhone: scrapeResult.data.contactPhone ?? council.contactPhone,
              lastScraped: new Date(),
            },
          })

          // Create alerts if changes detected
          if (changes.length > 0) {
            await prisma.regulatoryAlert.create({
              data: {
                councilId: council.id,
                alertType: 'FEE_CHANGE',
                category: 'LANDLORD_REGISTRATION',
                title: `${council.councilName} Update`,
                description: `Automated sync detected changes: ${changes.join('; ')}`,
                severity: 'MEDIUM',
                status: 'ACTIVE',
                sourceUrl: council.landlordRegUrl,
                effectiveDate: new Date(),
              },
            })

            results.alertsCreated++
            console.log(`✅ Created alert for ${council.councilName}`)
          }
        } else {
          console.log(`✓ No changes for ${council.councilName}`)
          
          // Update lastScraped even when no changes detected
          await prisma.councilData.update({
            where: { id: council.id },
            data: {
              lastScraped: new Date(),
            },
          })
        }

        // Rate limiting: wait 2 seconds between requests
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`❌ Error processing ${council.councilName}:`, error)
        results.failed++
        results.errors.push(
          `${council.councilName}: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`\n✅ Council sync completed in ${duration}s`)
    console.log(`📊 Results:`, results)

    return NextResponse.json({
      success: true,
      duration: `${duration}s`,
      ...results,
    })
  } catch (error) {
    console.error('❌ Council sync failed:', error)
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
