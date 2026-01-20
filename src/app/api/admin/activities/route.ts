import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment';
import Lock from '@/models/Lock';
import User from '@/models/User';
import { canAccessAdminPanel } from '@/lib/auth/permissions';

export async function GET() {
  try {
    const session = await auth();
    if (!canAccessAdminPanel(session?.user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    
    // Ensure models are registered
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const m1 = Lock;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const m2 = User;

    // Fetch 7 most recent activities across bookings and payments
    const [recentBookings, recentPayments] = await Promise.all([
      Booking.find()
        .populate('user', 'name email')
        .populate('lock', 'lockNumber')
        .sort({ createdAt: -1 })
        .limit(10),
      Payment.find({ status: { $ne: 'pending' } }) // Only approved/rejected for "activity"
        .populate('user', 'name email')
        .sort({ updatedAt: -1 })
        .limit(10)
    ]);

    // Combine and format activities
    const activities = [
      ...recentBookings.map(b => ({
        id: b._id,
        type: 'booking',
        title: `การเช่าใหม่: ล็อก ${b.lock?.lockNumber || 'N/A'}`,
        user: b.user?.name || 'ผู้ใช้ทั่วไป',
        timestamp: b.createdAt,
        status: b.status,
      })),
      ...recentPayments.map(p => ({
        id: p._id,
        type: 'payment',
        title: p.status === 'approved' ? 'อนุมัติการชำระเงิน' : 'ปฏิเสธการชำระเงิน',
        user: p.user?.name || 'ผู้ใช้ทั่วไป',
        timestamp: p.updatedAt,
        status: p.status,
      }))
    ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching admin activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}
