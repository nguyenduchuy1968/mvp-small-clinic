import { CalendarCheck, HeartHandshake, Stethoscope } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FeatureCard } from '@/components/ui/FeatureCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
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
        <SectionHeader title={t('about.title')} />
        <div
          className={`mt-16 grid ${spacing.grid.wide} sm:grid-cols-2 md:grid-cols-3`}
        >
          {aboutItems.map((item) => (
            <FeatureCard
              key={item.key}
              icon={item.icon}
              title={t(`about.${item.key}`)}
              description={t(`about.${item.key}Desc`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
