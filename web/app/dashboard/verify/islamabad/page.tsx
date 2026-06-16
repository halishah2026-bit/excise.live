'use client';
import { useState, FormEvent } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VehicleResult from '@/components/shared/VehicleResult';
import API from '@/lib/api';

const searchTypes = [
  { value: 'registration', label: 'Registration No.', placeholder: 'e.g. ISB-1234', mono: true },
  { value: 'cnic', label: 'CNIC', placeholder: 'e.g. 61101-1234567-1', mono: false },
  { value: 'chassis', label: 'Chassis No.', placeholder: 'e.g. JTEHX05J704009213', mono: true },
  { value: 'engine', label: 'Engine No.', placeholder: 'e.g. 2NZ1234567', mono: true },
];

export default function IslamabadVerification() {
  const [searchType, setSearchType] = useState('registration');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  const activeType = searchTypes.find(t => t.value === searchType)!;

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
      const payload: any = { searchType, searchValue };
      if (location) payload.location = location;
      const { data } = await API.post('/verify/islamabad', payload);
      setResult(data);
    } catch {
      setResult({ found: false, data: null });
    } finally {
      setLoading(false); setSearched(true);
    }
  };

  return (
    <DashboardLayout title="Islamabad Vehicle Verification" subtitle="Search by CNIC, Chassis, Engine or Registration No.">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">Search Vehicle</h3>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search By</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchTypes.map(t => (
                  <button key={t.value} type="button" onClick={() => { setSearchType(t.value); setSearchValue(''); }}
                    className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${searchType === t.value ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{activeType.label} *</label>
              <input type="text" required value={searchValue}
                onChange={e => setSearchValue(searchType === 'chassis' || searchType === 'engine' || searchType === 'registration' ? e.target.value.toUpperCase() : e.target.value)}
                placeholder={activeType.placeholder}
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${activeType.mono ? 'font-mono text-base sm:text-lg tracking-wider uppercase' : ''}`}
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-base shadow-sm hover:shadow-md">
              {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>Searching...</> : <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>Search Vehicle</>}
            </button>
          </form>
        </div>

        {searched && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <h3 className="font-bold text-gray-900 mb-5 text-lg border-b border-gray-100 pb-3">Search Results</h3>
            <VehicleResult found={result?.found} data={result?.data} service="Islamabad" />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
