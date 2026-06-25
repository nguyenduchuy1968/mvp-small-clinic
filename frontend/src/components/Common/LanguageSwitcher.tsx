import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const LANGUAGES = [
  { code: "vi", label: "Tiếng Việt", short: "VI" },
  { code: "en", label: "English", short: "EN" },
  { code: "uk", label: "Українська", short: "UK" },
]

function LanguageSwitcher() {
  const { i18n, t } = useTranslation("common")

  const changeLanguage = (lng: string) => {
    void i18n.changeLanguage(lng)
    // localStorage persistence is handled automatically
    // by i18next-browser-languagedetector
  }

  return (
    <Select value={i18n.language} onValueChange={changeLanguage}>
      <SelectTrigger className="h-[42px] w-[160px] rounded-xl border border-gray-200 bg-white px-4 text-[15px] font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md">
        <Globe className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
        <SelectValue placeholder={t("nav.language")} />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-gray-100 text-[11px] font-semibold text-gray-700">
                {lang.short}
              </span>
              <span>{lang.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { LanguageSwitcher }
