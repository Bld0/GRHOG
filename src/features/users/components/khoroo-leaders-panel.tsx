'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { apiClient } from '@/lib/api-client';

/** Панелд хэрэгтэй талбарууд. Хуудсын бүтэн SystemUser-ийн дэд олонлог. */
export interface KhorooLeader {
  id: number;
  username: string;
  email: string;
  district?: string | null;
  khoroo?: number | null;
}

interface KhorooLeadersPanelProps {
  leaders: KhorooLeader[];
  onAdd: (district: string, khoroo: number) => void;
  onEdit: (leader: KhorooLeader) => void;
}

/**
 * Дүүрэг → хороо → тухайн хорооны дарга нар.
 *
 * Зорилго нь хэрэглэгчийн жагсаалтаас дарга хайх биш, эсрэгээрээ: аль хороонд
 * дарга байхгүй байгааг нэг харцаар олох. Тиймээс жагсаалтын тэнхлэг нь
 * хэрэглэгч биш, ХОРОО.
 *
 * Дүүрэг, хорооны жагсаалт өгөгдлөөс гардаг тул өгөгдөлд байхгүй дүүрэг энд
 * харагдахгүй, мөн 0 эсвэл 99 гэх мэт бодит бус хороо орж ирж болно.
 *
 * Хорооны мөр дээр дарвал тухайн хорооны дарга нар доор нь мөр болж дэлгэгдэнэ.
 * Хураангуй байдалд зөвхөн тоо (эсвэл "Дарга оноогоогүй") харагдана: панелийн
 * гол асуулт "аль хороонд дарга алга вэ" гэдэг тул дэлгээгүй үед ч тэр хариулт
 * мөр болгон дээр байх ёстой. Хэд ч хороог зэрэг дэлгэж болно — нэгийг нээхэд
 * нөгөө нь хаагдвал хоёр хороог харьцуулж чадахгүй.
 */
export function KhorooLeadersPanel({
  leaders,
  onAdd,
  onEdit
}: KhorooLeadersPanelProps) {
  const [areas, setAreas] = useState<{ district: string; khoroos: number[] }[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  // Дэлгэсэн хороод — "дүүрэг|хороо" түлхүүрээр. Хоёр дүүрэгт ижил дугаартай
  // хороо байдаг тул дугаар дангаараа түлхүүр болохгүй.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const districtResponse = await apiClient.fetchWithAuth(
          '/api/dashboard/getDistrict'
        );
        const districts: string[] = districtResponse.ok
          ? await districtResponse.json()
          : [];

        // Дүүрэг цөөхөн (одоогоор 1-2) тул дараалсан дуудлага хангалттай;
        // хороог дүүргээс нь салгаж татах боломжгүй.
        const loaded = await Promise.all(
          districts.map(async (district) => {
            const response = await apiClient.fetchWithAuth(
              `/api/dashboard/getKhoroo?district=${encodeURIComponent(district)}`
            );
            const khoroos: number[] = response.ok ? await response.json() : [];
            return { district, khoroos: [...khoroos].sort((a, b) => a - b) };
          })
        );

        if (!cancelled) setAreas(loaded);
      } catch {
        if (!cancelled) setAreas([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const leadersOf = (district: string, khoroo: number) =>
    leaders.filter((l) => l.district === district && l.khoroo === khoroo);

  const keyOf = (district: string, khoroo: number) => `${district}|${khoroo}`;

  const toggle = (district: string, khoroo: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      const key = keyOf(district, khoroo);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Хороодын дарга</CardTitle>
        <CardDescription>
          Хороо тус бүрд дарга оноох. Нэг хороонд хэд ч дарга байж болно — дарга
          оноогоогүй хороо шууд харагдана
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {isLoading ? (
          <div className='space-y-2'>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className='h-12 w-full' />
            ))}
          </div>
        ) : areas.length === 0 ? (
          <p className='text-muted-foreground py-6 text-center text-sm'>
            Дүүргийн жагсаалт хоосон байна. Дүүрэг, хороо нь бүртгэгдсэн сав,
            иргэний өгөгдлөөс гардаг тул эхлээд тэдгээрийг бүртгэнэ үү.
          </p>
        ) : (
          areas.map((area) => (
            <div key={area.district} className='space-y-2'>
              <div className='flex items-baseline gap-2'>
                <h3 className='text-base font-semibold'>{area.district}</h3>
                <span className='text-muted-foreground text-xs'>
                  {area.khoroos.length} хороо
                </span>
              </div>

              <div className='divide-y rounded-md border'>
                {area.khoroos.map((khoroo) => {
                  const assigned = leadersOf(area.district, khoroo);
                  const isOpen = expanded.has(keyOf(area.district, khoroo));
                  return (
                    <div key={khoroo}>
                      <div className='flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between'>
                        {/*
                          Дэлгэх талбар нь <button>: гар, дэлгэц уншигчаар ч
                          нээгддэг байх ёстой. Дарга байхгүй хороог дэлгэх юмгүй
                          тул идэвхгүй — гэхдээ "Дарга нэмэх" нь хэвээр.
                        */}
                        <button
                          type='button'
                          className='flex flex-1 items-center gap-2 text-left disabled:cursor-default'
                          onClick={() => toggle(area.district, khoroo)}
                          disabled={assigned.length === 0}
                          aria-expanded={isOpen}
                        >
                          <Icons.chevronRight
                            className={`h-4 w-4 shrink-0 transition-transform ${
                              assigned.length === 0
                                ? 'opacity-0'
                                : isOpen
                                  ? 'rotate-90'
                                  : ''
                            }`}
                          />
                          <span className='w-24 text-sm font-medium'>
                            {khoroo}-р хороо
                          </span>
                          {assigned.length === 0 ? (
                            <span className='text-muted-foreground text-sm'>
                              Дарга оноогоогүй
                            </span>
                          ) : (
                            <Badge variant='secondary'>
                              {assigned.length} дарга
                            </Badge>
                          )}
                        </button>

                        <Button
                          variant='outline'
                          size='sm'
                          className='shrink-0'
                          onClick={() => onAdd(area.district, khoroo)}
                        >
                          <Icons.add className='mr-1 h-4 w-4' />
                          Дарга нэмэх
                        </Button>
                      </div>

                      {isOpen && assigned.length > 0 && (
                        <div className='bg-muted/30 divide-y border-t'>
                          {assigned.map((leader) => (
                            <div
                              key={leader.id}
                              className='flex flex-col gap-2 py-2 pr-3 pl-3 sm:flex-row sm:items-center sm:justify-between sm:pl-10'
                            >
                              <div className='min-w-0'>
                                <div className='truncate text-sm font-medium'>
                                  {leader.username}
                                </div>
                                <div className='text-muted-foreground truncate text-xs'>
                                  {leader.email}
                                </div>
                              </div>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='shrink-0'
                                onClick={() => onEdit(leader)}
                              >
                                <Icons.userPen className='mr-1 h-4 w-4' />
                                Засах
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
