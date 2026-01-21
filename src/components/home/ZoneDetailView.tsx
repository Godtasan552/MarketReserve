'use client';

import { useState, useEffect, useMemo } from 'react';
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

// Fixed coordinates for locks to match background images
const LOCK_POSITION_MAP: Record<string, { x: number; y: number }> = {
  // Zone A: Premium Retail (8 locks)
  'A-001': { x: 20, y: 59 },
  'A-002': { x: 38, y: 40 },
  'A-003': { x: 55, y: 25 },
  'A-004': { x: 67, y: 16 },
  'A-005': { x: 40, y: 73 },
  'A-006': { x: 55, y: 56 },
  'A-007': { x: 68, y: 44 },
  'A-008': { x: 80, y: 34 },

  // Zone B: Food Court (up to 12 stalls)
  'B-001': { x: 12, y: 44 }, 'B-002': { x: 20, y: 40 }, 'B-003': { x: 27, y: 35 }, 'B-004': { x: 34, y: 30 },
  'B-005': { x: 22, y: 56 }, 'B-006': { x: 30, y: 50 }, 'B-007': { x: 37, y: 45 }, 'B-008': { x: 44, y: 40 },
  'B-009': { x: 33, y: 65 }, 'B-010': { x: 42, y: 60 }, 'B-011': { x: 50, y: 55 }, 'B-012': { x: 58, y: 50 },

  // Zone C: Fashion (up to 12 booths)
  'C-001': { x: 55, y: 21 }, 'C-002': { x: 41, y: 30 }, 'C-003': { x: 67, y: 33 }, 'C-004': { x: 52, y: 43 },
  'C-005': { x: 38, y: 51 }, 'C-006': { x: 22, y: 61 }, 'C-007': { x: 64, y: 53 }, 'C-008': { x: 50, y: 63 },
  'C-009': { x: 35, y: 72 }, 'C-010': { x: 73, y: 66 }, 'C-011': { x: 86, y: 40 }, 'C-012': { x: 72, y: 30 },

  // Zone D: Fresh Produce (up to 16 stalls)
  'D-001': { x: 20, y: 65 }, 'D-002': { x: 14, y: 23 }, 'D-003': { x: 44, y: 20 }, 'D-004': { x: 64, y: 18 },
  'D-005': { x: 25, y: 45 }, 'D-006': { x: 40, y: 46 }, 'D-007': { x: 66, y: 44 }, 'D-008': { x: 80, y: 43 },
  'D-009': { x: 35, y: 70 }, 'D-010': { x: 41, y: 72 }, 'D-011': { x: 60, y: 67 }, 'D-012': { x: 74, y: 70 },
};

const getLockPosition = (lockNumber: string, index: number, total: number) => {
  // Return fixed position if exists
  if (LOCK_POSITION_MAP[lockNumber]) {
    return LOCK_POSITION_MAP[lockNumber];
  }

  // Fallback to stable grid if not mapped
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;
  
  return {
    x: 10 + (col * (80 / Math.max(1, cols))),
    y: 20 + (row * (60 / Math.max(1, Math.ceil(total / cols))))
  };
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

  const lockPositions = useMemo(() => 
    locks.map((lock, index) => getLockPosition(lock.lockNumber, index, locks.length)), 
    [locks]
  );

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
                  background: `url(/zone_${zonePrefix.toLowerCase()}.png) center/cover no-repeat, linear-gradient(135deg, ${zoneColor}15 0%, ${zoneColor}05 100%)`,
                  position: 'relative'
                }}
              >
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
