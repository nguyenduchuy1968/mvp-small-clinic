import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/ui/PageHeader';

export const Route = createFileRoute('/_patientLayout/patient/history')({
  component: PatientHistory,
});

function PatientHistory() {
  const { t } = useTranslation('patient');

  return (
    <PageHeader
      title={t('placeholder.title')}
      description={t('placeholder.description')}
      variant="muted"
    />
  );
}

export default PatientHistory;
