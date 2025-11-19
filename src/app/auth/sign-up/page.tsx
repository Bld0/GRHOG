import { Metadata } from 'next';
import SignUpViewPage from '@/features/auth/components/sign-up-view';

export const metadata: Metadata = {
  title: 'Бүртгүүлэх | GRHOG',
  description: 'Шинэ бүртгэл үүсгэх'
};

export default function Page() {
  return <SignUpViewPage stars={0} />;
} 