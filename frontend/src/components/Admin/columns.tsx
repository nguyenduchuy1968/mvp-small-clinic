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
      const { t } = useTranslation()
      return <>{t("common.users.fullName")}</>
    },
    cell: ({ row }) => {
      const { t } = useTranslation()
      const fullName = row.original.full_name
      return (
        <div className="flex items-center gap-2">
          <span
            className={cn("font-medium", !fullName && "text-muted-foreground")}
          >
            {fullName || t("common.users.nA")}
          </span>
          {row.original.isCurrentUser && (
            <Badge variant="outline" className="text-xs">
              {t("common.users.you")}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: () => {
      const { t } = useTranslation()
      return <>{t("common.users.email")}</>
    },
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    accessorKey: "is_superuser",
    header: () => {
      const { t } = useTranslation()
      return <>{t("common.users.role")}</>
    },
    cell: ({ row }) => {
      const { t } = useTranslation()
      return (
        <Badge variant={row.original.is_superuser ? "default" : "secondary"}>
          {row.original.is_superuser
            ? t("common.users.superuser")
            : t("common.users.user")}
        </Badge>
      )
    },
  },
  {
    accessorKey: "is_active",
    header: () => {
      const { t } = useTranslation()
      return <>{t("common.users.status")}</>
    },
    cell: ({ row }) => {
      const { t } = useTranslation()
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
            {row.original.is_active
              ? t("common.users.active")
              : t("common.users.inactive")}
          </span>
        </div>
      )
    },
  },
  {
    id: "actions",
    header: () => {
      const { t } = useTranslation()
      return <span className="sr-only">{t("common.actions.filter")}</span>
    },
    cell: ({ row }) => (
      <div className="flex justify-end">
        <UserActionsMenu user={row.original} />
      </div>
    ),
  },
]
