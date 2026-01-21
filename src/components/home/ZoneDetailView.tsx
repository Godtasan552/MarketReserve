'use client';

import { useState, useEffect } from 'react';
import { Card, Badge, Button, Spinner, Row, Col } from 'react-bootstrap';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Lock {
  _id: string;
  lockNumber: string;
  status: 'available' | 'booked' | 'rented' | 'maintenance' | 'reserved';
  size: {
    width: number;
    length: number;
    unit: string;
  };
  pricing: {
    daily: number;
    weekly?: number;
    monthly?: number;
  };
  description?: string;
  features: string[];
}

interface ZoneDetailViewProps {
  zoneId: string;
  zoneName: string;
  zoneColor: string;
  zonePrefix: string;
  onBack: () => void;
}

// Generate grid positions for locks (simulating market layout)
const generateLockPositions = (lockCount: number) => {
  const positions: { x: number; y: number }[] = [];
  const cols = Math.ceil(Math.sqrt(lockCount));
  const rows = Math.ceil(lockCount / cols);
  
  for (let i = 0; i < lockCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    // Add some randomness for more natural look
    const randomX = (Math.random() - 0.5) * 5;
    const randomY = (Math.random() - 0.5) * 5;
    
    positions.push({
      x: 15 + (col * (70 / cols)) + randomX,
      y: 15 + (row * (70 / rows)) + randomY
    });
  }
  
  return positions;
};

export default function ZoneDetailView({ 
  zoneId, 
  zoneName, 
  zoneColor, 
  zonePrefix,
  onBack 
}: ZoneDetailViewProps) {
  const [locks, setLocks] = useState<Lock[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredLock, setHoveredLock] = useState<string | null>(null);
  const [selectedLock, setSelectedLock] = useState<Lock | null>(null);

  useEffect(() => {
    fetchZoneLocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId]);

  const fetchZoneLocks = async () => {
    try {
      const response = await fetch(`/api/locks?zone=${zoneId}`);
      if (response.ok) {
        const data = await response.json();
        // API returns array directly, not wrapped in { locks: [...] }
        setLocks(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching locks:', error);
    } finally {
      setLoading(false);
    }
  };

  const lockPositions = generateLockPositions(locks.length);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#27AE60';
      case 'booked': return '#F39C12';
      case 'rented': return '#E74C3C';
      case 'maintenance': return '#95A5A6';
      case 'reserved': return '#3498DB';
      default: return '#95A5A6';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'ว่าง';
      case 'booked': return 'จองแล้ว';
      case 'rented': return 'เช่าแล้ว';
      case 'maintenance': return 'ปรับปรุง';
      case 'reserved': return 'สำรอง';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: zoneColor }} />
        <p className="mt-3 text-muted">กำลังโหลดข้อมูลล็อค...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button
            variant="outline-secondary"
            onClick={onBack}
            className="d-flex align-items-center gap-2"
          >
            <i className="bi bi-arrow-left"></i>
            กลับ
          </Button>
          <div>
            <h3 className="mb-1 fw-bold" style={{ color: zoneColor }}>
              <i className="bi bi-geo-alt-fill me-2"></i>
              {zoneName}
            </h3>
            <p className="text-muted mb-0">
              {locks.length} ล็อคทั้งหมด • {locks.filter(l => l.status === 'available').length} ว่าง
            </p>
          </div>
        </div>
        
        <Link href={`/locks?zone=${zoneId}`}>
          <Button variant="primary">
            <i className="bi bi-list me-2"></i>
            ดูแบบรายการ
          </Button>
        </Link>
      </div>

      <Row className="g-4">
        {/* Map View */}
        <Col lg={8}>
          <Card className="border-0 shadow-lg" style={{ minHeight: '600px' }}>
            <Card.Body className="p-0 position-relative" style={{ backgroundColor: '#f8f9fa' }}>
              {/* Zone Map Background */}
              <div
                className="position-relative w-100"
                style={{
                  height: '600px',
                  background: zonePrefix === 'A' 
                    ? `url(/zone-a-detail.png) center/cover no-repeat, linear-gradient(135deg, ${zoneColor}15 0%, ${zoneColor}05 100%)`
                    : `linear-gradient(135deg, ${zoneColor}20 0%, ${zoneColor}08 100%)`,
                  backgroundImage: zonePrefix !== 'A' 
                    ? `linear-gradient(135deg, ${zoneColor}20 0%, ${zoneColor}08 100%), repeating-linear-gradient(0deg, ${zoneColor}10 0px, ${zoneColor}10 1px, transparent 1px, transparent 50px), repeating-linear-gradient(90deg, ${zoneColor}10 0px, ${zoneColor}10 1px, transparent 1px, transparent 50px)`
                    : undefined,
                  position: 'relative'
                }}
              >
                {/* Zone Illustration Overlay for zones without images */}
                {zonePrefix !== 'A' && (
                  <div
                    className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{
                      opacity: 0.1,
                      pointerEvents: 'none'
                    }}
                  >
                    <i 
                      className={`bi ${
                        zonePrefix === 'B' ? 'bi-cup-hot' :
                        zonePrefix === 'C' ? 'bi-bag-heart' :
                        'bi-basket'
                      }`}
                      style={{
                        fontSize: '200px',
                        color: zoneColor
                      }}
                    />
                  </div>
                )}
                {/* Zone Label */}
                <div
                  className="position-absolute top-0 start-0 m-4 px-4 py-3 rounded-3 shadow-sm"
                  style={{
                    backgroundColor: 'white',
                    border: `3px solid ${zoneColor}`
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                      style={{
                        width: '50px',
                        height: '50px',
                        backgroundColor: zoneColor,
                        fontSize: '24px'
                      }}
                    >
                      {zonePrefix}
                    </div>
                    <div>
                      <div className="fw-bold" style={{ color: zoneColor }}>
                        โซน {zonePrefix}
                      </div>
                      <small className="text-muted">แผนผังล็อค</small>
                    </div>
                  </div>
                </div>

                {/* Lock Markers */}
                {locks.map((lock, index) => {
                  const position = lockPositions[index];
                  const isHovered = hoveredLock === lock._id;
                  const isSelected = selectedLock?._id === lock._id;
                  const isAvailable = lock.status === 'available';

                  return (
                    <motion.div
                      key={lock._id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.02, type: 'spring' }}
                      className="position-absolute"
                      style={{
                        left: `${position.x}%`,
                        top: `${position.y}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: isHovered || isSelected ? 10 : 5
                      }}
                      onMouseEnter={() => setHoveredLock(lock._id)}
                      onMouseLeave={() => setHoveredLock(null)}
                      onClick={() => setSelectedLock(lock)}
                    >
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="position-relative"
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Lock Pin */}
                        <div
                          className="rounded-circle shadow-lg d-flex align-items-center justify-content-center"
                          style={{
                            width: isHovered || isSelected ? '50px' : '40px',
                            height: isHovered || isSelected ? '50px' : '40px',
                            backgroundColor: getStatusColor(lock.status),
                            border: `3px solid white`,
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <i
                            className={`bi ${isAvailable ? 'bi-shop' : 'bi-lock-fill'} text-white`}
                            style={{ fontSize: isHovered || isSelected ? '20px' : '16px' }}
                          ></i>
                        </div>

                        {/* Lock Number Label */}
                        <AnimatePresence>
                          {(isHovered || isSelected) && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="position-absolute top-100 start-50 translate-middle-x mt-2 px-2 py-1 rounded shadow-sm text-nowrap"
                              style={{
                                backgroundColor: 'white',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: `2px solid ${getStatusColor(lock.status)}`
                              }}
                            >
                              {lock.lockNumber}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Pulsing effect for available locks */}
                        {isAvailable && (
                          <motion.div
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.5, 0, 0.5]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="position-absolute top-50 start-50 translate-middle rounded-circle"
                            style={{
                              width: '50px',
                              height: '50px',
                              backgroundColor: getStatusColor(lock.status),
                              pointerEvents: 'none'
                            }}
                          />
                        )}
                      </motion.div>
                    </motion.div>
                  );
                })}

                {/* Legend */}
                <div
                  className="position-absolute bottom-0 start-0 m-4 p-3 rounded-3 shadow-lg"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '2px solid #e9ecef'
                  }}
                >
                  <div className="fw-bold mb-2 small">
                    <i className="bi bi-info-circle me-2"></i>
                    สถานะล็อค:
                  </div>
                  <div className="d-flex flex-column gap-1">
                    {['available', 'booked', 'rented', 'maintenance'].map(status => (
                      <div key={status} className="d-flex align-items-center gap-2">
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: getStatusColor(status)
                          }}
                        />
                        <small>{getStatusText(status)}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Lock Details Sidebar */}
        <Col lg={4}>
          <AnimatePresence mode="wait">
            {selectedLock ? (
              <motion.div
                key={selectedLock._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="border-0 shadow-lg sticky-top" style={{ top: '20px' }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="fw-bold mb-0">{selectedLock.lockNumber}</h5>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setSelectedLock(null)}
                        className="text-muted p-0"
                      >
                        <i className="bi bi-x-lg"></i>
                      </Button>
                    </div>

                    <Badge
                      bg={selectedLock.status === 'available' ? 'success' : 'secondary'}
                      className="mb-3"
                    >
                      {getStatusText(selectedLock.status)}
                    </Badge>

                    <div className="mb-3">
                      <small className="text-muted d-block mb-1">ขนาด</small>
                      <div className="fw-bold">
                        {selectedLock.size.width} × {selectedLock.size.length} {selectedLock.size.unit}
                      </div>
                    </div>

                    <div className="mb-3">
                      <small className="text-muted d-block mb-1">ราคา</small>
                      <div className="d-flex flex-column gap-1">
                        <div>
                          <strong>รายวัน:</strong> ฿{selectedLock.pricing.daily.toLocaleString()}
                        </div>
                        {selectedLock.pricing.weekly && (
                          <div>
                            <strong>รายสัปดาห์:</strong> ฿{selectedLock.pricing.weekly.toLocaleString()}
                          </div>
                        )}
                        {selectedLock.pricing.monthly && (
                          <div>
                            <strong>รายเดือน:</strong> ฿{selectedLock.pricing.monthly.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedLock.features.length > 0 && (
                      <div className="mb-3">
                        <small className="text-muted d-block mb-2">สิ่งอำนวยความสะดวก</small>
                        <div className="d-flex flex-wrap gap-1">
                          {selectedLock.features.map((feature, idx) => (
                            <Badge key={idx} bg="light" text="dark" className="fw-normal">
                              <i className="bi bi-check-circle me-1"></i>
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedLock.description && (
                      <div className="mb-3">
                        <small className="text-muted d-block mb-1">รายละเอียด</small>
                        <p className="small mb-0">{selectedLock.description}</p>
                      </div>
                    )}

                    <div className="d-grid gap-2 mt-4">
                      <Link href={`/locks/${selectedLock._id}`}>
                        <Button
                          variant="primary"
                          size="lg"
                          disabled={selectedLock.status !== 'available'}
                          className="w-100"
                        >
                          {selectedLock.status === 'available' ? (
                            <>
                              <i className="bi bi-calendar-check me-2"></i>
                              จองล็อคนี้
                            </>
                          ) : (
                            <>
                              <i className="bi bi-lock me-2"></i>
                              ไม่ว่าง
                            </>
                          )}
                        </Button>
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="border-0 shadow-sm bg-light">
                  <Card.Body className="text-center py-5">
                    <i className="bi bi-cursor display-1 text-muted mb-3"></i>
                    <h6 className="text-muted">คลิกที่ล็อคเพื่อดูรายละเอียด</h6>
                    <p className="small text-muted mb-0">
                      เลือกล็อคจากแผนที่ด้านซ้าย
                    </p>
                  </Card.Body>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </Col>
      </Row>
    </motion.div>
  );
}
