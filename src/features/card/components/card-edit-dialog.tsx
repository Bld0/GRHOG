'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import SwitchButton from '@/components/switch-button';
import { apiClient } from '@/lib/api-client';
import { swapCardIdBytes } from '@/lib/card-id';
import {
  CardFormFields,
  CardFormValues,
  EMPTY_CARD_FORM,
  toClientPayload
} from './card-form-fields';

/** Засварлах гэж буй мөр — хүснэгтийн хөрвүүлсэн хэлбэр. */
export interface EditableCard {
  id: string;
  name: string;
  cardId: string;
  cardIdConverted?: boolean;
  email?: string;
  phone?: string;
  address?: string;
  district?: string;
  khoroo?: number | string | null;
  streetBuilding?: string;
  apartmentNumber?: number | string | null;
  type?: string;
}

interface CardEditDialogProps {
  /** null бол цонх хаалттай. */
  card: EditableCard | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Карт засварлах цонх. Формын төлөв, хөрвүүлэлт, хадгалалтыг өөрөө эзэмшинэ.
 */
export function CardEditDialog({ card, onClose, onSaved }: CardEditDialogProps) {
  const [values, setValues] = useState<CardFormValues>(EMPTY_CARD_FORM);
  const [cardIdConverted, setCardIdConverted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Шинэ мөр сонгогдох бүрд формыг түүний утгаар дүүргэнэ.
  useEffect(() => {
    if (!card) return;
    setValues({
      name: card.name ?? '',
      email: card.email ?? '',
      phone: card.phone ?? '',
      cardId: card.cardId ?? '',
      address: card.address ?? '',
      district: card.district ?? '',
      khoroo: card.khoroo != null ? String(card.khoroo) : '',
      streetBuilding: card.streetBuilding ?? '',
      apartmentNumber:
        card.apartmentNumber != null ? String(card.apartmentNumber) : '',
      type: card.type ?? ''
    });
    setCardIdConverted(card.cardIdConverted ?? false);
  }, [card]);

  const patch = (change: Partial<CardFormValues>) =>
    setValues((prev) => ({ ...prev, ...change }));

  const toggleConversion = () => {
    setValues((prev) => ({ ...prev, cardId: swapCardIdBytes(prev.cardId) }));
    setCardIdConverted((prev) => !prev);
  };

  const save = async () => {
    if (!card?.id) return;
    setIsSaving(true);
    try {
      const response = await apiClient.fetchWithAuth(
        `/api/users/clients/${card.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...toClientPayload(values), cardIdConverted })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update client');
      }

      toast.success('Картын мэдээлэл амжилттай шинэчлэгдлээ');
      onClose();
      // Өмнө нь хэрэглэгчид «Reload хийж шинэчлэгдсэн дата үзнэ үү» гэж
      // зааварчилдаг байв — одоо жагсаалт өөрөө дахин татагдана.
      onSaved();
    } catch (error) {
      toast.error(
        'Карт засахад алдаа гарлаа: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={card !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-[525px]'>
        <DialogHeader>
          <DialogTitle>Карт засварлах</DialogTitle>
          <DialogDescription>
            {card?.name} ({card?.cardId}) картын мэдээллийг засварлах
          </DialogDescription>
        </DialogHeader>
        <CardFormFields
          idPrefix='edit'
          values={values}
          onChange={patch}
          cardIdSlot={
            <SwitchButton
              value={cardIdConverted}
              onChange={toggleConversion}
              label={cardIdConverted ? 'Хөрвүүлсэн' : 'Хөрвүүлээгүй'}
            />
          }
        />
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            disabled={isSaving}
          >
            Цуцлах
          </Button>
          <Button type='button' onClick={save} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                Хадгалж байна...
              </>
            ) : (
              'Хадгалах'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
