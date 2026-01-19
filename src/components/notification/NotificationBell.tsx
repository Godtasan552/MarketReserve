'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dropdown, Badge } from 'react-bootstrap';
import NotificationList from './NotificationList';
import { useSession } from 'next-auth/react';

export default function NotificationBell() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const userId = session?.user?.id;

  // Memoize to use in useEffect
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [userId]);

  useEffect(() => {
    const init = async () => {
      await fetchUnreadCount();
    };
    init();
    
    // Poll every 60 seconds
    intervalRef.current = setInterval(fetchUnreadCount, 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchUnreadCount]);

  const handleToggle = (nextShow: boolean) => {
    setIsOpen(nextShow);
    if (nextShow) {
      // Just opened
    } else {
        // Closed, refresh count
        fetchUnreadCount();
    }
  };

  const handleRead = () => {
    // When read, decrement local count or fetch again
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };
  
  const handleReadAll = () => {
      setUnreadCount(0);
  }

  if (!session) return null;

  return (
    <Dropdown show={isOpen} onToggle={handleToggle} align="end">
      <Dropdown.Toggle 
        variant="link" 
        id="notification-dropdown" 
        className="text-decoration-none text-dark position-relative p-0 me-3"
        bsPrefix="custom-dropdown-toggle" // To remove default caret
      >
        <i className="bi bi-bell fs-5"></i>
        {unreadCount > 0 && (
          <Badge 
            pill 
            bg="danger" 
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
            style={{ fontSize: '0.6rem' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="p-0 shadow border-0" style={{ width: '320px', maxHeight: '500px', overflowY: 'auto' }}>
        <NotificationList onRead={handleRead} onReadAll={handleReadAll} />
      </Dropdown.Menu>
      
      <style jsx global>{`
          .custom-dropdown-toggle::after {
              display: none !important;
          }
      `}</style>
    </Dropdown>
  );
}
