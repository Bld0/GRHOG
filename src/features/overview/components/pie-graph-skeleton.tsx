import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';

export function PieGraphSkeleton() {
  return (
    <Card>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6'>
          <Skeleton className='h-6 w-[200px]' />
          <Skeleton className='h-4 w-[280px]' />
        </div>
      </CardHeader>
      <CardContent className='p-6'>
        <div className='flex h-[280px] items-center justify-center'>
          {/* Circular skeleton for pie chart */}
          <div className='relative h-[250px] w-[250px]'>
            <Skeleton className='h-full w-full rounded-full' />
            {/* Center text skeleton */}
            <div className='absolute inset-0 flex flex-col items-center justify-center gap-2'>
              <Skeleton className='h-8 w-[80px]' />
              <Skeleton className='h-4 w-[60px]' />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className='flex-col gap-2'>
        <Skeleton className='h-4 w-[180px]' />
        <Skeleton className='h-3 w-[140px]' />
      </CardFooter>
    </Card>
  );
}
