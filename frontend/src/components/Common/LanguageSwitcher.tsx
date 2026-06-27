import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', short: 'VI' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'uk', label: 'Українська', short: 'UK' },
];

function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common');

  const changeLanguage = (lng: string) => {
    void i18n.changeLanguage(lng);
    // localStorage persistence is handled automatically
    // by i18next-browser-languagedetector
  };

  return (
    <Select value={i18n.language} onValueChange={changeLanguage}>
      <SelectTrigger className="h-[50px] w-[190px] rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50 to-teal-50/80 px-5 text-[16px] font-medium text-teal-700 shadow-sm transition-all duration-200 hover:from-teal-50 hover:to-white hover:border-teal-300 hover:shadow-md">
        <Globe className="mr-2.5 h-5 w-5 shrink-0 text-teal-500" />
        <SelectValue placeholder={t('nav.language')} />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-teal-100 text-[12px] font-semibold text-teal-700">
                {lang.short}
              </span>
              <span className="text-[15px]">{lang.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { LanguageSwitcher };
