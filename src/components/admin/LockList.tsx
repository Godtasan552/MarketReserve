'use client';

import { Table, Badge, Button, ButtonGroup } from 'react-bootstrap';

export interface Lock {
  _id: string;
  lockNumber: string;
  zone: { name: string; _id: string } | string; // Populated or ID
  size: { width: number; length: number; unit: 'm' | 'sqm' };
  pricing: { daily: number; weekly?: number; monthly?: number };
  status: string;
  isActive: boolean;
  images?: string[];
  features?: string[];
  description?: string;
}

interface LockListProps {
  locks: Lock[];
  onView: (lock: Lock) => void;
  onEdit: (lock: Lock) => void;
  onDelete: (id: string) => void;
}

export default function LockList({ locks, onView, onEdit, onDelete }: LockListProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return <Badge bg="success">ว่าง</Badge>;
      case 'booked': return <Badge bg="warning" text="dark">จองแล้ว</Badge>;
      case 'rented': return <Badge bg="danger">เช่าแล้ว</Badge>;
      case 'maintenance': return <Badge bg="secondary">ปิดปรับปรุง</Badge>;
      default: return <Badge bg="light" text="dark">{status}</Badge>;
    }
  };

  const getZoneName = (zone: { name: string } | string | null | undefined) => {
      if (typeof zone === 'object' && zone !== null && 'name' in zone) {
        return (zone as { name: string }).name;
      }
      return 'ไม่ระบุโซน';
  };

  return (
    <Table responsive hover className="align-middle border shadow-sm">
      <thead className="table-light">
        <tr>
          <th className="py-3">รหัสล็อก</th>
          <th className="py-3">โซน</th>
          <th className="py-3">ขนาด (กว้าง x ยาว)</th>
          <th className="py-3">ราคา (รายวัน)</th>
          <th className="py-3">สถานะ</th>
          <th className="py-3 text-end">จัดการ</th>
        </tr>
      </thead>
      <tbody>
        {locks.length === 0 ? (
          <tr>
            <td colSpan={6} className="text-center py-5 text-muted">
              ไม่พบข้อมูลล็อกในขณะนี้
            </td>
          </tr>
        ) : (
          locks.map((lock) => (
            <tr key={lock._id} style={{ cursor: 'pointer' }} onClick={() => onView(lock)}>
              <td className="fw-bold">{lock.lockNumber}</td>
              <td>{getZoneName(lock.zone)}</td>
              <td>
                {lock.size.width} x {lock.size.length} {lock.size.unit === 'm' ? 'เมตร' : 'ตร.ม.'}
              </td>
              <td>฿{lock.pricing.daily.toLocaleString()}</td>
              <td>{getStatusBadge(lock.status)}</td>
              <td className="text-end" onClick={(e) => e.stopPropagation()}>
                <ButtonGroup size="sm">
                  <Button variant="outline-info" onClick={() => onView(lock)} title="ดูรายละเอียด">
                    <i className="bi bi-eye"></i>
                  </Button>
                  <Button variant="outline-primary" onClick={() => onEdit(lock)} title="แก้ไข">
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button variant="outline-danger" onClick={() => onDelete(lock._id)} title="ลบ">
                    <i className="bi bi-trash"></i>
                  </Button>
                </ButtonGroup>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}
