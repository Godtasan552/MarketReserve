'use client';

import { useState, useEffect, useCallback } from 'react';
import { ListGroup, Button, Spinner } from 'react-bootstrap';
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

interface NotificationListProps {
    onRead: () => void;
    onReadAll: () => void;
}

export default function NotificationList({ onRead, onReadAll }: NotificationListProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async (isInitial = false) => {
    // Only fetch if not loading OR if it's the very first load
    try {
      if (isInitial) setLoading(true);
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []); // Remove changing dependencies to break the loop

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  const markAsRead = async (id: string, currentlyRead: boolean) => {
    if (!currentlyRead) {
      try {
        await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
        setNotifications(prev => 
            prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
        onRead();
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }
  };
  
  const markAllAsRead = async () => {
      try {
          await fetch('/api/notifications/read-all', { method: 'PATCH' });
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
          onReadAll();
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

  if (loading) {
    return (
      <div className="text-center p-3">
        <Spinner animation="border" size="sm" variant="primary" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center p-4 text-muted">
        <i className="bi bi-bell-slash fs-4 d-block mb-2"></i>
        <span>ไม่มีการแจ้งเตือน</span>
      </div>
    );
  }

  return (
    <div>
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-light">
            <h6 className="mb-0 fw-bold">การแจ้งเตือน</h6>
            {notifications.some(n => !n.isRead) && (
                <Button variant="link" size="sm" className="text-decoration-none p-0" onClick={markAllAsRead} style={{ fontSize: '0.8rem' }}>
                    อ่านทั้งหมด
                </Button>
            )}
        </div>
      <ListGroup variant="flush">
        {notifications.map((notification) => (
          <ListGroup.Item 
            key={notification._id} 
            action 
            className={`px-3 py-3 border-bottom ${!notification.isRead ? 'bg-blue-50' : ''}`}
            style={{ backgroundColor: !notification.isRead ? '#f0f8ff' : 'white' }}
            onClick={() => markAsRead(notification._id, notification.isRead)}
          >
            <div className="d-flex gap-3">
                <div className={`text-${getTypeColor(notification.type)} fs-4`}>
                    <i className={`bi ${getTypeIcon(notification.type)}`}></i>
                </div>
                <div className="flex-grow-1">
                    <p className="mb-1 fw-bold fs-6 text-dark">{notification.title}</p>
                    <p className="mb-1 text-secondary" style={{ fontSize: '0.9rem' }}>{notification.message}</p>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(notification.createdAt).toLocaleString('th-TH')}
                    </small>
                    {notification.link && (
                         <div className="mt-1">
                            <Link 
                              href={notification.link.replace('/bookings/', '/my-bookings/')} 
                              className="text-decoration-none small fw-bold"
                            >
                                ดูรายละเอียด
                            </Link>
                         </div>
                    )}
                </div>
                {!notification.isRead && (
                    <div className="pt-2">
                        <span className="d-inline-block bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></span>
                    </div>
                )}
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <div className="p-2 border-top text-center bg-light">
          <Link href="/notifications" className="text-decoration-none small fw-bold py-1 d-block">
              ดูการแจ้งเตือนทั้งหมด
          </Link>
      </div>
    </div>
  );
}
