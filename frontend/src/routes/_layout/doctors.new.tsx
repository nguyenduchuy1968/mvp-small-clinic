import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import CreateDoctor from "@/components/Doctors/CreateDoctor"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_layout/doctors/new")({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: "New Doctor",
      },
    ],
  }),
})

function RouteComponent() {
  const { t } = useTranslation("common")
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: "/doctors" })}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("actions.back")}
      </Button>
      <CreateDoctor />
    </div>
  )
}
