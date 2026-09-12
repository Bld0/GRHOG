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

interface CardDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Устгах картуудын id. */
  clientIds: string[];
  /** Устгасны дараа сонголт цэвэрлэх + жагсаалт дахин татах. */
  onDeleted: () => void;
}

/** Сонгосон картуудыг устгах баталгаажуулалт. */
export function CardDeleteDialog({
  open,
  onOpenChange,
  clientIds,
  onDeleted
}: CardDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const remove = async () => {
    setIsDeleting(true);
    try {
      await Promise.all(
        clientIds.map((clientId) =>
          apiClient.fetchWithAuth(`/api/users/clients/${clientId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          })
        )
      );
      toast.success('Сонгосон картууд амжилттай устгагдлаа');
      onDeleted();
    } catch (error) {
      toast.error('Карт устгахад алдаа гарлаа');
    } finally {
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
            Та {clientIds.length} картыг устгах гэж байна. Энэ үйлдлийг буцаах
            боломжгүй.
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
