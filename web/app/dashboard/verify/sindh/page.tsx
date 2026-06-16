import MultiSearchForm from '@/components/verify/MultiSearchForm';

export default function SindhVerification() {
  return (
    <MultiSearchForm
      title="Sindh Vehicle Verification"
      subtitle="Search by CNIC, Chassis, Engine or Registration No."
      endpoint="/verify/sindh"
      searchTypes={[
        { value: 'registration', label: 'Registration No.', placeholder: 'e.g. SBA-1234', mono: true },
        { value: 'cnic', label: 'CNIC', placeholder: 'e.g. 42101-1234567-1' },
        { value: 'chassis', label: 'Chassis No.', placeholder: 'e.g. JTEHX05J704009213', mono: true },
        { value: 'engine', label: 'Engine No.', placeholder: 'e.g. 2NZ1234567', mono: true },
      ]}
      color="bg-indigo-600 hover:bg-indigo-700"
    />
  );
}
