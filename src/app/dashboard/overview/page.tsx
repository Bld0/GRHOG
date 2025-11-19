import React from 'react';

// Minimal page to ensure /dashboard/overview route resolves and the
// `layout.tsx` in this folder is applied. The layout uses parallel route
// slots (bar_stats, area_stats, pie_stats, sales) which are provided by
// sibling folders (for example `@bar_stats`). Returning an empty fragment
// is enough because the visuals come from the layout and parallel route
// slots.
export default function Page() {
  return <></>;
}
