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
import { AlertSeverity, AlertCategory, ChangeType, ImpactLevel } from '@prisma/client'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max

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

          // Update council data
          await prisma.councilData.update({
            where: { id: council.id },
            data: {
              ...scrapeResult.data,
              updatedAt: new Date(),
            },
          })

          // Create change records
          for (const changeDescription of changes) {
            await prisma.councilChange.create({
              data: {
                councilId: council.id,
                changeType: determineChangeType(changeDescription),
                title: `${council.councilName} Update`,
                description: changeDescription,
                impactLevel: determineImpactLevel(changeDescription),
                effectiveDate: new Date(),
                source: council.landlordRegUrl,
              },
            })
          }

          // Create alerts for significant changes
          if (changes.some((c) => c.includes('fee'))) {
            const alert = await prisma.regulatoryAlert.create({
              data: {
                councilId: council.id,
                alertType: 'FEE_INCREASE',
                category: AlertCategory.LANDLORD_REGISTRATION,
                title: `Fee Change: ${council.councilName}`,
                description: changes.join('. '),
                severity: determineSeverity(changes),
                status: 'ACTIVE',
                source: council.landlordRegUrl,
                effectiveDate: new Date(),
              },
            })

            results.alertsCreated++
            console.log(`✅ Created alert for ${council.councilName}`)
          }
        } else {
          console.log(`✓ No changes for ${council.councilName}`)
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

/**
 * Determine the type of change from description
 */
function determineChangeType(description: string): ChangeType {
  if (description.toLowerCase().includes('fee')) {
    return ChangeType.FEE
  }
  if (
    description.toLowerCase().includes('time') ||
    description.toLowerCase().includes('processing')
  ) {
    return ChangeType.DEADLINE
  }
  if (description.toLowerCase().includes('contact')) {
    return ChangeType.CONTACT
  }
  return ChangeType.POLICY
}

/**
 * Determine impact level of change
 */
function determineImpactLevel(description: string): ImpactLevel {
  // Fee increases are high impact
  if (description.toLowerCase().includes('fee')) {
    const match = description.match(/from £(\d+) to £(\d+)/)
    if (match) {
      const oldFee = parseInt(match[1])
      const newFee = parseInt(match[2])
      const increase = ((newFee - oldFee) / oldFee) * 100

      if (increase > 20) return ImpactLevel.HIGH
      if (increase > 10) return ImpactLevel.MEDIUM
      return ImpactLevel.LOW
    }
    return ImpactLevel.MEDIUM
  }

  // Contact changes are low impact
  if (
    description.toLowerCase().includes('contact') ||
    description.toLowerCase().includes('email') ||
    description.toLowerCase().includes('phone')
  ) {
    return ImpactLevel.LOW
  }

  return ImpactLevel.MEDIUM
}

/**
 * Determine alert severity
 */
function determineSeverity(changes: string[]): AlertSeverity {
  const hasMajorFeeIncrease = changes.some((c) => {
    const match = c.match(/from £(\d+) to £(\d+)/)
    if (match) {
      const oldFee = parseInt(match[1])
      const newFee = parseInt(match[2])
      return ((newFee - oldFee) / oldFee) * 100 > 20
    }
    return false
  })

  if (hasMajorFeeIncrease) return AlertSeverity.HIGH
  if (changes.some((c) => c.toLowerCase().includes('fee')))
    return AlertSeverity.MEDIUM

  return AlertSeverity.LOW
}
