import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Paint Shop Painter Management Platform',
  description:
    'Single-shop painter rewards, sales tracking, and management platform.',
  keywords: ['paint shop', 'painter management', 'rewards', 'sales tracking'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
