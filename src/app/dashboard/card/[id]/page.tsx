import { CardDetailView } from '@/features/card/components/card-detail-view';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CardDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <CardDetailView cardId={id} />;
} 