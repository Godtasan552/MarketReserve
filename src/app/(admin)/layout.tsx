'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container, Nav, Navbar, Row, Col, Button } from 'react-bootstrap';
import { useSession, signOut } from 'next-auth/react';
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
      {/* Mobile Navbar: Visible only on small screens */}
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm sticky-top d-lg-none">
        <Container fluid>
          <Navbar.Brand as={LinkAny} href="/admin/dashboard" className="fw-bold">
            <i className="bi bi-shield-lock-fill me-2 text-warning"></i>
            Admin
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="admin-navbar-nav" />
          <Navbar.Collapse id="admin-navbar-nav">
            <Nav className="me-auto py-2">
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
              <Nav.Link onClick={() => signOut({ callbackUrl: '/' })} className="text-danger border-top mt-2">
                <i className="bi bi-box-arrow-right me-2"></i> ออกจากระบบ
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="flex-grow-1 p-0">
        <Row className="g-0 min-vh-100">
          {/* Vertical Sidebar: Visible only on Desktop */}
          <Col lg={2} className="d-none d-lg-block bg-white border-end shadow-sm sticky-top" style={{ height: '100vh', overflowY: 'auto' }}>
            <div className="d-flex flex-column h-100 py-4 px-3">
              {/* Branding Section */}
              <div className="mb-4 px-2">
                <Link href="/" className="text-decoration-none d-flex align-items-center mb-4">
                  <div className="bg-primary text-white rounded-3 p-2 me-2">
                    <i className="bi bi-shield-lock fs-4"></i>
                  </div>
                  <span className="fw-bold fs-5 text-dark" style={{ letterSpacing: '-0.5px' }}>MARKET HUB</span>
                </Link>
                <div className="small text-uppercase fw-bold text-muted mb-2 ls-1">Admin Panel</div>
              </div>

              {/* Navigation Menu */}
              <Nav className="flex-column nav-pills flex-grow-1">
                {filteredMenu.map((item) => (
                  <Nav.Link
                    key={item.path}
                    as={LinkAny}
                    href={item.path}
                    active={pathname.startsWith(item.path)}
                    className="mb-2 py-2 px-3 rounded-3"
                  >
                    <i className={`bi ${item.icon} me-2 fs-5`}></i>
                    <span className="fw-medium">{item.name}</span>
                  </Nav.Link>
                ))}
              </Nav>

              {/* Bottom Actions */}
              <div className="mt-auto pt-4 border-top">
                <div className="d-flex align-items-center mb-4 px-2">
                  <div className="bg-light rounded-circle p-2 me-3 border">
                     <i className="bi bi-person-circle fs-5"></i>
                  </div>
                  <div className="overflow-hidden">
                    <div className="small fw-bold text-dark text-truncate">{session?.user?.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Administrator</div>
                  </div>
                </div>
                
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  as={LinkAny}
                  href="/"
                  className="w-100 mb-2 border-0 text-start px-3"
                >
                  <i className="bi bi-house-door me-2"></i> หน้าเว็บร้านค้า
                </Button>

                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-100 border-0 text-start px-3"
                >
                  <i className="bi bi-box-arrow-right me-2"></i> ออกจากระบบ
                </Button>
              </div>
            </div>
          </Col>

          {/* Main Content Area */}
          <Col lg={10} className="py-4 px-4 bg-light overflow-auto">
             {children}
          </Col>
        </Row>
      </Container>
      
      <style jsx global>{`
        .ls-1 { letter-spacing: 1px; }
      `}</style>
    </div>
  );
}
