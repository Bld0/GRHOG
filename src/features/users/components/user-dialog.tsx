'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';

import {
  UserFormFields,
  UserFormValues
} from './user-form-fields';

interface UserDialogProps {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: UserFormValues;
  onChange: (patch: Partial<UserFormValues>) => void;
  areaLocked: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * Хэрэглэгч үүсгэх ба засах цонх.
 *
 * Хоёулаа ижил формтой, зөвхөн гарчиг, товчны шошго, нууц үгийн шаардлага
 * ялгаатай тул нэг component. Өмнө нь хоёр цонх тус тусдаа ~170 мөрөөр
 * бичигдсэн байв.
 */
export function UserDialog({
  mode,
  open,
  onOpenChange,
  values,
  onChange,
  areaLocked,
  onSubmit,
  onCancel
}: UserDialogProps) {
  const isCreate = mode === 'create';

  // Үүсгэхэд нууц үг заавал, засахад хоосон үлдээвэл хэвээр нь үлдэнэ.
  const canSubmit = isCreate
    ? Boolean(values.username && values.email && values.password.length >= 6)
    : Boolean(values.username && values.email);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader className='space-y-3'>
          <DialogTitle className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
            {isCreate ? 'Шинэ хэрэглэгч үүсгэх' : 'Хэрэглэгч засах'}
          </DialogTitle>
          <DialogDescription className='text-gray-600 dark:text-gray-400'>
            {isCreate
              ? 'Системд шинэ хэрэглэгч нэмэх. Бүх талбарыг бөглөнө үү.'
              : 'Хэрэглэгчийн мэдээллийг шинэчлэх.'}
          </DialogDescription>
        </DialogHeader>

        <UserFormFields
          idPrefix={mode}
          values={values}
          onChange={onChange}
          areaLocked={areaLocked}
          passwordLabel={isCreate ? 'Нууц үг *' : 'Шинэ нууц үг'}
          passwordHint={
            isCreate
              ? 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой'
              : 'Хоосон үлдээвэл нууц үг өөрчлөгдөхгүй'
          }
        />

        <DialogFooter className='flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2'>
          <Button variant='outline' onClick={onCancel} className='w-full sm:w-auto'>
            Цуцлах
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!canSubmit}
            className='bg-primary hover:bg-primary/90 w-full text-white shadow-sm sm:w-auto'
          >
            {isCreate ? (
              <>
                <Icons.add className='mr-2 h-4 w-4' />
                Хэрэглэгч үүсгэх
              </>
            ) : (
              <>
                <Icons.userPen className='mr-2 h-4 w-4' />
                Хадгалах
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
