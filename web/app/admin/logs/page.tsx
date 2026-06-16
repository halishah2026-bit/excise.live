'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import API from '@/lib/api';

const services = ['Punjab','Islamabad','Sindh','KPK','AJK','Balochistan','Stolen','Non-Custom'];

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/admin/logs?page=${page}&limit=30&service=${service}`);
      setLogs(data.logs); setTotalPages(data.pages); setTotal(data.total);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [page, service]);

  return (
    <DashboardLayout title="Search Logs" subtitle="Monitor all vehicle verification searches" adminOnly>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select value={service} onChange={e => setService(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 w-full sm:w-auto">
              <option value="">All Services</option>
              {services.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 font-medium">Total: <span className="font-bold text-gray-900">{total.toLocaleString()}</span> searches</div>
        </div>

        {loading ? (
          <div className="py-14 text-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/><p className="text-gray-400">Loading logs...</p></div>
        ) : logs.length === 0 ? (
          <div className="py-14 text-center text-gray-400"><div className="text-4xl mb-2">📋</div><p className="font-medium">No logs found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full min-w-[860px]">
              <thead>
                <tr><th>#</th><th>User</th><th>Service</th><th>Search Type</th><th>Query</th><th>Result</th><th>IP</th><th>Date</th></tr>
              </thead>
              <tbody>
                {logs.map((log: any, i: number) => (
                  <tr key={log._id}>
                    <td className="text-gray-400 text-xs">{(page-1)*30+i+1}</td>
                    <td>
                      <p className="font-semibold text-gray-900 text-sm">{log.userId?.name || log.userName || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{log.userId?.email || ''}</p>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0"/>
                        <span className="font-semibold text-gray-800 text-sm">{log.service}</span>
                      </span>
                    </td>
                    <td className="text-gray-600 text-sm">{log.searchType || '—'}</td>
                    <td><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{log.searchQuery || '—'}</span></td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${log.resultFound ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {log.resultFound ? '✓ Found' : '✗ Not Found'}
                      </span>
                    </td>
                    <td className="text-gray-400 text-xs">{log.ipAddress || '—'}</td>
                    <td className="text-gray-400 text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 sm:px-5 py-4 border-t flex justify-between items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40">← Previous</button>
            <span className="text-xs sm:text-sm text-gray-500">Page {page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
