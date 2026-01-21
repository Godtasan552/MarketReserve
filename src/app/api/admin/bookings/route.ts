import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Booking from '@/models/Booking';
import Lock from '@/models/Lock';
import Zone from '@/models/Zone';
import Payment from '@/models/Payment';
import { canAccessAdminPanel } from '@/lib/auth/permissions';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !canAccessAdminPanel(session.user?.role)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();
    
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate({
        path: 'lock',
        populate: { path: 'zone', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch payment data for each booking
    const bookingsWithPayments = await Promise.all(
      bookings.map(async (booking) => {
        const payment = await Payment.findOne({ booking: booking._id })
          .select('slipImage status amount verifiedAt verifiedBy rejectionReason')
          .lean();
        return {
          ...booking,
          payment: payment || null
        };
      })
    );

    return NextResponse.json(bookingsWithPayments);
  } catch (error) {
    console.error('Fetch admin bookings error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลรายการจองได้' }, { status: 500 });
  }
}
