'use client';

import { useState, useEffect, useMemo } from 'react';
import { Container, Card, ListGroup, Button, Badge, Spinner, Nav } from 'react-bootstrap';
import Link from 'next/link';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.isRead);
    }
    return notifications;
  }, [notifications, filter]);

  const markAsRead = async (id: string, currentlyRead: boolean) => {
    if (!currentlyRead) {
      try {
        await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
        setNotifications(prev => 
            prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }
  };
  
  const markAllAsRead = async () => {
      try {
          await fetch('/api/notifications/read-all', { method: 'PATCH' });
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch (error) {
          console.error('Error marking all as read', error);
      }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'booking_created': return 'primary';
      case 'booking_approved': return 'success';
      case 'booking_rejected': return 'danger';
      case 'booking_expiring': return 'warning';
      default: return 'info';
    }
  };
  
  const getTypeIcon = (type: string) => {
      switch(type) {
          case 'booking_created': return 'bi-bookmark-plus';
          case 'booking_approved': return 'bi-check-circle';
          case 'booking_rejected': return 'bi-x-circle';
          case 'booking_expiring': return 'bi-clock';
          default: return 'bi-info-circle';
      }
  }

  return (
    <Container className="py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
            <h2 className="fw-bold mb-1">การแจ้งเตือน</h2>
            <p className="text-muted mb-0">ติดตามข่าวสารและการจองพื้นที่ของคุณ</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          {notifications.some(n => !n.isRead) && (
              <Button variant="outline-primary" size="sm" onClick={markAllAsRead}>
                  <i className="bi bi-check2-all me-2"></i>อ่านทั้งหมด
              </Button>
          )}
        </div>
      </div>

      <Nav variant="pills" className="mb-4 bg-light p-1 rounded-3 d-inline-flex">
        <Nav.Item>
          <Nav.Link 
            active={filter === 'all'} 
            onClick={() => setFilter('all')}
            className={`rounded-3 px-4 py-2 border-0 ${filter === 'all' ? 'shadow-sm' : ''}`}
            style={{ cursor: 'pointer' }}
          >
            ทั้งหมด
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={filter === 'unread'} 
            onClick={() => setFilter('unread')}
            className={`rounded-3 px-4 py-2 border-0 ${filter === 'unread' ? 'shadow-sm' : ''}`}
            style={{ cursor: 'pointer' }}
          >
            ยังไม่ได้อ่าน
            {notifications.filter(n => !n.isRead).length > 0 && (
              <Badge pill bg="danger" className="ms-2">
                {notifications.filter(n => !n.isRead).length}
              </Badge>
            )}
          </Nav.Link>
        </Nav.Item>
      </Nav>

      <Card className="border-0 shadow-sm overflow-hidden rounded-4">
        {loading ? (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">กำลังโหลดข้อมูล...</p>
            </div>
        ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-5">
                <i className={`bi ${filter === 'unread' ? 'bi-chat-heart' : 'bi-bell-slash'} display-1 text-light mb-3 d-block`}></i>
                <h4 className="text-muted">
                  {filter === 'unread' ? 'ไม่มีรายการใหม่ที่ยังไม่ได้อ่าน' : 'ไม่มีการแจ้งเตือนในขณะนี้'}
                </h4>
                {filter === 'all' && (
                  <Link href="/locks">
                      <Button variant="primary" className="mt-3">ไปจองพื้นที่เลย</Button>
                  </Link>
                )}
            </div>
        ) : (
            <ListGroup variant="flush">
                {filteredNotifications.map((n) => (
                    <ListGroup.Item 
                        key={n._id}
                        className={`p-4 border-bottom ${!n.isRead ? 'bg-primary bg-opacity-10' : ''} border-0 list-group-item-action transition-all`}
                        onClick={() => markAsRead(n._id, n.isRead)}
                        style={{ cursor: n.isRead ? 'default' : 'pointer' }}
                    >
                        <div className="d-flex gap-3">
                            <div className={`bg-${getTypeColor(n.type)} bg-opacity-10 p-3 rounded-circle text-${getTypeColor(n.type)} d-flex align-items-center justify-content-center flex-shrink-0`} style={{ width: '60px', height: '60px' }}>
                                <i className={`bi ${getTypeIcon(n.type)} fs-3`}></i>
                            </div>
                            <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-start mb-1 gap-2 flex-wrap">
                                    <h5 className={`mb-0 fw-bold ${!n.isRead ? 'text-primary' : ''}`}>{n.title}</h5>
                                    <small className="text-muted">{new Date(n.createdAt).toLocaleString('th-TH')}</small>
                                </div>
                                <p className="text-secondary mb-3 fs-5">{n.message}</p>
                                <div className="d-flex align-items-center gap-3">
                                    {n.link && (
                                        <Link 
                                          href={n.link.replace('/bookings/', '/my-bookings/')} 
                                          className="btn btn-sm btn-outline-primary fw-bold px-3 rounded-pill"
                                        >
                                            ดูรายละเอียด
                                        </Link>
                                    )}
                                    {!n.isRead && (
                                        <Badge bg="primary" pill className="px-3">ใหม่</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        )}
      </Card>
    </Container>
  );
}
