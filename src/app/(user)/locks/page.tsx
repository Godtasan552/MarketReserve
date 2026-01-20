'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, InputGroup, Placeholder } from 'react-bootstrap';
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
  const [selectedDate, setSelectedDate] = useState('');

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
        return;
      }

      const data = await res.json();
      if (typeof data?.bookmarked === 'boolean') {
        setBookmarkedLockIds(prev => {
          const already = prev.includes(lockId);
          if (data.bookmarked && !already) return [...prev, lockId];
          if (!data.bookmarked && already) return prev.filter(id => id !== lockId);
          return prev;
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark', error);
      setBookmarkedLockIds(bookmarkedLockIds);
    }
  };

  const fetchZones = async () => {
    try {
      const res = await fetch('/api/admin/zones');
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
      if (selectedDate) params.append('date', selectedDate);
      
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
  }, [selectedZone, priceRange, statusFilter, selectedDate]);

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
    setSelectedDate('');
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

      {/* Top Filter Bar */}
      <Card className="border shadow-sm mb-4 border-start-0 border-top-0 border-bottom-0 border-end-0" style={{ borderLeft: '4px solid var(--bs-primary) !important', boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.08)' }}>
        <Card.Body className="p-3 border rounded shadow-sm">
          <Row className="g-2 align-items-center">
            {/* Zone Filter */}
            <Col xs={12} md={4} lg={2}>
              <InputGroup size="sm" className="border rounded overflow-hidden shadow-none">
                <InputGroup.Text className="bg-light border-0 border-end"><i className="bi bi-geo-alt text-muted"></i></InputGroup.Text>
                <Form.Select 
                  value={selectedZone} 
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="bg-light border-0 shadow-none fw-medium"
                >
                  <option value="">ทุกโซน</option>
                  {zones.map(z => <option key={z._id} value={z._id}>{z.name}</option>)}
                </Form.Select>
              </InputGroup>
            </Col>

            {/* Date Filter */}
            <Col xs={12} md={4} lg={2}>
              <InputGroup size="sm" className="border rounded overflow-hidden shadow-none">
                <InputGroup.Text className="bg-light border-0 border-end"><i className="bi bi-calendar-event text-muted"></i></InputGroup.Text>
                <Form.Control 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-light border-0 shadow-none fw-medium"
                />
              </InputGroup>
            </Col>

            {/* Price Range */}
            <Col xs={12} md={4} lg={3}>
              <InputGroup size="sm" className="border rounded overflow-hidden">
                <InputGroup.Text className="bg-light border-0 border-end">฿</InputGroup.Text>
                <Form.Control 
                  placeholder="ต่ำสุด" 
                  type="number" 
                  min="0"
                  className="bg-light border-0 shadow-none text-center"
                  value={priceRange.min}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setPriceRange(prev => ({ ...prev, min: val }))
                  }}
                />
                <InputGroup.Text className="bg-light border-0 px-1 border-start border-end">-</InputGroup.Text>
                <Form.Control 
                  placeholder="สูงสุด" 
                  type="number" 
                  min="0"
                  className="bg-light border-0 shadow-none text-center"
                  value={priceRange.max}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setPriceRange(prev => ({ ...prev, max: val }))
                  }}
                />
              </InputGroup>
            </Col>

            {/* Favorites Toggle */}
            <Col xs={6} md={6} lg={2}>
              <Button 
                variant={showFavoritesOnly ? "danger" : "outline-secondary"}
                size="sm"
                className={`w-100 fw-medium d-flex align-items-center justify-content-center gap-2 border-secondary-subtle ${showFavoritesOnly ? '' : 'text-muted bg-light'}`}
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <i className={`bi ${showFavoritesOnly ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
                <span className="d-none d-sm-inline">ที่บันทึกไว้</span>
              </Button>
            </Col>

            {/* Action Buttons */}
            <Col xs={6} md={6} lg={3} className="d-flex gap-2 justify-content-end">
              <Button variant="primary" size="sm" className="flex-grow-1 flex-lg-grow-0 fw-medium px-3" onClick={fetchLocks}>
                <i className="bi bi-search me-1"></i> ค้นหา
              </Button>
              <Button variant="outline-secondary" size="sm" onClick={clearFilters} title="ล้างค่าทั้งหมด">
                  <i className="bi bi-arrow-counterclockwise"></i>
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Lock Grid */}
      <Row>
        <Col xs={12}>
          {loading ? (
            <Row xs={2} md={2} lg={3} xl={4} className="g-2 g-md-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <Col key={i}>
                  <Card className="border-0 shadow-sm h-100 overflow-hidden">
                    <div className="placeholder-glow">
                      <div className="placeholder w-100" style={{ height: '140px' }}></div>
                    </div>
                    <Card.Body className="p-2 p-md-3">
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
            <Row xs={2} md={2} lg={3} xl={4} className="g-2 g-md-4">
              {displayedLocks.map((lock) => (
                <Col key={lock._id}>
                  <Card className="border-0 shadow-sm h-100 overflow-hidden hover-lift card-hover transition-300 position-relative">
                    <button
                      className="btn btn-light rounded-circle shadow-sm position-absolute top-0 start-0 m-2 m-md-3 p-0 d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px', zIndex: 10, border: 'none' }}
                      onClick={(e) => toggleBookmark(e, lock._id)}
                      title={bookmarkedLockIds.includes(lock._id) ? "ยกเลิกการบันทึก" : "บันทึกข้อมูล"}
                    >
                      <i className={`bi ${bookmarkedLockIds.includes(lock._id) ? 'bi-bookmark-fill text-primary' : 'bi-bookmark text-secondary'} fs-6 fs-md-5`}></i>
                    </button>
                    <LinkAny href={`/locks/${lock._id}`} className="text-decoration-none text-dark">
                      <div className="position-relative">
                        {lock.images?.[0] ? (
                          <div className="lock-card-img-container">
                             <Card.Img 
                              variant="top" 
                              src={lock.images[0]} 
                              className="h-100 w-100"
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <div 
                            className="bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center lock-card-img-placeholder"
                          >
                            <i className="bi bi-image text-muted fs-1 opacity-25"></i>
                          </div>
                        )}
                        <div className="position-absolute top-0 end-0 m-2 m-md-3">
                          {getStatusBadge(lock.status)}
                        </div>
                        <div className="position-absolute bottom-0 start-0 m-2 m-md-3">
                          <Badge bg="dark" className="bg-opacity-75 backdrop-blur px-2 px-md-3 py-1 py-md-2 small fw-medium">
                            <i className="bi bi-geo-alt me-1"></i> {lock.zone?.name}
                          </Badge>
                        </div>
                      </div>
                      <Card.Body className="p-2 p-md-4 pb-0">
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-1 mb-md-2">
                          <Card.Title className="fw-bold fs-5 fs-md-4 mb-0">{lock.lockNumber}</Card.Title>
                        <div className="text-md-end mt-1 mt-md-0">
                          <div className="text-muted small fw-normal d-none d-md-block" style={{ fontSize: '0.75rem', marginBottom: '-2px' }}>เริ่มต้น</div>
                          <div className="text-primary fw-bold fs-6 fs-md-5">
                            ฿{lock.pricing.daily.toLocaleString()} <span className="text-muted small fw-normal">/วัน</span>
                          </div>
                        </div>
                        </div>
                        <p className="text-muted small mb-0 d-none d-md-block">
                          <i className="bi bi-aspect-ratio me-1"></i> {lock.size.width} x {lock.size.length} เมตร
                        </p>
                      </Card.Body>
                    </LinkAny>
                    <Card.Body className="p-2 p-md-4 pt-0">
                      <hr className="my-2 my-md-3 opacity-10" />
                      <div className="d-grid">
                          <Button 
                            as={LinkAny}
                            href={`/locks/${lock._id}`}
                            variant={lock.status === 'available' ? 'primary' : 'outline-secondary'}
                            className="fw-bold py-1 py-md-2 rounded-3 small"
                            disabled={lock.status !== 'available' && !selectedDate} // Simple rule: if we picked a date, button works
                          >
                            {lock.status === 'available' ? 'จองทันที' : 'จองสมาชิก'}
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
        .lock-card-img-container, .lock-card-img-placeholder {
          height: 140px;
        }
        @media (min-width: 768px) {
          .lock-card-img-container, .lock-card-img-placeholder {
            height: 200px;
          }
        }
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 1rem 3rem rgba(0,0,0,0.1) !important;
        }
        .transition-300 {
          transition: all 0.3s ease;
        }
        .backdrop-blur {
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
      `}</style>
    </Container>
  );
}
