'use client';
import { useState, FormEvent } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getUser, saveAuth, getToken } from '@/lib/auth';
import API from '@/lib/api';

export default function Profile() {
  const user = getUser();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', cnic: user?.cnic || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [error, setError] = useState('');
  const [pwError, setPwError] = useState('');

  const handleProfile = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg(''); setError('');
    try {
      const { data } = await API.put('/auth/profile', form);
      const token = getToken()!;
      saveAuth(token, { ...user!, ...data.user });
      setMsg('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault(); setPwMsg(''); setPwError('');
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('Passwords do not match'); return; }
    setChangingPw(true);
    try {
      await API.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMsg('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPwError(err.response?.data?.message || 'Password change failed');
    } finally { setChangingPw(false); }
  };

  return (
    <DashboardLayout title="My Profile" subtitle="Manage your account information">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Avatar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl sm:text-3xl font-bold">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{user?.name}</h2>
              <p className="text-gray-500 text-sm truncate">{user?.email}</p>
              <span className={`mt-1.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${user?.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                {user?.role?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h3 className="font-bold text-gray-900 mb-5 text-lg">Personal Information</h3>
          {msg && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">{msg}</div>}
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          <form onSubmit={handleProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">CNIC</label>
                <input type="text" value={form.cnic} onChange={e => setForm({...form, cnic: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input type="email" value={user?.email} disabled
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed" />
            </div>
            <button type="submit" disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Saving...</> : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Password Change */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h3 className="font-bold text-gray-900 mb-5 text-lg">Change Password</h3>
          {pwMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">{pwMsg}</div>}
          {pwError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{pwError}</div>}
          <form onSubmit={handlePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Password</label>
              <input type="password" required value={pwForm.currentPassword} onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                <input type="password" required minLength={6} value={pwForm.newPassword} onChange={e => setPwForm({...pwForm, newPassword: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                <input type="password" required value={pwForm.confirmPassword} onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              </div>
            </div>
            <button type="submit" disabled={changingPw}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              {changingPw ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Changing...</> : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
