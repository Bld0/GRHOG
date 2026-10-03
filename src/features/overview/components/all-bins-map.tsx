"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getAllBins } from '@/lib/api';

// leaflet нь import хийхэд `window` шаарддаг тул сервер дээр ачаалахгүй.
const LeafletMap = dynamic(() => import('@/components/leaflet-map'), {
  ssr: false
});

type LocalLocation = {
  id?: string;
  lat: number;
  lng: number;
  title?: string;
  fillLevel?: number;
  batteryLevel?: number;
  status?: string;
};

export default function AllBinsMap({ height = '500px', className = '' }: { height?: string; className?: string }) {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getAllBins()
      .then((bins: any) => {
        if (!mounted) return;
        const items = Array.isArray(bins) ? bins : (bins?.content ?? []);
        const mapped: LocalLocation[] = items.map((b: any) => ({
          id: b.id != null ? String(b.id) : undefined,
          lat: Number(b.latitude),
          lng: Number(b.longitude),
          title: b.location || b.binId,
          fillLevel: (typeof b.storageLevelPercent === 'number' && b.storageLevelPercent >= 0) ? b.storageLevelPercent : b.storageLevel,
          batteryLevel: b.batteryLevelPercent ?? undefined,
          status: b.isActive ? 'active' : 'inactive'
        }));
        // Координатгүй сав (null -> 0, undefined -> NaN) зураг дээр гарахгүй:
        // NaN нь Leaflet-ийг унагаж, (0, 0) нь fitBounds-ыг дэлхий даяар тэлнэ.
        setLocations(
          mapped.filter(
            (l) => Number.isFinite(l.lat) && Number.isFinite(l.lng) && (l.lat !== 0 || l.lng !== 0)
          )
        );
      })
      .catch(() => {
        if (mounted) setFailed(true);
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <div className='p-4 text-sm text-muted-foreground'>Зураг ачаалж байна...</div>;
  }
  if (failed) {
    return <div className='p-4 text-sm text-destructive'>Савны байршлыг ачаалж чадсангүй</div>;
  }

  // Allow passing a className for responsive heights (e.g. h-56 sm:h-72 md:h-96)
  const containerStyle = className ? undefined : { height };

  return (
    <div className={`w-full rounded-lg border border-gray-300 overflow-hidden ${className}`} style={containerStyle}>
      <LeafletMap selectedLocation={null} multipleLocations={locations} height={className ? '100%' : height} readOnly={true} zoom={13} />
    </div>
  );
}
