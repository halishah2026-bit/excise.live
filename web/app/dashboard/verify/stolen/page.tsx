import MultiSearchForm from '@/components/verify/MultiSearchForm';

export default function StolenVerification() {
  return (
    <MultiSearchForm
      title="Stolen Vehicles Database"
      subtitle="Check if a vehicle is reported stolen - CNIC, Chassis, Engine or Reg. No."
      endpoint="/verify/stolen"
      searchTypes={[
        { value: 'registration', label: 'Registration No.', placeholder: 'e.g. LHR-1234', mono: true },
        { value: 'cnic', label: 'Owner CNIC', placeholder: 'e.g. 35201-1234567-1' },
        { value: 'chassis', label: 'Chassis No.', placeholder: 'e.g. JTEHX05J704009213', mono: true },
        { value: 'engine', label: 'Engine No.', placeholder: 'e.g. 2NZ1234567', mono: true },
      ]}
      color="bg-red-600 hover:bg-red-700"
    />
  );
}
