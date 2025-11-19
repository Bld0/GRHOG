'use client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import * as z from 'zod';

const formSchema = z.object({
  username: z.string().min(1, { message: 'Хэрэглэгчийн нэр оруулна уу' }),
  password: z.string().min(1, { message: 'Нууц үг оруулна уу' })
});

type UserFormValue = z.infer<typeof formSchema>;

interface UserAuthFormProps {
  type: 'signin' | 'signup';
}

export default function UserAuthForm({ type }: UserAuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  const defaultValues = {
    username: '',
    password: ''
  };
  
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: UserFormValue) => {
    try {
      if (type === 'signup') {
        toast.error('Бүртгэл үүсгэх боломжтой байхгүй. Админтай холбогдоно уу.');
        return;
      }

      const success = await login(data);
      
      if (success) {
        toast.success('Амжилттай нэвтэрлээ!');
        
        // Redirect to the original requested page or dashboard
        const redirectUrl = searchParams.get('redirect') || '/dashboard/overview';
        router.push(redirectUrl);
      } else {
        toast.error('Хэрэглэгчийн нэр эсвэл нууц үг буруу байна');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Серверт холбогдоход алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  // For signup type, show a message that only admin login is available
  if (type === 'signup') {
    return (
      <div className="text-center space-y-4">
        <div className="p-4 border rounded-lg bg-muted">
          <h3 className="font-medium mb-2">Бүртгэл үүсгэх боломжтой байхгүй</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Зөвхөн админ эрхтэй хэрэглэгч нэвтрэх боломжтой.
          </p>
          <Button 
            onClick={() => router.push('/auth/sign-in')}
            variant="outline"
            className="w-full"
          >
            Нэвтрэх хуудас руу буцах
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='w-full space-y-4'
        >
          <FormField
            control={form.control}
            name='username'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Хэрэглэгчийн нэр</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Хэрэглэгчийн нэрээ оруулна уу'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Нууц үг</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Нууц үгээ оруулна уу'
                      {...field}
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <Icons.eye className='h-4 w-4' aria-hidden='true' />
                      ) : (
                        <Icons.eyeOff className='h-4 w-4' aria-hidden='true' />
                      )}
                      <span className='sr-only'>
                        {showPassword ? 'Hide password' : 'Show password'}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit' className='w-full' disabled={authLoading}>
            {authLoading && (
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
            )}
            Нэвтрэх
          </Button>
        </form>
      </Form>
    </>
  );
}
