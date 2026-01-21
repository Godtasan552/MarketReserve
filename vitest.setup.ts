import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Environment Variables
process.env.NEXTAUTH_SECRET = 'test-secret-key-at-least-32-characters-long';
process.env.CRON_SECRET = 'test-cron-secret-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/markethub-test';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '',
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}));
