'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import API from '@/lib/api';
import { saveAuth } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', cnic: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await API.post('/auth/register', form);
      saveAuth(data.token, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #01411C 0%, #1d4ed8 100%)' }}>
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-7">
            <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
            <p className="text-gray-500 text-sm mt-1">Register for Excise.Live Vehicle Verification</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="Muhammad Ali" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
                <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone No.</label>
                <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="03XX-XXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">CNIC</label>
                <input type="text" value={form.cnic} onChange={e => setForm({...form, cnic: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="XXXXX-XXXXXXX-X" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
                <input type="password" required minLength={6} value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="Minimum 6 characters" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
              {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>Creating...</> : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">Already have an account? <Link href="/login" className="text-blue-600 font-semibold hover:underline">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
