'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { Form, Button, Alert, Container, Card } from 'react-bootstrap';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณาระบุรหัสผ่าน'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือคุณไม่มีสิทธิ์ผู้ดูแลระบบ');
      } else {
        // Successful login
        // Check session role? Client-side session might strictly require a refresh or check.
        // For now, redirect to dashboard, middleware will catch if not admin.
        router.push('/admin/dashboard');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100 bg-secondary">
      <Card className="shadow-lg border-0" style={{ maxWidth: '400px', width: '100%' }}>
        <Card.Body className="p-5">
          <div className="text-center mb-5">
            <i className="bi bi-shield-lock-fill text-warning display-4 mb-3"></i>
            <h2 className="fw-bold text-dark">Admin Console</h2>
            <p className="text-muted small">Access Restricted to Administrators</p>
          </div>

          {error && <Alert variant="danger" className="text-center small">{error}</Alert>}

          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control 
                type="email" 
                placeholder="admin@markethub.com"
                {...register('email')} 
                isInvalid={!!errors.email}
              />
              <Form.Control.Feedback type="invalid">
                {errors.email?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="••••••••"
                {...register('password')} 
                isInvalid={!!errors.password}
              />
              <Form.Control.Feedback type="invalid">
                {errors.password?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Button variant="dark" type="submit" className="w-100 py-2 fw-bold" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </Form>
        </Card.Body>
        <Card.Footer className="text-center py-3 bg-light border-0">
          <small className="text-muted">MarketHub System &copy; 2026</small>
        </Card.Footer>
      </Card>
    </Container>
  );
}
