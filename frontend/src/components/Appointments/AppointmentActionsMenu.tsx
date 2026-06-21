import { useNavigate } from '@tanstack/react-router';
import { EllipsisVertical, Eye } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { AppointmentPublic } from '@/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppointmentActionsMenuProps {
  appointment: AppointmentPublic;
}

export const AppointmentActionsMenu = ({
  appointment,
}: AppointmentActionsMenuProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('appointments');
  const navigate = useNavigate();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            navigate({
              to: '/appointments/$id',
              params: { id: appointment.id },
            })
          }
        >
          <Eye className="mr-2 h-4 w-4" />
          {t('actions.viewDetails')}
        </DropdownMenuItem>
        {/* TODO: Enable in Sprint 6.3 — Confirm/Cancel/Reschedule actions */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
