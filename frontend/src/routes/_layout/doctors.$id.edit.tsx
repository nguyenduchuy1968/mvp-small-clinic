import type { UserPublic } from '@/client';
import { UsersService } from '@/client';
import EditDoctor from '@/components/Doctors/EditDoctor';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoctor } from '@/hooks/useDoctor';
import { canEditDoctors } from '@/utils/authorization';
import type { QueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_layout/doctors/$id/edit')({
  component: RouteComponent,
  beforeLoad: async (ctx) => {
    const context = ctx.context as { queryClient: QueryClient };
    const queryClient: QueryClient = context.queryClient;
    let user = queryClient.getQueryData<UserPublic>(['currentUser']);

    if (!user) {
      try {
        user = await queryClient.fetchQuery({
          queryKey: ['currentUser'],
          queryFn: UsersService.readUserMe,
        });
      } catch {
        throw redirect({ to: '/' });
      }
    }

    if (!canEditDoctors(user)) {
      throw redirect({ to: '/' });
    }
  },
  head: ({ params }) => ({
    meta: [
      {
        title: `Edit Doctor - ${params.id}`,
      },
    ],
  }),
});

function RouteComponent() {
  const { t } = useTranslation('common');
  const { id } = Route.useParams();
  const { data: doctor, isLoading } = useDoctor(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" disabled className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('actions.back')}
        </Button>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">{t('states.notFound')}</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/doctors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('actions.back')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/doctors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('actions.back')}
        </Link>
      </Button>
      <EditDoctor doctor={doctor} onSuccess={() => {}} />
    </div>
  );
}
