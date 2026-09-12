'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';

import type { UserRole } from './user-form-fields';

export interface SystemUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  /** Зөвхөн хорооны даргад утгатай — бусад эрхэд null. */
  district?: string | null;
  khoroo?: number | null;
  isActive: boolean;
  createdAt: string;
}

/** Эрхийн шошго ба өнгө — нүдэнд гурван үүрлэсэн ternary байсныг нэг зураглалд. */
const ROLE_BADGE: Record<UserRole, { label: string; className: string }> = {
  SUPER_ADMIN: { label: 'SUPER_ADMIN', className: 'bg-red-100 text-red-800' },
  ADMIN: { label: 'ADMIN', className: 'bg-blue-100 text-blue-800' },
  DEVELOPER: { label: 'DEVELOPER', className: 'bg-purple-100 text-purple-800' },
  KHOROO_LEADER: {
    label: 'Хорооны дарга',
    className: 'bg-green-100 text-green-800'
  },
  VIEWER: { label: 'VIEWER', className: 'bg-gray-100 text-gray-800' }
};

interface UsersTableProps {
  users: SystemUser[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (user: SystemUser) => void;
  onDelete: (user: SystemUser) => void;
}

export function UsersTable({
  users,
  canEdit,
  canDelete,
  onEdit,
  onDelete
}: UsersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Хэрэглэгчид</CardTitle>
        <CardDescription>Системийн хэрэглэгчдийн жагсаалт</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Хэрэглэгчийн нэр</TableHead>
              <TableHead>И-мэйл</TableHead>
              <TableHead>Эрх</TableHead>
              <TableHead>Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const badge = ROLE_BADGE[user.role] ?? ROLE_BADGE.VIEWER;
              return (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    {user.role === 'KHOROO_LEADER' && (
                      <div className='text-muted-foreground mt-1 text-xs'>
                        {user.district || '—'}
                        {user.khoroo != null ? `, ${user.khoroo}-р хороо` : ''}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className='flex space-x-2'>
                      {canEdit && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => onEdit(user)}
                        >
                          <Icons.userPen className='h-4 w-4' />
                        </Button>
                      )}
                      {/* `admin` бол системийн үндсэн данс — устгуулахгүй. */}
                      {canDelete && user.username !== 'admin' && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => onDelete(user)}
                        >
                          <Icons.trash className='h-4 w-4' />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
