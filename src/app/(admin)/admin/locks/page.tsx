'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Modal, Spinner, Form, InputGroup, Card } from 'react-bootstrap';
import LockList, { Lock as LockListType } from '@/components/admin/LockList';
import LockForm from '@/components/admin/LockForm';
import LockDetail from '@/components/admin/LockDetail';
import { LockFormData } from '@/lib/validations/lock';
import { showAlert, showConfirm } from '@/lib/swal';

interface Lock extends Omit<LockFormData, 'zone'> {
  _id: string;
  zone: string | { _id: string; name: string };
}


export default function LockManagementPage() {
  const [locks, setLocks] = useState<LockListType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingLock, setEditingLock] = useState<Lock | null>(null);
  const [viewingLock, setViewingLock] = useState<LockListType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [zoneFilter, setZoneFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [zones, setZones] = useState<{ _id: string; name: string }[]>([]);

  const fetchLocks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (zoneFilter) params.append('zone', zoneFilter);
      if (statusFilter) params.append('status', statusFilter);
      
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/admin/locks${qs}`);
      if (res.ok) {
        const data = await res.json();
        setLocks(data);
      }
    } catch (error) {
      console.error('Failed to fetch locks', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, zoneFilter, statusFilter]);

  useEffect(() => {
    fetchLocks();
  }, [fetchLocks]);

  useEffect(() => {
    // Fetch zones for filter
    const fetchZones = async () => {
      try {
        const res = await fetch('/api/zones');
        console.log('Zones API response status:', res.status);
        if (res.ok) {
          const data = await res.json();
          console.log('Zones data received:', data);
          setZones(data);
        } else {
          console.error('Failed to fetch zones, status:', res.status);
        }
      } catch (error) {
        console.error('Failed to fetch zones', error);
      }
    };
    fetchZones();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      fetchLocks();
  };

  const handleCreate = () => {
    setEditingLock(null);
    setShowModal(true);
  };

  const handleEdit = (lock: LockListType) => {
    setEditingLock(lock as unknown as Lock);
    setShowModal(true);
  };

  const handleView = (lock: LockListType) => {
    setViewingLock(lock);
    setShowViewModal(true);
  };

  const handleDelete = async (id: string) => {
    const result = await showConfirm('ยืนยันการลบ', 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลล็อกนี้?', 'ลบข้อมูล', 'ยกเลิก');
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/locks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLocks();
      } else {
        showAlert('ล้มเหลว', 'ไม่สามารถลบข้อมูลล็อกได้ในขณะนี้', 'error');
      }
    } catch (error) {
      console.error('Error deleting lock', error);
      showAlert('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่อีกครั้ง', 'error');
    }
  };

  const handleSubmit = async (data: LockFormData) => {
    try {
      const url = editingLock 
        ? `/api/admin/locks/${editingLock._id}` 
        : '/api/admin/locks';
        
      const method = editingLock ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'การดำเนินการล้มเหลว');
      }

      setShowModal(false);
      fetchLocks();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Submit error:', error.message);
        throw error;
      }
      throw new Error('เกิดข้อผิดพลาดที่ไม่คาดคิด');
    }
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">จัดการพื้นที่เช่า (ล็อกตลาด)</h2>
        <Button variant="primary" onClick={handleCreate} className="fw-bold">
          <i className="bi bi-plus-lg me-2"></i>
          เพิ่มล็อกใหม่
        </Button>
      </div>

      <Card className="border shadow-sm mb-4 border-start-0 border-top-0 border-bottom-0 border-end-0" style={{ borderLeft: '4px solid var(--bs-primary)', boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.08)' }}>
        <Card.Body className="p-3 border rounded shadow-sm">
          <Row className="g-3">
            <Col md={5}>
                <Form onSubmit={handleSearch}>
                    <InputGroup size="sm" className="border rounded overflow-hidden">
                        <InputGroup.Text className="bg-light border-0 border-end"><i className="bi bi-search text-muted"></i></InputGroup.Text>
                        <Form.Control
                            placeholder="ค้นหาด้วยรหัสล็อก..."
                            value={searchTerm}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^a-zA-Z0-9\s-]/g, '');
                                setSearchTerm(val);
                            }}
                            className="bg-light border-0 shadow-none fw-medium"
                        />
                        <Button variant="primary" type="submit" className="border-0">
                            ค้นหา
                        </Button>
                    </InputGroup>
                </Form>
            </Col>
            <Col md={3}>
              <Form.Select 
                size="sm"
                value={zoneFilter} 
                onChange={(e) => setZoneFilter(e.target.value)}
                className="bg-light border shadow-none"
              >
                <option value="">ทุกโซน</option>
                {zones.map(zone => (
                  <option key={zone._id} value={zone._id}>{zone.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select 
                size="sm"
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-light border shadow-none"
              >
                <option value="">ทุกสถานะ</option>
                <option value="available">ว่าง</option>
                <option value="rented">ให้เช่าแล้ว</option>
                <option value="maintenance">ปิดปรับปรุง</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button 
                variant="outline-secondary" 
                size="sm"
                className="w-100"
                onClick={() => {
                  setSearchTerm('');
                  setZoneFilter('');
                  setStatusFilter('');
                }}
              >
                <i className="bi bi-x-circle me-1"></i>
                ล้างตัวกรอง
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <LockList 
          locks={locks} 
          onView={handleView}
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{editingLock ? 'แก้ไขข้อมูลล็อก' : 'เพิ่มล็อกใหม่'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <LockForm 
            initialData={editingLock || undefined} 
            onSubmit={handleSubmit} 
            onCancel={() => setShowModal(false)} 
          />
        </Modal.Body>
      </Modal>

      {/* View Detail Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">รายละเอียดข้อมูลล็อก</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          {viewingLock && <LockDetail lock={viewingLock} />}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>ปิดหน้าต่าง</Button>
          <Button variant="primary" onClick={() => {
            setShowViewModal(false);
            handleEdit(viewingLock!);
          }}>แก้ไขข้อมูล</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
