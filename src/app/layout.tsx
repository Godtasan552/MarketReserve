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
  title: "Admin Dashboard",
  description: "Market Lock Rental System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${inter.className} ${notoSansThai.className}`}>
      <body>{children}</body>
    </html>
  );
}
