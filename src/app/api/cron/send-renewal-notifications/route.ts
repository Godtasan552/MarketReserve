import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Booking from '@/models/Booking';
import { NotificationService } from '@/lib/notification/service';

export async function GET() {
  try {
    // Cron authentication (Optional: Check header)
    // if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) ...

    await connectDB();
    const now = Date.now();
    const threeHoursFromNow = new Date(now + 3 * 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now + 2 * 60 * 60 * 1000); // 2-3 hour window

    // Find bookings expiring soon
    // Logic: Active bookings, EndDate is coming up soon, Not notified yet
    const expiringBookings = await Booking.find({
      status: 'active',
      endDate: {
        $gte: twoHoursFromNow,
        $lte: threeHoursFromNow,
      },
      renewalNotificationSent: { $ne: true },
    }).populate('user').populate('lock');

    let notifiedCount = 0;

    for (const booking of expiringBookings) {
      if (booking.user?._id && booking.lock?.lockNumber) {
        const userId = booking.user._id.toString();
        const userEmail = booking.user.email;

        // Dispatch Notification
        await NotificationService.send(userId, 'booking_expiring', {
          bookingId: booking._id.toString(),
          lockNumber: booking.lock.lockNumber,
          userEmail: userEmail,
          message: `การเช่าล็อค #${booking.lock.lockNumber} จะหมดอายุในอีก 3 ชั่วโมง กรุณาต่อสัญญาหากต้องการใช้งานต่อ`
        });

        // Mark as notified
        booking.renewalNotificationSent = true;
        await booking.save();
        notifiedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: expiringBookings.length,
      notified: notifiedCount 
    });

  } catch (error) {
    console.error('Error in renewal cron:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
