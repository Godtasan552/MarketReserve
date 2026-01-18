import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Notification from '@/models/Notification';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Fetch notifications: limited to 20, sorted by newest
    const notifications = await Notification.find({ user: session.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    // Count unread
    const unreadCount = await Notification.countDocuments({ 
      user: session.user.id, 
      isRead: false 
    });

    return NextResponse.json({
      notifications,
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
