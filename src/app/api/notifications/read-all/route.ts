import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Notification from '@/models/Notification';

export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Mark all unread as read
    await Notification.updateMany(
      { user: session.user.id, isRead: false },
      { isRead: true }
    );

    return NextResponse.json({ message: 'All notifications marked as read' });

  } catch (error) {
    console.error('Error reading all notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
