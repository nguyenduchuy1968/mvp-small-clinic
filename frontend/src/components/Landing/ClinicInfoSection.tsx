import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

import { clinicConfig } from '@/config/clinic';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export function ClinicInfoSection() {
  const { t, i18n } = useTranslation('landing');

  const isVietnamese = i18n.language?.startsWith('vi');
  const address = isVietnamese ? clinicConfig.address : clinicConfig.addressEn;

  const infoItems = [
    {
      label: t('clinicInfo.address'),
      value: address,
      icon: MapPin,
    },
    {
      label: t('clinicInfo.phone'),
      value: clinicConfig.phone,
      icon: Phone,
    },
    {
      label: t('clinicInfo.email'),
      value: clinicConfig.email,
      icon: Mail,
    },
  ] as const;

  return (
    <section
      id="contact-section"
      className={`bg-white px-4 ${spacing.section.default}`}
    >
      <div className={`mx-auto ${spacing.container.narrow}`}>
        <h2 className="text-center text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
          {t('clinicInfo.title')}
        </h2>
        <div className={`mt-16 grid gap-10 md:grid-cols-2`}>
          <div className="space-y-6">
            {infoItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`flex items-start gap-4 ${radius.card.DEFAULT} border border-gray-200 bg-[#F9FAFB] ${spacing.card.compact} shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-all duration-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[19px] font-medium text-gray-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-[19px] font-medium text-gray-900">
                      {item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`${radius.card.DEFAULT} border border-gray-200 bg-[#F9FAFB] ${spacing.card.default} shadow-sm transition-all duration-300 hover:shadow-md`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-[22px] font-semibold text-gray-900">
                {t('clinicInfo.workingHours')}
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <span className="text-[19px] text-gray-500">
                  {t('clinicInfo.weekday')}
                </span>
                <span className="text-[19px] font-semibold text-gray-900">
                  {clinicConfig.workingHours.weekday}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <span className="text-[19px] text-gray-500">
                  {t('clinicInfo.saturday')}
                </span>
                <span className="text-[19px] font-semibold text-gray-900">
                  {clinicConfig.workingHours.saturday}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <span className="text-[19px] text-gray-500">
                  {t('clinicInfo.sunday')}
                </span>
                <span className="text-[19px] font-semibold text-gray-900">
                  {clinicConfig.workingHours.sunday}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
