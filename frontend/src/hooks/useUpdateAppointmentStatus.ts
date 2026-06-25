import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import {
  AppointmentsService,
  type AppointmentsUpdateAppointmentStatusData,
  type AppointmentsUpdateAppointmentStatusResponse,
} from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient()
  const { t } = useTranslation("appointments")
  const { showSuccessToast, showErrorToast } = useCustomToast()

  return useMutation<
    AppointmentsUpdateAppointmentStatusResponse,
    Error,
    AppointmentsUpdateAppointmentStatusData
  >({
    mutationFn: async (data) => {
      return AppointmentsService.updateAppointmentStatus(data)
    },
    onSuccess: () => {
      showSuccessToast(t("updateStatus.success"))
    },
    onError: handleError.bind(showErrorToast) as (err: Error) => void,
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      queryClient.invalidateQueries({
        queryKey: ["appointment", variables.appointmentId],
      })
    },
  })
}
