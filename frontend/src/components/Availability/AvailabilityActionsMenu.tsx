import { EllipsisVertical } from 'lucide-react';
import { useState } from 'react';

import type { DoctorAvailabilityPublic } from '@/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DeleteAvailability from './DeleteAvailability';
import EditAvailability from './EditAvailability';

interface AvailabilityActionsMenuProps {
  availability: DoctorAvailabilityPublic;
}

export const AvailabilityActionsMenu = ({
  availability,
}: AvailabilityActionsMenuProps) => {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EditAvailability
          availability={availability}
          onSuccess={() => setOpen(false)}
        />
        <DeleteAvailability
          id={availability.id}
          onSuccess={() => setOpen(false)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
