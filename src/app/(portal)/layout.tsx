import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { FinnovaPortalNavbar } from '@/components/layout/finnova-portal-navbar';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#edf0f7] text-slate-800 p-2.5 sm:p-4 md:p-6 lg:p-7 flex flex-col justify-start">
      {/* Signature Finnova Outer Container Card */}
      <div className="bg-white rounded-3xl md:rounded-[32px] shadow-xl shadow-slate-200/60 border border-slate-200/80 p-4 sm:p-6 md:p-8 flex flex-col min-h-[95vh] max-w-[1740px] mx-auto w-full transition-all">
        <FinnovaPortalNavbar user={session} />
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

