import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Booking from '@/models/Booking';
import { processLockAvailability } from '@/lib/queue-processor';

export async function GET() {
  try {
    await connectDB();
    const now = new Date();

    // Find bookings that are 'pending_payment' and passed the 'paymentDeadline'
    const expiredBookings = await Booking.find({
      status: 'pending_payment',
      paymentDeadline: { $lt: now },
    });

    let cancelledCount = 0;

    for (const booking of expiredBookings) {
      // 1. Update booking status
      booking.status = 'cancelled';
      // We could add a system note or reason if the schema supports it
      await booking.save();

      // 2. Release the lock via Queue Processor
      // This helper will check if there is a queue. 
      // If Queue: Reserve for next user.
      // If No Queue: Set available & Notify interests.
      await processLockAvailability(booking.lock.toString());
      
      cancelledCount++;
    }

    return NextResponse.json({
      success: true,
      found: expiredBookings.length,
      cancelled: cancelledCount,
    });
  } catch (error) {
    console.error('Error in cancel-expired-bookings cron:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
