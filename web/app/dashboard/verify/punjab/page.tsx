import MultiSearchForm from '@/components/verify/MultiSearchForm';

export default function PunjabVerification() {
  return (
    <MultiSearchForm
      title="Punjab Vehicle Verification"
      subtitle="Search by Registration Number or CNIC"
      endpoint="/verify/punjab"
      searchTypes={[
        { value: 'registration', label: 'Registration No.', placeholder: 'e.g. LEA-123, LHR-2345, LEB-9898', mono: true },
        { value: 'cnic', label: 'Owner CNIC', placeholder: 'e.g. 35201-1234567-1' },
      ]}
      color="bg-green-600 hover:bg-green-700"
    />
  );
}
