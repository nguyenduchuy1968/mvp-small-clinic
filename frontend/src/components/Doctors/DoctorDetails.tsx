import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
  Phone,
  Stethoscope,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { DoctorsService } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface DoctorDetailsProps {
  doctorId: string
  onBack: () => void
}

export function DoctorDetails({ doctorId, onBack }: DoctorDetailsProps) {
  const { t } = useTranslation(["doctors", "common"])

  const { data: doctor, isLoading } = useQuery({
    queryFn: () => DoctorsService.readDoctor({ doctorId }),
    queryKey: ["doctor", doctorId],
    enabled: !!doctorId,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common:actions.back")}
        </Button>
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">{t("common:states.notFound")}</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common:actions.back")}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("common:actions.back")}
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {doctor.full_name}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Stethoscope className="h-4 w-4" />
            {doctor.specialty || t("common:states.notSpecified")}
          </p>
        </div>
        <Badge variant={doctor.is_active ? "default" : "secondary"}>
          {doctor.is_active ? t("status.active") : t("status.inactive")}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("common:sections.contactInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{doctor.email || doctor.user_id}</span>
            </div>
            {doctor.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{doctor.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("common:sections.professionalInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {doctor.experience_years != null && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {t("fields.experience", { years: doctor.experience_years })}
                </span>
              </div>
            )}
            {doctor.consultation_duration != null && (
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {t("fields.consultationDuration", {
                    minutes: doctor.consultation_duration,
                  })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {doctor.bio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("fields.bio")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {doctor.bio}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
