'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { 
  IconUser, 
  IconLogout, 
  IconMail, 
  IconPhone,
  IconSettings
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

export function UserNav() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success('Амжилттай гарлаа');
      router.push('/auth/sign-in');
    } catch (error) {
      toast.error('Гарахад алдаа гарлаа');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'SUPER_ADMIN';
      case 'ADMIN':
        return 'ADMIN';
      case 'VIEWER':
        return 'VIEWER';
      default:
        return role;
    }
  };

  // Show loading state or return null if no user
  if (isLoading || !user) {
    return (
      <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gray-300 text-gray-600">
            ...
          </AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user.username)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-64'
        align='end'
        sideOffset={10}
        forceMount
      >
        <DropdownMenuLabel className='font-normal'>
          <div className='flex items-center space-x-3'>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
            <div className='flex flex-col space-y-1'>
              <p className='text-sm leading-none font-medium'>
                {user.username}
              </p>
              <p className='text-muted-foreground text-xs leading-none flex items-center gap-1'>
                <IconMail className="h-3 w-3" />
                {user.email}
              </p>
              <div className='flex items-center gap-2 mt-1'>
                <Badge variant={user.isActive ? 'default' : 'secondary'} className="text-xs">
                  {user.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {getRoleDisplayName(user.role)}
                </Badge>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
            <IconUser className="mr-2 h-4 w-4" />
            Профайл
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/dashboard')}>
            <IconSettings className="mr-2 h-4 w-4" />
            Дашбоард
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <IconLogout className="mr-2 h-4 w-4" />
          Гарах
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
