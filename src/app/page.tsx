'use client';

import Link from 'next/link';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import MarketMap from '@/components/home/MarketMap';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Hero Section with Gradient */}
      <div 
        className="text-white py-5 mb-5 position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          minHeight: '450px'
        }}
      >
        {/* Animated Background Pattern */}
        <div 
          className="position-absolute w-100 h-100 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            top: 0,
            left: 0
          }}
        />

        <Container className="position-relative" style={{ zIndex: 1 }}>
          <Row className="align-items-center">
            <Col lg={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="mb-3">
                  <span className="badge bg-white bg-opacity-25 text-white px-3 py-2 rounded-pill">
                    <i className="bi bi-stars me-2"></i>
                    ระบบจองล็อคตลาดออนไลน์
                  </span>
                </div>
                <h1 className="display-3 fw-bold mb-3">
                  MarketHub
                </h1>
                <h2 className="h4 mb-4 opacity-90">
                  จองล็อคตลาด สะดวก รวดเร็ว ทันสมัย
                </h2>
                <p className="lead mb-4 opacity-85">
                  เลือกดูแผนที่ตลาด จองพื้นที่ที่คุณต้องการ 
                  จ่ายเงินง่าย ตรวจสอบสถานะได้ทันที
                </p>
                <div className="d-flex gap-3 flex-wrap">
                  <Link href="#market-map" passHref>
                    <Button 
                      variant="light" 
                      size="lg" 
                      className="px-4 shadow-sm fw-bold"
                      style={{ borderRadius: '50px' }}
                    >
                      <i className="bi bi-map me-2"></i>
                      ดูแผนที่ตลาด
                    </Button>
                  </Link>
                  <Link href="/locks" passHref>
                    <Button 
                      variant="outline-light" 
                      size="lg" 
                      className="px-4 fw-bold"
                      style={{ borderRadius: '50px' }}
                    >
                      <i className="bi bi-search me-2"></i>
                      ค้นหาล็อค
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </Col>
            <Col lg={6} className="d-none d-lg-block">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center"
              >
                <div 
                  className="p-5 bg-white bg-opacity-10 rounded-4 backdrop-blur"
                  style={{ 
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <i className="bi bi-shop display-1 text-white"></i>
                  <div className="mt-3 d-flex justify-content-center gap-3">
                    <div className="text-center">
                      <div className="h2 fw-bold mb-0">4</div>
                      <small className="opacity-75">โซน</small>
                    </div>
                    <div className="text-center">
                      <div className="h2 fw-bold mb-0">25+</div>
                      <small className="opacity-75">ล็อค</small>
                    </div>
                    <div className="text-center">
                      <div className="h2 fw-bold mb-0">24/7</div>
                      <small className="opacity-75">จองได้</small>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Col>
          </Row>
        </Container>

        {/* Wave Divider */}
        <div className="position-absolute bottom-0 w-100" style={{ height: '100px' }}>
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ height: '100%', width: '100%' }}>
            <path 
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
              fill="#ffffff"
            />
          </svg>
        </div>
      </div>

      {/* Market Map Section */}
      <div id="market-map" className="mb-5">
        <MarketMap />
      </div>

      {/* Features Section */}
      <Container className="mb-5">
        <div className="text-center mb-5">
          <h2 className="display-6 fw-bold mb-3">
            ทำไมต้องเลือก MarketHub?
          </h2>
          <p className="lead text-muted">
            ระบบจองล็อคที่ออกแบบมาเพื่อความสะดวกของคุณ
          </p>
        </div>

        <Row className="g-4">
          <Col md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card 
                className="h-100 border-0 shadow-sm text-center p-4 hover-lift"
                style={{ borderTop: '4px solid #667eea' }}
              >
                <div 
                  className="display-4 mb-3 mx-auto rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}
                >
                  <i className="bi bi-calendar-check"></i>
                </div>
                <Card.Title as="h3" className="h5 fw-bold">จองง่าย 24 ชม.</Card.Title>
                <Card.Text className="text-muted">
                  เลือกดูแผนที่ตลาดและจองล็อคที่ต้องการได้ทุกที่ทุกเวลา 
                  ผ่านระบบออนไลน์ที่ใช้งานง่าย
                </Card.Text>
              </Card>
            </motion.div>
          </Col>

          <Col md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card 
                className="h-100 border-0 shadow-sm text-center p-4 hover-lift"
                style={{ borderTop: '4px solid #27AE60' }}
              >
                <div 
                  className="display-4 mb-3 mx-auto rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #27AE60 0%, #229954 100%)',
                    color: 'white'
                  }}
                >
                  <i className="bi bi-qr-code-scan"></i>
                </div>
                <Card.Title as="h3" className="h5 fw-bold">ชำระเงินสะดวก</Card.Title>
                <Card.Text className="text-muted">
                  อัปโหลดสลิปโอนเงิน ระบบตรวจสอบอัตโนมัติด้วย OCR 
                  รวดเร็ว แม่นยำ ปลอดภัย
                </Card.Text>
              </Card>
            </motion.div>
          </Col>

          <Col md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Card 
                className="h-100 border-0 shadow-sm text-center p-4 hover-lift"
                style={{ borderTop: '4px solid #FF6B35' }}
              >
                <div 
                  className="display-4 mb-3 mx-auto rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                    color: 'white'
                  }}
                >
                  <i className="bi bi-bell"></i>
                </div>
                <Card.Title as="h3" className="h5 fw-bold">แจ้งเตือนทันใจ</Card.Title>
                <Card.Text className="text-muted">
                  รับการแจ้งเตือนเมื่อถึงกำหนดชำระ หรือเมื่อล็อคที่คุณสนใจว่างลง
                  ไม่พลาดทุกโอกาส
                </Card.Text>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>

      {/* CTA Section */}
      <div 
        className="py-5 mb-5 text-white text-center"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="display-6 fw-bold mb-3">
              พร้อมเริ่มต้นแล้วหรือยัง?
            </h2>
            <p className="lead mb-4 opacity-90">
              เลือกล็อคที่ใช่สำหรับธุรกิจของคุณวันนี้
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Link href="/locks" passHref>
                <Button 
                  variant="light" 
                  size="lg" 
                  className="px-5 shadow fw-bold"
                  style={{ borderRadius: '50px' }}
                >
                  <i className="bi bi-search me-2"></i>
                  เริ่มค้นหาล็อค
                </Button>
              </Link>
              <Link href="/login" passHref>
                <Button 
                  variant="outline-light" 
                  size="lg" 
                  className="px-5 fw-bold"
                  style={{ borderRadius: '50px' }}
                >
                  <i className="bi bi-person-circle me-2"></i>
                  เข้าสู่ระบบ
                </Button>
              </Link>
            </div>
          </motion.div>
        </Container>
      </div>

      <style jsx global>{`
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
        }
        .backdrop-blur {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  );
}

