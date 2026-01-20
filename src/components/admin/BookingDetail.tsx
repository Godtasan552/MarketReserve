import { Badge, Row, Col, Card } from 'react-bootstrap';
import Image from 'next/image';

interface BookingDetailProps {
  booking: {
    _id: string;
    user: { name: string; email: string };
    lock: { lockNumber: string; zone?: { name: string } };
    startDate: string;
    endDate: string;
    totalAmount: number;
    status: 'pending_payment' | 'pending_verification' | 'active' | 'expired' | 'cancelled';
    rentalType: string;
    createdAt: string;
    payment?: {
      slipImage: string;
      status: 'pending' | 'approved' | 'rejected';
      amount: number;
      verifiedAt?: string;
      rejectionReason?: string;
    } | null;
  };
}

export default function BookingDetail({ booking }: BookingDetailProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment': return <Badge bg="warning" text="dark">รอชำระเงิน</Badge>;
      case 'pending_verification': return <Badge bg="info">รอตรวจสอบ</Badge>;
      case 'active': return <Badge bg="success">ใช้งานอยู่</Badge>;
      case 'expired': return <Badge bg="secondary">หมดอายุ</Badge>;
      case 'cancelled': return <Badge bg="danger">ยกเลิก</Badge>;
      default: return <Badge bg="light" text="dark">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge bg="warning" text="dark">รอตรวจสอบ</Badge>;
      case 'approved': return <Badge bg="success">อนุมัติแล้ว</Badge>;
      case 'rejected': return <Badge bg="danger">ปฏิเสธ</Badge>;
      default: return <Badge bg="light" text="dark">{status}</Badge>;
    }
  };

  const getRentalTypeLabel = (type: string) => {
    switch (type) {
      case 'daily': return 'รายวัน';
      case 'weekly': return 'รายสัปดาห์';
      case 'monthly': return 'รายเดือน';
      default: return type;
    }
  };

  return (
    <div>
      <Card className="mb-3 border-0 bg-light">
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <div className="mb-3">
                <small className="text-muted d-block mb-1">รหัสการจอง</small>
                <div className="fw-bold fs-5">#{booking._id.slice(-8).toUpperCase()}</div>
              </div>
            </Col>
            <Col md={6} className="text-md-end">
              <div className="mb-3">
                <small className="text-muted d-block mb-1">สถานะ</small>
                <div>{getStatusBadge(booking.status)}</div>
              </div>
            </Col>
          </Row>

          <hr className="my-3" />

          <Row className="mb-2">
            <Col md={4}>
              <small className="text-muted d-block mb-1">ผู้จอง</small>
              <div className="fw-bold">{booking.user?.name || 'ไม่ระบุชื่อ'}</div>
              <div className="small text-muted">{booking.user?.email}</div>
            </Col>
            <Col md={4}>
              <small className="text-muted d-block mb-1">พื้นที่เช่า</small>
              <div className="fw-bold">ล็อก {booking.lock?.lockNumber}</div>
              <div className="small text-muted">{booking.lock?.zone?.name || 'ไม่ระบุโซน'}</div>
            </Col>
            <Col md={4}>
              <small className="text-muted d-block mb-1">ประเภทการเช่า</small>
              <div className="fw-bold">{getRentalTypeLabel(booking.rentalType)}</div>
            </Col>
          </Row>

          <hr className="my-3" />

          <Row className="mb-2">
            <Col md={6}>
              <small className="text-muted d-block mb-1">วันเริ่มต้น</small>
              <div className="fw-bold">
                {new Date(booking.startDate).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </Col>
            <Col md={6}>
              <small className="text-muted d-block mb-1">วันสิ้นสุด</small>
              <div className="fw-bold">
                {new Date(booking.endDate).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </Col>
          </Row>

          <hr className="my-3" />

          <Row>
            <Col md={6}>
              <small className="text-muted d-block mb-1">ยอดเงินทั้งหมด</small>
              <div className="fw-bold text-primary fs-4">฿{booking.totalAmount.toLocaleString()}</div>
            </Col>
            <Col md={6}>
              <small className="text-muted d-block mb-1">วันที่ทำรายการ</small>
              <div className="fw-bold">
                {new Date(booking.createdAt).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Payment Slip Section */}
      {booking.payment && (
        <Card className="border-0 bg-light">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-receipt me-2"></i>
                ข้อมูลการชำระเงิน
              </h6>
              {getPaymentStatusBadge(booking.payment.status)}
            </div>

            <hr className="my-3" />

            <Row className="mb-3">
              <Col md={6}>
                <small className="text-muted d-block mb-1">ยอดที่ชำระ</small>
                <div className="fw-bold text-success fs-5">฿{(booking.payment?.amount || 0).toLocaleString()}</div>
              </Col>
              {booking.payment?.verifiedAt && (
                <Col md={6}>
                  <small className="text-muted d-block mb-1">วันที่ตรวจสอบ</small>
                  <div className="fw-bold">
                    {new Date(booking.payment.verifiedAt).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </Col>
              )}
            </Row>

            {booking.payment?.rejectionReason && (
              <div className="alert alert-danger mb-3">
                <strong>เหตุผลที่ปฏิเสธ:</strong> {booking.payment.rejectionReason}
              </div>
            )}

            <div className="mt-3">
              <small className="text-muted d-block mb-2">สลิปการโอนเงิน</small>
              <div className="border rounded p-2 bg-white text-center" style={{ maxWidth: '400px' }}>
                {booking.payment?.slipImage && (
                  <Image
                    src={booking.payment.slipImage}
                    alt="Payment Slip"
                    width={350}
                    height={500}
                    className="img-fluid rounded"
                    style={{ objectFit: 'contain', maxHeight: '500px' }}
                  />
                )}
              </div>
              {booking.payment?.slipImage && (
                <div className="mt-2">
                  <a 
                    href={booking.payment.slipImage} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary"
                  >
                    <i className="bi bi-box-arrow-up-right me-1"></i>
                    เปิดดูขนาดเต็ม
                  </a>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      )}

      {!booking.payment && booking.status !== 'pending_payment' && (
        <Card className="border-0 bg-light">
          <Card.Body className="text-center text-muted py-4">
            <i className="bi bi-receipt-cutoff display-4 d-block mb-2"></i>
            <p className="mb-0">ไม่พบข้อมูลการชำระเงิน</p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
