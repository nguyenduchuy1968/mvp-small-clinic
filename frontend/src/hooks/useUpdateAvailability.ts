import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import type { ApiError } from "@/client"
import { AvailabilityService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

export function useUpdateAvailability() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("availability")
  const { showSuccessToast, showErrorToast } = useCustomToast()

  return useMutation({
    mutationFn: AvailabilityService.updateDoctorAvailability,
    onSuccess: () => {
      showSuccessToast(t("edit.success"))
    },
    onError: (err: Error) => {
      handleError.call(showErrorToast, err as unknown as ApiError)
    },
    onSettled: () => {
      // Invalidate all availability queries since we don't know the doctorId
      queryClient.invalidateQueries({ queryKey: ["availabilities"] })
    },
  })
}
