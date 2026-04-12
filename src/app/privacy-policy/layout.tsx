import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Нууцлалын бодлого | GRHOG',
  description: 'GRHOG системийн нууцлалын бодлого'
};

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
