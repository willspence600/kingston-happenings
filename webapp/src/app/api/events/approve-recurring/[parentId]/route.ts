import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ parentId: string }> }
) {
  try {
    const { parentId } = await params;
    
    // Verify admin
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Update all events with this parentEventId OR this id
    const result = await prisma.event.updateMany({
      where: {
        OR: [
          { id: parentId },
          { parentEventId: parentId }
        ],
        status: 'pending'
      },
      data: { status: 'approved' },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Approve recurring events error:', error);
    return NextResponse.json({ error: 'Failed to approve events' }, { status: 500 });
  }
}

