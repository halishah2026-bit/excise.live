'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import API from '@/lib/api';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalVehicles: number;
  totalSearches: number;
  serviceStats: { _id: string; count: number }[];
  recentLogs: any[];
}

function StatCard({ title, value, icon, color, link }: { title: string; value: number; icon: string; color: string; link?: string }) {
  const content = (
    <div className={`bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 flex items-start gap-4 ${link ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value?.toLocaleString() || 0}</p>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
      </div>
    </div>
  );
  return link ? <Link href={link}>{content}</Link> : content;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/stats').then(r => setStats(r.data.stats)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout title="Admin Dashboard" adminOnly>
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="System Overview & Statistics" adminOnly>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 sm:p-6 mb-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Admin Control Panel</h2>
            <p className="text-cyan-200 mt-1 text-sm">Excise.Live — Vehicle Verification System</p>
          </div>
          <div className="sm:text-right">
            <p className="text-slate-300 text-sm">System Status</p>
            <div className="flex items-center gap-1.5 sm:justify-end mt-1">
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"/>
              <span className="text-green-400 font-semibold text-sm">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon="👥" color="bg-blue-100 text-blue-600" link="/admin/users" />
        <StatCard title="Active Users" value={stats?.activeUsers || 0} icon="✅" color="bg-green-100 text-green-600" link="/admin/users" />
        <StatCard title="Vehicle Records" value={stats?.totalVehicles || 0} icon="🚗" color="bg-purple-100 text-purple-600" link="/admin/vehicles" />
        <StatCard title="Total Searches" value={stats?.totalSearches || 0} icon="🔍" color="bg-orange-100 text-orange-600" link="/admin/logs" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Usage */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Service Usage Statistics</h3>
          </div>
          <div className="p-4 sm:p-5 space-y-3">
            {stats?.serviceStats?.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No searches recorded yet</p>
            ) : (
              stats?.serviceStats?.map((svc) => {
                const total = stats.serviceStats.reduce((a, s) => a + s.count, 0);
                const pct = total > 0 ? Math.round((svc.count / total) * 100) : 0;
                return (
                  <div key={svc._id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{svc._id}</span>
                      <span className="text-sm font-bold text-gray-900">{svc.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }}/>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Searches */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Recent Searches</h3>
            <Link href="/admin/logs" className="text-blue-600 text-sm font-medium hover:underline">View All</Link>
          </div>
          {!stats?.recentLogs?.length ? (
            <div className="py-10 text-center text-gray-400">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm">No searches yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats.recentLogs.slice(0, 8).map((log: any) => (
                <div key={log._id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-xs font-bold">{log.service?.[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{log.service}</p>
                      <p className="text-xs text-gray-400 truncate">{log.userId?.name || 'Unknown'} · {log.searchQuery}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${log.resultFound ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {log.resultFound ? 'Found' : 'Not Found'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/admin/users', label: 'Manage Users', icon: '👥', desc: 'Add, edit or deactivate users' },
          { href: '/admin/vehicles', label: 'Vehicle Records', icon: '🚗', desc: 'Manage vehicle database' },
          { href: '/admin/logs', label: 'Search Logs', icon: '📋', desc: 'View all search activity' },
          { href: '/dashboard/verify/punjab', label: 'Test Services', icon: '🔍', desc: 'Test vehicle verification' },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4 group">
            <div className="text-2xl mb-2">{a.icon}</div>
            <p className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{a.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
