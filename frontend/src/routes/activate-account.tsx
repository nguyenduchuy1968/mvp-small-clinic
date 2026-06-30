import { zodResolver } from '@hookform/resolvers/zod';
import {
  createFileRoute,
  redirect,
  Link as RouterLink,
  useNavigate,
} from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import {
  PatientAccountsService,
  type PatientAccountsActivatePatientAccountData,
} from '@/client';
import { AuthLayout } from '@/components/Common/AuthLayout';
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
import useAuth, { isLoggedIn } from '@/hooks/useAuth';
import { resolveDashboardRoute } from '@/utils/auth';
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';

type FormData = z.infer<ReturnType<typeof getFormSchema>>;

function getFormSchema(t: (key: string) => string) {
  return z
    .object({
      phone: z.string().min(1, { message: t('activateAccount.phoneRequired') }),
      email: z.string().email({ message: t('activateAccount.emailRequired') }),
      password: z
        .string()
        .min(1, { message: t('activateAccount.passwordRequired') })
        .min(8, { message: t('activateAccount.passwordMinLength') }),
      confirm_password: z
        .string()
        .min(1, { message: t('activateAccount.confirmPasswordRequired') }),
    })
    .refine((data) => data.password === data.confirm_password, {
      message: t('activateAccount.passwordsDontMatch'),
      path: ['confirm_password'],
    });
}

export const Route = createFileRoute('/activate-account')({
  component: ActivateAccount,
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
        title: 'Activate Account',
      },
    ],
  }),
});

function ActivateAccount() {
  const { t } = useTranslation('auth');
  const { loginMutation } = useAuth();
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const formSchema = getFormSchema(t);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    criteriaMode: 'all',
    defaultValues: {
      phone: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (loginMutation.isPending) return;
    setApiError(null);

    try {
      const requestBody: PatientAccountsActivatePatientAccountData = {
        requestBody: {
          phone: data.phone,
          email: data.email,
          password: data.password,
          confirm_password: data.confirm_password,
        },
      };

      const response =
        await PatientAccountsService.activatePatientAccount(requestBody);

      // Store the token and set the auth state
      localStorage.setItem('access_token', response.access_token);

      setIsSuccess(true);
    } catch (error: unknown) {
      const err = error as { body?: { detail?: string }; message?: string };
      const detail =
        err?.body?.detail ||
        err?.message ||
        'An unexpected error occurred. Please try again.';
      setApiError(detail);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-300" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {t('activateAccount.successTitle')}
            </h1>
            <p className="text-muted-foreground">
              {t('activateAccount.successMessage')}
            </p>
          </div>
          <LoadingButton
            onClick={async () => {
              const destination = await resolveDashboardRoute();
              navigate({ to: destination });
            }}
            className="w-full"
          >
            {t('activateAccount.goToDashboard')}
          </LoadingButton>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">{t('activateAccount.title')}</h1>
          </div>

          {apiError && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {apiError}
            </div>
          )}

          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('activateAccount.phone')}</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="phone-input"
                      placeholder={t('activateAccount.phonePlaceholder')}
                      type="tel"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('activateAccount.email')}</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="email-input"
                      placeholder={t('activateAccount.emailPlaceholder')}
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
                  <FormLabel>{t('activateAccount.password')}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      data-testid="password-input"
                      placeholder={t('activateAccount.passwordPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('activateAccount.confirmPassword')}</FormLabel>
                  <FormControl>
                    <PasswordInput
                      data-testid="confirm-password-input"
                      placeholder={t(
                        'activateAccount.confirmPasswordPlaceholder'
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <LoadingButton type="submit" loading={loginMutation.isPending}>
              {t('activateAccount.submit')}
            </LoadingButton>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {t('activateAccount.alreadyHaveAccount')}{' '}
            </span>
            <RouterLink
              to="/login"
              className="underline underline-offset-4 hover:text-primary"
            >
              {t('activateAccount.login')}
            </RouterLink>
          </div>
        </form>
      </Form>
    </AuthLayout>
  );
}
