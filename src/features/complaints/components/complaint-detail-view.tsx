'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { apiClient } from '@/lib/api-client';
import { useRolePermissions } from '@/hooks/use-role-permissions';
import { toast } from 'sonner';
import { Complaint, StatusBadge } from './complaints-view';

function formatDate(value?: string) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });
}

/** base64 зургийг data URI болгоно (аль хэдийн data: угтвартай бол хэвээр нь). */
function toDataUri(img: string) {
  return img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`;
}

export default function ComplaintDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { canPost } = useRolePermissions();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [fullImage, setFullImage] = useState<string | null>(null);

  const fetchComplaint = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.fetchWithAuth(`/api/complaints/${id}`);
      if (response.ok) {
        setComplaint(await response.json());
      } else {
        setComplaint(null);
      }
    } catch {
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  const sendReply = async () => {
    const text = reply.trim();
    if (!text) return;
    setSending(true);
    try {
      const response = await apiClient.fetchWithAuth(
        `/api/complaints/${id}/reply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reply: text })
        }
      );
      if (response.ok) {
        toast.success('Хариу амжилттай илгээгдлээ');
        setReply('');
        fetchComplaint();
      } else {
        const e = await response.json().catch(() => null);
        toast.error(e?.message || 'Хариу илгээхэд алдаа гарлаа');
      }
    } catch {
      toast.error('Хариу илгээхэд алдаа гарлаа');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <PageContainer scrollable>
        <div className='flex flex-1 items-center justify-center py-24'>
          <Icons.spinner className='h-6 w-6 animate-spin' />
        </div>
      </PageContainer>
    );
  }

  if (!complaint) {
    return (
      <PageContainer scrollable>
        <div className='flex flex-1 flex-col items-center justify-center gap-4 py-24'>
          <p className='text-muted-foreground'>Гомдол олдсонгүй</p>
          <Button variant='outline' onClick={() => router.back()}>
            Буцах
          </Button>
        </div>
      </PageContainer>
    );
  }

  const replied = complaint.status === 'REPLIED';
  const images = complaint.images ?? [];

  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              size='icon'
              onClick={() => router.push('/dashboard/complaints')}
            >
              <Icons.chevronLeft className='h-4 w-4' />
            </Button>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>
                Гомдлын дэлгэрэнгүй
              </h2>
              <p className='text-muted-foreground text-sm'>
                {formatDate(complaint.createdAt)}
              </p>
            </div>
          </div>
          <StatusBadge status={complaint.status} />
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Гомдол гаргагч</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2 text-sm'>
              <div className='flex gap-2'>
                <span className='text-muted-foreground w-16 shrink-0'>Нэр</span>
                <span className='font-medium'>
                  {complaint.client?.name || '-'}
                </span>
              </div>
              <div className='flex gap-2'>
                <span className='text-muted-foreground w-16 shrink-0'>
                  Утас
                </span>
                <span>{complaint.client?.phone || '-'}</span>
              </div>
              <div className='flex gap-2'>
                <span className='text-muted-foreground w-16 shrink-0'>
                  Хаяг
                </span>
                <span>{complaint.client?.address || '-'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>
                Хогийн савны байршил
              </CardTitle>
            </CardHeader>
            <CardContent className='text-sm'>
              {complaint.location || '-'}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Гомдол</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm leading-relaxed whitespace-pre-wrap'>
              {complaint.text || '-'}
            </p>
          </CardContent>
        </Card>

        {images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>
                Зураг ({images.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-3'>
                {images.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={toDataUri(img)}
                    alt={`Гомдлын зураг ${i + 1}`}
                    className='h-32 w-32 cursor-pointer rounded-lg object-cover'
                    onClick={() => setFullImage(toDataUri(img))}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {replied ? (
          <Card className='border-green-500/40'>
            <CardHeader>
              <CardTitle className='text-base'>Хариу</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <p className='text-sm leading-relaxed whitespace-pre-wrap'>
                {complaint.replyText}
              </p>
              <p className='text-muted-foreground text-xs'>
                {complaint.repliedBy ? `${complaint.repliedBy} · ` : ''}
                {formatDate(complaint.repliedAt)}
              </p>
            </CardContent>
          </Card>
        ) : canPost ? (
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Хариу бичих</CardTitle>
              <p className='text-muted-foreground text-xs'>
                Хариу зөвхөн тухайн гомдол гаргасан хэрэглэгчид очно
              </p>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder='Хариугаа энд бичнэ үү...'
                rows={4}
              />
              <Button
                onClick={sendReply}
                disabled={sending || !reply.trim()}
              >
                {sending && (
                  <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                )}
                Хариу илгээх
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className='text-muted-foreground py-6 text-sm'>
              Хариу өгөөгүй байна
            </CardContent>
          </Card>
        )}
      </div>

      {/* Зураг томруулж харах */}
      {fullImage && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6'
          onClick={() => setFullImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullImage}
            alt='Гомдлын зураг'
            className='max-h-full max-w-full rounded-lg object-contain'
          />
        </div>
      )}
    </PageContainer>
  );
}
