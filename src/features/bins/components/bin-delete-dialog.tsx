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
import { deleteBin } from '@/lib/api';

interface BinDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Устгах савнууд. Нэг ч байж болно. */
  binIds: number[];
  /** Устгасны дараа — жагсаалт дахин татах эсвэл буцах. */
  onDeleted: () => void;
}

/** Сав устгах баталгаажуулалт. */
export function BinDeleteDialog({
  open,
  onOpenChange,
  binIds,
  onDeleted
}: BinDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const remove = async () => {
    setIsDeleting(true);
    try {
      await Promise.all(binIds.map((id) => deleteBin(id)));
      toast.success(
        binIds.length > 1
          ? `${binIds.length} хогийн сав устгагдлаа`
          : 'Хогийн сав амжилттай устгагдлаа'
      );
      onDeleted();
    } catch (error) {
      toast.error('Устгахад алдаа гарлаа');
      setIsDeleting(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='z-[1000]'>
        <AlertDialogHeader>
          <AlertDialogTitle>Та итгэлтэй байна уу?</AlertDialogTitle>
          <AlertDialogDescription>
            {binIds.length > 1
              ? `Та ${binIds.length} хогийн сав устгах гэж байна.`
              : 'Та энэ хогийн савыг устгах гэж байна.'}{' '}
            Энэ үйлдлийг буцаах боломжгүй.
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
