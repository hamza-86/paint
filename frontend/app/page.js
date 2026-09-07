import PublicHomePage from '@/components/public/PublicHomePage';
import './public-home.css';
import { baloo2, inter, kalam } from './fonts';

export const metadata = {
  title: 'Harun Aziz Paints & Tools — Malkapur',
  description:
    'Authorised Asian Paints & Nerolac dealer in Malkapur, Buldhana. Computerised custom colour mixing, hardware, tools, wallpapers, and festive colours.',
  keywords: [
    'Harun Aziz Paints & Tools',
    'Malkapur paint shop',
    'Asian Paints Malkapur',
    'Nerolac Malkapur',
    'colour mixing',
    'hardware and tools',
  ],
};

export default function HomePage() {
  return (
    <div className={`${baloo2.variable} ${inter.variable} ${kalam.variable}`}>
      <PublicHomePage />
    </div>
  );
}
