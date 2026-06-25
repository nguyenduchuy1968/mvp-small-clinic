import { CalendarCheck, HeartHandshake, Stethoscope } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

const aboutItems = [
  {
    key: 'professionalDoctors',
    icon: Stethoscope,
  },
  {
    key: 'convenientScheduling',
    icon: CalendarCheck,
  },
  {
    key: 'trustedCare',
    icon: HeartHandshake,
  },
] as const;

export function AboutSection() {
  const { t } = useTranslation('landing');

  return (
    <section
      id="about-section"
      className={`bg-[#F3F4F6] px-4 ${spacing.section.default}`}
    >
      <div className={`mx-auto ${spacing.container.narrow}`}>
        <h2 className="text-center text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
          {t('about.title')}
        </h2>
        <div
          className={`mt-16 grid ${spacing.grid.wide} sm:grid-cols-2 md:grid-cols-3`}
        >
          {aboutItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className={`group ${radius.card.DEFAULT} border border-gray-200 bg-[#F9FAFB] ${spacing.card.default} text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-teal-200`}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-all duration-300 group-hover:bg-teal-100 group-hover:scale-110">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-[22px] font-semibold text-gray-900">
                  {t(`about.${item.key}`)}
                </h3>
                <p className="mt-3 text-[19px] text-gray-500 leading-relaxed">
                  {t(`about.${item.key}Desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
