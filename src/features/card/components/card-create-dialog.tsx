'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { IconPlus } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import {
  CardFormFields,
  CardFormValues,
  EMPTY_CARD_FORM,
  toClientPayload
} from './card-form-fields';

interface CardCreateDialogProps {
  /** Товч харагдах эсэх — эрхийн шалгалтыг дуудагч хийнэ. */
  canCreate: boolean;
  /** Амжилттай үүсгэсний дараа жагсаалтыг дахин татна. */
  onCreated: () => void;
}

/**
 * Шинэ карт нэмэх цонх.
 *
 * Формын төлөв, илгээлт, ачаалж буй тугийг ӨӨРӨӨ эзэмшинэ — өмнө нь эдгээр
 * нь `CardsView` дотор 4 `useState` ба 60 мөрийн handler болж, 1900 мөрт
 * дэлгэцийн бусад логиктой холилдож байв.
 */
export function CardCreateDialog({ canCreate, onCreated }: CardCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CardFormValues>(EMPTY_CARD_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const patch = (change: Partial<CardFormValues>) =>
    setValues((prev) => ({ ...prev, ...change }));

  const submit = async () => {
    if (!values.name || !values.cardId) {
      toast.error('Нэр болон карт ID заавал бөглөнө үү');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.fetchWithAuth('/api/users/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toClientPayload(values))
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create client');
      }

      setOpen(false);
      setValues(EMPTY_CARD_FORM);
      toast.success('Карт амжилттай үүслээ');
      // Өмнө нь `window.location.reload()` дуудаж бүх хуудсыг сэргээдэг
      // байсан — шүүлтүүр, хуудаслалт, сонголт бүгд алга болно.
      onCreated();
    } catch (error) {
      toast.error(
        'Карт үүсгэхэд алдаа гарлаа: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {canCreate && (
          <Button size='sm'>
            <IconPlus className='mr-2 h-4 w-4' />
            Карт нэмэх
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='sm:max-w-[525px]'>
        <DialogHeader>
          <DialogTitle>Шинэ карт нэмэх</DialogTitle>
        </DialogHeader>
        <CardFormFields
          idPrefix='create'
          values={values}
          onChange={patch}
          nameLabel='Нэр *'
          cardIdLabel='Карт ID *'
        />
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Цуцлах
          </Button>
          <Button type='button' onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                Үүсгэж байна...
              </>
            ) : (
              'Карт үүсгэх'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
