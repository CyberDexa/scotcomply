import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const councils = await prisma.councilData.findMany({
      take: 5,
      select: {
        id: true,
        councilName: true,
      },
    });

    const count = await prisma.councilData.count();

    return NextResponse.json({
      success: true,
      count,
      councils,
      message: 'Direct Prisma query - no TRPC',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
