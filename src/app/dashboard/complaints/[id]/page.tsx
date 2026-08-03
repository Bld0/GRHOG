import { Metadata } from 'next';
import ComplaintDetailView from '@/features/complaints/components/complaint-detail-view';

interface ComplaintDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Гомдлын дэлгэрэнгүй | GRHOG'
};

export default async function ComplaintDetailPage({
  params
}: ComplaintDetailPageProps) {
  const { id } = await params;
  return <ComplaintDetailView id={id} />;
}
