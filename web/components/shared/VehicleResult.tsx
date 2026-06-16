'use client';

interface VehicleData {
  registrationNo?: string;
  ownerName?: string;
  fatherName?: string;
  ownerCnic?: string;
  ownerAddress?: string;
  ownerPhone?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleYear?: string;
  vehicleType?: string;
  engineNo?: string;
  chassisNo?: string;
  engineCapacity?: string;
  fuelType?: string;
  tokenTax?: string;
  fitnessExpiry?: string;
  routePermit?: string;
  district?: string;
  province?: string;
  isStolen?: boolean;
  isNonCustom?: boolean;
  stolenDate?: string;
  stolenFrom?: string;
  customsDuty?: string;
  status?: string;
  additionalInfo?: Record<string, any>;
}

interface Props {
  data: VehicleData | VehicleData[] | null;
  found: boolean;
  service: string;
}

function normalizeFieldValue(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function FieldRow({ label, value }: { label: string; value?: unknown }) {
  const safeValue = normalizeFieldValue(value);
  if (!safeValue) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-1 rounded transition-colors">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <span className="text-sm font-semibold text-gray-900 sm:text-right break-words sm:max-w-xs">{safeValue}</span>
    </div>
  );
}

type DisplayField = { label: string; value?: unknown };

const OWNER_LABEL_KEYWORDS = [
  'owner',
  'father',
  'mother',
  'guardian',
  'cnic',
  'nic',
  'address',
  'phone',
  'mobile',
  'contact',
  'applicant',
  'nominee',
  's/o',
  'd/o',
  'w/o',
];

function isOwnerRelatedLabel(label: string): boolean {
  const normalized = label.toLowerCase();
  return OWNER_LABEL_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function splitAdditionalInfo(info?: Record<string, any>) {
  const ownerFields: DisplayField[] = [];
  const vehicleFields: DisplayField[] = [];
  if (!info) return { ownerFields, vehicleFields };

  for (const [rawLabel, rawValue] of Object.entries(info)) {
    const value = normalizeFieldValue(rawValue);
    if (!value) continue;

    const label = String(rawLabel).replace(/_/g, ' ').trim();
    if (!label) continue;

    if (isOwnerRelatedLabel(label)) ownerFields.push({ label, value });
    else vehicleFields.push({ label, value });
  }

  return { ownerFields, vehicleFields };
}

function mergeUniqueFields(baseFields: DisplayField[], extraFields: DisplayField[]): DisplayField[] {
  const merged: DisplayField[] = [...baseFields];
  const seenLabels = new Set(
    baseFields
      .filter((field) => normalizeFieldValue(field.value))
      .map((field) => field.label.toLowerCase())
  );

  for (const field of extraFields) {
    const key = field.label.toLowerCase();
    if (seenLabels.has(key)) continue;
    seenLabels.add(key);
    merged.push(field);
  }
  return merged;
}

function SingleResult({ v }: { v: VehicleData }) {
  const statusColor = v.isStolen ? 'bg-red-100 text-red-700 border-red-200' : v.isNonCustom ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-green-100 text-green-700 border-green-200';
  const statusText = v.isStolen ? '⚠️ STOLEN VEHICLE' : v.isNonCustom ? '🚫 NON-CUSTOM VEHICLE' : '✅ VERIFIED VEHICLE';
  const { ownerFields: ownerExtraFields, vehicleFields: vehicleExtraFields } = splitAdditionalInfo(v.additionalInfo);

  const ownerFields = mergeUniqueFields(
    [
      { label: 'Owner Name', value: v.ownerName },
      { label: 'Father Name', value: v.fatherName },
      { label: 'CNIC', value: v.ownerCnic },
      { label: 'Address', value: v.ownerAddress },
      { label: 'Phone Number', value: v.ownerPhone },
    ],
    ownerExtraFields
  );

  const vehicleFields = mergeUniqueFields(
    [
      { label: 'Registration No.', value: v.registrationNo },
      { label: 'Make / Model', value: v.vehicleMake && v.vehicleModel ? `${v.vehicleMake} ${v.vehicleModel}` : v.vehicleMake || v.vehicleModel },
      { label: 'Year', value: v.vehicleYear },
      { label: 'Color', value: v.vehicleColor },
      { label: 'Type', value: v.vehicleType },
      { label: 'Province', value: v.province?.toUpperCase() },
      { label: 'District', value: v.district },
      { label: 'Engine No.', value: v.engineNo },
      { label: 'Chassis No.', value: v.chassisNo },
      { label: 'Engine Capacity', value: v.engineCapacity },
      { label: 'Fuel Type', value: v.fuelType },
      { label: 'Token Tax', value: v.tokenTax },
      { label: 'Fitness Expiry', value: v.fitnessExpiry },
      { label: 'Route Permit', value: v.routePermit },
      { label: 'Stolen Date', value: v.isStolen ? v.stolenDate : undefined },
      { label: 'Stolen From', value: v.isStolen ? v.stolenFrom : undefined },
      { label: 'Customs Duty', value: v.isNonCustom ? v.customsDuty : undefined },
      { label: 'Status', value: v.status },
    ],
    vehicleExtraFields
  );

  return (
    <div className="animate-fadeIn">
      {/* Status Banner */}
      <div className={`p-3 rounded-xl border text-center font-bold text-sm mb-5 ${statusColor}`}>
        {statusText}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Owner Info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">👤</span>
            Owner Information
          </h3>
          {ownerFields.map((field, index) => (
            <FieldRow key={`${field.label}-${index}`} label={field.label} value={field.value} />
          ))}
        </div>

        {/* Vehicle Info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">🚗</span>
            Vehicle Information
          </h3>
          {vehicleFields.map((field, index) => (
            <FieldRow key={`${field.label}-${index}`} label={field.label} value={field.value} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function VehicleResult({ data, found, service }: Props) {
  if (!found || !data) {
    return (
      <div className="text-center py-14 animate-fadeIn">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">No Record Found</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">No vehicle found matching your search criteria in the <strong>{service}</strong> database. Please verify the information and try again.</p>
      </div>
    );
  }

  const vehicles = Array.isArray(data) ? data : [data];

  return (
    <div>
      {vehicles.length > 1 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm font-medium">
          {vehicles.length} records found
        </div>
      )}
      {vehicles.map((v, i) => (
        <div key={i} className={i > 0 ? 'mt-6 pt-6 border-t-2 border-dashed border-gray-200' : ''}>
          {vehicles.length > 1 && <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Record {i + 1}</p>}
          <SingleResult v={v} />
        </div>
      ))}
    </div>
  );
}
