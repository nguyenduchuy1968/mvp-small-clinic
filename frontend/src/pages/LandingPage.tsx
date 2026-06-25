import { useCallback, useRef } from 'react';

import { AboutSection } from '@/components/Landing/AboutSection';
import { ClinicInfoSection } from '@/components/Landing/ClinicInfoSection';
import { DoctorsPreviewSection } from '@/components/Landing/DoctorsPreviewSection';
import { FinalCTASection } from '@/components/Landing/FinalCTASection';
import { HeroSection } from '@/components/Landing/HeroSection';
import { LandingFooter } from '@/components/Landing/LandingFooter';
import { LandingHeader } from '@/components/Landing/LandingHeader';
import { MapPlaceholderSection } from '@/components/Landing/MapPlaceholderSection';
import { ServicesSection } from '@/components/Landing/ServicesSection';
import { TrustIndicatorsSection } from '@/components/Landing/TrustIndicatorsSection';

export function LandingPage() {
  const doctorsRef = useRef<HTMLDivElement>(null);

  const handleViewDoctors = useCallback(() => {
    doctorsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleNavigate = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader onNavigate={handleNavigate} />
      <main className="flex-1">
        <HeroSection onViewDoctors={handleViewDoctors} />
        <TrustIndicatorsSection />
        <AboutSection />
        <ServicesSection />
        <div ref={doctorsRef}>
          <DoctorsPreviewSection />
        </div>
        <ClinicInfoSection />
        <MapPlaceholderSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
