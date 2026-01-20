'use client';

import { Badge, Row, Col, Card, Carousel } from 'react-bootstrap';
import { Lock } from './LockList';

interface LockDetailProps {
  lock: Lock & { images?: string[]; features?: string[]; description?: string };
}

export default function LockDetail({ lock }: LockDetailProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return <Badge bg="success" className="px-3 py-2">ว่าง (พร้อมให้จอง)</Badge>;
      case 'booked': return <Badge bg="warning" text="dark" className="px-3 py-2">จองแล้ว</Badge>;
      case 'rented': return <Badge bg="danger" className="px-3 py-2">เช่าแล้ว</Badge>;
      case 'maintenance': return <Badge bg="secondary" className="px-3 py-2">ปิดปรับปรุง</Badge>;
      default: return <Badge bg="light" text="dark" className="px-3 py-2">{status}</Badge>;
    }
  };

  const getZoneName = (zone: { name: string } | string | null | undefined) => {
    if (typeof zone === 'object' && zone !== null && 'name' in zone) {
      return (zone as { name: string }).name;
    }
    return 'ไม่ระบุโซน';
  };

  return (
    <div className="py-2">
      <Row className="g-4">
        {/* Images Section */}
        <Col lg={6}>
          {lock.images && lock.images.length > 0 ? (
            <Carousel className="shadow-sm rounded overflow-hidden">
              {lock.images.map((img, idx) => (
                <Carousel.Item key={idx}>
                  <img
                    className="d-block w-100"
                    src={img}
                    alt={`Slide ${idx}`}
                    style={{ height: '350px', objectFit: 'cover' }}
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          ) : (
            <div 
              className="bg-light d-flex align-items-center justify-content-center rounded" 
              style={{ height: '350px' }}
            >
              <div className="text-center text-muted">
                <i className="bi bi-image display-1"></i>
                <p>ไม่มีรูปภาพประกอบ</p>
              </div>
            </div>
          )}
        </Col>

        {/* Info Section */}
        <Col lg={6}>
          <div className="mb-4">
            <h3 className="fw-bold mb-1">รหัสล็อก: {lock.lockNumber}</h3>
            <p className="text-muted h5 mb-3">{getZoneName(lock.zone)}</p>
            <div className="mb-3">
              {getStatusBadge(lock.status)}
              {!lock.isActive && <Badge bg="dark" className="ms-2 px-3 py-2">ปิดใช้งานชั่วคราว</Badge>}
            </div>
          </div>

          <Card className="border-0 bg-light mb-4 shadow-sm">
            <Card.Body>
              <Row className="text-center g-0">
                <Col xs={4} className="border-end">
                  <div className="small text-muted mb-1 text-uppercase">ความกว้าง</div>
                  <div className="fw-bold h5 mb-0">{lock.size.width} {lock.size.unit}</div>
                </Col>
                <Col xs={4} className="border-end">
                  <div className="small text-muted mb-1 text-uppercase">ความยาว</div>
                  <div className="fw-bold h5 mb-0">{lock.size.length} {lock.size.unit}</div>
                </Col>
                <Col xs={4}>
                  <div className="small text-muted mb-1 text-uppercase">พื้นที่รวม</div>
                  <div className="fw-bold h5 mb-0">
                    {lock.size.unit === 'sqm' 
                      ? lock.size.width * lock.size.length 
                      : (lock.size.width * lock.size.length).toFixed(2)} ตร.ม.
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 bg-white mb-4 border shadow-sm">
            <Card.Body>
              <h6 className="fw-bold mb-3"><i className="bi bi-cash-stack me-2 text-success"></i>อัตราค่าเช่า</h6>
              <div className="d-flex justify-content-between mb-2">
                <span>รายวัน:</span>
                <span className="fw-bold text-success h5 mb-0">฿{lock.pricing.daily.toLocaleString()}</span>
              </div>
              {lock.pricing.weekly && (
                <div className="d-flex justify-content-between mb-2">
                  <span>รายสัปดาห์:</span>
                  <span className="fw-bold">฿{lock.pricing.weekly.toLocaleString()}</span>
                </div>
              )}
              {lock.pricing.monthly && (
                <div className="d-flex justify-content-between">
                  <span>รายเดือน:</span>
                  <span className="fw-bold text-primary h5 mb-0">฿{lock.pricing.monthly.toLocaleString()}</span>
                </div>
              )}
            </Card.Body>
          </Card>

          {lock.description && (
            <div className="mb-4">
               <h6 className="fw-bold mb-2"><i className="bi bi-info-circle me-2 text-primary"></i>รายละเอียดเพิ่มเติม</h6>
               <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>{lock.description}</p>
            </div>
          )}


        </Col>
      </Row>
    </div>
  );
}
