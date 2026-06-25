import { useNavigate } from '@tanstack/react-router';
import { Calendar, Menu, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/components/Common/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { clinicConfig } from '@/config/clinic';

interface LandingHeaderProps {
  onNavigate: (sectionId: string) => void;
}

const NAV_ITEMS = [
  { key: 'home', sectionId: 'hero-section' },
  { key: 'services', sectionId: 'services-section' },
  { key: 'doctors', sectionId: 'doctors-section' },
  { key: 'about', sectionId: 'about-section' },
  { key: 'contact', sectionId: 'contact-section' },
] as const;

export function LandingHeader({ onNavigate }: LandingHeaderProps) {
  const { t, i18n } = useTranslation('landing');
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isVietnamese = i18n.language?.startsWith('vi');
  const clinicName = isVietnamese ? clinicConfig.name : clinicConfig.nameEn;

  const handleNavClick = useCallback(
    (sectionId: string) => {
      setMobileOpen(false);
      if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        onNavigate(sectionId);
      }
    },
    [onNavigate]
  );

  return (
    <header className="sticky top-0 z-50 h-[104px] border-b border-[#E6E9ED] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo — reduced ~20% for lighter feel */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white text-base font-bold shadow-sm">
            H
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[18px] font-extrabold tracking-tight text-teal-700 leading-none">
              {clinicName}
            </span>
            <span className="mt-0.5 text-[12px] font-medium text-gray-400 leading-none">
              {t('hero.subtitle')}
            </span>
          </div>
        </button>

        {/* Desktop: Navigation + Right Section */}
        <div className="hidden md:flex items-center gap-6">
          {/* Navigation Container */}
          <nav className="flex items-center gap-1 rounded-xl bg-[#E8F4FA] border border-[#D6EAF5] px-6 py-2.5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.sectionId)}
                className="rounded-lg px-4 py-2 text-[18px] font-semibold text-gray-600 transition-all duration-200 hover:bg-white/70 hover:text-blue-600 active:scale-[0.97]"
              >
                {t(`nav.${item.key}`)}
              </button>
            ))}
          </nav>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Book Appointment Button */}
          <Button
            className="h-[52px] rounded-xl bg-orange-500 px-6 text-white text-[17px] font-semibold shadow-sm transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.97]"
            onClick={() => navigate({ to: '/booking' })}
          >
            <Calendar className="mr-2 h-5 w-5" />
            {t('nav.bookAppointment')}
          </Button>
        </div>

        {/* Mobile: Book button + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            className="h-10 rounded-lg bg-orange-500 px-4 text-white text-[14px] font-semibold shadow-sm transition-all duration-200 hover:bg-orange-600 active:scale-[0.97]"
            onClick={() => navigate({ to: '/booking' })}
          >
            <Calendar className="mr-1.5 h-4 w-4" />
            {t('nav.bookAppointment')}
          </Button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu — Premium card-style items */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E6E9ED] bg-white shadow-lg">
          <nav className="flex flex-col items-center px-6 py-8">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.sectionId)}
                className="w-full rounded-2xl border border-[#D6EAF5] bg-[#E8F4FA] px-4 py-[18px] text-center text-[18px] font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-blue-100 hover:text-blue-700 active:scale-[0.97] mb-4 last:mb-0"
              >
                {t(`nav.${item.key}`)}
              </button>
            ))}
            <div className="w-full pt-6 mt-6 border-t border-gray-100 flex justify-center">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
