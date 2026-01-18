'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container, Nav, Navbar, Row, Col } from 'react-bootstrap';
import { useSession } from 'next-auth/react';
import { hasPermission, Action } from '@/lib/auth/permissions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LinkAny = Link as any;

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const menuItems = [
    { name: 'หน้าแรก', path: '/admin/dashboard', icon: 'bi-speedometer2', permission: 'manage_locks' as Action },
    { name: 'จัดการพื้นที่เช่า', path: '/admin/locks', icon: 'bi-shop', permission: 'manage_locks' as Action },
    { name: 'จัดการโซน', path: '/admin/zones', icon: 'bi-map', permission: 'manage_zones' as Action },
    { name: 'จัดการทีมงาน', path: '/admin/staff', icon: 'bi-people', permission: 'manage_staff' as Action },
    { name: 'รายการจอง', path: '/admin/bookings', icon: 'bi-calendar-check', permission: 'manage_bookings' as Action },
    { name: 'แจ้งชำระเงิน', path: '/admin/payments', icon: 'bi-cash-coin', permission: 'manage_payments' as Action },
  ];

  const filteredMenu = menuItems.filter(item => hasPermission(session?.user?.role, item.permission));

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm sticky-top">
        <Container fluid>
          <Navbar.Brand as={LinkAny} href="/admin/dashboard" className="fw-bold">
            <i className="bi bi-shield-lock-fill me-2 text-warning"></i>
            MarketHub Admin
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="admin-sidebar" />
          <Navbar.Collapse id="admin-navbar" className="d-lg-none">
            <Nav className="me-auto">
              {filteredMenu.map((item) => (
                <Nav.Link 
                  key={item.path} 
                  as={LinkAny} 
                  href={item.path}
                  active={pathname === item.path}
                >
                  <i className={`bi ${item.icon} me-2`}></i>
                  {item.name}
                </Nav.Link>
              ))}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="flex-grow-1">
        <Row className="h-100">
          {/* Sidebar for Desktop */}
          <Col lg={2} className="d-none d-lg-block bg-white shadow-sm sidebar min-vh-100 py-3">
            <Nav className="flex-column nav-pills">
              {filteredMenu.map((item) => (
                <Nav.Link
                  key={item.path}
                  as={LinkAny}
                  href={item.path}
                  active={pathname.startsWith(item.path)}
                  className="mb-2"
                >
                  <i className={`bi ${item.icon} me-2`}></i>
                  {item.name}
                </Nav.Link>
              ))}
            </Nav>
          </Col>

          {/* Main Content */}
          <Col lg={10} className="py-4">
             {children}
          </Col>
        </Row>
      </Container>
    </div>
  );
}
