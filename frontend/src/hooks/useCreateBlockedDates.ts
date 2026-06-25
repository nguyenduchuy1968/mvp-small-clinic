import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import type { ApiError } from "@/client"
import { BlockedDatesService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

export function useCreateBlockedDates() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("blockedDates")
  const { showSuccessToast, showErrorToast } = useCustomToast()

  return useMutation({
    mutationFn: BlockedDatesService.createBlockedDates,
    onSuccess: () => {
      showSuccessToast(t("create.success"))
    },
    onError: (err: Error) => {
      handleError.call(showErrorToast, err as unknown as ApiError)
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["blocked-dates", variables.doctorId],
      })
    },
  })
}
