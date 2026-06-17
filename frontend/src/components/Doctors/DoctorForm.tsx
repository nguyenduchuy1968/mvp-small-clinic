import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Textarea } from '@/components/ui/textarea';

function getFormSchema(t: (key: string) => string, isEdit: boolean) {
  const baseSchema = {
    email: z.string().email({ message: t('validation.invalidEmail') }),
    password: isEdit
      ? z
          .string()
          .refine((val) => !val || val.length >= 8, {
            message: t('validation.passwordMinLength'),
          })
          .optional()
          .or(z.literal(''))
      : z.string().min(8, { message: t('validation.passwordMinLength') }),
    full_name: z.string().min(1, { message: t('validation.fullNameRequired') }),
    specialty: z.string().optional(),
    phone: z.string().optional(),
    bio: z.string().optional(),
    experience_years: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val === '') return true;
          const num = Number(val);
          return !Number.isNaN(num) && num >= 0 && num <= 100;
        },
        { message: t('validation.experienceYearsRange') }
      ),
    consultation_duration: z.string().optional(),
    is_active: z.boolean(),
  };

  return z.object(baseSchema);
}

export type DoctorFormData = z.infer<ReturnType<typeof getFormSchema>>;

interface DoctorFormProps {
  onSubmit: (data: DoctorFormData) => void;
  defaultValues?: Partial<DoctorFormData>;
  isPending?: boolean;
  isEdit?: boolean;
  children?: React.ReactNode;
}

export function DoctorForm({
  onSubmit,
  defaultValues,
  isEdit = false,
  children,
}: DoctorFormProps) {
  const { t } = useTranslation(['doctors', 'common']);
  const formSchema = getFormSchema(t, isEdit);

  const form = useForm<DoctorFormData>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    criteriaMode: 'all',
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
      specialty: '',
      phone: '',
      bio: '',
      experience_years: undefined,
      consultation_duration: undefined,
      is_active: true,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>
                  {t('doctors:fields.fullName')}{' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('doctors:fields.fullName')}
                    {...field}
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('doctors:fields.email')}{' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('doctors:fields.email')}
                    type="email"
                    {...field}
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isEdit
                    ? t('doctors:fields.newPassword')
                    : t('doctors:fields.password')}
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder={
                      isEdit
                        ? t('doctors:fields.newPassword')
                        : t('doctors:fields.password')
                    }
                    {...field}
                  />
                </FormControl>
                {isEdit && (
                  <FormDescription>
                    {t('doctors:fields.passwordHelper')}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="specialty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('doctors:fields.specialty')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('doctors:fields.specialty')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('doctors:fields.phone')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('doctors:fields.phone')}
                    type="tel"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="experience_years"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('doctors:fields.experience')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('doctors:fields.experience')}
                    type="number"
                    min={0}
                    max={100}
                    {...field}
                    value={field.value ?? ''}
                    onKeyDown={(e) => {
                      // Prevent non-numeric input
                      if (
                        !/[0-9]/.test(e.key) &&
                        e.key !== 'Backspace' &&
                        e.key !== 'Delete' &&
                        e.key !== 'Tab' &&
                        e.key !== 'ArrowLeft' &&
                        e.key !== 'ArrowRight' &&
                        e.key !== 'Home' &&
                        e.key !== 'End'
                      ) {
                        e.preventDefault();
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="consultation_duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('doctors:fields.consultationDuration')}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('doctors:fields.consultationDuration')}
                    type="number"
                    min={5}
                    max={180}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>{t('doctors:fields.bio')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('doctors:fields.bio')}
                    className="min-h-25"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0 sm:col-span-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">
                  {t('doctors:fields.isActive')}
                </FormLabel>
              </FormItem>
            )}
          />
        </div>

        {children}
      </form>
    </Form>
  );
}
