import { AddressDetailView } from '@/features/address/components/address-detail-view';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AddressDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AddressDetailView addressId={id} />;
}
