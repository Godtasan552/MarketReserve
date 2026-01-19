import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { calculateBookingDetails, RentalType } from '@/lib/utils/booking';
import connectDB from '@/lib/db/mongoose';
import Booking from '@/models/Booking';
import Lock from '@/models/Lock';
import mongoose from 'mongoose';
import { NotificationService } from '@/lib/notification/service';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    // Note: session.user comes from auth middleware (inject via helper or auth())
    if (!session?.user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const body = await req.json();
    const { lockId, startDate, rentalType } = body;

    if (!lockId || !startDate || !rentalType) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    await connectDB();

    const lock = await Lock.findById(lockId);
    if (!lock || !lock.isActive) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลล็อก' }, { status: 404 });
    }

    // Check standard availability
    if (lock.status === 'booked' || lock.status === 'rented' || lock.status === 'maintenance') {
      return NextResponse.json({ error: 'ล็อกนี้ไม่ว่างสำหรับการจอง' }, { status: 400 });
    }

    // Check Reservation Logic
    if (lock.status === 'reserved') {
      // 1. Check if user is the reserved one
      if (lock.reservedTo?.toString() !== session.user.id) {
         return NextResponse.json({ error: 'ล็อกนี้ติดสิทธิ์จองคิวลำดับถัดไป (Reserved Queue)' }, { status: 403 });
      }
      
      // 2. Check Expiry
      if (lock.reservationExpiresAt && new Date() > new Date(lock.reservationExpiresAt)) {
         // Edge case: Cron hasn't run yet but time is up. Strict check.
         return NextResponse.json({ error: 'สิทธิ์การจองของคุณหมดอายุแล้ว' }, { status: 403 });
      }
    }

    // Calculate dates and amount using utility
    const { startDate: start, endDate: end, totalAmount: amount } = calculateBookingDetails(
      lock.pricing,
      new Date(startDate),
      rentalType as RentalType
    );

    // Payment deadline: 3 hours from now
    const paymentDeadline = new Date();
    paymentDeadline.setHours(paymentDeadline.getHours() + 3);

    // Mongoose transaction to ensure atomicity
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // 1. Create Booking
      const booking = await Booking.create([{
        user: session.user.id,
        lock: lockId,
        startDate: start,
        endDate: end,
        rentalType,
        totalAmount: amount,
        status: 'pending_payment',
        paymentDeadline,
        isRenewal: false
      }], { session: dbSession });

      // 2. Update Lock Status (Hardcore Race Condition Check)
      // We perform an atomic update with specific conditions.
      // If the lock status changed between our initial read and now, this will fail (return null).
      const updatedLock = await Lock.findOneAndUpdate(
        {
          _id: lockId,
          // Condition: Available OR (Reserved for current user)
          $or: [
            { status: 'available' },
            { status: 'reserved', reservedTo: session.user.id }
          ]
        },
        { 
          status: 'booked',
          $unset: { reservedTo: 1, reservationExpiresAt: 1 } 
        }, 
        { session: dbSession, new: true }
      );

      if (!updatedLock) {
         throw new Error('Lock is no longer available (Race Condition detected)');
      }
      
      // 3. Create Audit Log
      const AuditLog = (await import('@/models/AuditLog')).default;
      await AuditLog.create([{
         action: 'BOOKING_CREATED',
         actorId: session.user.id,
         targetId: lockId,
         details: { 
             bookingId: booking[0]._id, 
             amount, 
             prevStatus: lock.status 
         }
      }], { session: dbSession });

      await dbSession.commitTransaction();
      dbSession.endSession();

      // Send Notification (Event-based)
      // Note: session.user.id is used for In-App, session.user.email for Email
      if (session.user?.id) {
         await NotificationService.send(session.user.id, 'booking_created', {
            bookingId: booking[0]._id.toString(),
            lockNumber: lock.lockNumber,
            totalAmount: amount,
            paymentDeadline,
            userEmail: session.user.email || undefined
         });
      }

      return NextResponse.json(booking[0], { status: 201 });
    } catch (err: unknown) {
      await dbSession.abortTransaction();
      dbSession.endSession();
      throw err;
    }

  } catch (error: unknown) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการจอง' }, { status: 500 });
  }
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
        }

        await connectDB();
        const bookings = await Booking.find({ user: session.user.id })
            .populate('lock')
            .sort({ createdAt: -1 });

        return NextResponse.json(bookings);
    } catch (error) {
        console.error('Fetch bookings error:', error);
        return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลการจองได้' }, { status: 500 });
    }
}
