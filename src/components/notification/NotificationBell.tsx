'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dropdown, Badge } from 'react-bootstrap';
import NotificationList from './NotificationList';
import { useSession } from 'next-auth/react';

export default function NotificationBell() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const userId = session?.user?.id;

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

  // Handle both initial fetch and Real-time SSE in one effect to keep hooks stable
  useEffect(() => {
    if (!userId) return;
    
    // Function to fetch initial count
    const getInitialCount = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    // Trigger initial fetch
    void getInitialCount();

    // SSE Setup
    const eventSource = new EventSource('/api/notifications/stream');

    eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        if (notification) {
            setUnreadCount(prev => prev + 1);
        }
      } catch (err) {
        console.error('Error parsing notification from SSE:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [userId]);

  const handleToggle = useCallback((nextShow: boolean) => {
    setIsOpen(nextShow);
    if (!nextShow) {
        // When closing, refresh count once to be sure
        void fetchUnreadCount();
    }
  }, [fetchUnreadCount]);

  const handleRead = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);
  
  const handleReadAll = useCallback(() => {
      setUnreadCount(0);
  }, []);

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
