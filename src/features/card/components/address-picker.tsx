'use client';

import { useEffect, useState } from 'react';
import { IconMapPin, IconSearch } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';

import { AddressOption, DISTRICTS, formatAddress } from '@/features/address/types';

export type { AddressOption };
export { formatAddress };

const ALL = '__all';

interface AddressPickerProps {
  /** Сонгогдсон хаяг — сонгоогүй бол шинэ хаягаар бүртгэнэ. */
  selected: AddressOption | null;
  onSelect: (address: AddressOption | null) => void;
}

/**
 * Карт бүртгэхийн өмнөх алхам: аль өрхөд бүртгэх вэ.
 *
 * Байгаа хаягийг сонговол картын хаягийн талбарууд тэр хаягаас бөглөгдөнө
 * (backend ч мөн адил дарж бичдэг) — нэг өрхийн хоёр карт өөр өөр бичиглэлээр
 * орж, хоёр хаяг үүсэхээс сэргийлнэ. Шинэ хаяг бол доорх талбаруудыг гараар
 * бөглөхөд backend түлхүүрээр нь олж/үүсгэнэ.
 */
export function AddressPicker({ selected, onSelect }: AddressPickerProps) {
  const [district, setDistrict] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddressOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Хайлт хийхээс өмнө хаягийн бүх жагсаалтыг татахгүй — эхний 20-г л үзүүлнэ.
  useEffect(() => {
    if (selected) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ size: '20' });
      if (district) params.set('district', district);
      if (query.trim()) params.set('q', query.trim());
      apiClient
        .fetchWithAuth(`/api/addresses?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : { content: [] }))
        .then((json) => {
          if (cancelled) return;
          setResults(Array.isArray(json?.content) ? json.content : []);
          setSearched(true);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [district, query, selected]);

  if (selected) {
    return (
      <div className='bg-muted/40 flex items-center justify-between gap-3 rounded-md border p-3'>
        <div className='flex items-start gap-2 text-sm'>
          <IconMapPin className='mt-0.5 h-4 w-4 shrink-0' />
          <div>
            <div className='font-medium'>{formatAddress(selected)}</div>
            <div className='text-muted-foreground'>
              Энэ хаягт {selected.cardCount} карт бүртгэлтэй
            </div>
          </div>
        </div>
        <Button type='button' variant='outline' size='sm' onClick={() => onSelect(null)}>
          Өөрчлөх
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-2 rounded-md border p-3'>
      <Label className='text-sm font-medium'>Хаяг сонгох</Label>
      <div className='flex gap-2'>
        <Select
          value={district === '' ? ALL : district}
          onValueChange={(value) => setDistrict(value === ALL ? '' : value)}
        >
          <SelectTrigger className='w-[170px]'>
            <SelectValue placeholder='Бүх дүүрэг' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Бүх дүүрэг</SelectItem>
            {DISTRICTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className='relative flex-1'>
          <IconSearch className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Байр, тоот, нэрээр хайх'
            className='pl-8'
          />
        </div>
      </div>

      <div className='max-h-48 overflow-y-auto'>
        {loading ? (
          <div className='text-muted-foreground p-2 text-sm'>Хайж байна...</div>
        ) : results.length === 0 ? (
          <div className='text-muted-foreground p-2 text-sm'>
            {searched
              ? 'Хаяг олдсонгүй — доорх талбаруудыг бөглөвөл шинэ хаяг үүснэ.'
              : 'Хаяг хайна уу.'}
          </div>
        ) : (
          <ul className='divide-y'>
            {results.map((address) => (
              <li key={address.id}>
                <button
                  type='button'
                  onClick={() => onSelect(address)}
                  className='hover:bg-muted flex w-full items-center justify-between gap-2 px-2 py-2 text-left text-sm'
                >
                  <span>{formatAddress(address)}</span>
                  <span className='text-muted-foreground shrink-0'>
                    {address.cardCount} карт
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
