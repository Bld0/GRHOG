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
import { AddressPicker, AddressOption } from './address-picker';

interface CardCreateDialogProps {
  /** Товч харагдах эсэх — эрхийн шалгалтыг дуудагч хийнэ. */
  canCreate: boolean;
  /** Амжилттай үүсгэсний дараа жагсаалтыг дахин татна. */
  onCreated: () => void;
  /**
   * Хаягийн хуудаснаас дуудахад тухайн өрхийг урьдчилж сонгоно — оператор
   * хаягаа дахин хайх шаардлагагүй.
   */
  presetAddress?: AddressOption | null;
  triggerLabel?: string;
}

/**
 * Шинэ карт нэмэх цонх.
 *
 * Формын төлөв, илгээлт, ачаалж буй тугийг ӨӨРӨӨ эзэмшинэ — өмнө нь эдгээр
 * нь `CardsView` дотор 4 `useState` ба 60 мөрийн handler болж, 1900 мөрт
 * дэлгэцийн бусад логиктой холилдож байв.
 */
export function CardCreateDialog({
  canCreate,
  onCreated,
  presetAddress = null,
  triggerLabel = 'Карт нэмэх'
}: CardCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CardFormValues>(EMPTY_CARD_FORM);
  const [address, setAddress] = useState<AddressOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const patch = (change: Partial<CardFormValues>) =>
    setValues((prev) => ({ ...prev, ...change }));

  /** Хаяг сонгоход картын хаягийн талбарууд түүнээс бөглөгдөнө. */
  const selectAddress = (selected: AddressOption | null) => {
    setAddress(selected);
    patch(
      selected
        ? {
            addressId: selected.id,
            district: selected.district,
            khoroo: String(selected.khoroo),
            streetBuilding: selected.streetBuilding ?? '',
            apartmentNumber: selected.apartmentNumber ?? ''
          }
        : { addressId: null }
    );
  };

  // Цонх нээгдэх бүрд урьдчилж сонгосон хаягийг тавина.
  const openChange = (next: boolean) => {
    setOpen(next);
    if (next && presetAddress) selectAddress(presetAddress);
    if (!next) {
      setValues(EMPTY_CARD_FORM);
      setAddress(null);
    }
  };

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
      setAddress(null);
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
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>
        {canCreate && (
          <Button size='sm'>
            <IconPlus className='mr-2 h-4 w-4' />
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[525px]'>
        <DialogHeader>
          <DialogTitle>Шинэ карт нэмэх</DialogTitle>
        </DialogHeader>
        {/* Хаяг (өрх) нь бүртгэлийн үндсэн нэгж — эхлээд түүнийг сонгоно.
            Нэг хаяг дор олон карт байж болно. */}
        {values.type !== 'Ажилтан' && (
          <AddressPicker selected={address} onSelect={selectAddress} />
        )}
        <CardFormFields
          idPrefix='create'
          values={values}
          onChange={patch}
          nameLabel='Нэр *'
          cardIdLabel='Карт ID *'
          addressLocked={address !== null}
        />
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => openChange(false)}
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
