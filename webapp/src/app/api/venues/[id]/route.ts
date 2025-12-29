import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/venues/[id] - Get a single venue
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        events: {
          where: { status: 'approved' },
          include: {
            categories: true,
            _count: {
              select: { likes: true },
            },
          },
          orderBy: [
            { date: 'asc' },
            { startTime: 'asc' },
          ],
        },
      },
    });

    if (!venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      venue: {
        ...venue,
        events: venue.events.map((e) => ({
          ...e,
          categories: e.categories.map((c) => c.name),
          likeCount: e._count.likes,
        })),
      },
    });
  } catch (error) {
    console.error('Get venue error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venue' },
      { status: 500 }
    );
  }
}
