import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Page() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth-token')?.value;

  if (!authToken || authToken !== 'authenticated') {
    return redirect('/auth/sign-in');
  } else {
    redirect('/dashboard/overview');
  }
}
