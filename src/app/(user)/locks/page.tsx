'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, InputGroup, Spinner, Placeholder } from 'react-bootstrap';
import Link from 'next/link';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LinkAny = Link as any;

interface Lock {
  _id: string;
  lockNumber: string;
  zone: { _id: string; name: string; description?: string };
  size: { width: number; length: number; unit: string };
  pricing: { daily: number; weekly?: number; monthly?: number };
  status: 'available' | 'booked' | 'rented' | 'maintenance';
  images: string[];
}

interface Zone {
  _id: string;
  name: string;
}

export default function LockBrowsingPage() {
  const [locks, setLocks] = useState<Lock[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedZone, setSelectedZone] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [statusFilter, setStatusFilter] = useState('');

  // Bookmarks
  const [bookmarkedLockIds, setBookmarkedLockIds] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const fetchBookmarks = async () => {
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        setBookmarkedLockIds(data);
      }
    } catch (error) {
      console.error('Failed to fetch bookmarks', error);
    }
  };

  const toggleBookmark = async (e: React.MouseEvent, lockId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
    const isBookmarked = bookmarkedLockIds.includes(lockId);
    let newBookmarks = [];
    if (isBookmarked) {
      newBookmarks = bookmarkedLockIds.filter(id => id !== lockId);
    } else {
      newBookmarks = [...bookmarkedLockIds, lockId];
    }
    setBookmarkedLockIds(newBookmarks);

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockId })
      });
      
      if (!res.ok) {
        // Revert if failed
         setBookmarkedLockIds(bookmarkedLockIds);
      }
    } catch (error) {
      console.error('Error toggling bookmark', error);
      setBookmarkedLockIds(bookmarkedLockIds);
    }
  };

  const fetchZones = async () => {
    try {
      const res = await fetch('/api/admin/zones'); // Reusing admin API for zones as it's just a list
      if (res.ok) {
        const data = await res.json();
        setZones(data);
      }
    } catch (error) {
      console.error('Failed to fetch zones', error);
    }
  };

  const fetchLocks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedZone) params.append('zone', selectedZone);
      if (priceRange.min) params.append('minPrice', priceRange.min);
      if (priceRange.max) params.append('maxPrice', priceRange.max);
      if (statusFilter) params.append('status', statusFilter);
      
      const res = await fetch(`/api/locks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLocks(data);
      }
    } catch (error) {
      console.error('Failed to fetch locks', error);
    } finally {
      setLoading(false);
    }
  }, [selectedZone, priceRange, statusFilter]);

  useEffect(() => {
    fetchZones();
    fetchLocks();
    fetchBookmarks();
  }, [fetchLocks]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return <Badge bg="success">ว่าง</Badge>;
      case 'booked': return <Badge bg="warning" text="dark">จองแล้ว</Badge>;
      case 'rented': return <Badge bg="danger">เช่าแล้ว</Badge>;
      case 'maintenance': return <Badge bg="secondary">ปิดปรับปรุง</Badge>;
      default: return <Badge bg="light" text="dark">{status}</Badge>;
    }
  };

  const clearFilters = () => {
    setSelectedZone('');
    setPriceRange({ min: '', max: '' });
    setStatusFilter('');
    setShowFavoritesOnly(false);
  };
  
  const displayedLocks = showFavoritesOnly 
    ? locks.filter(l => bookmarkedLockIds.includes(l._id)) 
    : locks;

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">จองล็อกตลาด</h2>
        <p className="text-muted">เลือกทำเลที่ต้องการและจองพื้นที่ขายของออนไลน์ได้ทันที</p>
      </div>

      <Row>
        {/* Filters Sidebar */}
        <Col lg={3} className="mb-4">
          <Card className="border-0 shadow-sm sticky-top" style={{ top: '100px', zIndex: 10 }}>
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">ตัวกรอง</h5>
                <Button variant="link" size="sm" className="text-decoration-none p-0" onClick={clearFilters}>
                  ล้างทั้งหมด
                </Button>
              </div>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-uppercase text-muted">โซน</Form.Label>
                <Form.Select 
                  value={selectedZone} 
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="bg-light border-0 py-2"
                >
                  <option value="">ทุกโซน</option>
                  {zones.map(z => <option key={z._id} value={z._id}>{z.name}</option>)}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-uppercase text-muted">ช่วงราคา (รายวัน)</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control 
                    placeholder="ต่ำสุด" 
                    type="number" 
                    className="bg-light border-0 py-2 sm"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  />
                  <Form.Control 
                    placeholder="สูงสุด" 
                    type="number" 
                    className="bg-light border-0 py-2 sm"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-uppercase text-muted">สถานะ</Form.Label>
                <Form.Select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-light border-0 py-2"
                >
                  <option value="">ทั้งหมด</option>
                  <option value="available">พร้อมให้จอง</option>
                  <option value="booked">จองแล้ว</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Check 
                  type="switch"
                  id="favorites-switch"
                  label="แสดงเฉพาะที่ติดตาม"
                  checked={showFavoritesOnly}
                  onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                  className="small fw-bold text-muted text-uppercase"
                />
              </Form.Group>

              <Button variant="primary" className="w-100 py-2 fw-bold" onClick={fetchLocks}>
                <i className="bi bi-funnel me-2"></i> กรองผลการค้นหา
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Lock Grid */}
        <Col lg={9}>
          {loading ? (
            <Row xs={1} md={2} xl={3} className="g-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Col key={i}>
                  <Card className="border-0 shadow-sm h-100 overflow-hidden">
                    <div className="placeholder-glow">
                      <div className="placeholder w-100" style={{ height: '200px' }}></div>
                    </div>
                    <Card.Body>
                      <Placeholder as={Card.Title} animation="glow">
                        <Placeholder xs={6} />
                      </Placeholder>
                      <Placeholder as={Card.Text} animation="glow">
                        <Placeholder xs={7} /> <Placeholder xs={4} />
                      </Placeholder>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : displayedLocks.length === 0 ? (
            <div className="text-center py-5 bg-white rounded shadow-sm">
              <i className="bi bi-search display-1 text-light mb-3 d-block"></i>
              <h3>ไม่พบข้อมูลล็อก</h3>
              <p className="text-muted">ลองปรับเปลี่ยนตัวกรองใหม่ดูอีกครั้ง</p>
              <Button variant="outline-primary" onClick={clearFilters}>ล้างตัวกรองทั้งหมด</Button>
            </div>
          ) : (
            <Row xs={1} md={2} xl={3} className="g-4">
              {displayedLocks.map((lock) => (
                <Col key={lock._id}>
                  <Card className="border-0 shadow-sm h-100 overflow-hidden hover-lift card-hover transition-300 position-relative">
                    <button
                      className="btn btn-light rounded-circle shadow-sm position-absolute top-0 start-0 m-3 p-0 d-flex align-items-center justify-content-center"
                      style={{ width: '40px', height: '40px', zIndex: 10, border: 'none' }}
                      onClick={(e) => toggleBookmark(e, lock._id)}
                      title={bookmarkedLockIds.includes(lock._id) ? "ยกเลิกการติดตาม" : "ติดตาม"}
                    >
                      <i className={`bi ${bookmarkedLockIds.includes(lock._id) ? 'bi-heart-fill text-danger' : 'bi-heart text-secondary'} fs-5`}></i>
                    </button>
                    <LinkAny href={`/locks/${lock._id}`} className="text-decoration-none text-dark">
                      <div className="position-relative">
                        {lock.images?.[0] ? (
                          <Card.Img 
                            variant="top" 
                            src={lock.images[0]} 
                            style={{ height: '200px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div 
                            className="bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center"
                            style={{ height: '200px' }}
                          >
                            <i className="bi bi-image text-muted fs-1"></i>
                          </div>
                        )}
                        <div className="position-absolute top-0 end-0 m-3">
                          {getStatusBadge(lock.status)}
                        </div>
                        <div className="position-absolute bottom-0 start-0 m-3">
                          <Badge bg="dark" className="bg-opacity-75 backdrop-blur px-3 py-2">
                            <i className="bi bi-geo-alt me-1"></i> {lock.zone?.name}
                          </Badge>
                        </div>
                      </div>
                      <Card.Body className="p-4 pb-0">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <Card.Title className="fw-bold h4 mb-0">{lock.lockNumber}</Card.Title>
                        <div className="text-end">
                          <div className="text-muted small fw-normal" style={{ fontSize: '0.75rem', marginBottom: '-2px' }}>เริ่มต้น</div>
                          <div className="text-primary fw-bold fs-5">
                            ฿{lock.pricing.daily.toLocaleString()} <span className="text-muted small fw-normal">/วัน</span>
                          </div>
                        </div>
                        </div>
                        <p className="text-muted small mb-0">
                          <i className="bi bi-aspect-ratio me-1"></i> {lock.size.width} x {lock.size.length} เมตร
                        </p>
                      </Card.Body>
                    </LinkAny>
                    <Card.Body className="p-4 pt-0">
                      <hr className="my-3 opacity-10" />
                      <div className="d-grid">
                          <Button 
                            as={LinkAny}
                            href={`/locks/${lock._id}`}
                            variant={lock.status === 'available' ? 'primary' : 'outline-secondary'}
                            className="fw-bold py-2 rounded-3"
                            disabled={lock.status !== 'available'}
                          >
                            {lock.status === 'available' ? 'จองทันที' : 'จองแล้ว'}
                          </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>
      
      <style jsx global>{`
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 1rem 3rem rgba(0,0,0,0.1) !important;
        }
        .transition-300 {
          transition: all 0.3s ease;
        }
        .backdrop-blur {
          backdrop-filter: blur(5px);
        }
      `}</style>
    </Container>
  );
}
