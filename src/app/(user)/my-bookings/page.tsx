'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LinkAny = Link as any;

interface Booking {
  _id: string;
  lock: { lockNumber: string };
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'pending_payment' | 'pending_verification' | 'active' | 'expired' | 'cancelled';
  rentalType: string;
  createdAt: string;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/bookings');
        if (res.ok) {
          const data = await res.json();
          setBookings(data);
        } else {
          setError('ไม่สามารถดึงข้อมูลได้');
        }
      } catch (e: unknown) {
        console.error(e);
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'pending_payment': return <Badge bg="warning" text="dark">รอชำระเงิน</Badge>;
      case 'pending_verification': return <Badge bg="info">รอตรวจสอบ</Badge>;
      case 'active': return <Badge bg="success">ใช้งานอยู่</Badge>;
      case 'expired': return <Badge bg="secondary">หมดอายุ</Badge>;
      case 'cancelled': return <Badge bg="danger">ยกเลิกแล้ว</Badge>;
      default: return <Badge bg="light" text="dark">{status}</Badge>;
    }
  };

  if (loading) return (
    <Container className="py-5 text-center">
      <Spinner animation="border" variant="primary" />
    </Container>
  );

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold m-0">การจองของฉัน</h2>
          <Button as={LinkAny} href="/locks" variant="primary">
            <i className="bi bi-plus-lg me-2"></i> จองล็อกเพิ่ม
          </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {bookings.length === 0 ? (
        <div className="text-center py-5 bg-white rounded shadow-sm">
          <i className="bi bi-calendar-x display-1 text-light mb-3 d-block"></i>
          <h3>คุณยังไม่มีการจองในขณะนี้</h3>
          <p className="text-muted">เลือกทำเลที่ถูกใจและเริ่มสร้างรายได้ได้เลย</p>
            <Button as={LinkAny} href="/locks" variant="primary">ไปดูพื้นที่ว่าง</Button>
        </div>
      ) : (
        <Row xs={1} md={2} className="g-4">
          {bookings.map((booking) => (
            <Col key={booking._id}>
              <Card className="border-0 shadow-sm transition-300">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h4 className="fw-bold mb-1">ล็อก {booking.lock?.lockNumber || 'N/A'}</h4>
                      <div className="text-muted small">ID: #{booking._id.slice(-6)}</div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  <hr className="my-3 opacity-10" />

                  <Row className="mb-3">
                    <Col xs={6}>
                      <div className="small text-muted mb-1 text-uppercase">วันที่เริ่ม</div>
                      <div className="fw-bold">{new Date(booking.startDate).toLocaleDateString('th-TH')}</div>
                    </Col>
                    <Col xs={6}>
                      <div className="small text-muted mb-1 text-uppercase">วันที่สิ้นสุด</div>
                      <div className="fw-bold">{new Date(booking.endDate).toLocaleDateString('th-TH')}</div>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded-3">
                    <div>
                      <div className="small text-muted">ค่าเช่า ({booking.rentalType === 'daily' ? 'รายวัน' : booking.rentalType === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'})</div>
                      <div className="fw-bold fs-5 text-primary">฿{booking.totalAmount.toLocaleString()}</div>
                    </div>
                    <Button 
                      variant="outline-primary"
                      size="sm"
                      className="px-3 fw-bold"
                      onClick={() => router.push(`/my-bookings/${booking._id}`)}
                    >
                      {booking.status === 'pending_payment' ? 'ชำระเงิน' : 'ดูรายละเอียด'}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}
