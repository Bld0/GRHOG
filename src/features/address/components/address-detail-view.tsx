'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { IconArrowLeft, IconExternalLink } from '@tabler/icons-react';

import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { apiClient } from '@/lib/api-client';
import { AddressOption, formatAddress } from '@/features/address/types';
import { CardCreateDialog } from '@/features/card/components/card-create-dialog';
import {
  CardEditDialog,
  EditableCard
} from '@/features/card/components/card-edit-dialog';
import { CardDeleteDialog } from '@/features/card/components/card-delete-dialog';

import { AddressFormDialog } from './address-form-dialog';

interface AddressCard {
  id: number;
  name: string | null;
  cardId: string | null;
  cardIdDec: string | null;
  cardIdConverted?: boolean;
  email: string | null;
  phone: string | null;
  type: string | null;
  district: string | null;
  khoroo: number | null;
  streetBuilding: string | null;
  apartmentNumber: string | null;
  cardUsedAt: string | null;
  totalAccess: number | null;
  active?: boolean;
}

/**
 * Нэг өрхийн хуудас: хаягийн мэдээлэл + тэнд бүртгэлтэй картууд.
 *
 * Картын мөр бүрээс тухайн картын дэлгэрэнгүй рүү (`/dashboard/card/{id}`)
 * шилжинэ — нэвтрэлтийн бүтэн түүх тэнд аль хэдийн бий, түүнийг энд давтахгүй.
 */
export function AddressDetailView({ addressId }: { addressId: string }) {
  const { canPerformAction } = useRolePermissions();
  const [address, setAddress] = useState<AddressOption | null>(null);
  const [cards, setCards] = useState<AddressCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EditableCard | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.fetchWithAuth(
        `/api/addresses/${addressId}`
      );
      if (!response.ok) throw new Error(await response.text());
      const json = await response.json();
      setAddress(json?.address ?? null);
      setCards(Array.isArray(json?.cards) ? json.cards : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Алдаа');
    } finally {
      setLoading(false);
    }
  }, [addressId]);

  useEffect(() => {
    load();
  }, [load]);

  // Картын жагсаалтын хуудастай ижил цонхнуудыг дахин ашиглана — засварын
  // дүрэм (хаягийн талбар засагдвал хаяг нь дахин тодорхойлогдох) нэг л газарт.
  const toEditable = (card: AddressCard): EditableCard => ({
    id: String(card.id),
    name: card.name ?? '',
    cardId: card.cardId ?? '',
    cardIdConverted: card.cardIdConverted ?? false,
    email: card.email ?? '',
    phone: card.phone ?? '',
    district: card.district ?? '',
    khoroo: card.khoroo ?? null,
    streetBuilding: card.streetBuilding ?? '',
    apartmentNumber: card.apartmentNumber ?? null,
    type: card.type ?? ''
  });

  const totalAccess = cards.reduce((sum, c) => sum + (c.totalAccess ?? 0), 0);
  const usedCards = cards.filter((c) => c.cardUsedAt).length;

  if (error) {
    return (
      <PageContainer>
        <div className='space-y-4'>
          <BackLink />
          <p className='text-destructive'>Алдаа: {error}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex h-full flex-1 flex-col space-y-5'>
        <BackLink />

        <div className='flex flex-wrap items-start justify-between gap-3 pr-6'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              {address ? formatAddress(address) : 'Хаяг'}
            </h1>
            <div className='text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-sm'>
              {address?.type && <Badge variant='outline'>{address.type}</Badge>}
              {address?.contactName && <span>{address.contactName}</span>}
              {address?.contactPhone && <span>{address.contactPhone}</span>}
              {address?.note && <span>{address.note}</span>}
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {canPerformAction('canEditClients') && address && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setFormOpen(true)}
              >
                Хаяг засах
              </Button>
            )}
            {canPerformAction('canCreateClients') && (
              <CardCreateDialog
                canCreate
                presetAddress={address}
                onCreated={load}
              />
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Бүртгэлтэй карт</CardTitle>
            <CardDescription>
              {cards.length} карт • {usedCards} нь уншуулсан • нийт {totalAccess}{' '}
              нэвтрэлт
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Нэр</TableHead>
                  <TableHead>Карт</TableHead>
                  <TableHead>Төрөл</TableHead>
                  <TableHead>Утас</TableHead>
                  <TableHead className='text-right'>Нэвтрэлт</TableHead>
                  <TableHead>Сүүлд ашигласан</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className='text-muted-foreground'>
                      Уншиж байна...
                    </TableCell>
                  </TableRow>
                ) : cards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className='text-muted-foreground'>
                      Энэ хаягт карт бүртгэгдээгүй байна.
                    </TableCell>
                  </TableRow>
                ) : (
                  cards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell>
                        {/* Нэвтрэлтийн бүтэн түүх картын хуудсан дээр.
                            Тэр хуудас мөрийн id-гаар БИШ картын UID-аар
                            хайдаг (`/clients/{cardId}/activity`) — id
                            дамжуулбал "Карт олдсонгүй" гэж гарна. */}
                        {card.cardId ? (
                          <Link
                            href={`/dashboard/card/${card.cardId}`}
                            className='inline-flex items-center gap-1 font-medium hover:underline'
                          >
                            {card.name || `Карт ${card.id}`}
                            <IconExternalLink className='h-3.5 w-3.5' />
                          </Link>
                        ) : (
                          <span className='font-medium'>
                            {card.name || `Карт ${card.id}`}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className='font-mono'>
                        {card.cardIdDec || card.cardId || '-'}
                      </TableCell>
                      <TableCell>{card.type || '-'}</TableCell>
                      <TableCell>{card.phone || '-'}</TableCell>
                      <TableCell className='text-right'>
                        {card.totalAccess ?? 0}
                      </TableCell>
                      <TableCell>
                        {card.cardUsedAt
                          ? new Date(card.cardUsedAt).toLocaleDateString('mn-MN')
                          : 'Хэзээ ч'}
                      </TableCell>
                      <TableCell className='text-right whitespace-nowrap'>
                        {canPerformAction('canEditClients') && (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setEditing(toEditable(card))}
                          >
                            Засах
                          </Button>
                        )}
                        {canPerformAction('canDeleteClients') && (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-destructive'
                            onClick={() => setDeletingId(String(card.id))}
                          >
                            Устгах
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AddressFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        address={address}
        onSaved={load}
      />

      <CardEditDialog
        card={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />

      <CardDeleteDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
        clientIds={deletingId ? [deletingId] : []}
        onDeleted={() => {
          setDeletingId(null);
          load();
        }}
      />
    </PageContainer>
  );
}

function BackLink() {
  return (
    <Link
      href='/dashboard/address'
      className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm'
    >
      <IconArrowLeft className='h-4 w-4' />
      Хаягийн жагсаалт
    </Link>
  );
}
