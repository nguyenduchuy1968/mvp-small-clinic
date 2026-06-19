import { createFileRoute } from '@tanstack/react-router';

import { BookingPage } from '@/components/Booking/BookingPage';

export const Route = createFileRoute('/booking')({
  component: BookingPage,
  head: () => ({
    meta: [
      {
        title: 'Book Appointment',
      },
    ],
  }),
});
