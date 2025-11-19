'use client';

import { useState, useEffect } from 'react';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { authUtils } from '@/lib/auth';

interface SystemUser {
  id: number;
  username: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER';
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { isSuperAdmin, canPerformAction, canPost, canPut, canDelete, isLoading: authLoading } = useRolePermissions();
  const router = useRouter();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'ADMIN' as 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER'
  });

  // Redirect if not super admin - but only after auth is loaded
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push('/dashboard/overview');
      toast.error('Access denied. Super admin privileges required.');
    }
  }, [isSuperAdmin, router, authLoading]);

  useEffect(() => {
    if (isSuperAdmin && !authLoading) {
      fetchUsers();
    }
  }, [isSuperAdmin, authLoading]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: authUtils.getAuthHeader(),
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.content || []);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authUtils.getAuthHeader(),
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('User created successfully');
        setIsCreateDialogOpen(false);
        setFormData({ username: '', email: '', password: '', role: 'ADMIN' });
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Failed to create user');
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authUtils.getAuthHeader(),
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('User updated successfully');
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        setFormData({ username: '', email: '', password: '', role: 'ADMIN' });
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: authUtils.getAuthHeader(),
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Системийн хэрэглэгчид</h1>
          <p className="text-muted-foreground">
            Системийн хэрэглэгчдийн удирдлага
          </p>
        </div>
        {canPerformAction('canCreateUsers') && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm">
                <Icons.add className="mr-2 h-4 w-4" />
                Шинэ хэрэглэгч
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Шинэ хэрэглэгч үүсгэх
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Системд шинэ хэрэглэгч нэмэх. Бүх талбарыг бөглөнө үү.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Хэрэглэгчийн нэр *
                    </Label>
                    <Input
                      id="username"
                      placeholder="Хэрэглэгчийн нэр оруулна уу"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="h-10 border-gray-300 focus:border-primary focus:ring-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      И-мэйл хаяг *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@grhog.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-10 border-gray-300 focus:border-primary focus:ring-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Нууц үг *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Хамгийн багадаа 6 тэмдэгт"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-10 border-gray-300 focus:border-primary focus:ring-primary"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Хэрэглэгчийн эрх *
                    </Label>
                    <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger className="h-10 border-gray-300 focus:border-primary focus:ring-primary">
                        <SelectValue placeholder="Эрх сонгоно уу" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUPER_ADMIN" className="cursor-pointer">
                          <div className="flex items-center space-x-2">
                            <Icons.user className="h-4 w-4 text-red-500" />
                            <span>Супер админ</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="ADMIN" className="cursor-pointer">
                          <div className="flex items-center space-x-2">
                            <Icons.user className="h-4 w-4 text-blue-500" />
                            <span>Админ</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="VIEWER" className="cursor-pointer">
                          <div className="flex items-center space-x-2">
                            <Icons.user className="h-4 w-4 text-gray-500" />
                            <span>Харагч</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Хэрэглэгчийн системд хандах эрхийг тодорхойлно
                    </p>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setFormData({ username: '', email: '', password: '', role: 'ADMIN' });
                  }}
                  className="w-full sm:w-auto"
                >
                  Цуцлах
                </Button>
                <Button 
                  onClick={handleCreateUser}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-sm"
                  disabled={!formData.username || !formData.email || !formData.password || formData.password.length < 6}
                >
                  <Icons.add className="mr-2 h-4 w-4" />
                  Хэрэглэгч үүсгэх
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Хэрэглэгчид</CardTitle>
          <CardDescription>
            Системийн хэрэглэгчдийн жагсаалт
          </CardDescription>
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
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                      user.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' :
                       user.role === 'ADMIN' ? 'ADMIN' : 'VIEWER'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {canPerformAction('canEditUsers') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setFormData({
                              username: user.username,
                              email: user.email,
                              password: '',
                              role: user.role
                            });
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Icons.userPen className="h-4 w-4" />
                        </Button>
                      )}
                      {canPerformAction('canDeleteUsers') && user.username !== 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Icons.trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Хэрэглэгч засах
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Хэрэглэгчийн мэдээлэл засах. Нууц үгийг хоосон үлдээснээр өөрчлөхгүй.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Хэрэглэгчийн нэр *
                </Label>
                <Input
                  id="edit-username"
                  placeholder="Хэрэглэгчийн нэр оруулна уу"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="h-10 border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  И-мэйл хаяг *
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="example@grhog.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-10 border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Нууц үг
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Зөвхөн өөрчлөх бол оруулна уу"
                  className="h-10 border-gray-300 focus:border-primary focus:ring-primary"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Нууц үгийг өөрчлөхгүй бол хоосон үлдээнэ үү
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-role" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Хэрэглэгчийн эрх *
                </Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="h-10 border-gray-300 focus:border-primary focus:ring-primary">
                    <SelectValue placeholder="Эрх сонгоно уу" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN" className="cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <Icons.user className="h-4 w-4 text-red-500" />
                        <span>Супер админ</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ADMIN" className="cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <Icons.user className="h-4 w-4 text-blue-500" />
                        <span>Админ</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="VIEWER" className="cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <Icons.user className="h-4 w-4 text-gray-500" />
                        <span>Харагч</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Хэрэглэгчийн системд хандах эрхийг тодорхойлно
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedUser(null);
                setFormData({ username: '', email: '', password: '', role: 'ADMIN' });
              }}
              className="w-full sm:w-auto"
            >
              Цуцлах
            </Button>
            <Button 
              onClick={handleEditUser}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-sm"
              disabled={!formData.username || !formData.email}
            >
              <Icons.userPen className="mr-2 h-4 w-4" />
              Хадгалах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
