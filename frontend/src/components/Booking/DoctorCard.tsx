import { Calendar, Stethoscope } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { DoctorPublic } from '@/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DoctorCardProps {
  doctor: DoctorPublic;
  selected: boolean;
  onSelect: () => void;
}

export function DoctorCard({ doctor, selected, onSelect }: DoctorCardProps) {
  const { t } = useTranslation('booking');

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:border-primary/50',
        selected && 'border-primary ring-1 ring-primary',
      )}
      onClick={onSelect}
    >
      <CardHeader>
        <CardTitle className="text-lg">{doctor.full_name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {doctor.specialty && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Stethoscope className="h-4 w-4" />
            <span>{doctor.specialty}</span>
          </div>
        )}
        {doctor.experience_years != null && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {t('doctors:fields.experience', {
                years: doctor.experience_years,
                defaultValue: `${doctor.experience_years} years`,
              })}
            </span>
          </div>
        )}
        {doctor.bio && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {doctor.bio}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
