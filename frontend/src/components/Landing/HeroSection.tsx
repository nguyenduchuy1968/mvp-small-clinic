import { useNavigate } from "@tanstack/react-router"
import { Calendar, Users } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

interface HeroSectionProps {
  onViewDoctors: () => void
}

function MedicalIllustration() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Decorative background circles */}
      <div className="absolute h-[500px] w-[500px] rounded-full bg-teal-100/40" />
      <div className="absolute h-[380px] w-[380px] rounded-full bg-teal-50/60" />

      {/* Medical illustration SVG */}
      <svg
        viewBox="0 0 400 400"
        className="relative h-[320px] w-[320px] sm:h-[380px] sm:w-[380px] lg:h-[440px] lg:w-[440px]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Doctor figure */}
        <g transform="translate(80, 60)">
          {/* Body - white coat */}
          <rect
            x="55"
            y="100"
            width="90"
            height="130"
            rx="12"
            fill="#FFFFFF"
            stroke="#E5E7EB"
            strokeWidth="2"
          />
          {/* Coat lapels */}
          <path d="M100 100 L100 230" stroke="#E5E7EB" strokeWidth="1.5" />
          <path d="M80 100 L80 230" stroke="#E5E7EB" strokeWidth="1.5" />
          {/* Head */}
          <circle cx="100" cy="55" r="45" fill="#FEF3C7" />
          {/* Hair */}
          <path d="M55 45 Q55 10 100 5 Q145 10 145 45" fill="#1F2937" />
          {/* Eyes */}
          <ellipse cx="82" cy="52" rx="5" ry="6" fill="#1F2937" />
          <ellipse cx="118" cy="52" rx="5" ry="6" fill="#1F2937" />
          {/* Smile */}
          <path
            d="M85 70 Q100 85 115 70"
            stroke="#1F2937"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Stethoscope */}
          <path
            d="M100 100 L100 140 Q100 155 85 155 Q70 155 70 140"
            stroke="#14B8A6"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M100 100 L100 140 Q100 155 115 155 Q130 155 130 140"
            stroke="#14B8A6"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <circle
            cx="70"
            cy="140"
            r="8"
            fill="none"
            stroke="#14B8A6"
            strokeWidth="2.5"
          />
          <circle
            cx="130"
            cy="140"
            r="8"
            fill="none"
            stroke="#14B8A6"
            strokeWidth="2.5"
          />
          {/* Clipboard in left hand */}
          <rect
            x="145"
            y="130"
            width="35"
            height="45"
            rx="4"
            fill="#FFFFFF"
            stroke="#D1D5DB"
            strokeWidth="1.5"
          />
          <line
            x1="152"
            y1="142"
            x2="173"
            y2="142"
            stroke="#D1D5DB"
            strokeWidth="1.5"
          />
          <line
            x1="152"
            y1="150"
            x2="173"
            y2="150"
            stroke="#D1D5DB"
            strokeWidth="1.5"
          />
          <line
            x1="152"
            y1="158"
            x2="168"
            y2="158"
            stroke="#D1D5DB"
            strokeWidth="1.5"
          />
        </g>

        {/* Heart rate monitor line */}
        <g transform="translate(20, 280)">
          <path
            d="M0 40 L60 40 L80 40 L90 10 L100 70 L110 10 L120 70 L130 10 L140 40 L160 40 L200 40"
            stroke="#14B8A6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* Medical cross / plus icon */}
        <g transform="translate(310, 50)">
          <rect
            x="18"
            y="0"
            width="14"
            height="50"
            rx="3"
            fill="#14B8A6"
            opacity="0.3"
          />
          <rect
            x="0"
            y="18"
            width="50"
            height="14"
            rx="3"
            fill="#14B8A6"
            opacity="0.3"
          />
        </g>

        {/* Small medical icons */}
        <g transform="translate(300, 280)">
          {/* Pill */}
          <rect
            x="0"
            y="5"
            width="40"
            height="16"
            rx="8"
            fill="#2563EB"
            opacity="0.2"
          />
          <rect
            x="20"
            y="5"
            width="20"
            height="16"
            rx="8"
            fill="#2563EB"
            opacity="0.35"
          />
        </g>

        {/* Heart icon */}
        <g transform="translate(30, 50)">
          <path
            d="M20 10 C20 0 35 -5 40 5 C45 -5 60 0 60 10 L40 35 L20 10Z"
            fill="#EF4444"
            opacity="0.25"
          />
        </g>
      </svg>
    </div>
  )
}

export function HeroSection({ onViewDoctors }: HeroSectionProps) {
  const { t } = useTranslation("landing")
  const navigate = useNavigate()

  return (
    <section
      id="hero-section"
      className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4 py-16 md:py-24 lg:py-32"
    >
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-teal-100/50" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-cyan-100/40" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 rounded-full bg-teal-100/30" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          {/* Left: Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl md:text-7xl leading-tight">
              {t("hero.title")}
            </h1>
            <p className="mt-4 text-xl text-teal-700 sm:text-2xl font-light">
              {t("hero.subtitle")}
            </p>
            <p className="mx-auto mt-6 max-w-xl text-[19px] text-gray-500 leading-relaxed lg:mx-0">
              {t("hero.description")}
            </p>
            <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row lg:justify-start">
              <Button
                size="lg"
                className="h-14 min-w-[200px] rounded-xl bg-teal-600 text-white text-[19px] font-semibold shadow-lg transition-all duration-200 hover:bg-teal-700 hover:shadow-xl active:scale-[0.97]"
                onClick={() => navigate({ to: "/booking" })}
              >
                <Calendar className="mr-2 h-5 w-5" />
                {t("hero.bookAppointment")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-14 min-w-[200px] rounded-xl border-2 border-teal-200 bg-white text-teal-700 text-[19px] font-semibold shadow-sm transition-all duration-200 hover:bg-teal-50 hover:border-teal-300 active:scale-[0.97]"
                onClick={onViewDoctors}
              >
                <Users className="mr-2 h-5 w-5" />
                {t("hero.viewDoctors")}
              </Button>
            </div>
          </div>

          {/* Right: Medical Illustration */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <MedicalIllustration />
          </div>
        </div>
      </div>
    </section>
  )
}
