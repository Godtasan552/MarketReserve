import type { NextAuthConfig, Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = auth?.user?.role === 'admin';
      const isOnAdminPanel = nextUrl.pathname.startsWith('/admin');
      const isOnAdminLogin = nextUrl.pathname === '/admin/login';

      // 1. Admin Login Page Logic
      if (isOnAdminLogin) {
        if (isLoggedIn) {
            // If already logged in as admin, go to dashboard
            if (isAdmin) {
                return Response.redirect(new URL('/admin/dashboard', nextUrl));
            }
            // If logged in as user, redirect to home (prevent accessing admin login)
            return Response.redirect(new URL('/', nextUrl));
        }
        // If not logged in, allow access to valid login page
        return true; 
      }

      // 2. Admin Panel Logic (Protected Routes)
      if (isOnAdminPanel) {
        if (!isLoggedIn) {
            // Not logged in -> Redirect to Admin Login
            return Response.redirect(new URL('/admin/login', nextUrl));
        }
        if (!isAdmin) {
            // Logged in but not admin -> Redirect to Home
            return Response.redirect(new URL('/', nextUrl));
        }
        // Admin -> Allow
        return true;
      }

      // 3. Default behavior for other routes
      return true;
    },
    async jwt({ token, user }: { token: JWT, user?: User }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: Session, token: JWT }) {
      if (session?.user) {
        session.user.role = token.role;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [], // Providers are configured in auth.ts to avoid Edge Runtime issues
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
