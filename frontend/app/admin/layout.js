import AdminLayout from '@/components/admin/AdminLayout';

export const metadata = {
  title: 'Admin Portal | Paint Shop Platform',
  description: 'Shop Owner Management Portal for Painters, Sales, and Rewards.',
};

export default function Layout({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}
