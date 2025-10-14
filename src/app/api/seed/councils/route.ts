import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { scottishCouncils } from '@/../../prisma/seed/councils';

export async function POST(request: Request) {
  try {
    // Get secret from request
    const { secret } = await request.json();
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting council seed...');

    // Seed councils
    for (const council of scottishCouncils) {
      await prisma.councilData.upsert({
        where: { councilName: council.councilName },
        update: council,
        create: council,
      });
    }

    const count = await prisma.councilData.count();

    return NextResponse.json({
      success: true,
      message: `Seeded ${scottishCouncils.length} councils`,
      totalInDatabase: count,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
