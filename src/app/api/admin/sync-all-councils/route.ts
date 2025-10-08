/**
 * Admin API: Bulk Sync All Councils
 * 
 * Manually trigger scrapes for all councils.
 * Admin-only access required.
 * 
 * Note: This can take several minutes to complete.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { scrapeCouncil, detectChanges } from '@/lib/council-scraper'

export const maxDuration = 300 // 5 minutes

// Priority councils to process first
const PRIORITY_COUNCILS = [
  'City of Edinburgh Council',
  'Glasgow City Council',
  'Aberdeen City Council',
  'Dundee City Council',
  'Stirling Council',
]

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('🔧 Admin bulk sync: Starting all councils...')

    // Get all councils
    const councils = await prisma.councilData.findMany({
      orderBy: { councilName: 'asc' },
    })

    // Sort: Priority councils first, then alphabetically
    const sortedCouncils = councils.sort((a, b) => {
      const aPriority = PRIORITY_COUNCILS.indexOf(a.councilName)
      const bPriority = PRIORITY_COUNCILS.indexOf(b.councilName)

      if (aPriority !== -1 && bPriority !== -1) {
        return aPriority - bPriority
      }
      if (aPriority !== -1) return -1
      if (bPriority !== -1) return 1

      return a.councilName.localeCompare(b.councilName)
    })

    const results = {
      total: councils.length,
      successful: 0,
      failed: 0,
      changes: 0,
      alertsCreated: 0,
      errors: [] as Array<{ council: string; error: string }>,
    }

    // Process each council
    for (const council of sortedCouncils) {
      try {
        if (!council.landlordRegUrl) {
          console.log(`⏭️  Skipping ${council.councilName} - no URL`)
          results.failed++
          continue
        }

        console.log(`🔍 Scraping ${council.councilName}...`)

        const scrapeResult = await scrapeCouncil(council.councilName, council.landlordRegUrl)

        if (!scrapeResult.success) {
          console.error(`❌ Failed to scrape ${council.councilName}:`, scrapeResult.error)
          results.failed++
          results.errors.push({
            council: council.councilName,
            error: scrapeResult.error || 'Unknown error',
          })
          continue
        }

        // Detect changes
        const changes = detectChanges(council, scrapeResult.data!)

        // Update council data
        await prisma.councilData.update({
          where: { id: council.id },
          data: {
            ...scrapeResult.data,
            lastScraped: new Date(),
          },
        })

        // Create alerts if changes detected
        if (changes.length > 0) {
          results.changes += changes.length

          await prisma.regulatoryAlert.create({
            data: {
              councilId: council.id,
              alertType: 'FEE_CHANGE',
              category: 'FEES',
              title: `Admin Bulk Sync: ${council.councilName}`,
              description: `Bulk sync detected changes: ${changes.join('; ')}`,
              severity: 'MEDIUM',
              status: 'ACTIVE',
              sourceUrl: council.landlordRegUrl,
              effectiveDate: new Date(),
            },
          })

          results.alertsCreated++
          console.log(`✅ ${council.councilName}: ${changes.length} changes detected`)
        } else {
          console.log(`✅ ${council.councilName}: No changes`)
        }

        results.successful++

        // Rate limiting: 2 second delay between requests
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`❌ Error processing ${council.councilName}:`, error)
        results.failed++
        results.errors.push({
          council: council.councilName,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log('✅ Admin bulk sync completed:', results)

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('❌ Admin bulk sync failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
