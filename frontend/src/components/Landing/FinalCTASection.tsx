import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { spacing } from '@/theme/spacing';

export function FinalCTASection() {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();

  return (
    <section
      className={`bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4 ${spacing.section.default}`}
    >
      <div className={`mx-auto ${spacing.container.tight} text-center`}>
        <h2 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl leading-tight">
          {t('cta.title')}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[19px] text-gray-500 leading-relaxed">
          {t('cta.description')}
        </p>
        <div className="mt-10">
          <Button
            size="lg"
            className="h-14 min-w-[220px] rounded-xl bg-teal-600 text-white text-[19px] font-semibold shadow-lg transition-all duration-200 hover:bg-teal-700 hover:shadow-xl active:scale-[0.97]"
            onClick={() => navigate({ to: '/booking' })}
          >
            <Calendar className="mr-2 h-5 w-5" />
            {t('cta.bookAppointment')}
          </Button>
        </div>
      </div>
    </section>
  );
}
