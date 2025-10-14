import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Keep-alive endpoint to prevent Neon free tier database from auto-pausing
 * Runs every 4 minutes via external cron service
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple query to keep database awake
    const count = await prisma.councilData.count();
    
    console.log(`[Keep-Alive] Database is awake. Councils: ${count}`);

    return NextResponse.json({
      success: true,
      message: 'Database kept alive',
      timestamp: new Date().toISOString(),
      councils: count,
    });
  } catch (error) {
    console.error('[Keep-Alive] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
