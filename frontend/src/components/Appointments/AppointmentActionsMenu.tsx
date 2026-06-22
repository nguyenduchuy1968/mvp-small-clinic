import { useNavigate } from '@tanstack/react-router';
import { EllipsisVertical, Eye, XCircle } from 'lucide-react';
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
import { useUpdateAppointmentStatus } from '@/hooks/useUpdateAppointmentStatus';

interface AppointmentActionsMenuProps {
  appointment: AppointmentPublic;
}

export const AppointmentActionsMenu = ({
  appointment,
}: AppointmentActionsMenuProps) => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation('appointments');
  const navigate = useNavigate();
  const updateStatus = useUpdateAppointmentStatus();

  const handleCancel = () => {
    const confirmed = window.confirm(t('updateStatus.cancelMessage'));
    if (!confirmed) return;

    updateStatus.mutate({
      appointmentId: appointment.id,
      requestBody: { status: 'cancelled' },
    });
    setOpen(false);
  };

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
        {appointment.status === 'confirmed' && (
          <DropdownMenuItem
            onClick={handleCancel}
            disabled={updateStatus.isPending}
            className="text-destructive focus:text-destructive"
          >
            <XCircle className="mr-2 h-4 w-4" />
            {t('actions.cancel')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
