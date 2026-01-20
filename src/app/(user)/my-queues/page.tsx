
'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { showAlert, showConfirm } from '@/lib/swal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LinkAny = Link as any;

interface QueueItem {
  _id: string;
  lock: {
    _id: string;
    lockNumber: string;
    zone: { name: string };
    pricing: { daily: number };
    images: string[];
    status: string;
  };
  userPosition: number;
  createdAt: string;
}

export default function MyQueuesPage() {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchQueues = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/queue?my=true');
      if (res.ok) {
        const data = await res.json();
        setQueues(data);
      }
    } catch (error) {
      console.error('Failed to fetch queues', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveQueue = async (lockId: string, lockNumber: string) => {
    const { isConfirmed } = await showConfirm(
      'ยืนยันการออกจากคิว',
      `คุณต้องการออกจากคิวของล็อก ${lockNumber} ใช่หรือไม่?`,
      'ยืนยัน',
      'ยกเลิก'
    );

    if (!isConfirmed) return;

    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockId, action: 'leave' })
      });

      if (res.ok) {
        showAlert('สำเร็จ', 'ออกจากคิวเรียบร้อยแล้ว', 'success');
        setQueues(prev => prev.filter(q => q.lock._id !== lockId));
      } else {
        const err = await res.json();
        showAlert('ผิดพลาด', err.error || 'ไม่สามารถดำเนินการได้', 'error');
      }
    } catch (e) {
      console.error(e);
      showAlert('ผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  };

  useEffect(() => {
    if (session) {
      fetchQueues();
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">
          <i className="bi bi-people-fill text-primary me-2"></i>
          รายการจองคิว
        </h2>
        <p className="text-muted mb-0">ติดตามสถานะลำดับคิวของล็อกที่คุณต้องการจอง</p>
      </div>

      {queues.length === 0 ? (
        <div className="text-center py-5 bg-white rounded shadow-sm border">
          <i className="bi bi-person-dash display-1 text-secondary mb-3 d-block opacity-25"></i>
          <h3>ไม่มีรายการจองคิว</h3>
          <p className="text-muted">คุณยังไม่ได้เข้าคิวรอจองล็อกใดๆ ในขณะนี้</p>
          <LinkAny href="/locks" className="btn btn-primary fw-bold mt-2">
            ไปเลือกดูทำเลที่สนใจ
          </LinkAny>
        </div>
      ) : (
        <Row className="g-4">
          {queues.map((q) => (
            <Col key={q._id} lg={6}>
              <Card className="border-0 shadow-sm overflow-hidden h-100">
                <Card.Body className="p-0">
                  <Row className="g-0">
                    <Col xs={4} sm={3} className="bg-light position-relative">
                       {q.lock.images?.[0] ? (
                          <div className="h-100 w-100 position-relative">
                            <Image 
                              src={q.lock.images[0]} 
                              alt={q.lock.lockNumber} 
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                       ) : (
                          <div className="d-flex align-items-center justify-content-center h-100 bg-secondary bg-opacity-10">
                             <i className="bi bi-image text-muted fs-3"></i>
                          </div>
                       )}
                    </Col>
                    <Col xs={8} sm={9} className="p-3 p-sm-4 text-start">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                           <h4 className="fw-bold mb-1">ล็อก {q.lock.lockNumber}</h4>
                           <div className="text-primary small fw-medium">
                              <i className="bi bi-geo-alt me-1"></i> โซน: {q.lock.zone.name}
                           </div>
                        </div>
                        <Badge bg="primary" className="p-3 rounded-pill">
                           คิวที่ {q.userPosition}
                        </Badge>
                      </div>
                      
                      <div className="text-muted small mb-3">
                         เข้าคิวเมื่อ: {new Date(q.createdAt).toLocaleString('th-TH')}
                      </div>

                      <div className="d-flex gap-2">
                        <Button 
                          as={LinkAny} 
                          href={`/locks/${q.lock._id}`} 
                          variant="outline-primary" 
                          size="sm"
                          className="flex-grow-1"
                        >
                           ดูรายละเอียด
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleLeaveQueue(q.lock._id, q.lock.lockNumber)}
                        >
                           ออกจากคิว
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}
