import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { secret } = await request.json();
    
    // Verify secret
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple query to keep database awake
    const count = await prisma.councilData.count();

    return NextResponse.json({
      success: true,
      message: 'Database connection maintained',
      councilCount: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Keep-alive error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Also support GET for manual testing
export async function GET() {
  try {
    const count = await prisma.councilData.count();
    return NextResponse.json({
      success: true,
      message: 'Database is reachable',
      councilCount: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
