import AdminLayout from '@/components/admin/AdminLayout';

export const metadata = {
  title: 'Admin Portal | Harun Aziz Paints & Tools',
  description: 'Shop Owner Management Portal for Harun Aziz Paints & Tools.',
};

export default function Layout({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}
