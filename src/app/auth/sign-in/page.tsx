import { Metadata } from 'next';
import SignInViewPage from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'Нэвтрэх | GRHOG',
  description: 'Системд нэвтрэх'
};

export default function Page() {
  return <SignInViewPage stars={0} />;
} 