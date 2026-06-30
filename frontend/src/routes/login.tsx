import { zodResolver } from '@hookform/resolvers/zod';
import {
  createFileRoute,
  redirect,
  Link as RouterLink,
} from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Body_login_login_access_token as AccessToken } from '@/client';
import { AuthLayout } from '@/components/Common/AuthLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/ui/loading-button';
import { PasswordInput } from '@/components/ui/password-input';
import { Separator } from '@/components/ui/separator';
import useAuth, { isLoggedIn } from '@/hooks/useAuth';
import { resolveDashboardRoute } from '@/utils/auth';

type FormData = z.infer<ReturnType<typeof getFormSchema>>;

function getFormSchema(t: (key: string) => string) {
  return z.object({
    username: z.email(),
    password: z
      .string()
      .min(1, { message: t('login.passwordRequired') })
      .min(8, { message: t('login.passwordMinLength') }),
  }) satisfies z.ZodType<AccessToken>;
}

export const Route = createFileRoute('/login')({
  component: Login,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      const destination = await resolveDashboardRoute();
      throw redirect({
        to: destination,
      });
    }
  },
  head: () => ({
    meta: [
      {
        title: 'Log In',
      },
    ],
  }),
});

function Login() {
  const { t } = useTranslation('auth');
  const { loginMutation } = useAuth();
  const formSchema = getFormSchema(t);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    criteriaMode: 'all',
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = (data: FormData) => {
    if (loginMutation.isPending) return;
    loginMutation.mutate(data);
  };

  return (
    <AuthLayout>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">{t('login.title')}</h1>
          </div>

          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('login.email')}</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="email-input"
                      placeholder={t('login.emailPlaceholder')}
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel>{t('login.password')}</FormLabel>
                    <RouterLink
                      to="/recover-password"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      {t('login.forgotPassword')}
                    </RouterLink>
                  </div>
                  <FormControl>
                    <PasswordInput
                      data-testid="password-input"
                      placeholder={t('login.passwordPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <LoadingButton type="submit" loading={loginMutation.isPending}>
              {t('login.submit')}
            </LoadingButton>
          </div>
        </form>
      </Form>

      <Separator className="my-6" />

      <Card>
        <CardContent className="flex flex-col items-center gap-6 pt-8 pb-8 px-6">
          <h2 className="text-lg font-semibold text-center text-foreground">
            {t('login.activateAccountHeadline')}
          </h2>
          <p className="text-sm text-muted-foreground text-center leading-relaxed max-w-sm">
            {t('login.activateAccountDescription')}
          </p>
          <Button asChild className="w-full sm:w-auto min-w-60">
            <RouterLink to="/activate-account">
              {t('login.activateAccountButton')}
            </RouterLink>
          </Button>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
