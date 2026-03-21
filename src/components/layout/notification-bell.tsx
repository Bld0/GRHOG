'use client';

import { IconBell, IconBatteryOff, IconTrashFilled, IconCheck, IconChecks, IconTrash } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications, type Notification } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { mn } from 'date-fns/locale';

function NotificationIcon({ type }: { type: Notification['type'] }) {
  if (type === 'BATTERY_LOW') {
    return (
      <div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30'>
        <IconBatteryOff className='h-3.5 w-3.5 text-orange-600 dark:text-orange-400' />
      </div>
    );
  }
  return (
    <div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'>
      <IconTrashFilled className='h-3.5 w-3.5 text-red-600 dark:text-red-400' />
    </div>
  );
}

function NotificationItem({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(notification.createdAt), {
        addSuffix: true,
        locale: mn,
      });
    } catch {
      return '';
    }
  })();

  return (
    <div
      className={cn(
        'flex items-start gap-2 px-3 py-2 transition-colors hover:bg-muted/50',
        !notification.read && 'bg-muted/30'
      )}
    >
      <NotificationIcon type={notification.type} />
      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-1.5'>
          <p className='text-xs font-medium truncate'>{notification.title}</p>
          {!notification.read && (
            <span className='h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500' />
          )}
        </div>
        <p className='text-muted-foreground mt-0.5 text-[11px] leading-tight line-clamp-1'>
          {notification.message}
        </p>
        <div className='mt-1 flex items-center'>
          <span className='text-muted-foreground text-[11px]'>{timeAgo}</span>
          <div className='ml-auto flex items-center'>
            {!notification.read && (
              <Button
                variant='ghost'
                size='icon'
                className='h-5 w-5'
                onClick={(e) => {
                  e.stopPropagation();
                  onRead(notification.id);
                }}
                title='Уншсан гэж тэмдэглэх'
              >
                <IconCheck className='h-3 w-3' />
              </Button>
            )}
            <Button
              variant='ghost'
              size='icon'
              className='h-5 w-5 text-muted-foreground hover:text-destructive'
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              title='Устгах'
            >
              <IconTrash className='h-3 w-3' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon' className='relative h-8 w-8'>
          <IconBell className='h-5 w-5' />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold'
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='end'
        sideOffset={8}
        className='w-80 p-0'
      >
        <div className='flex items-center justify-between px-3 py-2'>
          <h4 className='text-xs font-semibold'>Мэдэгдэл</h4>
          {unreadCount > 0 && (
            <Button
              variant='ghost'
              size='sm'
              className='h-6 text-[11px] px-2'
              onClick={markAllAsRead}
            >
              <IconChecks className='mr-1 h-3 w-3' />
              Бүгдийг уншсан
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className='h-[300px]'>
          {loading ? (
            <div className='flex items-center justify-center py-6'>
              <p className='text-muted-foreground text-xs'>Уншиж байна...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-6'>
              <IconBell className='text-muted-foreground/50 h-8 w-8' />
              <p className='text-muted-foreground mt-1.5 text-xs'>
                Мэдэгдэл байхгүй
              </p>
            </div>
          ) : (
            <div className='divide-y'>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
