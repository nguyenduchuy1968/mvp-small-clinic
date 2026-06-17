import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useDoctor } from "@/hooks/useDoctor"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import EditDoctor from "@/components/Doctors/EditDoctor"

export const Route = createFileRoute("/_layout/doctors/$id/edit")({
  component: RouteComponent,
  head: ({ params }) => ({
    meta: [
      {
        title: `Edit Doctor - ${params.id}`,
      },
    ],
  }),
})

function RouteComponent() {
  const { t } = useTranslation("common")
  const { id } = Route.useParams()
  const { data: doctor, isLoading } = useDoctor(id)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" disabled className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("actions.back")}
        </Button>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">{t("states.notFound")}</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/doctors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("actions.back")}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/doctors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("actions.back")}
        </Link>
      </Button>
      <EditDoctor
        doctor={doctor}
        onSuccess={() => {}}
      />
    </div>
  )
}
