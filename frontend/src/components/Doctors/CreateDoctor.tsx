import { Plus } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LoadingButton } from "@/components/ui/loading-button"
import { useCreateDoctor } from "@/hooks/useCreateDoctor"
import { DoctorForm, type DoctorFormData } from "./DoctorForm"

const CreateDoctor = () => {
  const { t } = useTranslation(["doctors", "common"])
  const [isOpen, setIsOpen] = useState(false)
  const createDoctor = useCreateDoctor()

  const onSubmit = (data: DoctorFormData) => {
    // Convert string values to numbers for the API
    const payload = {
      ...data,
      password: data.password as string,
      experience_years: data.experience_years
        ? Number(data.experience_years)
        : undefined,
      consultation_duration: data.consultation_duration
        ? Number(data.consultation_duration)
        : undefined,
    }
    createDoctor.mutate(
      { requestBody: payload },
      {
        onSuccess: () => {
          setIsOpen(false)
        },
      },
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="my-4">
          <Plus className="mr-2" />
          {t("common:actions.create")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("create.title")}</DialogTitle>
          <DialogDescription>{t("create.description")}</DialogDescription>
        </DialogHeader>
        <DoctorForm onSubmit={onSubmit} isPending={createDoctor.isPending}>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={createDoctor.isPending}>
                {t("common:actions.cancel")}
              </Button>
            </DialogClose>
            <LoadingButton type="submit" loading={createDoctor.isPending}>
              {t("common:actions.save")}
            </LoadingButton>
          </DialogFooter>
        </DoctorForm>
      </DialogContent>
    </Dialog>
  )
}

export default CreateDoctor
