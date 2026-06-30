import { useNavigate } from '@tanstack/react-router';
import { Calendar, LogIn, Menu, User, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/components/Common/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { clinicConfig } from '@/config/clinic';
import { isLoggedIn } from '@/hooks/useAuth';

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
    <header className="sticky top-0 z-50 h-26 border-b border-[#E6E9ED] bg-white/95 backdrop-blur-sm">
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

          {/* Patient Login / My Portal */}
          <Button
            variant="outline"
            className="h-13 rounded-xl border-teal-600 px-6 text-teal-700 text-[17px] font-semibold shadow-sm transition-all duration-200 hover:bg-teal-50 hover:text-teal-800 active:scale-[0.97]"
            onClick={() =>
              navigate({
                to: isLoggedIn() ? '/patient/dashboard' : '/login',
              })
            }
          >
            {isLoggedIn() ? (
              <User className="mr-2 h-5 w-5" />
            ) : (
              <LogIn className="mr-2 h-5 w-5" />
            )}
            {isLoggedIn() ? t('nav.myPortal') : t('nav.patientLogin')}
          </Button>

          {/* Book Appointment Button */}
          <Button
            className="h-13 rounded-xl bg-orange-500 px-6 text-white text-[17px] font-semibold shadow-sm transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.97]"
            onClick={() => navigate({ to: '/booking' })}
          >
            <Calendar className="mr-2 h-5 w-5" />
            {t('nav.bookAppointment')}
          </Button>
        </div>

        {/* Desktop: Info message below buttons */}
        <div className="hidden md:flex absolute top-full left-0 right-0 border-t border-[#E6E9ED] bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-6 px-4 sm:px-6 lg:px-8 py-2">
            <p className="text-[13px] text-gray-500 leading-snug text-right">
              {t('nav.noAccountRequired')}
              <br />
              <span className="text-gray-400">{t('nav.portalBenefits')}</span>
            </p>
          </div>
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
                className="w-full rounded-2xl border border-[#D6EAF5] bg-[#E8F4FA] px-4 py-4.5 text-center text-[18px] font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:bg-blue-100 hover:text-blue-700 active:scale-[0.97] mb-4 last:mb-0"
              >
                {t(`nav.${item.key}`)}
              </button>
            ))}

            {/* Mobile: Patient Login / My Portal */}
            <button
              onClick={() => {
                setMobileOpen(false);
                navigate({
                  to: isLoggedIn() ? '/patient/dashboard' : '/login',
                });
              }}
              className="w-full rounded-2xl border border-teal-200 bg-teal-50 px-4 py-4.5 text-center text-[18px] font-semibold text-teal-700 shadow-sm transition-all duration-200 hover:bg-teal-100 hover:text-teal-800 active:scale-[0.97] mb-4"
            >
              <div className="flex items-center justify-center gap-2">
                {isLoggedIn() ? (
                  <User className="h-5 w-5" />
                ) : (
                  <LogIn className="h-5 w-5" />
                )}
                {isLoggedIn() ? t('nav.myPortal') : t('nav.patientLogin')}
              </div>
            </button>

            {/* Mobile: Info message */}
            <div className="w-full px-2 mb-6">
              <p className="text-[13px] text-gray-500 leading-snug text-center">
                {t('nav.noAccountRequired')}
                <br />
                <span className="text-gray-400">{t('nav.portalBenefits')}</span>
              </p>
            </div>

            <div className="w-full pt-6 mt-6 border-t border-gray-100 flex justify-center">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
