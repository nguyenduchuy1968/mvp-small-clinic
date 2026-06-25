import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import type { ApiError } from "@/client"
import { AvailabilityService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

export function useCreateAvailability() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("availability")
  const { showSuccessToast, showErrorToast } = useCustomToast()

  return useMutation({
    mutationFn: AvailabilityService.createDoctorAvailability,
    onSuccess: () => {
      showSuccessToast(t("create.success"))
    },
    onError: (err: Error) => {
      handleError.call(showErrorToast, err as unknown as ApiError)
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["availabilities", variables.doctorId],
      })
    },
  })
}
