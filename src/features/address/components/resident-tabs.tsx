'use client';

import { useRouter } from 'next/navigation';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Хаяг ба картын хоёр харагдацыг нэг цэс дор холбоно.
 *
 * Хоёр нь өөр НЭГЖ тоолдог: хаягийн мөр = нэг өрх (олон карттай), картын мөр =
 * нэг карт. Тиймээс нэг хүснэгт болгон нийлүүлэхгүй — таб сольж харна.
 */
export function ResidentTabs({ active }: { active: 'address' | 'card' }) {
  const router = useRouter();

  return (
    <Tabs
      value={active}
      onValueChange={(value) =>
        router.push(value === 'address' ? '/dashboard/address' : '/dashboard/card')
      }
    >
      <TabsList>
        <TabsTrigger value='address'>Хаяг</TabsTrigger>
        <TabsTrigger value='card'>Карт</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
