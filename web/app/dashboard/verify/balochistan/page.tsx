'use client';
import { useState, FormEvent } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VehicleResult from '@/components/shared/VehicleResult';
import API from '@/lib/api';

const balochistanDistricts = [
  { id: '1', name: 'Quetta' },
  { id: '2', name: 'Gwadar' },
  { id: '3', name: 'Turbat' },
  { id: '4', name: 'Khuzdar' },
  { id: '5', name: 'Chaman' },
  { id: '6', name: 'Sibi' },
  { id: '7', name: 'Zhob' },
  { id: '8', name: 'Loralai' },
  { id: '9', name: 'Dera Bugti' },
  { id: '10', name: 'Nushki' },
  { id: '11', name: 'Pishin' },
  { id: '12', name: 'Mastung' },
  { id: '13', name: 'Kalat' },
  { id: '14', name: 'Panjgur' },
  { id: '15', name: 'Washuk' },
  { id: '16', name: 'Kech' },
  { id: '17', name: 'Awaran' },
  { id: '18', name: 'Lasbela' },
  { id: '19', name: 'Jaffarabad' },
  { id: '20', name: 'Nasirabad' },
  { id: '21', name: 'Jhal Magsi' },
  { id: '22', name: 'Bolan' },
  { id: '23', name: 'Ziarat' },
  { id: '24', name: 'Harnai' },
  { id: '25', name: 'Sherani' },
  { id: '26', name: 'Musakhel' },
  { id: '27', name: 'Barkhan' },
  { id: '28', name: 'Kohlu' },
  { id: '29', name: 'Dera Murad Jamali' },
  { id: '30', name: 'Kharan' },
  { id: '31', name: 'Chaghai' },
  { id: '32', name: 'Dalbandin' },
  { id: '33', name: 'Kharan' },
];

export default function BalochistanVerification() {
  const [registrationNo, setRegistrationNo] = useState('');
  const [district, setDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true); setSearched(false);
    try {
      let location: any = undefined;
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          location = await new Promise((resolve) => {
            const timer = setTimeout(() => resolve(undefined), 5000);
            navigator.geolocation.getCurrentPosition((pos) => { clearTimeout(timer); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); }, () => { clearTimeout(timer); resolve(undefined); }, { enableHighAccuracy: false, maximumAge: 0, timeout: 5000 });
          });
        } catch { location = undefined; }
      }
      const payload: any = { registrationNo, district };
      if (location) payload.location = location;
      const { data } = await API.post('/verify/balochistan', payload);
      setResult(data);
    } catch { setResult({ found: false, data: null }); }
    finally { setLoading(false); setSearched(true); }
  };

  return (
    <DashboardLayout title="Balochistan Vehicle Verification" subtitle="Search by Registration Number and District Name">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">Search Vehicle</h3>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vehicle Registration Number *</label>
              <input type="text" required value={registrationNo}
                onChange={e => setRegistrationNo(e.target.value.toUpperCase())}
                placeholder="e.g. BAL-1234, QTA-5678"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 font-mono text-base sm:text-lg tracking-wider uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">District *</label>
              <select required value={district} onChange={e => setDistrict(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 text-gray-900">
                <option value="">Select District</option>
                {balochistanDistricts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-base shadow-sm hover:shadow-md">
              {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>Searching...</> : <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>Search Vehicle</>}
            </button>
          </form>
        </div>

        {searched && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <h3 className="font-bold text-gray-900 mb-5 text-lg border-b border-gray-100 pb-3">Search Results</h3>
            <VehicleResult found={result?.found} data={result?.data} service="Balochistan" />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
