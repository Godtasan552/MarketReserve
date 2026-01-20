'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner, Form, ProgressBar } from 'react-bootstrap';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Tesseract from 'tesseract.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LinkAny = Link as any;
import CountdownTimer from '@/components/common/CountdownTimer';
import { showAlert } from '@/lib/swal';

interface Booking {
  _id: string;
  lock: { lockNumber: string; zone: { name: string } };
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'pending_payment' | 'pending_verification' | 'active' | 'expired' | 'cancelled';
  rentalType: string;
  paymentDeadline: string;
  payment?: {
    _id: string;
    slipImage: string;
    createdAt: string;
  };
}

export default function BookingDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Payment Upload State
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  
  // OCR Client States
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<{
    amount?: number;
    referenceNumber?: string;
    confidence?: number;
    date?: string;
    time?: string;
    transferType?: string;
    rawText?: string;
  } | null>(null);

  const fetchBooking = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/bookings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBooking(data);
      } else {
        setError('ไม่พบข้อมูลการจอง');
      }
    } catch (e: unknown) {
      console.error(e);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setOcrResult(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreview(result);
      // Run OCR on client
      runOCR(result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const runOCR = async (imageSrc: string) => {
    setOcrLoading(true);
    setUploadProgress(0);
    
    let worker;
    try {
        worker = await Tesseract.createWorker('tha+eng', 1, {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    setUploadProgress(Math.floor(m.progress * 100));
                }
            },
            // Use a stable CDN for languages to avoid fetch issues
            cacheMethod: 'readOnly',
        });
        
        const { data: { text, confidence } } = await worker.recognize(imageSrc);
        
        // --- Shared Regex Logic (Client Side) ---
        const cleanText = text
            .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s\.\,\:\-\/\(\)\฿]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const amountPatterns = [
            /(?:จำนวนเงิน|ยอดเงิน|โอนเงิน|โอน|pay|amount|total|sum|เงิน).{0,25}?(\d{1,3}(?:,\d{3})*\.\d{2})/i,
            /(\d{1,3}(?:,\d{3})*\.\d{2})\s*(?:บาท|baht|฿|thb)/i,
        ];

        let detectedAmount: number | undefined;
        const allMatches: number[] = [];

        // 1. Try specific patterns
        for (const pattern of amountPatterns) {
            const regex = new RegExp(pattern instanceof RegExp ? pattern.source : pattern, 'gi');
            const matches = cleanText.matchAll(regex);
            for (const m of matches) {
                const val = parseFloat(m[1].replace(/,/g, ''));
                if (!isNaN(val)) allMatches.push(val);
            }
        }

        // 2. Fallback to any currency-like number
        const genericRegex = /(\d{1,3}(?:[,\s]?\d{3})*[.,]\s?\d{2})/g;
        const genericMatches = cleanText.matchAll(genericRegex);
        for (const m of genericMatches) {
            const val = parseFloat(m[0].replace(/,/g, '').replace(/\s/g, '').replace(',', '.'));
            if (!isNaN(val)) allMatches.push(val);
        }

        // 3. Selection Logic
        if (allMatches.length > 0) {
            const exactMatch = allMatches.find(a => booking && Math.abs(a - booking.totalAmount) < 0.01);
            if (exactMatch !== undefined) {
                detectedAmount = exactMatch;
            } else {
                const validAmounts = allMatches.filter(a => a > 0.01);
                if (validAmounts.length > 0) {
                    detectedAmount = Math.max(...validAmounts);
                } else {
                    detectedAmount = 0;
                }
            }
        }

        const refPatterns = [
            /(?:เลขที่อ้างอิง|หมายเลขอ้างอิง|อ้างอิง|Reference|Ref\s*No\.?|Ref\.?)[:\s]*([A-Z0-9]{10,})/i,
            /\b\d{18,}\b/
        ];
        
        let detectedRef: string | undefined;
        for (const pattern of refPatterns) {
            const match = text.match(pattern);
            if (match) {
                detectedRef = (match[1] || match[0]).trim();
                break;
            }
        }

        setOcrResult({
            amount: detectedAmount,
            referenceNumber: detectedRef,
            confidence: confidence,
            rawText: cleanText
        });

    } catch (err) {
        console.error('OCR Client Error:', err);
        // Special handling for Failed to fetch which often happens in Tesseract
        if (err instanceof Error && err.message.includes('fetch')) {
            console.warn('Tesseract failed to fetch language data. Check your connection.');
        }
    } finally {
        if (worker) {
            await worker.terminate();
        }
        setOcrLoading(false);
        setUploadProgress(0);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent re-triggering file input
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!uploading && !preview) {
        setDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    
    if (uploading || preview) return;

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
        processFile(droppedFile);
    } else if (droppedFile) {
        showAlert('ไฟล์ไม่ถูกต้อง', 'กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น', 'error');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleUploadPayment = async () => {
    if (!file || !id) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกไฟล์สลิปการโอนเงิน', 'warning');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bookingId', id);
      if (ocrResult) {
        formData.append('ocrData', JSON.stringify(ocrResult));
      }

      setUploadProgress(30);
      const res = await fetch('/api/payments', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(90);
      
      if (res.ok) {
        showAlert('สำเร็จ', 'อัปโหลดสลิปเรียบร้อยแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบ', 'success');
        fetchBooking();
      } else {
        const result = await res.json();
        showAlert('การอัปโหลดล้มเหลว', result.error || 'ไม่สามารถอัปโหลดไฟล์ได้ในขณะนี้', 'error');
      }
    } catch (e: unknown) {
      console.error(e);
      showAlert('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการสื่อสารกับเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setFile(null);
      setPreview(null);
      setOcrResult(null);
    }
  };

  const handleCancel = async () => {
    const { isConfirmed } = await (await import('@/lib/swal')).showConfirm(
        'ยืนยันการยกเลิก',
        'คุณต้องการยกเลิกการจองนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
        'ยืนยันการยกเลิก',
        'ไม่ ยกเลิก'
    );

    if (!isConfirmed || !id) return;

    setCancelling(true);
    try {
        const res = await fetch(`/api/bookings/${id}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            await showAlert('สำเร็จ', 'ยกเลิกการจองเรียบร้อยแล้ว', 'success');
            router.push('/my-bookings');
        } else {
            const result = await res.json();
            showAlert('ผิดพลาด', result.error || 'ไม่สามารถยกเลิกการจองได้', 'error');
        }
    } catch (e: unknown) {
        console.error(e);
        showAlert('ผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
    } finally {
        setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment': return <Badge bg="warning" text="dark" className="px-3 py-2">รอชำระเงิน</Badge>;
      case 'pending_verification': return <Badge bg="info" className="px-3 py-2">รอตรวจสอบสลิป</Badge>;
      case 'active': return <Badge bg="success" className="px-3 py-2">จองสำเร็จ (พร้อมใช้งาน)</Badge>;
      case 'expired': return <Badge bg="secondary" className="px-3 py-2">หมดอายุ</Badge>;
      case 'cancelled': return <Badge bg="danger" className="px-3 py-2">ยกเลิกแล้ว</Badge>;
      default: return <Badge bg="light" text="dark" className="px-3 py-2">{status}</Badge>;
    }
  };

  if (loading) return (
    <Container className="py-5 text-center">
      <Spinner animation="border" variant="primary" />
    </Container>
  );

  if (error || !booking) return (
    <Container className="py-5">
      <Alert variant="danger">{error || 'ไม่พบข้อมูล'}</Alert>
      <Button as={LinkAny} href="/my-bookings" variant="outline-primary">กลับไปหน้ารายการ</Button>
    </Container>
  );

  const isExpired = booking.status === 'pending_payment' && new Date(booking.paymentDeadline) < new Date();

  return (
    <Container className="py-4">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link href="/my-bookings" className="text-decoration-none">การจองของฉัน</Link>
          </li>
          <li className="breadcrumb-item active">รายละเอียด #{booking._id.slice(-6)}</li>
        </ol>
      </nav>

      <Row className="g-4">
        <Col lg={7}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-0">รายละเอียดการจอง</h3>
                {getStatusBadge(booking.status)}
              </div>

              <div className="bg-light p-4 rounded-3 mb-4">
                <Row className="g-3">
                  <Col sm={6}>
                    <div className="small text-muted mb-1">รหัสล็อก</div>
                    <div className="fw-bold h5">ล็อก {booking.lock?.lockNumber || 'ไม่ระบุ'}</div>
                  </Col>
                  <Col sm={6}>
                    <div className="small text-muted mb-1">โซน</div>
                    <div className="fw-bold h5 text-primary">{booking.lock?.zone?.name || 'ไม่ระบุโซน'}</div>
                  </Col>
                  <Col sm={6}>
                    <div className="small text-muted mb-1">ระยะเวลาเช่า</div>
                    <div className="fw-bold">
                        {new Date(booking.startDate).toLocaleDateString('th-TH')} - {new Date(booking.endDate).toLocaleDateString('th-TH')}
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="small text-muted mb-1">ประเภทการเช่า</div>
                    <div className="fw-bold text-capitalize">
                        {booking.rentalType === 'daily' ? 'รายวัน' : booking.rentalType === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
                    </div>
                  </Col>
                </Row>
              </div>

              <div className="d-flex justify-content-between align-items-center border-top pt-4">
                <span className="h5 fw-bold text-muted">ยอดที่ต้องชำระทั้งหมด</span>
                <span className="h3 fw-bold text-primary">฿{booking.totalAmount.toLocaleString()}</span>
              </div>

              {['pending_payment', 'pending_verification'].includes(booking.status) && (
                <div className="mt-4 pt-3 border-top text-end">
                    <Button 
                        variant="link" 
                        className="text-danger text-decoration-none small"
                        onClick={handleCancel}
                        disabled={cancelling || uploading}
                    >
                        {cancelling ? (
                            <><Spinner animation="border" size="sm" className="me-2" /> กำลังยกเลิก...</>
                        ) : (
                            <><i className="bi bi-x-circle me-1"></i> ยกเลิกการจองนี้</>
                        )}
                    </Button>
                </div>
              )}
            </Card.Body>
          </Card>

          {booking.status === 'pending_verification' && booking.payment && (
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                    <h5 className="fw-bold mb-3">สลิปที่อัปโหลดแล้ว</h5>
                    <div className="bg-light p-2 rounded border text-center position-relative" style={{ minHeight: '300px' }}>
                        <Image 
                          src={booking.payment.slipImage} 
                          alt="Uploaded Slip" 
                          className="rounded shadow-sm"
                          fill
                          style={{ objectFit: 'contain' }}
                        />
                    </div>
                    <div className="mt-3 text-center text-muted small">
                        อัปโหลดเมื่อ: {new Date(booking.payment.createdAt).toLocaleString('th-TH')}
                    </div>
                </Card.Body>
            </Card>
          )}
        </Col>

        <Col lg={5}>
          {booking.status === 'pending_payment' && !isExpired && (
            <Card className="border-0 shadow-sm mb-4 border-top border-primary border-4">
              <Card.Body className="p-4">
                <h4 className="fw-bold mb-3">ชำระเงิน</h4>
                <div className="alert alert-warning border-0 small mb-4 py-3 shadow-sm bg-warning bg-opacity-10 text-dark">
                  <div className="d-flex align-items-center">
                    <div className="bg-warning bg-opacity-25 rounded-circle p-2 me-3">
                      <i className="bi bi-clock-history fs-4 text-dark"></i>
                    </div>
                    <div>
                      <div className="fw-bold mb-1">กรุณาชำระเงินภายในเวลาที่กำหนด</div>
                      <div className="mb-2 text-muted small">หากชำระไม่ทันภายในเวลา คิวจะหลุดและสิทธิ์จะตกเป็นของคนถัดไป</div>
                      <CountdownTimer 
                        expiryDate={booking.paymentDeadline} 
                        onExpire={() => fetchBooking()}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold small text-muted text-uppercase mb-3">บัญชีธนาคารสำหรับโอนเงิน</h6>
                  <div className="p-3 border rounded-3 d-flex align-items-center bg-light">
                    <div className="bg-primary rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                        <i className="bi bi-bank text-white fs-4"></i>
                    </div>
                    <div>
                        <div className="fw-bold">ธนาคารกสิกรไทย (K-Bank)</div>
                        <div className="text-primary fw-bold fs-5">012-3-45678-9</div>
                        <div className="small text-muted">บจก. มาร์เก็ต ฮับ เทคโนโลยี</div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <Form.Group>
                    <Form.Label className="fw-bold">อัปโหลดหลักฐานการโอนเงิน (สลิป)</Form.Label>
                    <div 
                        className={`border-2 rounded-4 p-4 text-center transition-all ${
                            dragging ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 
                            preview ? 'border-primary bg-white' : 
                            'border-dashed cursor-pointer hover-bg-light'
                        }`}
                        onClick={() => !uploading && !preview && fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={{ 
                            borderStyle: preview ? 'solid' : 'dashed', 
                            cursor: preview ? 'default' : 'pointer',
                            minHeight: '200px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        {preview ? (
                            <div className="w-100">
                                <div className="mb-3" style={{ height: '300px', width: '100%', position: 'relative' }}>
                                    <Image 
                                      src={preview} 
                                      alt="Slip Preview" 
                                      fill 
                                      style={{ objectFit: 'contain' }}
                                      className="rounded border shadow-sm"
                                    />
                                </div>
                                <div className="d-flex gap-2 justify-content-center">
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm" 
                                      onClick={handleRemoveFile}
                                      disabled={uploading}
                                      className="px-3"
                                    >
                                        <i className="bi bi-trash me-1"></i> ลบออก
                                    </Button>
                                    <Button 
                                      variant="primary" 
                                      size="sm" 
                                      onClick={() => fileInputRef.current?.click()}
                                      disabled={uploading}
                                      className="px-3 shadow-sm"
                                    >
                                        <i className="bi bi-arrow-repeat me-1"></i> เปลี่ยนรูปภาพ
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-3">
                                <div className="mb-3">
                                    <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center shadow-sm" style={{ width: '80px', height: '80px' }}>
                                        <i className="bi bi-cloud-arrow-up text-primary" style={{ fontSize: '2.5rem' }}></i>
                                    </div>
                                </div>
                                <h5 className="fw-bold text-dark mb-1">ลากและวางสลิปได้ที่นี่</h5>
                                <p className="text-muted small mb-3">หรือกดปุ่มเพื่อเลือกไฟล์จากเครื่องของคุณ</p>
                                <Button 
                                    variant="primary" 
                                    className="px-4 py-2 rounded-pill fw-bold shadow-sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.click();
                                    }}
                                >
                                    เลือกไฟล์สลิป
                                </Button>
                                <div className="mt-3 small text-muted">
                                    <span className="badge bg-light text-dark border me-1">JPG</span>
                                    <span className="badge bg-light text-dark border me-1">PNG</span>
                                    <span className="badge bg-light text-dark border">สูงสุด 5MB</span>
                                </div>
                            </div>
                        )}
                        <input 
                            ref={fileInputRef}
                            id="slip-upload"
                            type="file" 
                            accept="image/*" 
                            className="d-none" 
                            onChange={handleFileChange}
                            disabled={uploading || ocrLoading}
                        />
                    </div>
                  </Form.Group>
                </div>

                {ocrLoading && (
                    <div className="alert alert-info py-3 mb-4 border-0 small text-center">
                        <Spinner animation="border" size="sm" className="me-2" />
                        กำลังอ่านข้อมูลจากสลิป...
                        <div className="mt-2">
                           <ProgressBar now={uploadProgress} style={{ height: '4px' }} />
                        </div>
                    </div>
                )}

                {ocrResult && !ocrLoading && (
                    <div className="alert alert-success py-3 mb-4 border-0 small">
                        <div className="d-flex align-items-center mb-2">
                            <i className="bi bi-shield-check me-2 fs-5"></i>
                            <strong>ระบบตรวจสอบพบข้อมูลดังนี้:</strong>
                        </div>
                        <Row className="g-2">
                            <Col xs={6}>
                                <div className="text-muted">จำนวนเงิน:</div>
                                <div className="fw-bold">
                                    {ocrResult.amount !== undefined ? `฿${ocrResult.amount.toLocaleString()}` : '-'}
                                </div>
                            </Col>
                            <Col xs={6}>
                                <div className="text-muted">เลขที่อ้างอิง:</div>
                                <div className="fw-bold text-truncate">
                                    {ocrResult.referenceNumber || '-'}
                                </div>
                            </Col>
                        </Row>
                        {ocrResult.amount !== undefined && ocrResult.amount < booking.totalAmount && (
                            <div className="mt-2 text-danger fw-bold border-top pt-2">
                                <i className="bi bi-x-circle-fill me-1"></i>
                                ยอดเงินที่ตรวจพบ (฿{ocrResult.amount.toLocaleString()}) น้อยกว่ายอดที่ต้องชำระ (฿{booking.totalAmount.toLocaleString()})
                            </div>
                        )}
                        {ocrResult.amount !== undefined && ocrResult.amount > booking.totalAmount && (
                            <div className="mt-2 text-warning fw-bold border-top pt-2">
                                <i className="bi bi-exclamation-circle-fill me-1"></i>
                                ยอดเงินในสลิปเกินกว่ายอดที่ต้องชำระ
                            </div>
                        )}
                        {ocrResult.amount === undefined && (
                            <div className="mt-2 text-muted small border-top pt-2">
                                <i className="bi bi-info-circle me-1"></i>
                                ไม่สามารถตรวจสอบยอดเงินอัตโนมัติได้
                                <Button variant="link" size="sm" className="p-0 ms-2 text-decoration-none" onClick={() => setShowDebug(!showDebug)}>
                                    {showDebug ? 'ซ่อน' : 'ตรวจสอบสาเหตุ'}
                                </Button>
                            </div>
                        )}
                        {showDebug && ocrResult.rawText && (
                            <div className="mt-2 p-2 bg-dark text-light rounded small font-monospace" style={{ maxHeight: '100px', overflow: 'auto' }}>
                                <strong>Raw Text:</strong> {ocrResult.rawText}
                            </div>
                        )}
                    </div>
                )}

                {uploading && (
                    <div className="mb-4">
                        <div className="d-flex justify-content-between small mb-1">
                            <span>กำลังบันทึกข้อมูล...</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <ProgressBar now={uploadProgress} animated variant="success" style={{ height: '8px' }} />
                    </div>
                )}

                <div className="d-grid gap-2">
                  <Button 
                    variant={ocrResult?.amount !== undefined && ocrResult.amount < booking.totalAmount ? "secondary" : "primary"} 
                    size="lg" 
                    className="fw-bold py-3 shadow-sm"
                    onClick={handleUploadPayment}
                    disabled={
                        uploading || 
                        ocrLoading || 
                        !file || 
                        (ocrResult?.amount !== undefined && ocrResult.amount < booking.totalAmount)
                    }
                  >
                    {uploading ? 'กำลังบันทึก...' : 
                     (ocrResult?.amount !== undefined && ocrResult.amount < booking.totalAmount) ? 'ยอดเงินไม่เพียงพอ' : 
                     'ยืนยันการแจ้งชำระเงิน'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {isExpired && (
             <Alert variant="danger" className="border-0 shadow-sm p-4">
                <h5 className="fw-bold">การจองหมดอายุ</h5>
                <p className="mb-0">การจองนี้ถูกระงับเนื่องจากไม่ได้ชำระเงินภายในเวลาที่กำหนด กรุณาจองใหม่อีกครั้ง</p>
                <hr />
                <Button variant="danger" className="w-100" onClick={() => router.push('/locks')}>ไปเลือกทำเลใหม่</Button>
             </Alert>
          )}
          
          <Card className="border-0 shadow-sm">
             <Card.Body className="p-4">
               <h5 className="fw-bold mb-3">คำแนะนำ</h5>
               <ul className="text-muted small ps-3">
                 <li className="mb-2">กรุณาอัปโหลดสลิปที่แสดงชื่อผู้รับและจำนวนเงินชัดเจน</li>
                 <li className="mb-2">ระบบจะใช้เวลาตรวจสอบสลิปประมาณ 30-60 นาที</li>
                 <li>เมื่อตรวจสอบสำเร็จ สถานะจะเปลี่ยนเป็น &quot;จองสำเร็จ&quot; ทันที</li>
               </ul>
             </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
