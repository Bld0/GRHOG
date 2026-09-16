import { Suspense } from 'react';

import { BinsViewGrouped } from '@/features/bins/components/bins-view-grouped';

export default function BinsPage() {
  // `useSearchParams` (жагсаалт/газрын зургийн таб) нь Suspense заавал шаардана.
  return (
    <Suspense>
      <BinsViewGrouped />
    </Suspense>
  );
}
