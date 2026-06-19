import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { AppointmentCreate, ContactMethod } from '@/client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const CONTACT_METHODS: ContactMethod[] = [
  'phone',
  'email',
  'whatsapp',
  'viber',
  'zalo',
  'telegram',
];

function getFormSchema(t: (key: string) => string) {
  return z.object({
    patient_name: z
      .string()
      .min(1, { message: t('form.nameRequired') }),
    patient_phone: z
      .string()
      .min(1, { message: t('form.phoneRequired') }),
    patient_email: z.string().email().optional().or(z.literal('')),
    contact_method: z.string().optional(),
    notes: z.string().optional(),
  });
}

type PatientInfoFormData = z.infer<ReturnType<typeof getFormSchema>>;

interface PatientInfoFormProps {
  onSubmit: (data: AppointmentCreate) => void;
  isPending: boolean;
  defaultValues?: Partial<PatientInfoFormData>;
}

export function PatientInfoForm({
  onSubmit,
  isPending,
  defaultValues,
}: PatientInfoFormProps) {
  const { t } = useTranslation('booking');
  const formSchema = getFormSchema(t);

  const form = useForm<PatientInfoFormData>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    criteriaMode: 'all',
    defaultValues: {
      patient_name: '',
      patient_phone: '',
      patient_email: '',
      contact_method: 'phone',
      notes: '',
      ...defaultValues,
    },
  });

  const handleSubmit = (data: PatientInfoFormData) => {
    const appointmentData: AppointmentCreate = {
      doctor_id: '', // Will be filled by BookingWizard
      patient_name: data.patient_name,
      patient_phone: data.patient_phone,
      patient_email: data.patient_email || null,
      contact_method: (data.contact_method as ContactMethod) || undefined,
      appointment_date: '', // Will be filled by BookingWizard
      appointment_time: '', // Will be filled by BookingWizard
      notes: data.notes || null,
    };
    onSubmit(appointmentData);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="patient_name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>
                  {t('form.patientName')}{' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.patientName')}
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
            name="patient_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('form.patientPhone')}{' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.patientPhone')}
                    type="tel"
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
            name="patient_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.patientEmail')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('form.patientEmail')}
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.contactMethod')}</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.contactMethod')} />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {t(`form.contactMethods.${method}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>{t('form.notes')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('form.notes')}
                    className="min-h-20"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isPending && (
          <p className="text-sm text-muted-foreground">
            {t('submit.button')}...
          </p>
        )}
      </form>
    </Form>
  );
}
