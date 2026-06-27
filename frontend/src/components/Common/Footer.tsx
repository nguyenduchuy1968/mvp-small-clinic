import { useTranslation } from 'react-i18next';

import { clinicConfig } from '@/config/clinic';

export function Footer() {
  const { i18n } = useTranslation();
  const currentYear = new Date().getFullYear();
  const isVietnamese = i18n.language?.startsWith('vi');
  const clinicName = isVietnamese ? clinicConfig.name : clinicConfig.nameEn;

  return (
    <footer className="border-t py-4 px-6">
      <div className="flex items-center justify-center">
        <p className="text-muted-foreground text-sm text-center">
          {clinicName} &copy; {currentYear} Nha Trang, Việt Nam
        </p>
      </div>
    </footer>
  );
}
