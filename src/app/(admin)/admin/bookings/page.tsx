'use client';

import { useState, useEffect } from 'react';
import { Container, Table, Badge, Button, Form, Spinner, Alert, Card, InputGroup, Row, Col, Modal } from 'react-bootstrap';
import BookingDetail from '@/components/admin/BookingDetail';

interface Booking {
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
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rentalTypeFilter, setRentalTypeFilter] = useState('');
  
  // View Modal
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
        setFilteredBookings(data);
      } else {
        setError('ไม่สามารถดึงข้อมูลรายการจองได้');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    let result = bookings;

    if (statusFilter) {
      result = result.filter(b => b.status === statusFilter);
    }

    if (rentalTypeFilter) {
      result = result.filter(b => b.rentalType === rentalTypeFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(b => 
        b.user?.name?.toLowerCase().includes(term) ||
        b.user?.email?.toLowerCase().includes(term) ||
        b.lock?.lockNumber?.toLowerCase().includes(term)
      );
    }

    setFilteredBookings(result);
  }, [searchTerm, statusFilter, rentalTypeFilter, bookings]);

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

  const getRentalTypeLabel = (type: string) => {
    switch (type) {
      case 'daily': return 'รายวัน';
      case 'weekly': return 'รายสัปดาห์';
      case 'monthly': return 'รายเดือน';
      default: return type;
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">รายการจองทั้งหมด</h2>
          <p className="text-muted mb-0">จัดการและตรวจสอบประวัติการจองพื้นที่ของลูกค้า</p>
        </div>
        <Button variant="outline-primary" onClick={fetchBookings} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-2"></i>รีเฟรช
        </Button>
      </div>

      <Card className="border shadow-sm mb-4 border-start-0 border-top-0 border-bottom-0 border-end-0" style={{ borderLeft: '4px solid var(--bs-primary)', boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.08)' }}>
        <Card.Body className="p-3 border rounded shadow-sm">
          <Row className="g-3">
            <Col md={6}>
              <InputGroup className="border rounded overflow-hidden">
                <InputGroup.Text className="bg-light border-0 border-end">
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="ค้นหาชื่อผู้จอง, อีเมล หรือรหัสล็อก..."
                  className="bg-light border-0 ps-2"
                  value={searchTerm}
                  onChange={(e) => {
                    // Allow: alphanumeric, Thai characters, spaces, dots, @, underscores, and dashes
                    const val = e.target.value.replace(/[^a-zA-Z0-9ก-๙\s.@_-]/g, '');
                    setSearchTerm(val);
                  }}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-light border shadow-none"
              >
                <option value="">ทุกสถานะ</option>
                <option value="pending_payment">รอชำระเงิน</option>
                <option value="pending_verification">รอตรวจสอบ</option>
                <option value="active">ใช้งานอยู่</option>
                <option value="expired">หมดอายุ</option>
                <option value="cancelled">ยกเลิก</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={rentalTypeFilter} 
                onChange={(e) => setRentalTypeFilter(e.target.value)}
                className="bg-light border shadow-none"
              >
                <option value="">ทุกประเภท</option>
                <option value="daily">รายวัน</option>
                <option value="weekly">รายสัปดาห์</option>
                <option value="monthly">รายเดือน</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-5 bg-white rounded shadow-sm border">
          <i className="bi bi-calendar-x display-1 text-light mb-3 d-block"></i>
          <h4 className="text-muted">ไม่พบรายการจองตามเงื่อนไขที่ระบุ</h4>
        </div>
      ) : (
        <div className="bg-white rounded shadow-sm border overflow-hidden">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th className="py-3 ps-4">รหัสจอง</th>
                <th className="py-3">ผู้จอง</th>
                <th className="py-3">พื้นที่ / โซน</th>
                <th className="py-3">วันเริ่มต้น - สิ้นสุด</th>
                <th className="py-3">ประเภท</th>
                <th className="py-3">ยอดเงิน</th>
                <th className="py-3">สถานะ</th>
                <th className="py-3 text-end pe-4">วันที่ทำรายการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => (
                <tr 
                  key={b._id} 
                  onClick={() => {
                    setViewingBooking(b);
                    setShowViewModal(true);
                  }}
                  style={{ cursor: 'pointer' }}
                  className="booking-row"
                >
                  <td className="ps-4 fw-bold">#{b._id.slice(-6).toUpperCase()}</td>
                  <td>
                    <div className="fw-bold">{b.user?.name || 'ไม่ระบุชื่อ'}</div>
                    <div className="small text-muted">{b.user?.email}</div>
                  </td>
                  <td>
                    <Badge bg="primary">ล็อก {b.lock?.lockNumber}</Badge>
                    <div className="small mt-1 text-muted text-truncate" style={{ maxWidth: '150px' }}>
                      {b.lock?.zone?.name || 'ไม่ระบุโซน'}
                    </div>
                  </td>
                  <td className="small">
                    <div>{new Date(b.startDate).toLocaleDateString('th-TH')}</div>
                    <div className="text-muted">{new Date(b.endDate).toLocaleDateString('th-TH')}</div>
                  </td>
                  <td className="small">{getRentalTypeLabel(b.rentalType)}</td>
                  <td className="fw-bold text-primary">฿{b.totalAmount.toLocaleString()}</td>
                  <td>{getStatusBadge(b.status)}</td>
                  <td className="text-end pe-4 small text-muted">
                    {new Date(b.createdAt).toLocaleDateString('th-TH')}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Booking Detail Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">รายละเอียดการจอง</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          {viewingBooking && <BookingDetail booking={viewingBooking} />}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            ปิดหน้าต่าง
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .booking-row:hover {
          background-color: rgba(13, 110, 253, 0.05) !important;
        }
      `}</style>
    </Container>
  );
}
