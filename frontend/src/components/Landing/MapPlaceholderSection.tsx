import { MapIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { SectionHeader } from '@/components/ui/SectionHeader';

export function MapPlaceholderSection() {
  const { t } = useTranslation('landing');

  return (
    <section className="bg-[#F3F4F6] px-4 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <SectionHeader title={t('map.title')} />
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-[#F9FAFB] p-16 text-center shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <MapIcon className="h-10 w-10" />
          </div>
          <h3 className="mt-6 text-2xl font-semibold text-gray-900">
            {t('map.comingSoon')}
          </h3>
          <p className="mt-3 max-w-md text-[19px] text-gray-500 leading-relaxed">
            {t('map.description')}
          </p>
        </div>
      </div>
    </section>
  );
}
