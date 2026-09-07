import { Geist } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Harun Aziz Paints & Tools | Malkapur',
  description:
    'Harun Aziz Paints & Tools, Neemwadi Chowk, Malkapur, Buldhana. Asian Paints & Nerolac dealer, custom colour mixing, hardware, and painter rewards platform.',
  keywords: [
    'harun aziz paints',
    'paint shop malkapur',
    'asian paints malkapur',
    'nerolac dealer buldhana',
    'painter rewards',
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
