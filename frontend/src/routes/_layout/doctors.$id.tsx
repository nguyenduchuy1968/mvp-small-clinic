import { createFileRoute } from '@tanstack/react-router';

import { DoctorDetails } from '@/components/Doctors/DoctorDetails';

export const Route = createFileRoute('/_layout/doctors/$id')({
  component: RouteComponent,
  head: ({ params }) => ({
    meta: [
      {
        title: `Doctor - ${params.id}`,
      },
    ],
  }),
});

function RouteComponent() {
  const { id } = Route.useParams();

  return <DoctorDetails doctorId={id} onBack={() => window.history.back()} />;
}
