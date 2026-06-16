'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, isAuthenticated } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    if (isAuthenticated()) {
      const user = getUser();
      router.replace(user?.role === 'admin' ? '/admin' : '/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Loading Excise.Live...</p>
      </div>
    </div>
  );
}
