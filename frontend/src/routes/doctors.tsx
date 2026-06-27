import { createFileRoute } from '@tanstack/react-router';

import { DoctorsDirectoryPage } from '@/pages/DoctorsDirectoryPage';

export const Route = createFileRoute('/doctors')({
  component: DoctorsDirectoryPage,
});
