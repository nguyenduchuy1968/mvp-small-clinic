import { Pencil } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import type { DoctorPublic } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { LoadingButton } from "@/components/ui/loading-button"
import { useUpdateDoctor } from "@/hooks/useUpdateDoctor"
import { DoctorForm, type DoctorFormData } from "./DoctorForm"

interface EditDoctorProps {
  doctor: DoctorPublic
  onSuccess: () => void
}

const EditDoctor = ({ doctor, onSuccess }: EditDoctorProps) => {
  const { t } = useTranslation(["doctors", "common"])
  const [isOpen, setIsOpen] = useState(false)
  const updateDoctor = useUpdateDoctor()

  const onSubmit = (data: DoctorFormData) => {
    const { password, ...rest } = data

    // Build the payload — only include email/password if they were changed
    const doctorData: Record<string, unknown> = {
      full_name: rest.full_name,
      specialty: rest.specialty || undefined,
      phone: rest.phone || undefined,
      bio: rest.bio || undefined,
      experience_years: rest.experience_years
        ? Number(rest.experience_years)
        : undefined,
      consultation_duration: rest.consultation_duration
        ? Number(rest.consultation_duration)
        : undefined,
      is_active: rest.is_active,
    }

    // Only send email if it changed from the current value
    if (rest.email !== doctor.email) {
      doctorData.email = rest.email
    }

    // Only send password if user entered a new one
    if (password) {
      doctorData.password = password
    }

    updateDoctor.mutate(
      {
        doctorId: doctor.id,
        requestBody: doctorData,
      },
      {
        onSuccess: () => {
          setIsOpen(false)
          onSuccess()
        },
      },
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        onClick={() => setIsOpen(true)}
      >
        <Pencil />
        {t("common:actions.edit")}
      </DropdownMenuItem>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("edit.title")}</DialogTitle>
          <DialogDescription>{t("edit.description")}</DialogDescription>
        </DialogHeader>
        <DoctorForm
          onSubmit={onSubmit}
          isEdit
          defaultValues={{
            email: doctor.email ?? "",
            full_name: doctor.full_name,
            specialty: doctor.specialty ?? undefined,
            phone: doctor.phone ?? undefined,
            bio: doctor.bio ?? undefined,
            experience_years: doctor.experience_years?.toString() ?? undefined,
            consultation_duration:
              doctor.consultation_duration?.toString() ?? undefined,
            is_active: doctor.is_active ?? true,
          }}
          isPending={updateDoctor.isPending}
        >
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={updateDoctor.isPending}>
                {t("common:actions.cancel")}
              </Button>
            </DialogClose>
            <LoadingButton type="submit" loading={updateDoctor.isPending}>
              {t("common:actions.save")}
            </LoadingButton>
          </DialogFooter>
        </DoctorForm>
      </DialogContent>
    </Dialog>
  )
}

export default EditDoctor
