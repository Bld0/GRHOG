'use client';

import { jsonBounds } from '../iot-grouping';

export function RawBodyView({ raw }: { raw: string | null }) {
  if (!raw) return <p className='text-muted-foreground text-sm'>Хоосон</p>;
  const b = jsonBounds(raw);
  if (!b) {
    return (
      <pre className='bg-muted overflow-auto rounded-lg p-3 font-mono text-xs break-all whitespace-pre-wrap text-red-500'>
        {raw}
      </pre>
    );
  }
  const prefix = raw.slice(0, b.start);
  const json = raw.slice(b.start, b.end);
  const suffix = raw.slice(b.end);
  return (
    <pre className='bg-muted overflow-auto rounded-lg p-3 font-mono text-xs break-all whitespace-pre-wrap'>
      {prefix && (
        <span className='rounded bg-red-500/15 text-red-500' title='Модемын шуугиан'>
          {prefix}
        </span>
      )}
      <span className='text-green-600 dark:text-green-500'>{json}</span>
      {suffix && (
        <span className='rounded bg-red-500/15 text-red-500' title='Модемын шуугиан'>
          {suffix}
        </span>
      )}
    </pre>
  );
}

export function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='space-y-1'>
      <p className='text-muted-foreground text-xs font-medium'>{label}</p>
      {children}
    </div>
  );
}
