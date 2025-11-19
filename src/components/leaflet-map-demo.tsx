'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { IconMapPin, IconTrendingUp, IconSettings, IconRefresh } from '@tabler/icons-react';
import dynamic from 'next/dynamic';
import { normalizeStorageLevel } from '@/lib/utils';

// Dynamically import LeafletMap to avoid SSR issues
const LeafletMap = dynamic(() => import('@/components/leaflet-map'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-lg border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
      <div className="text-center text-sm text-muted-foreground">
        Газрын зураг ачаалж байна...
      </div>
    </div>
  )
});

// Sample data for demonstration
const sampleBins = [
  {
    id: '1',
    lat: 47.9211,
    lng: 106.9154,
    title: 'Сав #1 - Сүхбаатар дүүрэг',
    fillLevel: normalizeStorageLevel(85),
    batteryLevel: 92,
    status: 'active'
  },
  {
    id: '2',
    lat: 47.9180,
    lng: 106.9170,
    title: 'Сав #2 - Баянзүрх дүүрэг',
    fillLevel: normalizeStorageLevel(45),
    batteryLevel: 78,
    status: 'active'
  },
  {
    id: '3',
    lat: 47.9240,
    lng: 106.9130,
    title: 'Сав #3 - Хан-Уул дүүрэг',
    fillLevel: normalizeStorageLevel(95),
    batteryLevel: 65,
    status: 'active'
  },
  {
    id: '4',
    lat: 47.9200,
    lng: 106.9200,
    title: 'Сав #4 - Баянзүрх дүүрэг',
    fillLevel: normalizeStorageLevel(30),
    batteryLevel: 88,
    status: 'inactive'
  },
  {
    id: '5',
    lat: 47.9260,
    lng: 106.9180,
    title: 'Сав #5 - Сүхбаатар дүүрэг',
    fillLevel: normalizeStorageLevel(70),
    batteryLevel: 45,
    status: 'active'
  }
];

export function LeafletMapDemo() {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedBin, setSelectedBin] = useState<any>(null);
  const [mapHeight, setMapHeight] = useState('500px');

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-500' : 'bg-red-500';
  };

  const getFillLevelColor = (level: number) => {
    if (level >= 90) return 'text-red-600';
    if (level >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leaflet Газрын зургийн жишээ</h1>
          <p className="text-muted-foreground">
            React Leaflet ашиглан хогийн савны байршлыг харуулах
          </p>
        </div>
        <Button variant="outline" size="sm">
          <IconRefresh className="h-4 w-4 mr-2" />
          Шинэчлэх
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSettings className="h-5 w-5" />
            Тохиргоо
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="heatmap"
                checked={showHeatmap}
                onCheckedChange={setShowHeatmap}
              />
              <Label htmlFor="heatmap">Дулааны зураг</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Label>Газрын зургийн өндөр:</Label>
              <select 
                value={mapHeight} 
                onChange={(e) => setMapHeight(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="400px">400px</option>
                <option value="500px">500px</option>
                <option value="600px">600px</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconMapPin className="h-5 w-5" />
            Савны байршил
          </CardTitle>
          <CardDescription>
            {sampleBins.length} савны байршил газрын зураг дээр
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeafletMap
            selectedLocation={selectedBin}
            multipleLocations={sampleBins}
            showHeatmap={showHeatmap}
            height={mapHeight}
            zoom={14}
            readOnly={false}
            onLocationSelect={(lat, lng) => {
              const bin = sampleBins.find(b => b.lat === lat && b.lng === lng);
              setSelectedBin(bin || null);
            }}
          />
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Нийт сав</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sampleBins.length}</div>
            <div className="text-xs text-muted-foreground">
              Бүртгэлтэй савны тоо
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Идэвхтэй сав</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sampleBins.filter(bin => bin.status === 'active').length}
            </div>
            <div className="text-xs text-muted-foreground">
              Холболттой савны тоо
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Дундаж дүүргэлт</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(sampleBins.reduce((sum, bin) => sum + bin.fillLevel, 0) / sampleBins.length).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              Бүх савны дундаж
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bins List */}
      <Card>
        <CardHeader>
          <CardTitle>Савны жагсаалт</CardTitle>
          <CardDescription>
            Газрын зураг дээрх савнуудын дэлгэрэнгүй мэдээлэл
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleBins.map((bin) => (
              <div
                key={bin.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedBin?.id === bin.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedBin(bin)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{bin.title}</h3>
                  <Badge variant={bin.status === 'active' ? 'default' : 'secondary'}>
                    <div className={`h-2 w-2 rounded-full mr-1 ${getStatusColor(bin.status)}`} />
                    {bin.status === 'active' ? 'Идэвхтэй' : 'Идэвхгүй'}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Дүүргэлт:</span>
                    <span className={`font-medium ${getFillLevelColor(bin.fillLevel)}`}>
                      {bin.fillLevel}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Батарей:</span>
                    <span className="font-medium">{bin.batteryLevel}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Координат:</span>
                    <span className="font-mono text-xs">
                      {bin.lat.toFixed(4)}, {bin.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle>Leaflet Газрын зургийн онцлогууд</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold">✅ Үндсэн онцлогууд</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• React Leaflet - React-д зориулсан Leaflet wrapper</li>
                <li>• OpenStreetMap - Үнэгүй, API key шаардлагагүй</li>
                <li>• SSR-safe - Next.js-тэй нийцтэй</li>
                <li>• TypeScript дэмжлэг - Type-safe хөгжүүлэлт</li>
                <li>• Custom markers - Өнгөт маркерууд</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">🚀 Нэмэлт онцлогууд</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Multiple locations - Олон байршил харуулах</li>
                <li>• Interactive popups - Дэлгэрэнгүй мэдээлэл</li>
                <li>• Heatmap visualization - Дулааны зураг</li>
                <li>• Status-based colors - Төлөвөөр өнгөлөх</li>
                <li>• Responsive design - Ухаалаг төхөөрөмж</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 