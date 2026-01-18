import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
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

    if (lock.status !== 'available') {
      return NextResponse.json({ error: 'ล็อกนี้ไม่ว่างสำหรับการจอง' }, { status: 400 });
    }

    // Calculate dates
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    let end = new Date(start);
    let amount = 0;

    if (rentalType === 'daily') {
      end = new Date(start);
      amount = lock.pricing.daily;
    } else if (rentalType === 'weekly') {
      end.setDate(start.getDate() + 6);
      amount = lock.pricing.weekly || (lock.pricing.daily * 7);
    } else if (rentalType === 'monthly') {
      end.setDate(start.getDate() + 29);
      amount = lock.pricing.monthly || (lock.pricing.daily * 30);
    } else {
      return NextResponse.json({ error: 'รูปแบบการเช่าไม่ถูกต้อง' }, { status: 400 });
    }

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

      // 2. Update Lock Status
      await Lock.findByIdAndUpdate(
        lockId, 
        { status: 'booked' }, 
        { session: dbSession }
      );

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

export async function GET(req: NextRequest) {
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
