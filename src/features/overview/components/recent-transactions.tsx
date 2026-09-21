'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useBinUsages, useClients } from '@/hooks/use-api-data';
import { BinUsage, Client } from '@/types';
import { useMemo } from 'react';

export function RecentTransactions() {
  const {
    data: binUsages,
    loading: binUsagesLoading,
    error: binUsagesError
  } = useBinUsages();
  const {
    data: clients,
    loading: clientsLoading,
    error: clientsError
  } = useClients();

  // Create a map of cardId to client for quick lookup
  const clientsMap = useMemo(() => {
    return clients.reduce(
      (map, client) => {
        map[client.cardId] = client;
        return map;
      },
      {} as Record<string, Client>
    );
  }, [clients]);

  // Get the most recent 5 bin usages
  const recentUsages = useMemo(() => {
    return binUsages
      .filter((a) => a.cardId !== null)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 6);
  }, [binUsages]);

  if (binUsagesLoading || clientsLoading) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle>Сүүлийн хогний хэрэглээ</CardTitle>
          <CardDescription>Сүүлийн 5 хогний идэвхтэй хэрэглээ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-muted-foreground text-sm'>Ачааллаж байна...</div>
        </CardContent>
      </Card>
    );
  }

  if (binUsagesError || clientsError) {
    return (
      <Card className='w-full'>
        <CardHeader>
          <CardTitle>Сүүлийн хогний хэрэглээ</CardTitle>
          <CardDescription>Сүүлийн 5 хогний идэвхтэй хэрэглээ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-destructive text-sm'>
            Алдаа гарлаа: {binUsagesError || clientsError}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>Сүүлийн хэрэглээ</CardTitle>
        <CardDescription>Сүүлийн идэвхтэй хэрэглээ</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-8'>
        {recentUsages.length === 0 ? (
          <div className='text-muted-foreground text-sm'>
            Хэрэглээний мэдээлэл олдсонгүй
          </div>
        ) : (
          recentUsages.map((usage: BinUsage) => {
            const client = clientsMap[usage.cardId];
            const clientName =
              client?.name || `Card ${usage.cardId ? usage.cardId : '0000'}`;
            const binLocation =
              usage.bin.location || `${usage.bin.binId || usage.bin.id}`;

            return (
              <div key={usage.id} className='flex items-center gap-4'>
                <Avatar className='h-9 w-9 sm:flex'>
                  <AvatarFallback>
                    {clientName
                      .split(' ')
                      .map((name: string) => name[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className='grid gap-1'>
                  <p className='text-sm leading-none font-medium'>
                    {clientName}
                  </p>
                  <p className='text-muted-foreground text-sm'>{binLocation}</p>
                </div>
                <div className='ml-auto font-medium'>
                  <div className='text-right'>
                    <div className='text-sm font-medium'>Хэрэглэсэн</div>
                    <div className='text-muted-foreground text-xs'>
                      {new Date(usage.createdAt).toLocaleDateString('mn-MN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
