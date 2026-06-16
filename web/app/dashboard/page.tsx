'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getUser } from '@/lib/auth';
import API from '@/lib/api';
import Link from 'next/link';
import { Car, Truck, Bus, ShieldAlert, CircleSlashed, ShieldCheck } from 'lucide-react';

const services = [
  { href: '/dashboard/verify/punjab', label: 'Punjab Excise', desc: 'Search by Registration No.', color: 'from-green-500 to-green-700', icon: <Car className="h-7 w-7 text-slate-800" />, fields: 'Reg. No.' },
  { href: '/dashboard/verify/islamabad', label: 'Islamabad Excise', desc: 'CNIC, Chassis, Engine, Reg. No.', color: 'from-blue-500 to-blue-700', icon: <Truck className="h-7 w-7 text-slate-800" />, fields: '4 Fields' },
  { href: '/dashboard/verify/sindh', label: 'Sindh Excise', desc: 'CNIC, Chassis, Engine, Reg. No.', color: 'from-indigo-500 to-indigo-700', icon: <Bus className="h-7 w-7 text-slate-800" />, fields: '4 Fields' },
  { href: '/dashboard/verify/kpk', label: 'KPK Excise', desc: 'CNIC, Chassis, Engine, Reg. No.', color: 'from-teal-500 to-teal-700', icon: <ShieldCheck className="h-7 w-7 text-slate-800" />, fields: '4 Fields' },
  { href: '/dashboard/verify/ajk', label: 'AJK Excise', desc: 'Search by CNIC or Reg. No.', color: 'from-sky-500 to-sky-700', icon: <Bus className="h-7 w-7 text-slate-800" />, fields: '2 Fields' },
  { href: '/dashboard/verify/balochistan', label: 'Balochistan Excise', desc: 'Reg. No. + District Name', color: 'from-orange-500 to-orange-700', icon: <Truck className="h-7 w-7 text-slate-800" />, fields: '2 Fields' },
  { href: '/dashboard/verify/stolen', label: 'Stolen Vehicles', desc: 'CNIC, Chassis, Engine, Reg. No.', color: 'from-red-500 to-red-700', icon: <ShieldAlert className="h-7 w-7 text-slate-800" />, fields: 'Alert DB' },
  { href: '/dashboard/verify/noncustom', label: 'Non-Custom Vehicles', desc: 'Chassis No. or Engine No.', color: 'from-purple-500 to-purple-700', icon: <CircleSlashed className="h-7 w-7 text-slate-800" />, fields: 'Custom DB' },
];

export default function UserDashboard() {
  const user = getUser();
  const [stats, setStats] = useState({ totalSearches: 0, todaySearches: 0 });
  const [recentHistory, setRecentHistory] = useState<any[]>([]);

  useEffect(() => {
    API.get('/verify/history?limit=5').then(r => {
      setRecentHistory(r.data.logs || []);
      setStats({ totalSearches: r.data.total || 0, todaySearches: 0 });
    }).catch(() => {});
  }, []);

  return (
    <DashboardLayout title="Dashboard" subtitle="Welcome to Excise.Live Vehicle Verification">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 sm:p-6 mb-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Good day, {user?.name?.split(' ')[0]}! 👋</h2>
            <p className="text-blue-100 mt-1 text-sm">Verify vehicles across Pakistan using Excise.Live.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold">{stats.totalSearches}</p>
              <p className="text-blue-200 text-xs">Total Searches</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Verification Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {services.map((svc) => (
            <Link key={svc.href} href={svc.href}
              className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden hover:-translate-y-0.5">
              <div className={`h-1.5 bg-gradient-to-r ${svc.color}`}/>
              <div className="p-4">
                <div className="text-2xl mb-2">{svc.icon}</div>
                <p className="font-bold text-gray-900 text-sm">{svc.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">{svc.desc}</p>
                <div className="mt-3 flex items-center gap-1">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{svc.fields}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Searches */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Recent Searches</h3>
          <Link href="/dashboard/history" className="text-blue-600 text-sm font-medium hover:underline">View All</Link>
        </div>
        {recentHistory.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <div className="text-4xl mb-2">🔍</div>
            <p className="font-medium">No searches yet</p>
            <p className="text-sm">Start verifying vehicles using the services above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full min-w-[700px]">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Search Type</th>
                  <th>Query</th>
                  <th>Result</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentHistory.map((log: any) => (
                  <tr key={log._id}>
                    <td className="font-semibold text-gray-900">{log.service}</td>
                    <td className="text-gray-600">{log.searchType}</td>
                    <td className="font-mono text-xs bg-gray-50 px-2 py-1 rounded">{log.searchQuery}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${log.resultFound ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {log.resultFound ? '✓ Found' : '✗ Not Found'}
                      </span>
                    </td>
                    <td className="text-gray-400 text-xs">{new Date(log.createdAt).toLocaleString('en-PK')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
