import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/ui/PageHeader';

export const Route = createFileRoute(
  '/_patientLayout/patient/appointments/$id'
)({
  component: PatientAppointmentDetails,
});

function PatientAppointmentDetails() {
  const { t } = useTranslation('patient');

  return (
    <PageHeader
      title={t('placeholder.title')}
      description={t('placeholder.description')}
      variant="muted"
    />
  );
}

export default PatientAppointmentDetails;
