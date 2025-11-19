'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@/components/ui/sidebar';
import { navItems } from '@/constants/data';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { useAuth } from '@/hooks/use-auth';
import { ClientOnly } from '@/components/auth/client-only';
import {
  IconChevronRight,
  IconChevronsDown,
  IconLogout,
  IconPhotoUp,
  IconUserCircle
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { OrgSwitcher } from '../org-switcher';

export const company = {
  name: 'GRhog',
  logo: IconPhotoUp,
  plan: 'Enterprise'
};

const tenants = [
  { id: '1', name: 'Grhog' },
];

export default function AppSidebar() {
  const { user, logout, isLoading } = useAuth();
  const { userRole, hasPermission } = useRolePermissions();
  const router = useRouter();

  const handleSwitchTenant = (_tenantId: string) => {
    // Tenant switching functionality would be implemented here
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/sign-in');
  };

  const activeTenant = tenants[0];

  // Filter nav items based on user permissions
  const filteredNavItems = React.useMemo(() => {
    if (isLoading) return [];
    
    return navItems.filter(item => {
      // If no role requirement, show to all authenticated users
      if (!item.requiresRole) return true;
      
      // Role-based access: SUPER_ADMIN can see everything
      if (userRole === 'SUPER_ADMIN') return true;
      
      // ADMINs can see everything except user management
      if (userRole === 'ADMIN' && item.requiresRole !== 'SUPER_ADMIN') return true;
      
      // VIEWERs can see viewer-level items
      if (userRole === 'VIEWER' && item.requiresRole === 'VIEWER') return true;
      
      return false;
    });
  }, [isLoading, userRole]);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <OrgSwitcher
          tenants={tenants}
          defaultTenant={activeTenant}
          onTenantSwitch={handleSwitchTenant}
        />
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarMenu>
            <ClientOnly fallback={
              // Loading state for navigation items
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            }>
              {filteredNavItems.map((item) => {
                const Icon = item.icon ? Icons[item.icon] : Icons.logo;
                return item?.items && item?.items?.length > 0 ? (
                  <Collapsible key={item.title} asChild>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <Icon className='h-4 w-4' />
                          <span>{item.title}</span>
                          <IconChevronRight className='ml-auto h-4 w-4' />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => {
                            const SubIcon = subItem.icon ? Icons[subItem.icon] : Icons.logo;
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <Link href={subItem.url}>
                                    <SubIcon className='h-4 w-4' />
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <Icon className='h-4 w-4' />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </ClientOnly>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel>User</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <ClientOnly fallback={
                <SidebarMenuButton>
                  <IconUserCircle className='h-4 w-4' />
                  <span>Loading...</span>
                </SidebarMenuButton>
              }>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton>
                      <IconUserCircle className='h-4 w-4' />
                      <span>{user?.username || 'User'}</span>
                      <IconChevronsDown className='ml-auto h-4 w-4' />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className='w-[--radix-dropdown-menu-trigger-width] min-w-56'
                    align='end'
                    side='bottom'
                  >
                    <DropdownMenuLabel>
                      <div className='flex flex-col space-y-1'>
                        <p className='text-sm font-medium leading-none'>{user?.username}</p>
                        <p className='text-xs leading-none text-muted-foreground'>
                          {user?.email}
                        </p>
                        <p className='text-xs leading-none text-muted-foreground'>
                          Role: {user?.role}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link href='/dashboard/profile'>
                          <IconUserCircle className='mr-2 h-4 w-4' />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <IconLogout className='mr-2 h-4 w-4' />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </ClientOnly>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
