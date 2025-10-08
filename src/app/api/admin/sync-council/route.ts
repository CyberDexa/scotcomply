/**
 * Admin API: Sync Single Council
 * 
 * Manually trigger a scrape for a specific council.
 * Admin-only access required.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { scrapeCouncil, detectChanges } from '@/lib/council-scraper'

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

    const body = await request.json()
    const { councilId } = body

    if (!councilId) {
      return NextResponse.json({ error: 'Council ID required' }, { status: 400 })
    }

    // Get council from database
    const council = await prisma.councilData.findUnique({
      where: { id: councilId },
    })

    if (!council) {
      return NextResponse.json({ error: 'Council not found' }, { status: 404 })
    }

    if (!council.landlordRegUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Council does not have a landlord registration URL',
          councilName: council.councilName,
        },
        { status: 400 }
      )
    }

    console.log(`🔧 Admin manual sync: ${council.councilName}`)

    // Scrape the council
    const scrapeResult = await scrapeCouncil(council.councilName, council.landlordRegUrl)

    if (!scrapeResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: scrapeResult.error,
          councilName: council.councilName,
        },
        { status: 500 }
      )
    }

    // Detect changes
    const changes = detectChanges(council, scrapeResult.data!)

    // Update council data with lastScraped timestamp
    await prisma.councilData.update({
      where: { id: council.id },
      data: {
        ...scrapeResult.data,
        lastScraped: new Date(),
      },
    })

    // If changes detected, create alert
    if (changes.length > 0) {
      await prisma.regulatoryAlert.create({
        data: {
          councilId: council.id,
          alertType: 'FEE_CHANGE',
          category: 'FEES',
          title: `Admin Sync: ${council.councilName}`,
          description: `Manual sync detected changes: ${changes.join('; ')}`,
          severity: 'MEDIUM',
          status: 'ACTIVE',
          sourceUrl: council.landlordRegUrl,
          effectiveDate: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      councilName: council.councilName,
      changes: changes,
      changesDetected: changes.length,
      scrapedData: scrapeResult.data,
    })
  } catch (error) {
    console.error('❌ Admin sync failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
