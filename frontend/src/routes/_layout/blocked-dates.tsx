import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { DoctorsService } from "@/client"
import { BlockedDatesList } from "@/components/BlockedDates/BlockedDatesList"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import useAuth from "@/hooks/useAuth"

function BlockedDatesPage() {
  const { t } = useTranslation("blockedDates")
  const { user } = useAuth()

  const isAdmin = user?.is_superuser === true

  // Fetch all doctors
  const { data: doctorsData } = useQuery({
    queryFn: () => DoctorsService.readDoctors({ skip: 0, limit: 100 }),
    queryKey: ["doctors"],
    enabled: !!user?.id,
  })

  // Admin: selected doctor ID (stateful)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")

  // Doctor user: automatically resolve doctor_id from user_id
  const currentDoctor = doctorsData?.data?.find(
    (doctor) => doctor.user_id === user?.id,
  )
  const doctorId = isAdmin ? selectedDoctorId : (currentDoctor?.id ?? "")

  // Admin without a selected doctor — show the selector
  if (isAdmin && !doctorId) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <div className="rounded-full bg-muted p-6 mb-6">
          <svg
            className="h-10 w-10 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-4">
          {t(
            "admin.noDoctor.title",
            "Select a doctor to manage blocked dates.",
          )}
        </h2>
        <div className="w-full max-w-xs">
          <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
            <SelectTrigger>
              <SelectValue
                placeholder={t(
                  "admin.doctorSelector.placeholder",
                  "Choose a doctor...",
                )}
              />
            </SelectTrigger>
            <SelectContent>
              {doctorsData?.data?.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.full_name}
                  {doctor.specialty ? ` (${doctor.specialty})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  // Regular doctor users without a profile see a different message
  if (!doctorId) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <div className="rounded-full bg-muted p-6 mb-6">
          <svg
            className="h-10 w-10 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">
          {t("noDoctorProfile.title", "No doctor profile found")}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {t(
            "noDoctorProfile.description",
            "You do not have a doctor profile yet. Please contact an administrator to create one before managing blocked dates.",
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <BlockedDatesList doctorId={doctorId} />
    </div>
  )
}

export const Route = createFileRoute("/_layout/blocked-dates")({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: "Blocked Dates",
      },
    ],
  }),
})

function RouteComponent() {
  return <BlockedDatesPage />
}
