import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { calculateBookingDetails, RentalType } from '@/lib/utils/booking';
import connectDB from '@/lib/db/mongoose';
import Booking from '@/models/Booking';
import Lock from '@/models/Lock';
import Zone from '@/models/Zone';
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

    // Check Lock Status for current date if trying to book for today
    const requestedStart = new Date(startDate);
    requestedStart.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isToday = requestedStart.getTime() === today.getTime();

    // Maintenance check (always blocked)
    if (lock.status === 'maintenance') {
      return NextResponse.json({ error: 'ล็อกนี้อยู่ในช่วงปรับปรุง ไม่สามารถจองได้' }, { status: 400 });
    }

    // Check standard availability for TODAY if booking for today
    if (isToday && (lock.status === 'booked' || lock.status === 'rented')) {
      return NextResponse.json({ error: 'ล็อกนี้ถูกเช่าหรือจองแล้วในวันนี้' }, { status: 400 });
    }

    // For advance booking or today, check all overlapping bookings
    const { startDate: start, endDate: end, totalAmount: amount } = calculateBookingDetails(
      lock.pricing,
      requestedStart,
      rentalType as RentalType
    );

    const overlap = await Booking.findOne({
      lock: lockId,
      status: { $in: ['pending_payment', 'pending_verification', 'active'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlap) {
      return NextResponse.json({ 
        error: 'ล็อกนี้ไม่ว่างในช่วงเวลาที่เลือก เนื่องจากมีการจองทับซ้อนกัน' 
      }, { status: 400 });
    }

    // Check Reservation Logic (Only for today's FCFS/Queue)
    if (isToday && lock.status === 'reserved') {
      // 1. Check if user is the reserved one
      if (lock.reservedTo?.toString() !== session.user.id) {
         return NextResponse.json({ error: 'ล็อกนี้ติดสิทธิ์จองคิวลำดับถัดไป (Reserved Queue)' }, { status: 403 });
      }
      
      // 2. Check Expiry
      if (lock.reservationExpiresAt && new Date() > new Date(lock.reservationExpiresAt)) {
         return NextResponse.json({ error: 'สิทธิ์การจองของคุณหมดอายุแล้ว' }, { status: 403 });
      }
    }

    // Payment deadline: 30 minutes from now (Updated for faster queue movement)
    const paymentDeadline = new Date();
    paymentDeadline.setMinutes(paymentDeadline.getMinutes() + 30);

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
      const updatedLock = await Lock.findOneAndUpdate(
        {
          _id: lockId,
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
         // --- RACE CONDITION DETECTED ---
         // If someone else snatched the lock, automatically move this user to queue
         await dbSession.abortTransaction();
         
         // Check if user already has an active or pending booking for this lock (unlikely but safe)
         const existingBooking = await Booking.findOne({
            lock: lockId,
            user: session.user.id,
            status: { $in: ['pending_payment', 'pending_verification', 'active'] }
         });

         if (existingBooking) {
            return NextResponse.json({ 
              error: 'คุณมีการจองล็อกนี้อยู่แล้ว ไม่สามารถจองคิวเพิ่มได้' 
            }, { status: 400 });
         }

         const Queue = (await import('@/models/Queue')).default;
         await Queue.findOneAndUpdate(
            { lock: lockId, user: session.user.id },
            { lock: lockId, user: session.user.id },
            { upsert: true, new: true }
         );

         return NextResponse.json({ 
           success: true, 
           isQueued: true,
           message: 'คุณจองไม่ทันเสี้ยววินาที! แต่ระบบลำดับคิวให้คุณเป็นคิวที่ 1 เพื่อรับสิทธิ์คนถัดไปแล้ว' 
         }, { status: 200 });
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
      
      // Send Notification
      if (session.user?.id) {
         try {
            await NotificationService.send(session.user.id, 'booking_created', {
               bookingId: booking[0]._id.toString(),
               lockNumber: lock.lockNumber,
               totalAmount: amount,
               paymentDeadline,
               userEmail: session.user.email || undefined
            });
         } catch (notifyErr) {
            console.error('Notification failed but booking was successful:', notifyErr);
         }
      }

      return NextResponse.json(booking[0], { status: 201 });
    } catch (err: unknown) {
      if (dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }
      throw err;
    } finally {
      dbSession.endSession();
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
            .populate({
                path: 'lock',
                populate: { path: 'zone', select: 'name' }
            })
            .sort({ createdAt: -1 });

        return NextResponse.json(bookings);
    } catch (error) {
        console.error('Fetch bookings error:', error);
        return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลการจองได้' }, { status: 500 });
    }
}
