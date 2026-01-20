import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Booking from '@/models/Booking';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    await connectDB();
    
    // Booking should belong to the user
    const booking = await Booking.findOne({ _id: id, user: session.user.id })
      .populate({
        path: 'lock',
        populate: { path: 'zone' }
      })
      .populate('payment');

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Fetch booking detail error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลได้' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const mongoose = (await import('mongoose')).default;
    const Lock = (await import('@/models/Lock')).default;
    const AuditLog = (await import('@/models/AuditLog')).default;

    await connectDB();
    
    // Find booking and ensure it belongs to the user
    const booking = await Booking.findOne({ _id: id, user: session.user.id });
    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 });
    }

    // Only allow cancellation if pending payment or pending verification
    if (!['pending_payment', 'pending_verification'].includes(booking.status)) {
      return NextResponse.json({ 
        error: `ไม่สามารถยกเลิกการจองในสถานะ ${booking.status} ได้` 
      }, { status: 400 });
    }

    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // 1. Update Booking status
      booking.status = 'cancelled';
      await booking.save({ session: dbSession });

      // 2. Update Lock status back to available
      await Lock.findByIdAndUpdate(
        booking.lock,
        { status: 'available' },
        { session: dbSession }
      );

      // 3. Create Audit Log
      await AuditLog.create([{
        action: 'BOOKING_CANCELLED',
        actorId: session.user.id,
        targetId: id,
        details: { 
          lockId: booking.lock,
          prevStatus: booking.status
        }
      }], { session: dbSession });

      await dbSession.commitTransaction();
      
      return NextResponse.json({ message: 'ยกเลิกการจองเรียบร้อยแล้ว' });
    } catch (err) {
      if (dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }
      throw err;
    } finally {
      dbSession.endSession();
    }
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการยกเลิกการจอง' }, { status: 500 });
  }
}
