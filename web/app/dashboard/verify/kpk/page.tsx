import MultiSearchForm from '@/components/verify/MultiSearchForm';

export default function KPKVerification() {
  return (
    <MultiSearchForm
      title="KPK Vehicle Verification"
      subtitle="Search by CNIC, Chassis, Engine or Registration No."
      endpoint="/verify/kpk"
      searchTypes={[
        { value: 'registration', label: 'Registration No.', placeholder: 'e.g. A-1234, PES-5678', mono: true },
        { value: 'cnic', label: 'CNIC', placeholder: 'e.g. 17301-1234567-1' },
        { value: 'chassis', label: 'Chassis No.', placeholder: 'e.g. JTEHX05J704009213', mono: true },
        { value: 'engine', label: 'Engine No.', placeholder: 'e.g. 2NZ1234567', mono: true },
      ]}
      color="bg-teal-600 hover:bg-teal-700"
    />
  );
}
