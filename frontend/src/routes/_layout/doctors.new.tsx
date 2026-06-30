import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import type { QueryClient } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import CreateDoctor from "@/components/Doctors/CreateDoctor"
import { Button } from "@/components/ui/button"
import { UsersService } from "@/client"
import type { UserPublic } from "@/client"
import { canEditDoctors } from "@/utils/authorization"

export const Route = createFileRoute("/_layout/doctors/new")({
  component: RouteComponent,
  beforeLoad: async (ctx) => {
    const context = ctx.context as { queryClient: QueryClient }
    const queryClient: QueryClient = context.queryClient
    let user = queryClient.getQueryData<UserPublic>(["currentUser"])

    if (!user) {
      try {
        user = await queryClient.fetchQuery({
          queryKey: ["currentUser"],
          queryFn: UsersService.readUserMe,
        })
      } catch {
        throw redirect({ to: "/" })
      }
    }

    if (!canEditDoctors(user)) {
      throw redirect({ to: "/" })
    }
  },
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
