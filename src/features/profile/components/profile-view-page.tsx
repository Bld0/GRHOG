'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  IconUser,
  IconEdit,
  IconMail,
  IconPhone,
  IconCalendar,
  IconSettings,
  IconKey,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import * as z from 'zod';

// Mock user data - in a real app this would come from your auth system
const mockUser = {
  id: '1',
  name: 'Admin',
  email: 'admin@grhog.com',
  phone: '+976 **** ****',
  role: 'Супер Админ',
  joinedDate: new Date('2025-06-03'),
      lastLogin: new Date(),
  status: 'active'
};

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Нэр дор хаяж 2 тэмдэгт байх ёстой' }),
  email: z.string().email({ message: 'Зөв и-мэйл хаяг оруулна уу' }),
  phone: z.string().min(8, { message: 'Утасны дугаар дор хаяж 8 тэмдэгт байх ёстой' })
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Одоогийн нууц үгээ оруулна уу' }),
  newPassword: z.string().min(6, { message: 'Шинэ нууц үг дор хаяж 6 тэмдэгт байх ёстой' }),
  confirmPassword: z.string().min(6, { message: 'Нууц үгээ баталгаажуулна уу' })
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Нууц үгнүүд таарахгүй байна",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfileViewPage() {
  const [user, setUser] = useState(mockUser);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone
    }
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const handleProfileUpdate = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      // Mock API call - replace with real API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUser(prev => ({
        ...prev,
        name: data.name,
        email: data.email,
        phone: data.phone
      }));
      
      toast.success('Профайл амжилттай шинэчлэгдлээ');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Профайл шинэчлэхэд алдаа гарлаа');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      // Mock API call - replace with real API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Нууц үг амжилттай солигдлоо');
      setIsPasswordDialogOpen(false);
      passwordForm.reset();
    } catch (error) {
      toast.error('Нууц үг солихд алдаа гарлаа');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className='flex w-full flex-col space-y-6 p-6'>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Профайл</h1>
          <p className="text-muted-foreground">
            Хувийн мэдээлэл болон тохиргоог удирдах
          </p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-lg">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription className="text-base">{user.email}</CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                  {user.status === 'active' ? 'Идэвхтэй' : 'Идэвхгүй'}
                </Badge>
                <Badge variant="outline">{user.role}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <IconEdit className="h-4 w-4 mr-2" />
                    Засах
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Профайл засах</DialogTitle>
                    <DialogDescription>
                      Хувийн мэдээллээ шинэчлэх
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Нэр</FormLabel>
                            <FormControl>
                              <Input placeholder="Нэрээ оруулна уу" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>И-мэйл</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="И-мэйл хаягаа оруулна уу" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Утас</FormLabel>
                            <FormControl>
                              <Input placeholder="Утасны дугаараа оруулна уу" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditDialogOpen(false)}
                          disabled={isLoading}
                        >
                          Цуцлах
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Хадгалж байна...' : 'Хадгалах'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUser className="h-5 w-5" />
              Хувийн мэдээлэл
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Label className="text-sm font-medium text-muted-foreground">Нэр:</Label>
              <div className="col-span-2">{user.name}</div>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-4">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <IconMail className="h-4 w-4" />
                И-мэйл:
              </Label>
              <div className="col-span-2">{user.email}</div>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-4">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <IconPhone className="h-4 w-4" />
                Утас:
              </Label>
              <div className="col-span-2">{user.phone}</div>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-4">
              <Label className="text-sm font-medium text-muted-foreground">Эрх:</Label>
              <div className="col-span-2">
                <Badge variant="outline">{user.role}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconSettings className="h-5 w-5" />
              Бүртгэлийн мэдээлэл
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <IconCalendar className="h-4 w-4" />
                Элссэн өдөр:
              </Label>
              <div className="col-span-2">{formatDate(user.joinedDate)}</div>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-4">
              <Label className="text-sm font-medium text-muted-foreground">Сүүлийн нэвтрэлт:</Label>
              <div className="col-span-2">{formatDate(user.lastLogin)}</div>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-4">
              <Label className="text-sm font-medium text-muted-foreground">Төлөв:</Label>
              <div className="col-span-2">
                <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                  {user.status === 'active' ? 'Идэвхтэй' : 'Идэвхгүй'}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="pt-2">
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <IconKey className="h-4 w-4 mr-2" />
                    Нууц үг солих
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Нууц үг солих</DialogTitle>
                    <DialogDescription>
                      Аюулгүй байдлын үүднээс нууц үгээ тогтмол солино уу
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Одоогийн нууц үг</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Одоогийн нууц үгээ оруулна уу" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Шинэ нууц үг</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Шинэ нууц үгээ оруулна уу" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Нууц үг баталгаажуулах</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Шинэ нууц үгээ дахин оруулна уу" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsPasswordDialogOpen(false)}
                          disabled={isLoading}
                        >
                          Цуцлах
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Солиж байна...' : 'Нууц үг солих'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
