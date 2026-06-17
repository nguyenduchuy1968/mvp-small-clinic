import { toast } from "sonner"

import i18next from "@/i18n"

const useCustomToast = () => {
  const showSuccessToast = (description: string) => {
    toast.success(i18next.t("common.toasts.createSuccess"), {
      description,
    })
  }

  const showErrorToast = (description: string) => {
    toast.error(i18next.t("common.toasts.errorOccurred"), {
      description,
    })
  }

  return { showSuccessToast, showErrorToast }
}

export default useCustomToast
