'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import API from '@/lib/api';

const provinces = ['punjab','islamabad','sindh','kpk','ajk','balochistan','stolen','noncustom'];
const provinceBadgeColors: Record<string, string> = {
  punjab: 'bg-green-100 text-green-700', islamabad: 'bg-blue-100 text-blue-700',
  sindh: 'bg-indigo-100 text-indigo-700', kpk: 'bg-teal-100 text-teal-700',
  ajk: 'bg-sky-100 text-sky-700', balochistan: 'bg-orange-100 text-orange-700',
  stolen: 'bg-red-100 text-red-700', noncustom: 'bg-purple-100 text-purple-700',
};

const emptyVehicle = {
  province: 'punjab', registrationNo: '', ownerName: '', ownerCnic: '', ownerPhone: '', ownerAddress: '',
  vehicleMake: '', vehicleModel: '', vehicleYear: '', vehicleColor: '', vehicleType: '',
  engineNo: '', chassisNo: '', engineCapacity: '', fuelType: '',
  tokenTax: '', fitnessExpiry: '', district: '', isStolen: false, isNonCustom: false,
  stolenDate: '', stolenFrom: '', customsDuty: '', status: 'active',
};

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [province, setProvince] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyVehicle);
  const [saving, setSaving] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/admin/vehicles?page=${page}&limit=15&province=${province}&search=${search}`);
      setVehicles(data.vehicles); setTotalPages(data.pages);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchVehicles(); }, [page, search, province]);

  const openAdd = () => { setEditVehicle(null); setForm(emptyVehicle); setShowModal(true); };
  const openEdit = (v: any) => { setEditVehicle(v); setForm({...emptyVehicle, ...v}); setShowModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editVehicle) await API.put(`/admin/vehicles/${editVehicle._id}`, form);
      else await API.post('/admin/vehicles', form);
      setShowModal(false); fetchVehicles();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vehicle record?')) return;
    await API.delete(`/admin/vehicles/${id}`);
    fetchVehicles();
  };

  const F = ({ label, name, type = 'text', half = false }: any) => (
    <div className={half ? '' : 'sm:col-span-2'}>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input type={type} value={form[name] || ''} onChange={e => setForm((f: any) => ({...f, [name]: e.target.value}))}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm" />
    </div>
  );

  return (
    <DashboardLayout title="Vehicle Records" subtitle="Manage vehicle verification database" adminOnly>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input type="text" placeholder="Search reg. no, name..." value={search} onChange={e => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 w-full sm:w-56" />
            <select value={province} onChange={e => setProvince(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 w-full sm:w-auto">
              <option value="">All Provinces</option>
              {provinces.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
          </div>
          <button onClick={openAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all w-full sm:w-auto">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Add Vehicle
          </button>
        </div>

        {loading ? (
          <div className="py-14 text-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/><p className="text-gray-400">Loading records...</p></div>
        ) : vehicles.length === 0 ? (
          <div className="py-14 text-center text-gray-400"><div className="text-4xl mb-2">🚗</div><p className="font-medium">No vehicle records found</p><p className="text-sm mt-1">Add records using the button above</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full min-w-[960px]">
              <thead>
                <tr><th>#</th><th>Province</th><th>Reg. No.</th><th>Owner</th><th>Make/Model</th><th>Chassis No.</th><th>Engine No.</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {vehicles.map((v: any, i: number) => (
                  <tr key={v._id}>
                    <td className="text-gray-400 text-xs">{(page-1)*15+i+1}</td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${provinceBadgeColors[v.province] || 'bg-gray-100 text-gray-700'}`}>
                        {v.province}
                      </span>
                    </td>
                    <td className="font-mono font-bold text-gray-900 text-sm">{v.registrationNo || '—'}</td>
                    <td>
                      <p className="font-semibold text-gray-900 text-sm">{v.ownerName || '—'}</p>
                      <p className="text-xs text-gray-400">{v.ownerCnic || ''}</p>
                    </td>
                    <td className="text-gray-700 text-sm">{[v.vehicleMake, v.vehicleModel].filter(Boolean).join(' ') || '—'}</td>
                    <td className="font-mono text-xs text-gray-600">{v.chassisNo || '—'}</td>
                    <td className="font-mono text-xs text-gray-600">{v.engineNo || '—'}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${v.isStolen ? 'bg-red-100 text-red-700' : v.isNonCustom ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {v.isStolen ? '⚠️ Stolen' : v.isNonCustom ? '🚫 Non-Custom' : '✅ Active'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(v)} className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors">Edit</button>
                        <button onClick={() => handleDelete(v._id)} className="px-2.5 py-1 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">Del</button>
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

      {/* Vehicle Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900 text-lg">{editVehicle ? 'Edit Vehicle' : 'Add Vehicle Record'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Province *</label>
                  <select value={form.province} onChange={e => setForm({...form, province: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm">
                    {provinces.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                  </select>
                </div>
                <F label="Registration No." name="registrationNo" half />
                <F label="District" name="district" half />
                <div className="sm:col-span-2 border-t pt-3 mt-1"><p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Owner Information</p></div>
                <F label="Owner Name" name="ownerName" />
                <F label="Owner CNIC" name="ownerCnic" half />
                <F label="Owner Phone" name="ownerPhone" half />
                <F label="Owner Address" name="ownerAddress" />
                <div className="sm:col-span-2 border-t pt-3 mt-1"><p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Vehicle Details</p></div>
                <F label="Make (e.g. Toyota)" name="vehicleMake" half />
                <F label="Model (e.g. Corolla)" name="vehicleModel" half />
                <F label="Year" name="vehicleYear" half />
                <F label="Color" name="vehicleColor" half />
                <F label="Type (Car/Motorcycle/etc.)" name="vehicleType" half />
                <F label="Fuel Type" name="fuelType" half />
                <F label="Chassis No." name="chassisNo" half />
                <F label="Engine No." name="engineNo" half />
                <F label="Engine Capacity (cc)" name="engineCapacity" half />
                <F label="Token Tax" name="tokenTax" half />
                <F label="Fitness Expiry" name="fitnessExpiry" half />
                <F label="Route Permit" name="routePermit" half />
                <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isStolen} onChange={e => setForm({...form, isStolen: e.target.checked})} className="w-4 h-4 rounded" />
                    <span className="text-sm font-medium text-red-600">Mark as Stolen</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isNonCustom} onChange={e => setForm({...form, isNonCustom: e.target.checked})} className="w-4 h-4 rounded" />
                    <span className="text-sm font-medium text-orange-600">Mark as Non-Custom</span>
                  </label>
                </div>
                {form.isStolen && <><F label="Stolen Date" name="stolenDate" half /><F label="Stolen From" name="stolenFrom" half /></>}
                {form.isNonCustom && <F label="Customs Duty Details" name="customsDuty" />}
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-60 text-sm flex items-center justify-center gap-2">
                {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Saving...</> : editVehicle ? 'Save Changes' : 'Add Vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
