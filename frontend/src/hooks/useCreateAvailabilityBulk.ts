import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import type { ApiError, Weekday } from "@/client"
import { AvailabilityService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

const WEEKDAYS_MON_FRI: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
]

interface BulkCreateInput {
  doctorId: string
  start_time: string
  end_time: string
  duration_minutes: number
  is_active: boolean
}

export function useCreateAvailabilityBulk() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("availability")
  const { showSuccessToast, showErrorToast } = useCustomToast()

  return useMutation({
    mutationFn: async (input: BulkCreateInput) => {
      const { doctorId, ...rest } = input
      const results = await Promise.allSettled(
        WEEKDAYS_MON_FRI.map((weekday) =>
          AvailabilityService.createDoctorAvailability({
            doctorId,
            requestBody: { ...rest, weekday },
          }),
        ),
      )

      // Collect errors from rejected promises
      const errors = results.filter(
        (r) => r.status === "rejected",
      ) as PromiseRejectedResult[]

      if (errors.length > 0) {
        // If all failed, throw the first error
        if (errors.length === WEEKDAYS_MON_FRI.length) {
          throw errors[0].reason
        }
        // If some succeeded, show a partial success message
        const succeeded = results.filter((r) => r.status === "fulfilled").length
        showSuccessToast(
          t("templates.monFri.partialSuccess", {
            count: succeeded,
            total: WEEKDAYS_MON_FRI.length,
          }),
        )
      }

      return results
    },
    onSuccess: () => {
      showSuccessToast(t("templates.monFri.success"))
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
