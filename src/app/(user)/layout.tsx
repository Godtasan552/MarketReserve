'use client';



import { Container, Nav, Navbar, NavDropdown, Button } from 'react-bootstrap';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import NotificationBell from '@/components/notification/NotificationBell';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LinkAny = Link as any;

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar bg="white" expand="lg" className="shadow-sm sticky-top py-3" style={{ zIndex: 1030 }}>
        <Container>
          <Navbar.Brand as={LinkAny} href="/" className="fw-bold text-primary d-flex align-items-center">
              <i className="bi bi-cart4 me-2 fs-3"></i>
              MARKET HUB
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="user-navbar-nav" />
          <Navbar.Collapse id="user-navbar-nav">
            <Nav className="ms-auto align-items-center gap-2">
              <Nav.Link as={LinkAny} href="/locks" active={pathname === '/locks'} className="fw-medium">
                  จองล็อก
              </Nav.Link>
              {session ? (
                <>
                  <Nav.Link as={LinkAny} href="/my-bookings" active={pathname === '/my-bookings'} className="fw-medium">
                      การจองและคิวของฉัน
                  </Nav.Link>
                  <Nav.Link as={LinkAny} href="/bookmarks" active={pathname === '/bookmarks'} className="fw-medium">
                      รายการที่บันทึก
                  </Nav.Link>
                  <NotificationBell />
                  <NavDropdown 
                    title={
                      <span className="d-inline-flex align-items-center">
                        <i className="bi bi-person-circle me-2"></i>
                        {session.user?.name || 'บัญชีของฉัน'}
                      </span>
                    } 
                    id="user-nav-dropdown"
                    align="end"
                  >
                    {session.user?.role !== 'user' && (
                      <NavDropdown.Item as={LinkAny} href="/admin/dashboard">
                          หน้าจัดการ (Admin)
                      </NavDropdown.Item>
                    )}
                    <NavDropdown.Item as={LinkAny} href="/profile">
                        ข้อมูลส่วนตัว
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={() => signOut({ callbackUrl: '/' })} className="text-danger">
                      <i className="bi bi-box-arrow-right me-2"></i> ออกจากระบบ
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              ) : (
                <div className="d-flex gap-2 ms-lg-3">
                  <Button as={LinkAny} href="/login" variant="outline-primary" className="px-4">
                      เข้าสู่ระบบ
                  </Button>
                  <Button as={LinkAny} href="/register" variant="primary" className="px-4">
                      สมัครสมาชิก
                  </Button>
                </div>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="flex-grow-1 bg-light py-4">
        {children}
      </main>

      <footer className="bg-white border-top py-4 mt-auto">
        <Container>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <div className="text-muted small">
              © {new Date().getFullYear()} Market Hub - ระบบจัดการเช่าล็อกตลาด ลิขสิทธิ์ถูกต้อง
            </div>
            <div className="d-flex gap-4">
              <Link href="/terms" className="text-decoration-none text-muted small">ข้อกำหนดและเงื่อนไข</Link>
              <Link href="/privacy" className="text-decoration-none text-muted small">นโยบายความเป็นส่วนตัว</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
