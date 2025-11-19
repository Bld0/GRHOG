import { BinDetailView } from '@/features/bins/components/bin-detail-view';

interface BinDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BinDetailPage({ params }: BinDetailPageProps) {
  const { id } = await params;
  return <BinDetailView id={id} />;
}

export async function generateMetadata({ params }: BinDetailPageProps) {
  const { id } = await params;
  return {
    title: `Сав ${id} - Хогийн савны жагсаалт`,
    description: `${id} савны дэлгэрэнгүй мэдээлэл`
  };
} 