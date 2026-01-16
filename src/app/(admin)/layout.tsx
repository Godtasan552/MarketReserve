'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container, Nav, Navbar, Row, Col } from 'react-bootstrap';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: 'bi-speedometer2' },
    { name: 'Lock Management', path: '/admin/locks', icon: 'bi-shop' },
    { name: 'Zone Management', path: '/admin/zones', icon: 'bi-map' },
    { name: 'Bookings', path: '/admin/bookings', icon: 'bi-calendar-check' },
    { name: 'Payments', path: '/admin/payments', icon: 'bi-cash-coin' },
  ];

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm sticky-top">
        <Container fluid>
          <Navbar.Brand as={Link} href="/admin/dashboard" className="fw-bold">
            <i className="bi bi-shield-lock-fill me-2 text-warning"></i>
            MarketHub Admin
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="admin-sidebar" />
          <Navbar.Collapse id="admin-navbar" className="d-lg-none">
            <Nav className="me-auto">
              {menuItems.map((item) => (
                <Nav.Link 
                  key={item.path} 
                  as={Link} 
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
              {menuItems.map((item) => (
                <Nav.Link
                  key={item.path}
                  as={Link}
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
