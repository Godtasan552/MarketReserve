import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/custom-bootstrap.scss'; // Import custom SCSS
import 'bootstrap-icons/font/bootstrap-icons.css';
import "./globals.css";

import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const notoSansThai = Noto_Sans_Thai({ 
  subsets: ['thai'], 
  weight: ['300', '400', '500', '700'] 
});

export const metadata: Metadata = {
  title: {
    template: '%s | Market Hub',
    default: 'Market Hub | ระบบเช่าล็อกตลาดออนไลน์',
  },
  description: 'ระบบจัดการและเช่าพื้นที่ขายของ ล็อกตลาด จองง่าย จ่ายสะดวก พร้อมระบบแจ้งเตือนทันใจ',
  keywords: ['เช่าที่ขายของ', 'จองล็อกตลาด', 'ตลาดนัดออนไลน์', 'Market Hub'],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

import AuthProvider from '@/components/providers/SessionProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${inter.className} ${notoSansThai.className}`} suppressHydrationWarning>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
