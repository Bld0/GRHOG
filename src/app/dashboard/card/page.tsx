import { Suspense } from 'react';

import { CardsView } from '@/features/card/components/card-view';

export default function ResidentsPage() {
  // `useSearchParams` (тайлангаас ирдэг ?incomplete=1) нь Suspense шаардана.
  return (
    <Suspense>
      <CardsView />
    </Suspense>
  );
}
