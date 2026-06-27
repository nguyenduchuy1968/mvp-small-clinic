import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { clinicConfig } from '@/config/clinic';
import { cn } from '@/lib/utils';

interface ClinicInfoCardProps {
  className?: string;
  compact?: boolean;
}

/**
 * Reusable Clinic Information Card.
 *
 * Displays clinic logo, name, address, telephone, and working hours.
 * Designed for Booking pages, Appointment Confirmation, and Patient Portal.
 *
 * @param className - Additional CSS classes.
 * @param compact - If true, renders a more compact version suitable for sidebars.
 */
export function ClinicInfoCard({
  className,
  compact = false,
}: ClinicInfoCardProps) {
  const { t, i18n } = useTranslation('booking');

  const isVietnamese = i18n.language?.startsWith('vi');
  const clinicName = isVietnamese ? clinicConfig.name : clinicConfig.nameEn;
  const address = isVietnamese ? clinicConfig.address : clinicConfig.addressEn;

  const infoItems = [
    { icon: MapPin, label: t('clinicInfo.address', 'Address'), value: address },
    {
      icon: Phone,
      label: t('clinicInfo.phone', 'Phone'),
      value: clinicConfig.phone,
    },
    {
      icon: Mail,
      label: t('clinicInfo.email', 'Email'),
      value: clinicConfig.email,
    },
  ] as const;

  const workingHours = [
    {
      label: t('clinicInfo.weekday', 'Mon – Fri'),
      value: clinicConfig.workingHours.weekday,
    },
    {
      label: t('clinicInfo.saturday', 'Saturday'),
      value: clinicConfig.workingHours.saturday,
    },
    {
      label: t('clinicInfo.sunday', 'Sunday'),
      value: clinicConfig.workingHours.sunday,
    },
  ] as const;

  if (compact) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden',
          className
        )}
      >
        <div className="p-5 space-y-4">
          {/* Clinic Logo + Name */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <span className="text-[18px] font-bold">+</span>
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-gray-900 truncate">
                {clinicName}
              </p>
            </div>
          </div>

          {/* Info items */}
          <div className="space-y-2.5">
            {infoItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="text-[13px] text-gray-600 truncate">
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Working hours */}
          <div className="border-t border-gray-100 pt-3 space-y-1.5">
            {workingHours.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between text-[12px]"
              >
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden',
        className
      )}
    >
      <div className="p-6 sm:p-7 space-y-5">
        {/* Clinic Logo + Name */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 text-teal-600 shadow-sm">
            <span className="text-[24px] font-bold">+</span>
          </div>
          <div>
            <p className="text-[18px] font-bold text-gray-900">{clinicName}</p>
            <p className="text-[13px] text-gray-500 mt-0.5">
              {t('clinicInfo.tagline', 'Your trusted healthcare partner')}
            </p>
          </div>
        </div>

        {/* Info items */}
        <div className="space-y-3.5">
          {infoItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p className="text-[15px] font-medium text-gray-900 mt-0.5">
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Working hours */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-teal-600" />
            <p className="text-[14px] font-semibold text-gray-800">
              {t('clinicInfo.workingHours', 'Working Hours')}
            </p>
          </div>
          <div className="space-y-2">
            {workingHours.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between text-[14px]"
              >
                <span className="text-gray-500">{item.label}</span>
                <span className="font-semibold text-gray-800">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
