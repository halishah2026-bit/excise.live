'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import API from '@/lib/api';

interface User { _id: string; name: string; email: string; role: string; phone: string; cnic: string; isActive: boolean; searchCount: number; createdAt: string; lastLogin: string; }

const emptyForm = { name: '', email: '', password: '', phone: '', cnic: '', role: 'user' };

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/admin/users?page=${page}&limit=15&search=${search}`);
      setUsers(data.users); setTotalPages(data.pages);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const openAdd = () => { setEditUser(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (u: User) => { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', phone: u.phone || '', cnic: u.cnic || '', role: u.role }); setShowModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editUser) {
        const { password, ...data } = form;
        await API.put(`/admin/users/${editUser._id}`, data);
      } else {
        await API.post('/admin/users', form);
      }
      setShowModal(false); fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    await API.delete(`/admin/users/${id}`);
    fetchUsers();
  };

  const handleToggle = async (id: string) => {
    await API.patch(`/admin/users/${id}/toggle`);
    fetchUsers();
  };

  return (
    <DashboardLayout title="User Management" subtitle="Manage all system users" adminOnly>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 w-full sm:w-64" />
          </div>
          <button onClick={openAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Add User
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-14 text-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/><p className="text-gray-400">Loading users...</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full min-w-[860px]">
              <thead>
                <tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Searches</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u._id}>
                    <td className="text-gray-400 text-xs">{(page-1)*15+i+1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-bold text-sm">{u.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">{u.name}</span>
                      </div>
                    </td>
                    <td className="text-gray-600 text-sm">{u.email}</td>
                    <td className="text-gray-500 text-sm">{u.phone || '—'}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="font-semibold text-gray-700">{u.searchCount || 0}</td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString('en-PK')}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(u)} className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors">Edit</button>
                        <button onClick={() => handleToggle(u._id)} className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${u.isActive ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-green-50 hover:bg-green-100 text-green-600'}`}>
                          {u.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => handleDelete(u._id)} className="px-2.5 py-1 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">Del</button>
                      </div>
                    </td>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto animate-fadeIn">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-bold text-gray-900 text-lg">{editUser ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              </div>
              {!editUser && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
                  <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition-colors text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-60 text-sm flex items-center justify-center gap-2">
                {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Saving...</> : editUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
