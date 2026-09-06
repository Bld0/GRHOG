'use client';

import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLeaderArea } from '@/hooks/use-leader-area';

/**
 * Хорооны даргын харьяа бүсийг харуулах СТАТИК тэмдэг — сонголт биш.
 *
 * Дарга ганц хороо хардаг тул дүүрэг/хорооны шүүлтүүр утгагүй. Өөрчилж
 * болдоггүй Select үлдээхийн оронд түүнийг бүхэлд нь энэ тэмдгээр солино:
 * хэрэглэгч аль бүсийн дата харж байгаагаа мэдэх хэрэгтэй ч дарах зүйл
 * байх ёсгүй.
 *
 * Шүүлтүүр байрлах газар бүр НЭГ л энэ бүрэлдэхүүнийг ашиглана —
 * хуулбарлавал нэгийг нь засаад нөгөөг мартах нь цаг хугацааны асуудал.
 */
export function LeaderAreaBadge({ className }: { className?: string }) {
  const { label } = useLeaderArea();

  return (
    <Badge variant='secondary' className={className}>
      <MapPin className='mr-1 h-3 w-3' />
      {label || 'Харьяа бүс'}
    </Badge>
  );
}
