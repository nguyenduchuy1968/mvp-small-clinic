import type { ColumnDef } from "@tanstack/react-table"
import { useTranslation } from "react-i18next"

import type { UserPublic } from "@/client"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { UserActionsMenu } from "./UserActionsMenu"

export type UserTableData = UserPublic & {
  isCurrentUser: boolean
}

export const columns: ColumnDef<UserTableData>[] = [
  {
    accessorKey: "full_name",
    header: () => {
      const { t } = useTranslation("common")
      return <>{t("users.fullName")}</>
    },
    cell: ({ row }) => {
      const { t } = useTranslation("common")
      const fullName = row.original.full_name
      return (
        <div className="flex items-center gap-2">
          <span
            className={cn("font-medium", !fullName && "text-muted-foreground")}
          >
            {fullName || t("users.nA")}
          </span>
          {row.original.isCurrentUser && (
            <Badge variant="outline" className="text-xs">
              {t("users.you")}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: () => {
      const { t } = useTranslation("common")
      return <>{t("users.email")}</>
    },
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    accessorKey: "is_superuser",
    header: () => {
      const { t } = useTranslation("common")
      return <>{t("users.role")}</>
    },
    cell: ({ row }) => {
      const { t } = useTranslation("common")
      return (
        <Badge variant={row.original.is_superuser ? "default" : "secondary"}>
          {row.original.is_superuser ? t("users.superuser") : t("users.user")}
        </Badge>
      )
    },
  },
  {
    accessorKey: "is_active",
    header: () => {
      const { t } = useTranslation("common")
      return <>{t("users.status")}</>
    },
    cell: ({ row }) => {
      const { t } = useTranslation("common")
      return (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              row.original.is_active ? "bg-green-500" : "bg-gray-400",
            )}
          />
          <span
            className={row.original.is_active ? "" : "text-muted-foreground"}
          >
            {row.original.is_active ? t("users.active") : t("users.inactive")}
          </span>
        </div>
      )
    },
  },
  {
    id: "actions",
    header: () => {
      const { t } = useTranslation("common")
      return <span className="sr-only">{t("actions.filter")}</span>
    },
    cell: ({ row }) => (
      <div className="flex justify-end">
        <UserActionsMenu user={row.original} />
      </div>
    ),
  },
]
