import { useNavigate } from '@tanstack/react-router';
import { Calendar, CheckCircle, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onViewDoctors: () => void;
}

const trustBadges = [
  { key: 'experiencedDoctors', icon: CheckCircle },
  { key: 'onlineBooking', icon: CheckCircle },
  { key: 'sameDayAppointments', icon: CheckCircle },
] as const;

export function HeroSection({ onViewDoctors }: HeroSectionProps) {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();

  return (
    <section
      id="hero-section"
      className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4 py-16 md:py-24 lg:py-32"
    >
      {/* Subtle decorative background shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-teal-100/30" />
        <div className="absolute -bottom-32 -right-32 h-[30rem] w-[30rem] rounded-full bg-cyan-100/25" />
        <div className="absolute left-1/3 top-1/4 h-48 w-48 rounded-full bg-teal-100/20" />
        <div className="absolute bottom-1/4 right-1/4 h-36 w-36 rounded-full bg-blue-50/30" />
        {/* Decorative dots */}
        <div className="absolute left-[15%] top-[20%] h-2 w-2 rounded-full bg-teal-300/40" />
        <div className="absolute right-[20%] top-[30%] h-3 w-3 rounded-full bg-teal-300/30" />
        <div className="absolute bottom-[25%] left-[25%] h-2 w-2 rounded-full bg-cyan-300/30" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-20">
          {/* Left: Text Content */}
          <div className="flex-1 text-center lg:text-left lg:max-w-xl">
            {/* Subtitle badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-1.5 text-sm font-medium text-teal-700">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              {t('hero.subtitle')}
            </div>

            {/* Main heading — improved typography hierarchy */}
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl md:text-7xl leading-[1.1]">
              {t('hero.title')}
            </h1>

            {/* Description — improved whitespace */}
            <p className="mt-6 max-w-xl text-[19px] text-gray-500 leading-relaxed lg:mx-0">
              {t('hero.description')}
            </p>

            {/* CTA Buttons — improved spacing */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <Button
                size="lg"
                className="h-14 min-w-[200px] rounded-xl bg-teal-600 text-white text-[19px] font-semibold shadow-lg transition-all duration-200 hover:bg-teal-700 hover:shadow-xl active:scale-[0.97]"
                onClick={() => navigate({ to: '/booking' })}
              >
                <Calendar className="mr-2 h-5 w-5" />
                {t('hero.bookAppointment')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-14 min-w-[200px] rounded-xl border-2 border-teal-200 bg-white text-teal-700 text-[19px] font-semibold shadow-sm transition-all duration-200 hover:bg-teal-50 hover:border-teal-300 active:scale-[0.97]"
                onClick={onViewDoctors}
              >
                <Users className="mr-2 h-5 w-5" />
                {t('hero.viewDoctors')}
              </Button>
            </div>

            {/* Trust badges below CTA */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 lg:justify-start">
              {trustBadges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.key}
                    className="flex items-center gap-2 text-sm text-gray-500"
                  >
                    <Icon className="h-4 w-4 text-teal-500" />
                    <span>{t(`hero.${badge.key}`)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Medical Image */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative flex items-center justify-center">
              {/* Decorative rings behind image */}
              <div className="absolute h-[460px] w-[460px] rounded-full bg-teal-100/40 sm:h-[520px] sm:w-[520px]" />
              <div className="absolute h-[360px] w-[360px] rounded-full bg-teal-50/60 sm:h-[420px] sm:w-[420px]" />

              <img
                src="/assets/images/medical/hero-doctor.svg"
                alt="Medical professional"
                className="relative h-[320px] w-[320px] object-contain sm:h-[380px] sm:w-[380px] lg:h-[440px] lg:w-[440px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
