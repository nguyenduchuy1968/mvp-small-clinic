import { toast } from "sonner"

import i18next from "@/i18n"

const useCustomToast = () => {
  const showSuccessToast = (description: string) => {
    toast.success(i18next.t("toasts.createSuccess", { ns: "common" }), {
      description,
    })
  }

  const showErrorToast = (description: string) => {
    toast.error(i18next.t("toasts.errorOccurred", { ns: "common" }), {
      description,
    })
  }

  return { showSuccessToast, showErrorToast }
}

export default useCustomToast
