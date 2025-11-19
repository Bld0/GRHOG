import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import Link from 'next/link';
import UserAuthForm from './user-auth-form';

export const metadata: Metadata = {
  title: 'Нэвтрэх',
  description: 'Нэвтрэх хуудас'
};

export default function SignInViewPage({ stars }: { stars: number }) {
  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <Link
        href='/auth/sign-up'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 right-4 hidden md:top-8 md:right-8'
        )}
      >
        Бүртгүүлэх
      </Link>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          <div className='flex flex-col space-y-2 text-center'>
            <h1 className='text-3xl font-bold tracking-tight'>
              GRHOG system
            </h1>
            <h1 className='text-2xl font-semibold tracking-tight'>
              Тавтай морилно уу
            </h1>
            <p className='text-sm text-muted-foreground'>
              Системд нэвтрэхийн тулд и-мэйл хаяг болон нууц үгээ оруулна уу
            </p>
          </div>
          <UserAuthForm type="signin" />
          <p className='px-8 text-center text-sm text-muted-foreground'>
            Бүртгэл байхгүй юу?{' '}
            <Link
              href='/auth/sign-up'
              className='underline underline-offset-4 hover:text-primary'
            >
              Бүртгүүлэх
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
