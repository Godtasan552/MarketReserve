import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { hasPermission } from '@/lib/auth/permissions';
import connectDB from '@/lib/db/mongoose';
import Payment from '@/models/Payment';
import Booking from '@/models/Booking';
import Lock from '@/models/Lock';
import mongoose from 'mongoose';
import { NotificationService } from '@/lib/notification/service';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !hasPermission(session?.user?.role, 'manage_bookings')) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    const { status, rejectionReason } = await req.json();
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
    }

    await connectDB();
    
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    let emailData = null;

    try {
      const payment = await Payment.findById(id).session(dbSession);
      if (!payment) throw new Error('ไม่พบข้อมูลการชำระเงิน');

      payment.status = status;
      payment.verifiedBy = session.user!.id;
      payment.verifiedAt = new Date();
      if (rejectionReason) payment.rejectionReason = rejectionReason;
      await payment.save({ session: dbSession });

      if (status === 'approved') {
        // Find booking with population to get user/lock info for email
        const booking = await Booking.findById(payment.booking)
          .populate('user')
          .populate('lock')
          .session(dbSession);

        if (booking) {
            // Update Booking to active
            await Booking.findByIdAndUpdate(
              payment.booking,
              { status: 'active' },
              { session: dbSession }
            );
            
            // Update Lock to rented
            // Handle if lock is populated or not (safe check)
            const lockId = booking.lock?._id || booking.lock;
            await Lock.findByIdAndUpdate(
              lockId,
              { status: 'rented' },
              { session: dbSession }
            );

            // Prepare email data
            // Check if user and lock are populated with expected fields
            if (booking.user?.email && booking.lock?.lockNumber) {
              emailData = {
                userEmail: booking.user.email,
                userName: booking.user.name || 'User',
                userId: booking.user._id.toString(), // Store user ID for notification
                lockNumber: booking.lock.lockNumber,
                bookingId: booking._id.toString(),
                startDate: booking.startDate,
                endDate: booking.endDate
              };
            }
        }
      } else {
        // If rejected, booking goes back to pending_payment
        await Booking.findByIdAndUpdate(
          payment.booking,
          { status: 'pending_payment' },
          { session: dbSession }
        );
      }

      await dbSession.commitTransaction();

      // Send Notification (Outside Transaction)
      if (emailData) {
        try {
          await NotificationService.send(emailData.userId, 'booking_approved', {
              bookingId: emailData.bookingId,
              lockNumber: emailData.lockNumber,
              startDate: emailData.startDate,
              endDate: emailData.endDate,
              userName: emailData.userName,
              userEmail: emailData.userEmail
          });
        } catch (notifyErr) {
          console.error('Notification failed but payment update was successful:', notifyErr);
        }
      }

      return NextResponse.json({ message: 'ดำเนินการเรียบร้อยแล้ว' });
    } catch (err: unknown) {
      if (dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }
      throw err;
    } finally {
      dbSession.endSession();
    }

  } catch (error: unknown) {
    console.error('Admin Payment Update Error:', error);
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดำเนินการ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
