'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Form, InputGroup, Nav } from 'react-bootstrap';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { showAlert, showConfirm } from '@/lib/swal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LinkAny = Link as any;

interface Booking {
  _id: string;
  lock: { lockNumber: string; zone?: { name: string } };
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'pending_payment' | 'pending_verification' | 'active' | 'expired' | 'cancelled';
  rentalType: string;
  createdAt: string;
}

interface QueueItem {
  _id: string;
  lock: {
    _id: string;
    lockNumber: string;
    zone: { name: string };
    pricing: { daily: number };
    images: string[];
    status: string;
  };
  userPosition: number;
  createdAt: string;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  
  const [activeTab, setActiveTab] = useState<'bookings' | 'queues'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');

  // Derive zones from both bookings and queues
  const availableZones = Array.from(new Set([
    ...bookings.map(b => b.lock?.zone?.name).filter(Boolean),
    ...queues.map(q => q.lock?.zone?.name).filter(Boolean)
  ])).sort() as string[];

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      } else {
        setError('ไม่สามารถดึงข้อมูลการจองได้');
      }
    } catch (e: unknown) {
      console.error(e);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  }, []);

  const fetchQueues = useCallback(async () => {
    try {
      const res = await fetch('/api/queue?my=true');
      if (res.ok) {
        const data = await res.json();
        setQueues(data);
      }
    } catch (error) {
      console.error('Failed to fetch queues', error);
    }
  }, []);

  const initData = useCallback(async () => {
    setLoading(true);
    try {
        await Promise.all([fetchBookings(), fetchQueues()]);
    } finally {
        setLoading(false);
    }
  }, [fetchBookings, fetchQueues]);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=/my-bookings');
    } else if (authStatus === 'authenticated') {
      // Use setTimeout to avoid synchronous setState during render warning
      const timer = setTimeout(() => {
        initData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [authStatus, router, initData]);

  const handleLeaveQueue = async (lockId: string, lockNumber: string) => {
    const { isConfirmed } = await showConfirm(
      'ยืนยันการออกจากคิว',
      `คุณต้องการออกจากคิวของล็อก ${lockNumber} ใช่หรือไม่?`,
      'ยืนยัน',
      'ยกเลิก'
    );

    if (!isConfirmed) return;

    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockId, action: 'leave' })
      });

      if (res.ok) {
        showAlert('สำเร็จ', 'ออกจากคิวเรียบร้อยแล้ว', 'success');
        setQueues(prev => prev.filter(q => q.lock._id !== lockId));
      } else {
        const err = await res.json();
        showAlert('ผิดพลาด', err.error || 'ไม่สามารถออกจากคิวได้', 'error');
      }
    } catch (e) {
      console.error(e);
      showAlert('ผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'pending_payment': return <Badge bg="warning" text="dark" className="px-2 py-1">รอชำระเงิน</Badge>;
      case 'pending_verification': return <Badge bg="info" className="px-2 py-1">รอตรวจสอบ</Badge>;
      case 'active': return <Badge bg="success" className="px-2 py-1">ใช้งานอยู่</Badge>;
      case 'expired': return <Badge bg="secondary" className="px-2 py-1">หมดอายุ</Badge>;
      case 'cancelled': return <Badge bg="danger" className="px-2 py-1">ยกเลิกแล้ว</Badge>;
      default: return <Badge bg="light" text="dark" className="px-2 py-1">{status}</Badge>;
    }
  };

  const filteredBookings = bookings.filter(b => {
    const lockNum = b.lock?.lockNumber || '';
    const zoneName = b.lock?.zone?.name || '';
    const matchSearch = lockNum.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchZone = zoneFilter === 'all' || zoneName === zoneFilter;
    return matchSearch && matchStatus && matchZone;
  });

  const filteredQueues = queues.filter(q => {
    const lockNum = q.lock?.lockNumber || '';
    const zoneName = q.lock?.zone?.name || '';
    const matchSearch = lockNum.toLowerCase().includes(searchTerm.toLowerCase());
    const matchZone = zoneFilter === 'all' || zoneName === zoneFilter;
    return matchSearch && matchZone;
  });

  if (authStatus === 'loading' || loading) return (
    <Container className="py-5 text-center">
      <Spinner animation="border" variant="primary" />
      <div className="mt-3 text-muted">กำลังโหลดข้อมูล...</div>
    </Container>
  );

  return (
    <Container className="py-4">
      {/* Header Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold m-0 text-dark">
            <i className={`bi ${activeTab === 'bookings' ? 'bi-calendar-check' : 'bi-people-fill'} text-primary me-2`}></i>
            {activeTab === 'bookings' ? 'การจองของฉัน' : 'รายการจองคิว'}
          </h2>
          <p className="text-muted mb-0">จัดการรายการจองและลำดับคิวของคุณทั้งหมดได้ที่นี่</p>
        </div>
        <Button as={LinkAny} href="/locks" variant="primary" className="fw-bold shadow-sm rounded-pill px-4">
          <i className="bi bi-plus-lg me-2"></i> จองล็อกเพิ่ม
        </Button>
      </div>

      {/* Tabs Section */}
      <Card className="border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
        <Card.Body className="p-0">
          <Nav variant="tabs" activeKey={activeTab} className="border-0 bg-light flex-nowrap overflow-auto">
            <Nav.Item className="flex-grow-1">
              <Nav.Link 
                eventKey="bookings" 
                onClick={() => setActiveTab('bookings')}
                className={`text-center py-3 fw-bold border-0 rounded-0 ${activeTab === 'bookings' ? 'bg-white text-primary' : 'text-muted'}`}
                style={{ 
                  borderBottom: activeTab === 'bookings' ? '4px solid var(--bs-primary)' : 'none',
                  backgroundColor: activeTab === 'bookings' ? '#fff' : 'transparent'
                }}
              >
                การจอง ({bookings.length})
              </Nav.Link>
            </Nav.Item>
            <Nav.Item className="flex-grow-1">
              <Nav.Link 
                eventKey="queues" 
                onClick={() => setActiveTab('queues')}
                className={`text-center py-3 fw-bold border-0 rounded-0 ${activeTab === 'queues' ? 'bg-white text-primary' : 'text-muted'}`}
                style={{ 
                  borderBottom: activeTab === 'queues' ? '4px solid var(--bs-primary)' : 'none',
                  backgroundColor: activeTab === 'queues' ? '#fff' : 'transparent'
                }}
              >
                จองคิว ({queues.length})
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Body>
      </Card>

      {/* Filter Section */}
      <Card className="border-0 shadow-sm mb-4 rounded-4" style={{ borderLeft: '5px solid var(--bs-primary)' }}>
        <Card.Body className="p-3">
          <Row className="g-3">
            <Col xs={12} md={activeTab === 'bookings' ? 4 : 6}>
              <InputGroup className="border rounded-3 overflow-hidden">
                <InputGroup.Text className="bg-white border-0">
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="ค้นหาด้วยเลขที่ล็อก..."
                  className="border-0 py-2 shadow-none"
                  value={searchTerm}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z0-9\s-]/g, '');
                    setSearchTerm(val);
                  }}
                />
              </InputGroup>
            </Col>
            <Col xs={12} md={activeTab === 'bookings' ? 4 : 6}>
              <Form.Select 
                className="border rounded-3 py-2 shadow-none"
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
              >
                <option value="all">โซนทั้งหมด ({availableZones.length})</option>
                {availableZones.map(z => (
                  <option key={z} value={z}>โซน {z}</option>
                ))}
              </Form.Select>
            </Col>
            {activeTab === 'bookings' && (
              <Col xs={12} md={4}>
                <Form.Select 
                  className="border rounded-3 py-2 shadow-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">สถานะทั้งหมด</option>
                  <option value="pending_payment">รอชำระเงิน</option>
                  <option value="pending_verification">รอตรวจสอบ</option>
                  <option value="active">ใช้งานอยู่</option>
                  <option value="expired">หมดอายุ</option>
                  <option value="cancelled">ยกเลิกแล้ว</option>
                </Form.Select>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger" className="border-0 shadow-sm rounded-3 mb-4">{error}</Alert>}

      {activeTab === 'bookings' ? (
        <>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-5 bg-white rounded-4 shadow-sm border mt-3">
              <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '100px', height: '100px' }}>
                <i className="bi bi-calendar-x display-4 text-muted"></i>
              </div>
              <h3 className="fw-bold">ไม่พบรายการจอง</h3>
              <p className="text-muted mb-4">คุณยังไม่มีรายการจองตามเงื่อนไขที่ระบุ</p>
              <Button onClick={() => { setSearchTerm(''); setStatusFilter('all'); setZoneFilter('all'); }} variant="outline-primary" className="rounded-pill px-4">ล้างตัวกรอง</Button>
            </div>
          ) : (
            <Row xs={1} lg={2} className="g-4">
              {filteredBookings.map((booking) => (
                <Col key={booking._id}>
                  <Card className="border-0 shadow-sm h-100 rounded-4 overflow-hidden card-hover">
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h4 className="fw-bold mb-1">ล็อก {booking.lock?.lockNumber || 'N/A'}</h4>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            <span className="bg-light px-2 py-1 rounded">ID: #{booking._id.slice(-6)}</span>
                            <span className="ms-2">โซน: {booking.lock?.zone?.name || 'ทั่วไป'}</span>
                          </div>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="p-3 bg-light rounded-3 mb-3 border border-dashed">
                        <Row className="g-2 text-center">
                          <Col xs={6} className="border-end">
                            <div className="text-muted text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>วันที่เริ่ม จอง</div>
                            <div className="fw-bold small">{new Date(booking.startDate).toLocaleDateString('th-TH')}</div>
                          </Col>
                          <Col xs={6}>
                            <div className="text-muted text-uppercase mb-1" style={{ fontSize: '0.65rem' }}>วันที่สิ้นสุด</div>
                            <div className="fw-bold small">{new Date(booking.endDate).toLocaleDateString('th-TH')}</div>
                          </Col>
                        </Row>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-0">
                        <div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>ค่าเช่า ({booking.rentalType === 'daily' ? 'รายวัน' : booking.rentalType === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'})</div>
                          <div className="fw-bold h5 text-primary mb-0">฿{booking.totalAmount.toLocaleString()}</div>
                        </div>
                        <Button 
                          variant={booking.status === 'pending_payment' ? "primary" : "outline-primary"}
                          size="sm"
                          className="px-4 py-2 fw-bold rounded-pill shadow-sm"
                          onClick={() => router.push(`/my-bookings/${booking._id}`)}
                        >
                          {booking.status === 'pending_payment' ? (
                            <><i className="bi bi-wallet2 me-2"></i>ชำระเงิน</>
                          ) : (
                            'ดูรายละเอียด'
                          )}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </>
      ) : (
        <>
          {filteredQueues.length === 0 ? (
            <div className="text-center py-5 bg-white rounded-4 shadow-sm border mt-3">
              <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '100px', height: '100px' }}>
                <i className="bi bi-person-dash display-4 text-muted"></i>
              </div>
              <h3 className="fw-bold">ไม่พบรายการจองคิว</h3>
              <p className="text-muted mb-4">คุณยังไม่ได้เข้าคิวรอจองล็อกใดๆ ในขณะนี้</p>
              <Button onClick={() => { setSearchTerm(''); setZoneFilter('all'); }} variant="outline-primary" className="rounded-pill px-4">ล้างตัวกรอง</Button>
            </div>
          ) : (
            <Row className="g-4">
              {filteredQueues.map((q) => (
                <Col key={q._id} lg={6}>
                  <Card className="border-0 shadow-sm rounded-4 overflow-hidden h-100 card-hover">
                    <Card.Body className="p-0">
                      <Row className="g-0 h-100">
                        <Col xs={4} className="bg-light position-relative" style={{ minHeight: '160px' }}>
                           {q.lock.images?.[0] ? (
                              <Image 
                                src={q.lock.images[0]} 
                                alt={q.lock.lockNumber} 
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="(max-width: 768px) 33vw, 25vw"
                              />
                           ) : (
                              <div className="d-flex align-items-center justify-content-center h-100 bg-secondary bg-opacity-10">
                                 <i className="bi bi-image text-muted fs-3"></i>
                              </div>
                           )}
                        </Col>
                        <Col xs={8} className="p-3 d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                               <h5 className="fw-bold mb-1">ล็อก {q.lock.lockNumber}</h5>
                               <div className="text-primary fw-medium" style={{ fontSize: '0.75rem' }}>
                                  <i className="bi bi-geo-alt me-1"></i> โซน: {q.lock.zone.name}
                               </div>
                            </div>
                            <div className="text-center">
                               <div className="text-muted mb-0" style={{ fontSize: '0.6rem' }}>ลำดับคิว</div>
                               <Badge bg="primary" className="px-2 py-1 rounded-pill">
                                  {q.userPosition}
                               </Badge>
                            </div>
                          </div>
                          
                          <div className="text-muted mb-3 mt-auto" style={{ fontSize: '0.7rem' }}>
                             เข้าคิวเมื่อ: {new Date(q.createdAt).toLocaleString('th-TH')}
                          </div>

                          <div className="d-flex gap-2">
                            <Button 
                              as={LinkAny} 
                              href={`/locks/${q.lock._id}`} 
                              variant="outline-primary" 
                              size="sm"
                              className="flex-grow-1 rounded-pill fw-bold"
                              style={{ fontSize: '0.75rem' }}
                            >
                               รายละเอียด
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              className="rounded-pill fw-bold"
                              style={{ fontSize: '0.75rem' }}
                              onClick={() => handleLeaveQueue(q.lock._id, q.lock.lockNumber)}
                            >
                               <i className="bi bi-trash"></i> เลิกคิว
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </>
      )}

      {/* Global CSS for animations */}
      <style jsx global>{`
        .card-hover {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1) !important;
        }
        .border-dashed {
          border-style: dashed !important;
        }
      `}</style>
    </Container>
  );
}
