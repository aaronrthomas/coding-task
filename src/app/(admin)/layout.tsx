import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { FinnovaNavbar } from '@/components/layout/finnova-navbar';
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
    <div className="min-h-screen bg-[#edf0f7] text-slate-800 p-2.5 sm:p-4 md:p-6 lg:p-7 flex flex-col justify-start">
      {/* Signature Finnova Outer Container Card */}
      <div className="bg-white rounded-3xl md:rounded-[32px] shadow-xl shadow-slate-200/60 border border-slate-200/80 p-4 sm:p-6 md:p-8 flex flex-col min-h-[95vh] max-w-[1740px] mx-auto w-full transition-all">
        <FinnovaNavbar user={session} />
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
