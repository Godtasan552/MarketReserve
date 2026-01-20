'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Carousel, Alert, Spinner, Form } from 'react-bootstrap';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import NextLink from 'next/link';
import CountdownTimer from '@/components/common/CountdownTimer';
import { showAlert } from '@/lib/swal';

interface Lock {
  _id: string;
  lockNumber: string;
  zone: { _id: string; name: string; description?: string };
  size: { width: number; length: number; unit: string };
  pricing: { daily: number; weekly?: number; monthly?: number };
  status: 'available' | 'booked' | 'rented' | 'maintenance' | 'reserved';
  images: string[];
  features: string[];
  description?: string;
  reservedTo?: string; // or User object
  reservationExpiresAt?: string; // API string date
}

export default function LockDetailClient() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [lock, setLock] = useState<Lock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Booking Form State
  const [startDate, setStartDate] = useState('');
  const [rentalType, setRentalType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Bookmark State
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Queue State
  const [queueInfo, setQueueInfo] = useState({ count: 0, inQueue: false, userPosition: null, hasActiveBooking: false });
  const [queueLoading, setQueueLoading] = useState(false);

  const fetchQueueInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/queue?lockId=${id}`);
      if (res.ok) {
        setQueueInfo(await res.json());
      }
    } catch (e) {
      console.error('Fetch queue error', e);
    }
  }, [id]);

  const handleToggleQueue = async () => {
    if (!session) {
       router.push(`/login?callbackUrl=/locks/${id}`);
       return;
    }
    
    setQueueLoading(true);
    const action = queueInfo.inQueue ? 'leave' : 'join';

    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockId: id, action })
      });
      
      if (res.ok) {
        await fetchQueueInfo();
        showAlert('สำเร็จ', action === 'join' ? 'เข้าคิวเรียบร้อยแล้ว' : 'ออกจากคิวเรียบร้อยแล้ว', 'success');
      } else {
        const err = await res.json();
        showAlert('ผิดพลาด', err.error || 'ไม่สามารถดำเนินการได้', 'error');
      }
    } catch (e) {
      console.error(e);
      showAlert('ผิดพลาด', 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setQueueLoading(false);
    }
  };

  const fetchBookmarkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const bookmarks: string[] = await res.json();
        // Check if current lock ID is in the bookmarks list
        // id from params might be string or array, strictly it's string from file path [id]
        if (Array.isArray(bookmarks) && id && bookmarks.includes(id as string)) {
          setIsBookmarked(true);
        } else {
            setIsBookmarked(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch bookmark status', error);
    }
  }, [id]);

  const toggleBookmark = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/locks/${id}`);
      return;
    }

    // Optimistic Update
    const prevState = isBookmarked;
    setIsBookmarked(!prevState);

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockId: id })
      });

      if (!res.ok) throw new Error('Failed to toggle bookmark');

      const data = await res.json();
      if (typeof data?.bookmarked === 'boolean') {
        setIsBookmarked(data.bookmarked);
      }
    } catch (e) {
      console.error(e);
      setIsBookmarked(prevState); // Revert
      showAlert('Error', 'ไม่สามารถบันทึกรายการโปรดได้', 'error');
    }
  };

  const fetchLock = useCallback(async () => {
    try {
      const res = await fetch(`/api/locks/${id}`);
      if (res.ok) {
        const data = await res.json();
        setLock(data);
      } else {
        setError('ไม่พบข้อมูลล็อก');
      }
    } catch (e: unknown) {
      console.error(e);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
        fetchLock();
        fetchBookmarkStatus();
        fetchQueueInfo();
    }
  }, [id, fetchLock, fetchBookmarkStatus, fetchQueueInfo]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push(`/login?callbackUrl=/locks/${id}`);
      return;
    }

    if (!startDate) {
      showAlert('กรุณาเลือกวันที่', 'กรุณาเลือกวันที่เริ่มเช่า', 'warning');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lockId: id,
          startDate,
          rentalType
        })
      });

      const result = await res.json();
      if (res.ok) {
        router.push(`/my-bookings/${result._id}`);
      } else {
        showAlert('การจองล้มเหลว', result.error || 'ไม่สามารถทำรายการได้ในขณะนี้', 'error');
      }
    } catch (e: unknown) {
      console.error(e);
      showAlert('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return (
    <Container className="py-5 text-center">
      <Spinner animation="border" variant="primary" />
    </Container>
  );

  if (error || !lock) return (
    <Container className="py-5">
      <Alert variant="danger">{error || 'ไม่พบข้อมูล'}</Alert>
    </Container>
  );

  return (
    <Container className="py-4">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><NextLink href="/locks" className="text-decoration-none">จองล็อก</NextLink></li>
          <li className="breadcrumb-item active">{lock.lockNumber}</li>
        </ol>
      </nav>

      <Row className="g-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm overflow-hidden mb-4">
            {lock.images && lock.images.length > 0 ? (
              <Carousel fade>
                {lock.images.map((img, idx) => (
                  <Carousel.Item key={idx}>
                    <div className="position-relative" style={{ height: '450px' }}>
                      <Image
                        className="d-block w-100"
                        src={img}
                        alt={`Market Lock ${lock.lockNumber}`}
                        fill
                        style={{ objectFit: 'cover' }}
                        priority={idx === 0}
                      />
                    </div>
                  </Carousel.Item>
                ))}
              </Carousel>
            ) : (
              <div className="bg-light text-center py-5">
                <i className="bi bi-image display-1 text-muted"></i>
                <p className="text-muted">ไม่มีรูปภาพประกอบ</p>
              </div>
            )}
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <h1 className="fw-bold mb-0">ล็อก {lock.lockNumber}</h1>
                  <Button 
                    variant="link" 
                    className="p-0 border-0 ms-2 text-decoration-none"
                    onClick={toggleBookmark}
                    title={isBookmarked ? 'ยกเลิกการบันทึก' : 'บันทึกข้อมูลล็อกนี้'}
                  >
                    <i className={`bi ${isBookmarked ? 'bi-bookmark-fill text-primary' : 'bi-bookmark text-secondary'} fs-2`}></i>
                  </Button>
                </div>
                <Badge bg={lock.status === 'available' ? 'success' : 'secondary'} className="px-3 py-2 fs-6">
                  {lock.status === 'available' ? 'ว่าง' : lock.status}
                </Badge>
              </div>
              <h5 className="text-primary mb-4">
                <i className="bi bi-geo-alt me-2"></i>โซน: {lock.zone?.name}
              </h5>
              
              <Row className="mb-4">
                <Col md={12}>
                  <div className="p-3 bg-light rounded-3 border h-100">
                    <h6 className="small fw-bold text-uppercase text-muted mb-2">ข้อมูลพื้นที่</h6>
                    <div className="d-flex align-items-center mb-2">
                       <i className="bi bi-aspect-ratio me-3 fs-4 text-primary"></i>
                       <div>
                          <div className="fw-bold fs-5">{lock.size.width} x {lock.size.length} {lock.size.unit}</div>
                          <div className="small text-muted">พื้นที่ทั้งหมด {(lock.size.width * lock.size.length).toFixed(2)} {lock.size.unit === 'm' ? 'ตร.ม.' : lock.size.unit}</div>
                       </div>
                    </div>
                  </div>
                </Col>
              </Row>

              {lock.description && (
                <div className="mb-4">
                  <h5 className="fw-bold mb-3">รายละเอียดเพิ่มเติม</h5>
                  <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>{lock.description}</p>
                </div>
              )}

              <h5 className="fw-bold mb-3">รายละเอียดโซน</h5>
              <p className="text-muted mb-0">{lock.zone?.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm sticky-top" style={{ top: '100px' }}>
            <Card.Body className="p-4">
              <h4 className="fw-bold mb-4">
                {lock.status === 'available' || (lock.status === 'reserved' && lock.reservedTo === session?.user?.id) 
                  ? 'จองพื้นที่ขายของ' 
                  : (lock.status === 'reserved' ? 'ล็อกนี้ติดจอง (คิว)' : 'สถานะการจอง')
                }
              </h4>
              
              <div className="bg-primary bg-opacity-10 p-3 rounded-3 mb-4 text-primary">
                <div className="small mb-1">เริ่มต้นเพียง</div>
                <div className="h2 fw-bold mb-0 text-primary">฿{lock.pricing.daily.toLocaleString()} <span className="small text-muted fw-normal">/วัน</span></div>
              </div>

              {/* Show Reservation countdown if reserved for me */}
              {lock.status === 'reserved' && lock.reservedTo === session?.user?.id && (
                  <Alert variant="info" className="mb-4 border-0 shadow-sm bg-info bg-opacity-10 text-dark">
                    <div className="d-flex align-items-center">
                      <div className="bg-info bg-opacity-25 rounded-circle p-2 me-3">
                        <i className="bi bi-clock-history fs-4 text-info"></i>
                      </div>
                      <div>
                        <div className="fw-bold mb-1">ถึงคิวของคุณแล้ว!</div>
                        <div className="small text-muted mb-2">กรุณาทำรายการภายในเวลาที่กำหนด</div>
                        {lock.reservationExpiresAt && (
                          <CountdownTimer 
                            expiryDate={lock.reservationExpiresAt} 
                            onExpire={() => fetchLock()}
                          />
                        )}
                      </div>
                    </div>
                  </Alert>
              )}

              <Form onSubmit={handleBooking}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">เลือกรูปแบบการเช่า</Form.Label>
                  <div className="d-grid gap-2">
                    <Button 
                      variant={rentalType === 'daily' ? 'primary' : 'outline-primary'} 
                      onClick={() => setRentalType('daily')}
                      className="text-start px-3 py-2 rounded-3"
                    >
                      <i className={`bi bi-check-circle${rentalType === 'daily' ? '-fill' : ''} me-2`}></i>
                      รายวัน <span className="float-end fw-bold">฿{lock.pricing.daily}</span>
                    </Button>
                    {lock.pricing.weekly && (
                      <Button 
                        variant={rentalType === 'weekly' ? 'primary' : 'outline-primary'} 
                        onClick={() => setRentalType('weekly')}
                        className="text-start px-3 py-2 rounded-3"
                      >
                         <i className={`bi bi-check-circle${rentalType === 'weekly' ? '-fill' : ''} me-2`}></i>
                         รายสัปดาห์ <span className="float-end fw-bold">฿{lock.pricing.weekly}</span>
                      </Button>
                    )}
                    {lock.pricing.monthly && (
                      <Button 
                        variant={rentalType === 'monthly' ? 'primary' : 'outline-primary'} 
                        onClick={() => setRentalType('monthly')}
                        className="text-start px-3 py-2 rounded-3"
                      >
                         <i className={`bi bi-check-circle${rentalType === 'monthly' ? '-fill' : ''} me-2`}></i>
                         รายเดือน <span className="float-end fw-bold">฿{lock.pricing.monthly}</span>
                      </Button>
                    )}
                  </div>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">วันที่เริ่มเช่า</Form.Label>
                  <Form.Control 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="py-2 border-primary-subtle rounded-3"
                    required
                  />
                  <Form.Text className="text-muted">
                    <i className="bi bi-calendar-event me-1"></i> สามารถจองล่วงหน้าได้หากช่วงเวลานั้นยังว่าง
                  </Form.Text>
                </Form.Group>

                <div className="d-grid mb-3">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    type="submit" 
                    className="fw-bold py-3 rounded-4 shadow-sm"
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? (
                      <><Spinner animation="border" size="sm" className="me-2" /> กำลังประมวลผล...</>
                    ) : (
                      'ยืนยันการจอง'
                    )}
                  </Button>
                </div>
              </Form>

              <hr className="my-4 opacity-10" />

              {/* Queue Section - Show only if currently occupied */}
              {lock.status !== 'available' && !(lock.status === 'reserved' && lock.reservedTo === session?.user?.id) && (
                <div className="mt-4">
                  <h5 className="fw-bold mb-3 d-flex align-items-center">
                    <i className="bi bi-people me-2 text-warning"></i>
                    จองคิวลำดับถัดไป
                  </h5>
                  <Alert variant="warning" className="border-0 bg-warning bg-opacity-10 text-dark mb-4 rounded-4">
                    <div className="small">
                      ขณะนี้ล็อกไม่ว่างในเวลาปัจจุบัน คุณสามารถเข้าคิวเพื่อรับสิทธิ์เมื่อมีการยกเลิกหรือหมดสัญญา
                    </div>
                  </Alert>
                  
                  <div className="bg-light rounded-4 p-3 mb-4 text-center border">
                    <div className="text-muted small mb-1">จำนวนคนรอคิวขณะนี้</div>
                    <div className="h2 fw-bold text-dark mb-0">{queueInfo.count} <span className="fs-6 text-muted fw-normal">คน</span></div>
                  </div>

                  {queueInfo.inQueue ? (
                    <div className="text-center">
                      <div className="mb-3">
                         <Badge bg="primary" className="p-3 rounded-pill mb-2">
                            คุณคือคิวลำดับที่ {queueInfo.userPosition}
                         </Badge>
                      </div>
                      <Button 
                        variant="outline-danger" 
                        className="w-100 rounded-pill" 
                        onClick={handleToggleQueue}
                        disabled={queueLoading}
                      >
                        {queueLoading ? <Spinner size="sm" animation="border" /> : 'ออกจากคิว'}
                      </Button>
                    </div>
                  ) : queueInfo.hasActiveBooking ? (
                    <div className="text-center">
                       <Alert variant="success" className="border-0 bg-success bg-opacity-10 text-success mb-0 py-3 rounded-4">
                          คุณมีรายการจอง/เช่าล็อกนี้อยู่แล้ว
                       </Alert>
                    </div>
                  ) : (
                    <Button 
                      variant="outline-primary" 
                      className="w-100 fw-bold rounded-pill" 
                      onClick={handleToggleQueue}
                      disabled={queueLoading}
                    >
                      {queueLoading ? <Spinner size="sm" animation="border" /> : 'เข้าคิวรอจอง'}
                    </Button>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
