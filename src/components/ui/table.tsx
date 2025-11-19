'use client';

import * as React from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import { cn } from '@/lib/utils';

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div
      data-slot='table-container'
      className='relative w-full'
    >
      <ScrollArea className='w-full'>
        <table
          data-slot='table'
          className={cn('w-full caption-bottom text-sm', className)}
          style={{
            minWidth: 'max-content'
          }}
          {...props}
        />
        <ScrollBar orientation='horizontal' />
      </ScrollArea>
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot='table-header'
      className={cn('[&_tr]:border-b', className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot='table-body'
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot='table-footer'
      className={cn(
        'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot='table-row'
      className={cn(
        'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
        className
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot='table-head'
      className={cn(
        'text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className
      )}
      style={{
        minWidth: 'fit-content',
        whiteSpace: 'nowrap'
      }}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot='table-cell'
      className={cn(
        'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className
      )}
      style={{
        minWidth: 'fit-content',
        whiteSpace: 'nowrap'
      }}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot='table-caption'
      className={cn('text-muted-foreground mt-4 text-sm', className)}
      {...props}
    />
  );
}

// Mobile-optimized table component
function MobileTable({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div
      data-slot='mobile-table-container'
      className='relative w-full'
    >
      <ScrollArea className='w-full' type='always'>
        <table
          data-slot='mobile-table'
          className={cn('w-full caption-bottom text-sm min-w-full', className)}
          style={{
            minWidth: 'max-content',
            touchAction: 'pan-x'
          }}
          {...props}
        />
        <ScrollBar orientation='horizontal' className='h-2' />
      </ScrollArea>
    </div>
  );
}

// Responsive table component that automatically adapts to screen size
function ResponsiveTable({ className, ...props }: React.ComponentProps<'table'>) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return <MobileTable className={className} {...props} />;
  }

  return <Table className={className} {...props} />;
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  MobileTable,
  ResponsiveTable
};
