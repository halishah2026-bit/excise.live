'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import API from '@/lib/api';

export default function SearchHistory() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async (p: number) => {
    setLoading(true);
    try {
      const { data } = await API.get(`/verify/history?page=${p}&limit=20`);
      setLogs(data.logs || []);
      setTotalPages(data.pages || 1);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHistory(page); }, [page]);

  return (
    <DashboardLayout title="Search History" subtitle="All your previous vehicle verification searches">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
          <h3 className="font-bold text-gray-900">Search History</h3>
          <span className="text-xs sm:text-sm text-gray-500">Page {page} / {totalPages}</span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
            <p className="text-gray-400">Loading history...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-14 text-center">
            <div className="text-4xl mb-2">📋</div>
            <p className="font-bold text-gray-700">No Search History</p>
            <p className="text-sm text-gray-400 mt-1">Your searches will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full min-w-[700px]">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Service</th>
                  <th>Search Type</th>
                  <th>Query</th>
                  <th>Result</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any, i: number) => (
                  <tr key={log._id}>
                    <td className="text-gray-400 text-xs">{(page - 1) * 20 + i + 1}</td>
                    <td className="font-semibold text-gray-900">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"/>
                        {log.service}
                      </span>
                    </td>
                    <td className="text-gray-600">{log.searchType || '—'}</td>
                    <td><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{log.searchQuery}</span></td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${log.resultFound ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {log.resultFound ? '✓ Found' : '✗ Not Found'}
                      </span>
                    </td>
                    <td className="text-gray-400 text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 sm:px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40 transition-colors">
              ← Previous
            </button>
            <span className="text-xs sm:text-sm text-gray-500">Page {page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40 transition-colors">
              Next →
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
