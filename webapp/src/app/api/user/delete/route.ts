import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function DELETE(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // Delete user (cascades to likes, etc.)
    await prisma.user.delete({
      where: { id: decoded.userId },
    });

    // Clear the token cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('token');
    
    return response;
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}

