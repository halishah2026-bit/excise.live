'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  adminOnly?: boolean;
}

export default function DashboardLayout({ children, title, subtitle, adminOnly = false }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [canRender, setCanRender] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    const adminUser = isAdmin();
    if (adminOnly && !adminUser) {
      router.replace('/dashboard');
      return;
    }
    setAdmin(adminUser);
    setCanRender(true);
  }, [router, adminOnly]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [sidebarOpen]);

  if (!canRender) return null;

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 bg-slate-950/45 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar isAdmin={admin} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-h-screen flex-1 flex flex-col lg:ml-64">
        <Header title={title} subtitle={subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
