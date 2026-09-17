'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
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
import { AddressOption, CLIENT_TYPES, DISTRICTS } from '@/features/address/types';

interface AddressFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null бол шинэ хаяг. */
  address: AddressOption | null;
  onSaved: () => void;
}

const EMPTY = {
  district: '',
  khoroo: '',
  streetBuilding: '',
  apartmentNumber: '',
  type: '',
  contactName: '',
  contactPhone: '',
  note: ''
};

/**
 * Хаяг (өрх) нэмэх / засах цонх.
 *
 * Дүүрэг, хороо, гудамж/байр, тоот дөрөв нь хаягийн өвөрмөц түлхүүр — backend
 * тэдгээрээр нь олж эсвэл үүсгэдэг тул ижил хаягийг хоёр удаа нэмэх нь шинэ
 * мөр үүсгэхгүй, байгаагаа буцаана.
 */
export function AddressFormDialog({
  open,
  onOpenChange,
  address,
  onSaved
}: AddressFormDialogProps) {
  const [values, setValues] = useState(EMPTY);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(
      address
        ? {
            district: address.district,
            khoroo: String(address.khoroo),
            streetBuilding: address.streetBuilding ?? '',
            apartmentNumber: address.apartmentNumber ?? '',
            type: address.type ?? '',
            contactName: address.contactName ?? '',
            contactPhone: address.contactPhone ?? '',
            note: address.note ?? ''
          }
        : EMPTY
    );
  }, [open, address]);

  const patch = (change: Partial<typeof EMPTY>) =>
    setValues((prev) => ({ ...prev, ...change }));

  const submit = async () => {
    if (
      !values.district ||
      !values.khoroo ||
      !values.streetBuilding ||
      !values.apartmentNumber
    ) {
      toast.error('Дүүрэг, хороо, гудамж/байр, тоот дөрвийг бөглөнө үү');
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiClient.fetchWithAuth(
        address ? `/api/addresses/${address.id}` : '/api/addresses',
        {
          method: address ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            district: values.district,
            khoroo: parseInt(values.khoroo),
            streetBuilding: values.streetBuilding,
            apartmentNumber: values.apartmentNumber,
            type: values.type || null,
            contactName: values.contactName || null,
            contactPhone: values.contactPhone || null,
            note: values.note || null
          })
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Хадгалахад алдаа гарлаа');
      }

      onOpenChange(false);
      toast.success(address ? 'Хаяг шинэчлэгдлээ' : 'Хаяг бүртгэгдлээ');
      onSaved();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Хадгалахад алдаа гарлаа'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[525px]'>
        <DialogHeader>
          <DialogTitle>{address ? 'Хаяг засах' : 'Шинэ хаяг'}</DialogTitle>
        </DialogHeader>

        <div className='grid gap-4 py-2'>
          <Field label='Дүүрэг *'>
            <Select
              value={values.district}
              onValueChange={(value) => patch({ district: value })}
            >
              <SelectTrigger className='col-span-3'>
                <SelectValue placeholder='Дүүрэг сонгоно уу' />
              </SelectTrigger>
              <SelectContent>
                {DISTRICTS.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label='Хороо *'>
            <Input
              type='number'
              value={values.khoroo}
              onChange={(e) => patch({ khoroo: e.target.value })}
              placeholder='6'
              className='col-span-3'
            />
          </Field>

          <Field label='Гудамж, байр *'>
            <Input
              value={values.streetBuilding}
              onChange={(e) => patch({ streetBuilding: e.target.value })}
              placeholder='25-р байр'
              className='col-span-3'
            />
          </Field>

          <Field label='Тоот *'>
            <Input
              value={values.apartmentNumber}
              onChange={(e) => patch({ apartmentNumber: e.target.value })}
              placeholder='14'
              className='col-span-3'
            />
          </Field>

          <Field label='Төрөл'>
            <Select
              value={values.type}
              onValueChange={(value) => patch({ type: value })}
            >
              <SelectTrigger className='col-span-3'>
                <SelectValue placeholder='Төрөл сонгоно уу' />
              </SelectTrigger>
              <SelectContent>
                {CLIENT_TYPES.filter((type) => type !== 'Ажилтан').map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label='Холбоо барих'>
            <Input
              value={values.contactName}
              onChange={(e) => patch({ contactName: e.target.value })}
              placeholder='Овог нэр'
              className='col-span-3'
            />
          </Field>

          <Field label='Утас'>
            <Input
              type='tel'
              value={values.contactPhone}
              onChange={(e) => patch({ contactPhone: e.target.value })}
              placeholder='99112233'
              className='col-span-3'
            />
          </Field>

          <Field label='Тэмдэглэл'>
            <Input
              value={values.note}
              onChange={(e) => patch({ note: e.target.value })}
              placeholder='Дэлгэрэнгүй хаяг, нэмэлт тайлбар'
              className='col-span-3'
            />
          </Field>
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Цуцлах
          </Button>
          <Button type='button' onClick={submit} disabled={isSaving}>
            {isSaving ? 'Хадгалж байна...' : 'Хадгалах'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='grid grid-cols-4 items-center gap-4'>
      <Label className='text-right'>{label}</Label>
      {children}
    </div>
  );
}
