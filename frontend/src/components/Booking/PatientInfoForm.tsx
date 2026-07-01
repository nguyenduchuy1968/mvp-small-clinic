import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Mail, MessageSquare, Phone, User } from 'lucide-react';
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
import { cn } from '@/lib/utils';

const CONTACT_METHODS: ContactMethod[] = [
  'phone',
  'email',
  'whatsapp',
  'viber',
  'zalo',
  'telegram',
];

/**
 * Strip common phone number separators (spaces, dashes, dots, parentheses).
 */
function normalizePhone(value: string): string {
  return value.replace(/[\s\-.()]/g, '');
}

/**
 * Vietnam phone number regex (applied AFTER normalization).
 * Supports:
 *   - +84[3-9]XXXXXXXXX (international format, 11 digits after +84)
 *   - 0[3-9]XXXXXXXXX   (domestic format, 10 digits)
 *
 * Examples: +84 123 456 789, 0123 456 789, +84912345678, 0912345678
 */
const PHONE_REGEX = /^(\+84|0)[3-9]\d{8,9}$/;

function getFormSchema(t: (key: string) => string) {
  return z.object({
    patient_name: z.string().min(1, { message: t('form.nameRequired') }),
    patient_phone: z
      .string()
      .min(1, { message: t('form.phoneRequired') })
      .transform(normalizePhone)
      .refine((val) => PHONE_REGEX.test(val), {
        message: t('form.phoneInvalid'),
      }),
    patient_email: z
      .string()
      .email({ message: t('form.emailInvalid') })
      .optional()
      .or(z.literal('')),
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* ── Section: Personal Information ──────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
              <User className="h-5 w-5 text-teal-600" />
            </div>
            <h3 className="text-[22px] sm:text-[24px] font-bold text-gray-900 tracking-tight">
              {t('form.sectionPersonalInfo')}
            </h3>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="patient_name"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className="text-[14px] font-semibold text-gray-700">
                    {t('form.patientName')}{' '}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('form.patientNamePlaceholder')}
                      {...field}
                      required
                      className={cn(
                        'h-12 rounded-xl border-gray-200 bg-white text-[16px] text-gray-900 placeholder:text-gray-400 transition-all',
                        'hover:border-gray-300',
                        'focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20'
                      )}
                    />
                  </FormControl>
                  <FormMessage className="text-[13px] text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="patient_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[14px] font-semibold text-gray-700">
                    {t('form.patientPhone')}{' '}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={t('form.patientPhonePlaceholder')}
                        type="tel"
                        {...field}
                        required
                        className={cn(
                          'h-12 rounded-xl border-gray-200 bg-white text-[16px] text-gray-900 placeholder:text-gray-400 pl-10 transition-all',
                          'hover:border-gray-300',
                          'focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20'
                        )}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[13px] text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="patient_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[14px] font-semibold text-gray-700">
                    {t('form.patientEmail')}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={t('form.patientEmailPlaceholder')}
                        type="email"
                        {...field}
                        className={cn(
                          'h-12 rounded-xl border-gray-200 bg-white text-[16px] text-gray-900 placeholder:text-gray-400 pl-10 transition-all',
                          'hover:border-gray-300',
                          'focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20'
                        )}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[13px] text-red-500" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Section: Contact Preferences ───────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
              <MessageSquare className="h-5 w-5 text-teal-600" />
            </div>
            <h3 className="text-[22px] sm:text-[24px] font-bold text-gray-900 tracking-tight">
              {t('form.sectionContactPref')}
            </h3>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="contact_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[14px] font-semibold text-gray-700">
                    {t('form.contactMethod')}
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger
                        className={cn(
                          'h-12 rounded-xl border-gray-200 bg-white text-[16px] text-gray-900 transition-all',
                          'hover:border-gray-300',
                          'focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20'
                        )}
                      >
                        <SelectValue placeholder={t('form.contactMethod')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CONTACT_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {t(`form.contactMethods.${method}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-[13px] text-red-500" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Section: Additional Notes ──────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
              <FileText className="h-5 w-5 text-teal-600" />
            </div>
            <h3 className="text-[22px] sm:text-[24px] font-bold text-gray-900 tracking-tight">
              {t('form.sectionNotes')}
            </h3>
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[14px] font-semibold text-gray-700">
                  {t('form.notes')}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('form.notesPlaceholder')}
                    className={cn(
                      'min-h-28 rounded-xl border-gray-200 bg-white text-[16px] text-gray-900 placeholder:text-gray-400 transition-all',
                      'hover:border-gray-300',
                      'focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20'
                    )}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[13px] text-red-500" />
              </FormItem>
            )}
          />
        </div>

        {isPending && (
          <p className="text-[15px] text-gray-500 text-center">
            {t('submit.button')}...
          </p>
        )}
      </form>
    </Form>
  );
}
