'use client';

import { useState } from 'react';
import { toast } from 'sonner';

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
import { apiClient } from '@/lib/api-client';
import { AddressOption, formatAddress } from '@/features/address/types';

interface AddressDeleteDialogProps {
  /** null бол цонх хаалттай. */
  address: AddressOption | null;
  onClose: () => void;
  /** Устсаны дараа: жагсаалт дахин татах эсвэл буцах. */
  onDeleted: () => void;
}

/**
 * Хаяг устгах баталгаажуулалт — жагсаалтын мөр ба хаягийн хуудас хоёулаа
 * үүнийг дуудна.
 *
 * Backend нь карттай хаягийг устгахаас татгалздаг (`DELETE /addresses/{id}`
 * → 406). Дуудаж буй тал нь ихэвчлэн товчоо хаадаг ч 406-г энд бас
 * харуулна — жагсаалтын картын тоо хуучирсан байж болно.
 */
export function AddressDeleteDialog({
  address,
  onClose,
  onDeleted
}: AddressDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const remove = async () => {
    if (!address) return;
    setIsDeleting(true);
    try {
      const response = await apiClient.fetchWithAuth(
        `/api/addresses/${address.id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error(await serverMessage(response));
      toast.success('Хаяг устгалаа');
      onDeleted();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Хаяг устгахад алдаа гарлаа'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={address !== null} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className='z-[1000]'>
        <AlertDialogHeader>
          <AlertDialogTitle>Хаягийг устгах уу?</AlertDialogTitle>
          <AlertDialogDescription>
            {address ? formatAddress(address) : 'Энэ хаяг'} устгагдана. Энэ
            үйлдлийг буцаах боломжгүй.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Болих</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              remove();
            }}
            className='bg-red-600 hover:bg-red-700'
            disabled={isDeleting}
          >
            {isDeleting ? 'Устгаж байна...' : 'Устгах'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Spring-ийн алдааны хариу нь JSON — `message` талбарыг нь гаргаж авна.
 * Бүтэн биеийг toast-д хаявал оператор `{"timestamp":...}` уншина.
 */
async function serverMessage(response: Response): Promise<string> {
  const text = await response.text();
  try {
    return JSON.parse(text)?.message || text;
  } catch {
    return text || 'Хаяг устгахад алдаа гарлаа';
  }
}
