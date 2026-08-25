'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  IconBan,
  IconPlus,
  IconTrash,
  IconUserCheck
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

interface CollectorCard {
  id: number;
  cardId: string;
  cardIdDec: string | null;
  name: string;
  phone: string | null;
  vehicleNumber: string | null;
  active: boolean;
  lastUsedAt: string | null;
  totalClearings: number;
  createdAt: string;
}

const EMPTY_FORM = { name: '', cardId: '', phone: '', vehicleNumber: '' };

/**
 * Хогийн сав хоослогч (жолооч)-ийн картын бүртгэл.
 *
 * Энэ картыг сав дээр уншуулахад тухайн савны "Хоослох түүх"-д мөр үүснэ, тиймээс
 * бүртгэх эрхийг зөвхөн супер админд өгсөн — profile хуудсанд байрлана.
 */
export function CollectorCardsCard() {
  const [cards, setCards] = useState<CollectorCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CollectorCard | null>(
    null
  );

  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.fetchWithAuth(
        '/api/users/collector-cards'
      );
      if (!response.ok) {
        throw new Error('Картын жагсаалт татахад алдаа гарлаа');
      }
      setCards(await response.json());
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Картын жагсаалт татахад алдаа гарлаа'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Backend-ийн алдааны бичвэрийг (давхардсан карт, буруу формат) шууд харуулна.
  const readError = async (response: Response, fallback: string) => {
    const raw = await response.text();
    try {
      const parsed = JSON.parse(raw);
      return parsed.message || parsed.error || fallback;
    } catch {
      return raw || fallback;
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.cardId.trim()) {
      toast.error('Нэр болон картын дугаарыг бөглөнө үү');
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiClient.fetchWithAuth(
        '/api/users/collector-cards',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            cardId: form.cardId.trim(),
            phone: form.phone.trim() || null,
            vehicleNumber: form.vehicleNumber.trim() || null
          })
        }
      );

      if (!response.ok) {
        throw new Error(
          await readError(response, 'Карт бүртгэхэд алдаа гарлаа')
        );
      }

      toast.success('Хоослогчийн карт бүртгэгдлээ');
      setForm(EMPTY_FORM);
      fetchCards();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Карт бүртгэхэд алдаа гарлаа'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (card: CollectorCard) => {
    try {
      const response = await apiClient.fetchWithAuth(
        `/api/users/collector-cards/${card.id}/status?isActive=${!card.active}`,
        { method: 'PUT' }
      );
      if (!response.ok) {
        throw new Error(
          await readError(response, 'Төлөв өөрчлөхөд алдаа гарлаа')
        );
      }
      toast.success(card.active ? 'Карт хүчингүй болголоо' : 'Карт идэвхжлээ');
      fetchCards();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Төлөв өөрчлөхөд алдаа гарлаа'
      );
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      const response = await apiClient.fetchWithAuth(
        `/api/users/collector-cards/${pendingDelete.id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        throw new Error(
          await readError(response, 'Карт устгахад алдаа гарлаа')
        );
      }
      toast.success('Карт устгагдлаа');
      setPendingDelete(null);
      fetchCards();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Карт устгахад алдаа гарлаа'
      );
    }
  };

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleString('mn-MN') : '-';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Хогийн сав хоослогчийн карт</CardTitle>
        <CardDescription>
          Хог ачигч жолооч савыг хоослоод энэ картаа уншуулахад тухайн савны
          &quot;Хоослох түүх&quot;-д бүртгэгдэнэ. Картын дугаарыг уншигч дээр
          гарах аравтын тоогоор (жишээ нь 964487466) эсвэл 16-тын дугаараар
          (397CE92A) оруулж болно.
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-5'>
          <div className='space-y-2'>
            <Label htmlFor='collector-name'>Нэр *</Label>
            <Input
              id='collector-name'
              placeholder='Ж: Б.Болд'
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='collector-card-id'>Картын дугаар *</Label>
            <Input
              id='collector-card-id'
              placeholder='964487466'
              className='font-mono'
              value={form.cardId}
              onChange={(e) => setForm({ ...form, cardId: e.target.value })}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='collector-phone'>Утас</Label>
            <Input
              id='collector-phone'
              placeholder='99112233'
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='collector-vehicle'>Машины дугаар</Label>
            <Input
              id='collector-vehicle'
              placeholder='1234 УБА'
              value={form.vehicleNumber}
              onChange={(e) =>
                setForm({ ...form, vehicleNumber: e.target.value })
              }
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={isSaving || !form.name || !form.cardId}
          >
            <IconPlus className='mr-2 h-4 w-4' />
            {isSaving ? 'Бүртгэж байна...' : 'Бүртгэх'}
          </Button>
        </div>

        {isLoading ? (
          <div className='space-y-2'>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className='h-12 w-full' />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className='text-muted-foreground py-6 text-center text-sm'>
            Бүртгэлтэй карт алга байна.
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Нэр</TableHead>
                  <TableHead>Утас</TableHead>
                  <TableHead>Машин</TableHead>
                  <TableHead>Карт</TableHead>
                  <TableHead className='text-right'>Хоослолт</TableHead>
                  <TableHead>Сүүлд уншуулсан</TableHead>
                  <TableHead>Төлөв</TableHead>
                  <TableHead className='text-right'>Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className='font-medium'>{card.name}</TableCell>
                    <TableCell>{card.phone || '-'}</TableCell>
                    <TableCell>{card.vehicleNumber || '-'}</TableCell>
                    <TableCell>
                      <div className='font-mono text-xs'>{card.cardId}</div>
                      <div className='text-muted-foreground font-mono text-xs'>
                        {card.cardIdDec || '-'}
                      </div>
                    </TableCell>
                    <TableCell className='text-right'>
                      {card.totalClearings}
                    </TableCell>
                    <TableCell className='text-sm'>
                      {formatDate(card.lastUsedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={card.active ? 'default' : 'secondary'}>
                        {card.active ? 'Идэвхтэй' : 'Хүчингүй'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex justify-end gap-1'>
                        <Button
                          variant='outline'
                          size='sm'
                          title={
                            card.active ? 'Хүчингүй болгох' : 'Идэвхжүүлэх'
                          }
                          onClick={() => toggleActive(card)}
                        >
                          {card.active ? (
                            <IconBan className='h-4 w-4' />
                          ) : (
                            <IconUserCheck className='h-4 w-4' />
                          )}
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          title='Устгах'
                          onClick={() => setPendingDelete(card)}
                        >
                          <IconTrash className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Картыг устгах уу?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{pendingDelete?.name}&quot;-ийн карт устгагдана. Түүхийг
              хадгалахын тулд устгахын оронд &quot;Хүчингүй болгох&quot;
              сонголтыг ашиглаж болно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Устгах</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
