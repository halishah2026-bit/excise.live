'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getUser, clearAuth } from '@/lib/auth';
import { LayoutDashboard, Car, Truck, Bus, ShieldAlert, Archive, Users, FileText, ShieldCheck } from 'lucide-react';

const userNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/dashboard/verify/punjab', label: 'Punjab Excise', icon: <Car className="h-5 w-5" /> },
  { href: '/dashboard/verify/islamabad', label: 'Islamabad Excise', icon: <Truck className="h-5 w-5" /> },
  { href: '/dashboard/verify/sindh', label: 'Sindh Excise', icon: <Bus className="h-5 w-5" /> },
  { href: '/dashboard/verify/kpk', label: 'KPK Excise', icon: <ShieldCheck className="h-5 w-5" /> },
  { href: '/dashboard/verify/ajk', label: 'AJK Excise', icon: <Bus className="h-5 w-5" /> },
  { href: '/dashboard/verify/balochistan', label: 'Balochistan Excise', icon: <Truck className="h-5 w-5" /> },
  { href: '/dashboard/verify/stolen', label: 'Stolen Vehicles', icon: <ShieldAlert className="h-5 w-5" /> },
  { href: '/dashboard/verify/noncustom', label: 'Non-Custom Vehicles', icon: <Archive className="h-5 w-5" /> },
  { href: '/dashboard/history', label: 'Search History', icon: <FileText className="h-5 w-5" /> },
  { href: '/dashboard/profile', label: 'My Profile', icon: <Users className="h-5 w-5" /> },
];

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: '/admin/users', label: 'User Management', icon: <Users className="h-5 w-5" /> },
  { href: '/admin/vehicles', label: 'Vehicle Records', icon: <Car className="h-5 w-5" /> },
  { href: '/admin/logs', label: 'Search Logs', icon: <FileText className="h-5 w-5" /> },
];

interface SidebarProps {
  isAdmin?: boolean;
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isAdmin, open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();
  const navItems = isAdmin ? adminNavItems : userNavItems;

  const handleLogout = () => {
    onClose?.();
    clearAuth();
    router.push('/login');
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 h-full w-64 bg-slate-900 flex flex-col shadow-xl z-40 transform transition-transform duration-200 lg:translate-x-0 lg:z-30 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center justify-between gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm leading-tight">Excise.Live</p>
            <p className="text-cyan-200 text-xs">Pakistan Vehicle Excise</p>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            aria-label="Close navigation menu"
            className="lg:hidden text-slate-400 hover:text-white w-8 h-8 rounded-md hover:bg-slate-800"
          >
            ×
          </button>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-5 py-3 border-b border-slate-700/50">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isAdmin ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
          {isAdmin ? '⭐ ADMIN PANEL' : '👤 USER PANEL'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {isAdmin && (
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">Administration</p>
        )}
        {!isAdmin && (
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">Services</p>
        )}
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => onClose?.()}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="px-3 py-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-all text-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
