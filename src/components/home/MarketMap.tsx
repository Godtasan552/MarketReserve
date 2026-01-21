'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ZoneDetailView from './ZoneDetailView';

interface ZoneStats {
  _id: string;
  name: string;
  description: string;
  totalLocks: number;
  availableLocks: number;
  prefix: string;
  color: string;
  position: { x: number; y: number };
}

const ZONE_COLORS: Record<string, string> = {
  'A': '#F4C430', // Gold
  'B': '#FF6B35', // Orange-Red
  'C': '#9B59B6', // Purple
  'D': '#27AE60'  // Green
};

const ZONE_POSITIONS: Record<string, { x: number; y: number }> = {
  'A': { x: 60, y: 70 },  // Bottom right (Premium entrance area)
  'B': { x: 55, y: 50 },  // Center-right (Food court)
  'C': { x: 25, y: 45 },  // Left side (Fashion boutiques)
  'D': { x: 60, y: 25 }   // Top right (Produce market)
};

export default function MarketMap() {
  const [zones, setZones] = useState<ZoneStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<ZoneStats | null>(null);

  useEffect(() => {
    fetchZoneStats();
  }, []);

  const fetchZoneStats = async () => {
    try {
      const response = await fetch('/api/zones/stats');
      if (response.ok) {
        const data = await response.json();
        
        // Enrich with UI data
        const enrichedZones = data.map((zone: Omit<ZoneStats, 'prefix' | 'color' | 'position'>) => {
          const prefix = zone.name.match(/โซน ([A-D])/)?.[1] || 'A';
          return {
            ...zone,
            prefix,
            color: ZONE_COLORS[prefix] || '#6C757D',
            position: ZONE_POSITIONS[prefix] || { x: 50, y: 50 }
          };
        });
        
        setZones(enrichedZones);
      }
    } catch (error) {
      console.error('Error fetching zone stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">กำลังโหลดแผนที่ตลาด...</p>
      </div>
    );
  }

  return (
    <Container className="my-5">
      <div className="text-center mb-5">
        <h2 className="display-5 fw-bold mb-3">
          <i className="bi bi-map me-3"></i>
          แผนที่ตลาด
        </h2>
        <p className="lead text-muted">
          เลือกโซนที่คุณสนใจ เพื่อดูล็อคว่างและจองได้ทันที
        </p>
      </div>

      <AnimatePresence mode="wait">
        {selectedZone ? (
          <ZoneDetailView
            key={selectedZone._id}
            zoneId={selectedZone._id}
            zoneName={selectedZone.name}
            zoneColor={selectedZone.color}
            zonePrefix={selectedZone.prefix}
            onBack={() => setSelectedZone(null)}
          />
        ) : (
          <motion.div
            key="map-overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >

      <Row className="g-4">
        {/* Interactive Map */}
        <Col lg={7}>
          <Card className="border-0 shadow-lg overflow-hidden" style={{ minHeight: '500px' }}>
            <Card.Body className="p-0 position-relative bg-white">
              {/* Map Container with Real Infographic */}
              <div 
                className="position-relative w-100" 
                style={{ 
                  height: '500px',
                  backgroundImage: 'url(/market-map-3d.png)',
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#ffffff'
                }}
              >
                {/* Zone Markers - Positioned over the actual zones in the map */}
                {zones.map((zone, index) => {
                  const isHovered = hoveredZone === zone._id;
                  const availabilityPercent = zone.totalLocks > 0 
                    ? (zone.availableLocks / zone.totalLocks) * 100 
                    : 0;

                  return (
                    <motion.div
                      key={zone._id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1, type: 'spring' }}
                      className="position-absolute"
                      style={{
                        left: `${zone.position.x}%`,
                        top: `${zone.position.y}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: isHovered ? 10 : 5
                      }}
                      onMouseEnter={() => setHoveredZone(zone._id)}
                      onMouseLeave={() => setHoveredZone(null)}
                    >
                      <motion.div
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-center"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedZone(zone)}
                      >
                          {/* Availability Badge - Floating above zone */}
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: isHovered ? 1 : 0.9, y: 0 }}
                            className="px-3 py-2 rounded-pill shadow-lg mb-2"
                            style={{
                              backgroundColor: 'white',
                              border: `3px solid ${zone.color}`,
                              fontSize: '14px',
                              fontWeight: 700,
                              color: zone.color,
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="rounded-circle"
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  backgroundColor: availabilityPercent > 50 ? '#27AE60' : availabilityPercent > 0 ? '#FFD700' : '#DC3545'
                                }}
                              />
                              <span>{zone.availableLocks}/{zone.totalLocks} ว่าง</span>
                            </div>
                          </motion.div>

                          {/* Pulsing indicator for available zones */}
                          {availabilityPercent > 0 && (
                            <motion.div
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 0.8, 0.5]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              className="position-absolute top-50 start-50 translate-middle rounded-circle"
                              style={{
                                width: '60px',
                                height: '60px',
                                backgroundColor: zone.color,
                                opacity: 0.3,
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
                  className="position-absolute bottom-0 start-0 m-3 p-3 rounded shadow-lg"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    fontSize: '12px',
                    zIndex: 1,
                    border: '2px solid #e9ecef'
                  }}
                >
                  <div className="fw-bold mb-2 text-dark">
                    <i className="bi bi-info-circle me-2"></i>
                    สถานะความพร้อม:
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    <div className="d-flex align-items-center gap-1">
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27AE60' }}></div>
                      <small>ว่างมาก (&gt;50%)</small>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FFD700' }}></div>
                      <small>ว่างบางส่วน</small>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#DC3545' }}></div>
                      <small>เต็ม</small>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-top">
                    <small className="text-muted">
                      <i className="bi bi-cursor me-1"></i>
                      คลิกที่โซนเพื่อดูล็อคทั้งหมด
                    </small>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Zone Details List */}
        <Col lg={5}>
          <div className="d-flex flex-column gap-3">
            {zones.map((zone, index) => {
              const availabilityPercent = zone.totalLocks > 0 
                ? (zone.availableLocks / zone.totalLocks) * 100 
                : 0;

              return (
                <motion.div
                  key={zone._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link 
                    href={`/locks?zone=${zone._id}`}
                    className="text-decoration-none"
                  >
                    <Card 
                      className="border-0 shadow-sm h-100 hover-lift"
                      style={{
                        borderLeft: `4px solid ${zone.color}`,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={() => setHoveredZone(zone._id)}
                      onMouseLeave={() => setHoveredZone(null)}
                    >
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                              style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: zone.color,
                                fontSize: '18px'
                              }}
                            >
                              {zone.prefix}
                            </div>
                            <div>
                              <h6 className="mb-0 fw-bold">{zone.name}</h6>
                              <small className="text-muted">
                                {zone.totalLocks} ล็อคทั้งหมด
                              </small>
                            </div>
                          </div>
                          <Badge 
                            bg={availabilityPercent > 50 ? 'success' : availabilityPercent > 0 ? 'warning' : 'secondary'}
                            className="px-3 py-2"
                          >
                            {zone.availableLocks} ว่าง
                          </Badge>
                        </div>
                        
                        <p className="text-muted small mb-3">
                          {zone.description}
                        </p>

                        {/* Progress Bar */}
                        <div className="mb-2">
                          <div className="d-flex justify-content-between mb-1">
                            <small className="text-muted">ความพร้อม</small>
                            <small className="fw-bold" style={{ color: zone.color }}>
                              {availabilityPercent.toFixed(0)}%
                            </small>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div
                              className="progress-bar"
                              role="progressbar"
                              style={{
                                width: `${availabilityPercent}%`,
                                backgroundColor: zone.color
                              }}
                              aria-valuenow={availabilityPercent}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            />
                          </div>
                        </div>

                        <div className="text-end">
                          <small className="text-primary fw-bold">
                            ดูล็อคทั้งหมด <i className="bi bi-arrow-right"></i>
                          </small>
                        </div>
                      </Card.Body>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </Col>
      </Row>

      <style jsx global>{`
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
        }
      `}</style>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
}
