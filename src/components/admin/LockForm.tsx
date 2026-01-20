'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Button, Row, Col, Alert, Spinner, Modal, InputGroup } from 'react-bootstrap';
import { lockSchema, LockFormData } from '@/lib/validations/lock';
import ZoneForm from './ZoneForm';

interface Zone {
  _id: string;
  name: string;
  description?: string;
}

interface LockFormProps {
  initialData?: Omit<Partial<LockFormData>, 'zone'> & { _id?: string, zone?: string | { _id: string } }; 
  onSubmit: (data: LockFormData) => Promise<void>;
  onCancel: () => void;
}

export default function LockForm({ initialData, onSubmit, onCancel }: LockFormProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [showZoneModal, setShowZoneModal] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<LockFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(lockSchema) as any,
    defaultValues: initialData ? {
      ...initialData,
      zone: typeof initialData.zone === 'object' && initialData.zone !== null ? (initialData.zone as { _id: string })._id : initialData.zone,
      images: initialData.images || []
    } : {
      lockNumber: '',
      zone: '',
      size: { width: 2, length: 2, unit: 'm' },
      pricing: { daily: 100 },
      status: 'available',
      isActive: true,
      images: [],
    },
  });

  // Keep track of images in form state
  useEffect(() => {
    setValue('images', images);
  }, [images, setValue]);

  // Fetch zones for dropdown
  const fetchZones = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/zones');
      if (res.ok) {
        const data = await res.json();
        setZones(data);
      }
    } catch (err) {
      console.error('Failed to fetch zones', err);
      setError('Failed to load zones');
    } finally {
      setLoadingZones(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  // Pre-fill form if initialData changes (e.g. edit mode)
  useEffect(() => {
    if (initialData) {
        const zoneId = typeof initialData.zone === 'object' && initialData.zone !== null 
          ? (initialData.zone as { _id: string })._id 
          : initialData.zone;
          
        reset({
          ...initialData,
          zone: zoneId,
          images: initialData.images || []
        }); 
        setImages(initialData.images || []);
    }
  }, [initialData, reset]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'locks');

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('ไม่สามารถอัปโหลดรูปภาพได้');

      const data = await res.json();
      setImages((prev) => [...prev, data.url]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดในการอัปโหลด');
      }
    } finally {
      setUploading(false);
      // Clear input
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onFormSubmit = async (data: LockFormData) => {
    setError(null);
    try {
      await onSubmit({ ...data, images });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    }
  };

  const handleQuickAddZone = async (data: { name: string; description?: string }) => {
    try {
      const res = await fetch('/api/admin/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create zone');

      // Refresh zones list
      await fetchZones();
      
      // Auto-select the new zone
      setValue('zone', result._id);
      setShowZoneModal(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('เกิดข้อผิดพลาดในการสร้างโซน');
    }
  };

  return (
    <>
    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
    <Form onSubmit={handleSubmit(onFormSubmit as any)}>
      {error && <Alert variant="danger" className="text-center">{error}</Alert>}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">รหัสล็อก (Lock Number)</Form.Label>
            <Form.Control
              type="text"
              placeholder="ตัวอย่าง: A-01"
              {...register('lockNumber')}
              isInvalid={!!errors.lockNumber}
              disabled={!!initialData} 
            />
            <Form.Control.Feedback type="invalid">{errors.lockNumber?.message}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">โซน (Zone)</Form.Label>
            <InputGroup hasValidation>
              <Form.Select
                {...register('zone')}
                isInvalid={!!errors.zone}
                disabled={loadingZones}
              >
                <option value="">-- เลือกโซน --</option>
                {zones.map((zone) => (
                  <option key={zone._id} value={zone._id}>
                    {zone.name} {zone.description ? `(${zone.description})` : ''}
                  </option>
                ))}
              </Form.Select>
              <Button 
                variant="outline-primary" 
                onClick={() => setShowZoneModal(true)} 
                title="เพิ่มโซนใหม่แบบรวดเร็ว"
                disabled={loadingZones}
              >
                <i className="bi bi-plus-lg"></i>
              </Button>
              <Form.Control.Feedback type="invalid">{errors.zone?.message}</Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">คำอธิบาย/รายละเอียด (Description)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="ระบุรายละเอียดเพิ่มเติมเกี่ยวกับล็อกนี้..."
              {...register('description')}
              isInvalid={!!errors.description}
            />
            <Form.Control.Feedback type="invalid">{errors.description?.message}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <div className="mb-4">
        <h6 className="fw-bold text-primary mb-3"><i className="bi bi-aspect-ratio me-2"></i>ขนาดพื้นที่</h6>
        <Row>
          <Col md={4}>
             <Form.Group className="mb-2">
                <Form.Label>ความกว้าง</Form.Label>
                <Form.Control 
                    type="number" step="0.01" 
                    {...register('size.width', { valueAsNumber: true })} 
                    isInvalid={!!errors.size?.width}
                />
             </Form.Group>
          </Col>
          <Col md={4}>
             <Form.Group className="mb-2">
                <Form.Label>ความยาว</Form.Label>
                <Form.Control 
                    type="number" step="0.01" 
                    {...register('size.length', { valueAsNumber: true })} 
                    isInvalid={!!errors.size?.length}
                />
             </Form.Group>
          </Col>
           <Col md={4}>
             <Form.Group className="mb-2">
                <Form.Label>หน่วยวัด</Form.Label>
                <Form.Select
                    {...register('size.unit')}
                >
                    <option value="m">เมตร (m)</option>
                    <option value="sqm">ตารางเมตร (sqm)</option>
                </Form.Select>
             </Form.Group>
          </Col>
        </Row>
      </div>

      <div className="mb-4">
         <h6 className="fw-bold text-success mb-3"><i className="bi bi-cash-stack me-2"></i>ราคาเช่า (บาท)</h6>
         <Row>
            <Col md={4}>
                <Form.Group className="mb-2">
                    <Form.Label>รายวัน</Form.Label>
                    <Form.Control
                        type="number" step="1"
                        {...register('pricing.daily', { valueAsNumber: true })}
                        isInvalid={!!errors.pricing?.daily}
                    />
                </Form.Group>
            </Col>
            <Col md={4}>
                <Form.Group className="mb-2">
                    <Form.Label>รายสัปดาห์ (ถ้ามี)</Form.Label>
                    <Form.Control
                        type="number" step="1"
                        {...register('pricing.weekly', { valueAsNumber: true })}
                        isInvalid={!!errors.pricing?.weekly}
                    />
                </Form.Group>
            </Col>
            <Col md={4}>
                <Form.Group className="mb-2">
                    <Form.Label>รายเดือน (ถ้ามี)</Form.Label>
                    <Form.Control
                        type="number" step="1"
                        {...register('pricing.monthly', { valueAsNumber: true })}
                        isInvalid={!!errors.pricing?.monthly}
                    />
                </Form.Group>
            </Col>
         </Row>
      </div>
      
      <Row className="mb-4">
          <Col md={12}>
            <Form.Group>
                <Form.Label className="fw-bold"><i className="bi bi-images me-2"></i>รูปภาพประกอบ (Images)</Form.Label>
                <div className="d-flex flex-wrap gap-3 mb-3">
                  {images.map((url: string, index: number) => (
                    <div key={index} className="position-relative">
                      <img 
                        src={url} 
                        alt={`Lock ${index}`} 
                        className="rounded border shadow-sm" 
                        style={{ width: '120px', height: '120px', objectFit: 'cover' }} 
                      />
                      <Button 
                        variant="danger" 
                        size="sm" 
                        className="position-absolute top-0 end-0 rounded-circle"
                        style={{ margin: '-10px', width: '25px', height: '25px', padding: 0 }}
                        onClick={() => removeImage(index)}
                      >
                        <i className="bi bi-x"></i>
                      </Button>
                    </div>
                  ))}
                  <div 
                    className="border rounded bg-light d-flex align-items-center justify-content-center cursor-pointer hover-shadow"
                    style={{ width: '120px', height: '120px', borderStyle: 'dashed', cursor: 'pointer' }}
                    onClick={() => document.getElementById('lock-image-upload')?.click()}
                  >
                    {uploading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <div className="text-center text-muted">
                        <i className="bi bi-plus-circle display-6"></i>
                        <div className="small mt-1">เพิ่มรูป</div>
                      </div>
                    )}
                  </div>
                </div>
                <input 
                  type="file" 
                  id="lock-image-upload" 
                  className="d-none" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
            </Form.Group>
          </Col>
      </Row>

      <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
                <Form.Label className="fw-bold">สถานะเริ่มต้น</Form.Label>
                <Form.Select {...register('status')}>
                    <option value="available">ว่าง (พร้อมให้จอง)</option>
                    <option value="booked">จองแล้ว</option>
                    <option value="rented">เช่าแล้ว</option>
                    <option value="maintenance">ปิดปรับปรุง</option>
                </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="h-100 d-flex align-items-end mb-1">
              <Form.Check 
                type="switch"
                id="active-switch"
                label="เปิดใช้งาน (Active)"
                className="fw-bold"
                {...register('isActive')}
              />
            </Form.Group>
          </Col>
      </Row>

      <div className="d-flex justify-content-end gap-2 mt-5 border-top pt-4">
        <Button variant="light" onClick={onCancel} disabled={isSubmitting} className="px-4">
          ยกเลิก
        </Button>
        <Button variant="primary" type="submit" disabled={isSubmitting} className="px-5 fw-bold">
          {isSubmitting ? 'กำลังบันทึก...' : (initialData ? 'อัปเดตข้อมูล' : 'เพิ่มข้อมูลล็อก')}
        </Button>
      </div>
    </Form>

    <Modal show={showZoneModal} onHide={() => setShowZoneModal(false)} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title className="h5 fw-bold">เพิ่มโซนใหม่แบบรวดเร็ว</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ZoneForm 
            onSubmit={handleQuickAddZone} 
            onCancel={() => setShowZoneModal(false)} 
        />
      </Modal.Body>
    </Modal>
    </>
  );
}
