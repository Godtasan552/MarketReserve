import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Booking from '@/models/Booking';
import Payment from '@/models/Payment';
import cloudinary from '@/lib/cloudinary';
import mongoose from 'mongoose';
import { NotificationService } from '@/lib/notification/service';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bookingId = formData.get('bookingId') as string;

    if (!file || !bookingId) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    await connectDB();

    const booking = await Booking.findOne({ _id: bookingId, user: session.user.id });
    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 });
    }

    if (booking.status !== 'pending_payment') {
      return NextResponse.json({ error: 'สถานะการจองไม่ถูกต้องสำหรับการแจ้งชำระเงิน' }, { status: 400 });
    }

    // 1. Upload Slip to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const fileUri = `data:${file.type};base64,${base64Data}`;

    const uploadResult = await cloudinary.uploader.upload(fileUri, {
      folder: 'payment-slips',
      resource_type: 'auto',
    });

    // 2. OCR Processing (Background or immediate)
    let ocrResult = {};
    try {
      const { processSlipOCR } = await import('@/lib/ocr/slip-ocr');
      ocrResult = await processSlipOCR(buffer);
    } catch (ocrErr) {
      console.error('OCR Processing failed:', ocrErr);
    }

    // 3. Transaction to update database
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // Create Payment
      const payment = await Payment.create([{
        booking: bookingId,
        user: session.user.id,
        amount: booking.totalAmount,
        slipImage: uploadResult.secure_url,
        ocrResult: ocrResult,
        status: 'pending',
      }], { session: dbSession });

      // Update Booking
      await Booking.findByIdAndUpdate(
        bookingId,
        { 
          status: 'pending_verification',
          payment: payment[0]._id 
        },
        { session: dbSession }
      );

      await dbSession.commitTransaction();
      dbSession.endSession();

      // Send Notification (Event-based) - Policy will check if it should be sent
      await NotificationService.send(session.user.id, 'payment_uploaded', {
        bookingId: bookingId,
        userEmail: session.user.email || undefined
      });

      return NextResponse.json(payment[0], { status: 201 });
    } catch (err: unknown) {
      await dbSession.abortTransaction();
      dbSession.endSession();
      throw err;
    }

  } catch (error: unknown) {
    console.error('Payment upload error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปโหลดสลิป' }, { status: 500 });
  }
}
