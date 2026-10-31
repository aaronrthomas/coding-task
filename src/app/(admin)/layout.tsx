import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { Role } from '@prisma/client';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // If authenticated as a CUSTOMER, route them to the Customer Portal
  if (session.role === Role.CUSTOMER) {
    redirect('/portal');
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar user={session} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={session} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
