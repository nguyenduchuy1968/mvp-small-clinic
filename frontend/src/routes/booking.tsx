import { createFileRoute } from '@tanstack/react-router';

import { BookingPage } from '@/components/Booking/BookingPage';
import i18next from '@/i18n';

export const Route = createFileRoute('/booking')({
  component: BookingPage,
  head: () => ({
    meta: [
      {
        title: i18next.t('booking:title'),
      },
    ],
  }),
});
