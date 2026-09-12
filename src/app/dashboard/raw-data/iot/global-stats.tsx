'use client';

import type { GroupStats } from '../iot-grouping';
import { pct } from './iot-format';
import { StatBox } from './slot-cell';

// ---------------------------------------------------------------------------
// Global stats banner — across all bins
// ---------------------------------------------------------------------------

export function GlobalStats({ stats }: { stats: GroupStats }) {
  return (
    <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6'>
      <StatBox
        label='Нийт уншуулалт'
        value={stats.totalReads}
        sub={`${stats.totalRows} хүсэлт`}
      />
      <StatBox
        label='Бүрэн (3/3)'
        value={stats.complete}
        sub={pct(stats.complete, stats.totalReads)}
        tone='good'
      />
      <StatBox
        label='Battery дутуу'
        value={stats.missingBattery}
        sub={pct(stats.missingBattery, stats.totalReads)}
        tone={stats.missingBattery ? 'warn' : 'default'}
      />
      <StatBox
        label='Storage дутуу'
        value={stats.missingStorage}
        sub={pct(stats.missingStorage, stats.totalReads)}
        tone={stats.missingStorage ? 'warn' : 'default'}
      />
      <StatBox
        label='Давхар card'
        value={stats.duplicateCards}
        sub='retry'
        tone={stats.duplicateCards ? 'warn' : 'default'}
      />
      <StatBox
        label='Parse алдаа'
        value={stats.parseFailures}
        sub={pct(stats.parseFailures, stats.totalRows)}
        tone={stats.parseFailures ? 'bad' : 'default'}
      />
    </div>
  );
}
