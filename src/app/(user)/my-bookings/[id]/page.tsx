'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner, Form, ProgressBar } from 'react-bootstrap';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LinkAny = Link as any;

interface Booking {
  _id: string;
  lock: { lockNumber: string; zone: { name: string } };
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'pending_payment' | 'pending_verification' | 'active' | 'expired' | 'cancelled';
  rentalType: string;
  paymentDeadline: string;
  payment?: {
    _id: string;
    slipImage: string;
    createdAt: string;
  };
}

export default function BookingDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Payment Upload State
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchBooking = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/bookings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBooking(data);
      } else {
        setError('ไม่พบข้อมูลการจอง');
      }
    } catch (e: unknown) {
      console.error(e);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadPayment = async () => {
    if (!file || !id) {
      alert('กรุณาเลือกไฟล์สลิป');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bookingId', id);

      setUploadProgress(30);
      const res = await fetch('/api/payments', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(90);
      
      if (res.ok) {
        alert('อัปโหลดสลิปเรียบร้อยแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบ');
        fetchBooking();
      } else {
        const result = await res.json();
        alert(result.error || 'การอัปโหลดล้มเหลว');
      }
    } catch (e: unknown) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการสื่อสารกับเซิร์ฟเวอร์');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setFile(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment': return <Badge bg="warning" text="dark" className="px-3 py-2">รอชำระเงิน</Badge>;
      case 'pending_verification': return <Badge bg="info" className="px-3 py-2">รอตรวจสอบสลิป</Badge>;
      case 'active': return <Badge bg="success" className="px-3 py-2">จองสำเร็จ (พร้อมใช้งาน)</Badge>;
      case 'expired': return <Badge bg="secondary" className="px-3 py-2">หมดอายุ</Badge>;
      case 'cancelled': return <Badge bg="danger" className="px-3 py-2">ยกเลิกแล้ว</Badge>;
      default: return <Badge bg="light" text="dark" className="px-3 py-2">{status}</Badge>;
    }
  };

  if (loading) return (
    <Container className="py-5 text-center">
      <Spinner animation="border" variant="primary" />
    </Container>
  );

  if (error || !booking) return (
    <Container className="py-5">
      <Alert variant="danger">{error || 'ไม่พบข้อมูล'}</Alert>
      <Button as={LinkAny} href="/my-bookings" variant="outline-primary">กลับไปหน้ารายการ</Button>
    </Container>
  );

  const isExpired = booking.status === 'pending_payment' && new Date(booking.paymentDeadline) < new Date();

  return (
    <Container className="py-4">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/my-bookings" className="text-decoration-none">การจองของฉัน</Link>
          </li>
          <li className="breadcrumb-item active">รายละเอียด #{booking._id.slice(-6)}</li>
        </ol>
      </nav>

      <Row className="g-4">
        <Col lg={7}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-0">รายละเอียดการจอง</h3>
                {getStatusBadge(booking.status)}
              </div>

              <div className="bg-light p-4 rounded-3 mb-4">
                <Row className="g-3">
                  <Col sm={6}>
                    <div className="small text-muted mb-1">รหัสล็อก</div>
                    <div className="fw-bold h5">ล็อก {booking.lock.lockNumber}</div>
                  </Col>
                  <Col sm={6}>
                    <div className="small text-muted mb-1">โซน</div>
                    <div className="fw-bold h5 text-primary">{booking.lock.zone.name}</div>
                  </Col>
                  <Col sm={6}>
                    <div className="small text-muted mb-1">ระยะเวลาเช่า</div>
                    <div className="fw-bold">
                        {new Date(booking.startDate).toLocaleDateString('th-TH')} - {new Date(booking.endDate).toLocaleDateString('th-TH')}
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="small text-muted mb-1">ประเภทการเช่า</div>
                    <div className="fw-bold text-capitalize">
                        {booking.rentalType === 'daily' ? 'รายวัน' : booking.rentalType === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
                    </div>
                  </Col>
                </Row>
              </div>

              <div className="d-flex justify-content-between align-items-center border-top pt-4">
                <span className="h5 fw-bold text-muted">ยอดที่ต้องชำระทั้งหมด</span>
                <span className="h3 fw-bold text-primary">฿{booking.totalAmount.toLocaleString()}</span>
              </div>
            </Card.Body>
          </Card>

          {booking.status === 'pending_verification' && booking.payment && (
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                    <h5 className="fw-bold mb-3">สลิปที่อัปโหลดแล้ว</h5>
                    <div className="bg-light p-2 rounded border text-center">
                        <img 
                          src={booking.payment.slipImage} 
                          alt="Uploaded Slip" 
                          className="img-fluid rounded shadow-sm"
                          style={{ maxHeight: '400px' }}
                        />
                    </div>
                    <div className="mt-3 text-center text-muted small">
                        อัปโหลดเมื่อ: {new Date(booking.payment.createdAt).toLocaleString('th-TH')}
                    </div>
                </Card.Body>
            </Card>
          )}
        </Col>

        <Col lg={5}>
          {booking.status === 'pending_payment' && !isExpired && (
            <Card className="border-0 shadow-sm mb-4 border-top border-primary border-4">
              <Card.Body className="p-4">
                <h4 className="fw-bold mb-3">ชำระเงิน</h4>
                <div className="alert alert-warning border-0 small mb-4">
                  <i className="bi bi-clock-history me-2"></i>
                  กรุณาชำระเงินภายใน: <strong>{new Date(booking.paymentDeadline).toLocaleString('th-TH')}</strong>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold small text-muted text-uppercase mb-3">บัญชีธนาคารสำหรับโอนเงิน</h6>
                  <div className="p-3 border rounded-3 d-flex align-items-center bg-light">
                    <div className="bg-primary rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                        <i className="bi bi-bank text-white fs-4"></i>
                    </div>
                    <div>
                        <div className="fw-bold">ธนาคารกสิกรไทย (K-Bank)</div>
                        <div className="text-primary fw-bold fs-5">012-3-45678-9</div>
                        <div className="small text-muted">บจก. มาร์เก็ต ฮับ เทคโนโลยี</div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <Form.Group>
                    <Form.Label className="fw-bold">อัปโหลดหลักฐานการโอนเงิน (สลิป)</Form.Label>
                    <div 
                        className="border-2 border-dashed rounded-3 p-4 text-center cursor-pointer hover-bg-light"
                        onClick={() => !uploading && (document.getElementById('slip-upload') as HTMLInputElement)?.click()}
                        style={{ borderStyle: 'dashed', cursor: 'pointer' }}
                    >
                        {file ? (
                            <div className="py-2">
                                <i className="bi bi-file-earmark-check text-success display-6"></i>
                                <div className="mt-2 fw-bold">{file.name}</div>
                                <div className="small text-muted">{(file.size / 1024).toFixed(1)} KB</div>
                            </div>
                        ) : (
                            <div className="py-2 text-muted">
                                <i className="bi bi-cloud-arrow-up display-6 mb-2"></i>
                                <div>กดที่นี่เพื่อเลือกไฟล์หรือลากไฟล์มาวาง</div>
                                <div className="small text-muted mt-1">รองรับ JPG, PNG (สูงสุด 5MB)</div>
                            </div>
                        )}
                        <input 
                            id="slip-upload"
                            type="file" 
                            accept="image/*" 
                            className="d-none" 
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                    </div>
                  </Form.Group>
                </div>

                {uploading && (
                    <div className="mb-4">
                        <div className="d-flex justify-content-between small mb-1">
                            <span>กำลังบันทึกข้อมูล...</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <ProgressBar now={uploadProgress} animated style={{ height: '8px' }} />
                    </div>
                )}

                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    className="fw-bold py-3"
                    onClick={handleUploadPayment}
                    disabled={uploading || !file}
                  >
                    {uploading ? 'กำลังประมวลผล...' : 'ยืนยันการแจ้งชำระเงิน'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {isExpired && (
             <Alert variant="danger" className="border-0 shadow-sm p-4">
                <h5 className="fw-bold">การจองหมดอายุ</h5>
                <p className="mb-0">การจองนี้ถูกระงับเนื่องจากไม่ได้ชำระเงินภายในเวลาที่กำหนด กรุณาจองใหม่อีกครั้ง</p>
                <hr />
                <Button variant="danger" className="w-100" onClick={() => router.push('/locks')}>ไปเลือกทำเลใหม่</Button>
             </Alert>
          )}
          
          <Card className="border-0 shadow-sm">
             <Card.Body className="p-4">
               <h5 className="fw-bold mb-3">คำแนะนำ</h5>
               <ul className="text-muted small ps-3">
                 <li className="mb-2">กรุณาอัปโหลดสลิปที่แสดงชื่อผู้รับและจำนวนเงินชัดเจน</li>
                 <li className="mb-2">ระบบจะใช้เวลาตรวจสอบสลิปประมาณ 30-60 นาที</li>
                 <li>เมื่อตรวจสอบสำเร็จ สถานะจะเปลี่ยนเป็น &quot;จองสำเร็จ&quot; ทันที</li>
               </ul>
             </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
