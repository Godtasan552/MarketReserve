'use client';

import { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { useSession } from 'next-auth/react';

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  role: string;
  queueDropCount: number;
  lastQueueDropAt?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
        setError('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchProfile();
    }
  }, [session]);

  if (loading) {
    return (
      <Container className="py-5 d-flex justify-content-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'ไม่พบข้อมูลผู้ใช้'}</Alert>
      </Container>
    );
  }

  const getPenaltyStatus = (count: number) => {
    if (count === 0) return { label: 'ปกติ', color: 'success', icon: 'bi-check-circle' };
    if (count === 1) return { label: 'เตือนครั้งที่ 1', color: 'warning', icon: 'bi-exclamation-triangle' };
    if (count === 2) return { label: 'เตือนครั้งที่ 2', color: 'danger', icon: 'bi-exclamation-octagon' };
    return { label: 'ถูกระงับสิทธิ์ชั่วคราว', color: 'dark', icon: 'bi-slash-circle' };
  };

  const status = getPenaltyStatus(profile.queueDropCount);

  return (
    <Container className="py-5">
      <h2 className="fw-bold mb-4">ข้อมูลส่วนตัว</h2>
      
      <Row className="g-4">
        <Col lg={4}>
          <Card className="border-0 shadow-sm rounded-4 text-center p-4">
            <div className="mb-3">
              <div className="bg-primary bg-opacity-10 d-inline-flex rounded-circle p-4 mb-3">
                <i className="bi bi-person-fill display-1 text-primary"></i>
              </div>
              <h3 className="fw-bold mb-1">{profile.name}</h3>
              <p className="text-muted mb-3">{profile.email}</p>
              <Badge bg="primary" pill className="px-3 py-2">
                {profile.role === 'user' ? 'ผู้เช่าทั่วไป' : profile.role === 'admin' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'}
              </Badge>
            </div>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Header className="bg-white border-0 pt-4 px-4">
              <h5 className="fw-bold mb-0">ข้อมูลพื้นฐาน</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="mb-3">
                <Col sm={4} className="text-muted">ชื่อ-นามสกุล</Col>
                <Col sm={8} className="fw-bold">{profile.name}</Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4} className="text-muted">อีเมล</Col>
                <Col sm={8} className="fw-bold">{profile.email}</Col>
              </Row>
              <Row className="mb-3">
                <Col sm={4} className="text-muted">เบอร์โทรศัพท์</Col>
                <Col sm={8} className="fw-bold">{profile.phone || '-'}</Col>
              </Row>
              <Row>
                <Col sm={4} className="text-muted">วันที่เข้าร่วม</Col>
                <Col sm={8} className="fw-bold">{new Date(profile.createdAt).toLocaleDateString('th-TH')}</Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm rounded-4 border-start border-warning border-5">
            <Card.Header className="bg-white border-0 pt-4 px-4">
              <h5 className="fw-bold mb-0">สถานะวินัยและคิว (Queue Standing)</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-flex align-items-center mb-4 gap-3">
                <div className={`bg-${status.color} bg-opacity-10 p-3 rounded-circle text-${status.color}`}>
                  <i className={`bi ${status.icon} fs-2`}></i>
                </div>
                <div>
                  <h6 className="mb-1 text-muted">สถานะบัญชีปัจจุบัน</h6>
                  <h4 className={`fw-bold mb-0 text-${status.color}`}>{status.label}</h4>
                </div>
              </div>

              <div className="bg-light p-4 rounded-4 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted fs-5">จำนวนครั้งที่หลุดคิว (7 วันล่าสุด)</span>
                  <span className="display-4 fw-bold">{profile.queueDropCount}</span>
                </div>
                <p className="small text-muted mb-0">
                  * หากหลุดคิวสะสมครบ 3 ครั้งใน 7 วัน บัญชีจะถูกระงับสิทธิ์การจองชั่วคราวเป็นเวลา 24-48 ชั่วโมง
                </p>
              </div>

              {profile.lastQueueDropAt && (
                <div className="text-muted small">
                  <i className="bi bi-clock-history me-2"></i>
                  หลุดคิวครั้งล่าสุดเมื่อ: {new Date(profile.lastQueueDropAt).toLocaleString('th-TH')}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
