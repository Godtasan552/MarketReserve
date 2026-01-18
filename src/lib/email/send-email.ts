import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

interface BookingCreatedEmailProps {
  userEmail: string;
  lockNumber: string;
  bookingId: string;
  paymentDeadline: Date;
  totalAmount: number;
}

export async function sendBookingCreatedEmail({
  userEmail,
  lockNumber,
  bookingId,
  paymentDeadline,
  totalAmount,
}: BookingCreatedEmailProps) {
  if (!resend) {
    console.warn('RESEND_API_KEY is not set. Skipping email sending.');
    return;
  }

  const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  try {
    const { data, error } = await resend.emails.send({
      from: `Market Hub <${fromEmail}>`,
      to: userEmail,
      subject: `ยืนยันการทำรายการจอง - ล็อค #${lockNumber}`,
      html: `
        <div style="font-family: 'Noto Sans Thai', sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0d6efd;">การจองล็อคสำเร็จ (รอชำระเงิน)</h2>
          <p>คุณได้ทำการจองล็อคหมายเลข <strong>${lockNumber}</strong> เรียบร้อยแล้ว</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>รหัสการจอง:</strong> ${bookingId}</p>
            <p style="margin: 5px 0;"><strong>ยอดชำระ:</strong> ${totalAmount.toLocaleString()} บาท</p>
            <p style="margin: 5px 0; color: #dc3545;"><strong>กรุณาชำระภายใน:</strong> ${paymentDeadline.toLocaleString('th-TH')}</p>
          </div>

          <p>กรุณาอัปโหลดหลักฐานการชำระเงินผ่านระบบภายในเวลาที่กำหนด หากเกินกำหนดระบบจะยกเลิกรายการโดยอัตโนมัติ</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Market Hub Notification System</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending booking created email:', error);
    } else {
      console.log('Booking created email sent successfully:', data?.id);
    }
  } catch (err) {
    console.error('Exception sending booking created email:', err);
  }
}

interface BookingApprovedEmailProps {
  userEmail: string;
  userName: string;
  lockNumber: string;
  bookingId: string;
  startDate: Date;
  endDate: Date;
}

export async function sendBookingApprovedEmail({
  userEmail,
  userName,
  lockNumber,
  bookingId,
  startDate,
  endDate,
}: BookingApprovedEmailProps) {
  if (!resend) {
    console.warn('RESEND_API_KEY is not set. Skipping email sending.');
    return;
  }
  
  const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  try {
    const { data, error } = await resend.emails.send({
      from: `Market Hub <${fromEmail}>`,
      to: userEmail,
      subject: `การชำระเงินได้รับการอนุมัติ - ล็อค #${lockNumber}`,
      html: `
        <div style="font-family: 'Noto Sans Thai', sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #198754;">การชำระเงินเรียบร้อยแล้ว</h2>
          <p>เรียน คุณ ${userName},</p>
          <p>การชำระเงินสำหรับการจองล็อคหมายเลข <strong>${lockNumber}</strong> ได้รับการตรวจสอบและอนุมัติแล้ว</p>
          
          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>รหัสการจอง:</strong> ${bookingId}</p>
            <p style="margin: 5px 0;"><strong>สถานะ:</strong> <span style="color: #198754; font-weight: bold;">พร้อมใช้งาน (Active)</span></p>
            <p style="margin: 5px 0;"><strong>วันเริ่มสัญญา:</strong> ${startDate.toLocaleDateString('th-TH')}</p>
            <p style="margin: 5px 0;"><strong>วันสิ้นสุดสัญญา:</strong> ${endDate.toLocaleDateString('th-TH')}</p>
          </div>

          <p>ท่านสามารถเริ่มใช้พื้นที่ได้ตามวันที่ระบุ</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Market Hub Notification System</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending booking approved email:', error);
    } else {
      console.log('Booking approved email sent successfully:', data?.id);
    }
  } catch (err) {
    console.error('Exception sending booking approved email:', err);
  }
}
