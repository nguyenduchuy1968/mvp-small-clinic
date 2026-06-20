import { zodResolver } from '@hookform/resolvers/zod';
import { forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { Weekday } from '@/client';
import { Checkbox } from '@/components/ui/checkbox';
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

const WEEKDAYS: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

function getFormSchema(t: (key: string) => string) {
  return z
    .object({
      weekday: z.string().min(1, { message: t('validation.required') }),
      start_time: z.string().min(1, { message: t('validation.required') }),
      end_time: z.string().min(1, { message: t('validation.required') }),
      duration_minutes: z.string().optional(),
      is_active: z.boolean(),
    })
    .refine(
      (data) => {
        if (!data.start_time || !data.end_time) return true;
        return data.end_time > data.start_time;
      },
      {
        message: t('validation.endTimeAfterStart'),
        path: ['end_time'],
      }
    );
}

export type AvailabilityFormData = z.infer<ReturnType<typeof getFormSchema>>;

interface AvailabilityFormProps {
  onSubmit: (data: AvailabilityFormData) => void;
  defaultValues?: Partial<AvailabilityFormData>;
  isPending?: boolean;
  children?: React.ReactNode;
}

export const AvailabilityForm = forwardRef<HTMLFormElement, AvailabilityFormProps>(
  function AvailabilityForm({ onSubmit, defaultValues, children }, ref) {
  const { t } = useTranslation(['availability', 'common']);
  const formSchema = getFormSchema(t);

  const form = useForm<AvailabilityFormData>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    criteriaMode: 'all',
    defaultValues: {
      weekday: '',
      start_time: '',
      end_time: '',
      duration_minutes: '30',
      is_active: true,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form ref={ref} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="weekday"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>
                  {t('availability:fields.weekday')}{' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('availability:fields.weekday')}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {WEEKDAYS.map((day) => (
                      <SelectItem key={day} value={day}>
                        {t(`availability:weekdays.${day}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('availability:fields.startTime')}{' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="time" step="60" placeholder="HH:MM" {...field} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('availability:fields.endTime')}{' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="time" step="60" placeholder="HH:MM" {...field} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('availability:fields.duration')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('availability:fields.duration')}
                    type="number"
                    min={5}
                    max={480}
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
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">
                  {t('availability:fields.isActive')}
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
);
