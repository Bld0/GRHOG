'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { apiClient } from '@/lib/api-client';
import { KhorooLeadersPanel } from '@/features/users/components/khoroo-leaders-panel';
import { UserDialog } from '@/features/users/components/user-dialog';
import {
  EMPTY_USER_FORM,
  UserFormValues,
  buildUserPayload
} from '@/features/users/components/user-form-fields';
import {
  SystemUser,
  UsersTable
} from '@/features/users/components/users-table';

/**
 * Системийн хэрэглэгчийн удирдлага — зохицуулалт л хийнэ.
 *
 * Форм, цонх, хүснэгт тус бүр өөрийн файлтай. Өмнө нь энэ бүхэн 734 мөрийн
 * нэг файлд, үүсгэх ба засах цонх нь бие биенээ бүрэн давтаж байв.
 */
export default function UsersPage() {
  const {
    isSuperAdmin,
    canPerformAction,
    isLoading: authLoading
  } = useRolePermissions();
  const router = useRouter();

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [formData, setFormData] = useState<UserFormValues>(EMPTY_USER_FORM);
  // Хорооны жагсаалтаас нэмэхэд бүс нь тухайн мөрөөр тогтоно.
  const [isAreaLocked, setIsAreaLocked] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await apiClient.fetchWithAuth('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.content || []);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isSuperAdmin) {
      router.push('/dashboard/overview');
      toast.error('Access denied. Super admin privileges required.');
      return;
    }
    fetchUsers();
  }, [isSuperAdmin, authLoading, router, fetchUsers]);

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedUser(null);
    setIsAreaLocked(false);
    setFormData(EMPTY_USER_FORM);
  };

  const openEdit = (user: SystemUser, locked = false) => {
    setSelectedUser(user);
    setIsAreaLocked(locked);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      district: user.district ?? '',
      khoroo: user.khoroo != null ? String(user.khoroo) : ''
    });
    setDialogMode('edit');
  };

  const submit = async () => {
    const isCreate = dialogMode === 'create';
    if (!isCreate && !selectedUser) return;

    const url = isCreate ? '/api/users/create' : `/api/users/${selectedUser!.id}`;
    try {
      const response = await apiClient.fetchWithAuth(url, {
        method: isCreate ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildUserPayload(formData))
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success(
        isCreate ? 'User created successfully' : 'User updated successfully'
      );
      closeDialog();
      fetchUsers();
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : isCreate
            ? 'Failed to create user'
            : 'Failed to update user'
      );
    }
  };

  const deleteUser = async (user: SystemUser) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await apiClient.fetchWithAuth(`/api/users/${user.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : 'Failed to delete user'
      );
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <Icons.spinner className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <PageContainer>
      <div className='w-full space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Системийн хэрэглэгчид
            </h1>
            <p className='text-muted-foreground'>
              Системийн хэрэглэгчдийн удирдлага
            </p>
          </div>
          {canPerformAction('canCreateUsers') && (
            <Button
              className='bg-primary hover:bg-primary/90 text-white shadow-sm'
              onClick={() => {
                setFormData(EMPTY_USER_FORM);
                setIsAreaLocked(false);
                setDialogMode('create');
              }}
            >
              <Icons.add className='mr-2 h-4 w-4' />
              Шинэ хэрэглэгч
            </Button>
          )}
        </div>

        {/* DEVELOPER эрх нь дотоод хэрэглээний данс — жагсаалтад харуулахгүй. */}
        <UsersTable
          users={users.filter((user) => user.role !== 'DEVELOPER')}
          canEdit={canPerformAction('canEditUsers')}
          canDelete={canPerformAction('canDeleteUsers')}
          onEdit={(user) => openEdit(user)}
          onDelete={deleteUser}
        />

        {/*
          Хороогоор нь харах өнцөг: хэрэглэгчийн жагсаалтаас дарга хайхын оронд
          аль хороонд дарга байхгүйг нэг харцаар олно. Даргыг энэ жагсаалтаас
          нэмэхэд бүс нь тухайн мөрөөр цоожлогдоно.
        */}
        <KhorooLeadersPanel
          leaders={users.filter((user) => user.role === 'KHOROO_LEADER')}
          onAdd={(district, khoroo) => {
            setFormData({
              ...EMPTY_USER_FORM,
              role: 'KHOROO_LEADER',
              district,
              khoroo: String(khoroo)
            });
            setIsAreaLocked(true);
            setDialogMode('create');
          }}
          onEdit={(leader) => {
            const user = users.find((item) => item.id === leader.id);
            if (user) openEdit(user);
          }}
        />
      </div>

      <UserDialog
        mode={dialogMode ?? 'create'}
        open={dialogMode !== null}
        onOpenChange={(open) => !open && closeDialog()}
        values={formData}
        onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
        areaLocked={isAreaLocked}
        onSubmit={submit}
        onCancel={closeDialog}
      />
    </PageContainer>
  );
}
