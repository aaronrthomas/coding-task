import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { PortalSidebar } from '@/components/layout/portal-sidebar';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Role } from '@prisma/client';

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
    <div className="min-h-screen flex bg-slate-50">
      <PortalSidebar user={session} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-800">
              Customer Self-Service Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            {(session.role === Role.ADMIN || session.role === Role.STAFF) && (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium px-2.5 py-1 rounded bg-blue-50 border border-blue-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Return to Admin Console
              </Link>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <span>{session.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
