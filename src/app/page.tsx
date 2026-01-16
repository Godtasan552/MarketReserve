'use client';

import Link from 'next/link';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';

export default function Home() {
  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Hero Section */}
      <div className="bg-primary text-white py-5 mb-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <h1 className="display-4 fw-bold mb-3">Market Lock Rental</h1>
              <p className="lead mb-4">
                ระบบจองล็อคตลาดออนไลน์ สะดวก รวดเร็ว ทันสมัย
                จองง่าย จ่ายสะดวก ตรวจสอบสถานะได้ทันที
              </p>
              <div className="d-flex gap-3">
                <Link href="/locks" passHref>
                  <Button variant="light" size="lg" className="px-4">
                    ดูพื้นที่ว่าง
                  </Button>
                </Link>
                <Link href="/login" passHref>
                  <Button variant="outline-light" size="lg" className="px-4">
                    ผู้ค้าเข้าสู่ระบบ
                  </Button>
                </Link>
              </div>
            </Col>
            <Col lg={6} className="d-none d-lg-block text-center">
              {/* Image placeholder or illustration could go here */}
              <div className="p-5 bg-white bg-opacity-10 rounded-3">
                <i className="bi bi-shop display-1 text-white-50"></i>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="mb-5">
        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm text-center p-4">
              <div className="display-4 text-primary mb-3">
                <i className="bi bi-calendar-check"></i>
              </div>
              <Card.Title as="h3">จองง่าย 24 ชม.</Card.Title>
              <Card.Text className="text-muted">
                เลือกดูผังตลาดและจองล็อคที่ต้องการได้ทุกที่ทุกเวลา ผ่านระบบออนไลน์
              </Card.Text>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm text-center p-4">
              <div className="display-4 text-success mb-3">
                <i className="bi bi-qr-code-scan"></i>
              </div>
              <Card.Title as="h3">ชำระเงินสะดวก</Card.Title>
              <Card.Text className="text-muted">
                อัปโหลดสลิปโอนเงิน ระบบตรวจสอบอัตโนมัติด้วย OCR รวดเร็ว แม่นยำ
              </Card.Text>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm text-center p-4">
              <div className="display-4 text-info mb-3">
                <i className="bi bi-bell"></i>
              </div>
              <Card.Title as="h3">แจ้งเตือนทันใจ</Card.Title>
              <Card.Text className="text-muted">
                รับการแจ้งเตือนเมื่อถึงกำหนดชำระ หรือเมื่อล็อคที่คุณสนใจว่างลง
              </Card.Text>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
