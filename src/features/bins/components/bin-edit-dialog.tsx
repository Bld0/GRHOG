'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { IconCurrentLocation, IconMapPin } from '@tabler/icons-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api-client';

const LeafletMap = dynamic(() => import('@/components/leaflet-map'), {
  ssr: false,
  loading: () => (
    <div className='flex h-48 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 md:h-[300px]'>
      <div className='text-muted-foreground text-center text-sm'>
        Зураг ачаалж байна...
      </div>
    </div>
  )
});

/** Координатаас хаягийн нэр авна (OpenStreetMap Nominatim). */
async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=mn,en`
    );
    const data = await response.json();
    return data?.display_name || null;
  } catch (error) {
    return null;
  }
}

interface BinEditDialogProps {
  /** null бол цонх хаалттай. */
  bin: any | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Сав засах цонх — газрын зураг ба гараар оруулах хоёр таб. */
export function BinEditDialog({ bin, onClose, onSaved }: BinEditDialogProps) {
  const [editingBin, setEditingBin] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditingBin(bin ? { ...bin } : null);
  }, [bin]);

  const save = async () => {
    if (!editingBin?.id) return;
    setIsSaving(true);
    try {
      const response = await apiClient.fetchWithAuth(
        `/api/bins/${editingBin.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            binId: editingBin.binId || editingBin.id,
            binName: editingBin.binName,
            phone: editingBin.phone,
            location: editingBin.location,
            khoroo: editingBin.khoroo,
            latitude: parseFloat(
              editingBin.latitude || editingBin.coordinates.lat
            ),
            longitude: parseFloat(
              editingBin.longitude || editingBin.coordinates.lng
            ),
            batteryLevel: editingBin.batteryLevel || '12V',
            details: editingBin.details
          })
        }
      );
      if (!response.ok) throw new Error('Failed to update bin');

      toast.success('Савны мэдээлэл шинэчлэгдлээ');
      onClose();
      // Өмнө нь `window.location.reload()` дуудаж бүх хуудсыг сэргээдэг байв.
      onSaved();
    } catch (error) {
      toast.error('Сав засахад алдаа гарлаа');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={bin !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[700px]'>
        <DialogHeader>
          <DialogTitle>Сав засах</DialogTitle>
          <DialogDescription>Савны мэдээллийг засах</DialogDescription>
        </DialogHeader>
        {editingBin ? (
          <Tabs defaultValue='map' className='w-full'>
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='map' className='flex items-center gap-2'>
                <IconMapPin className='h-4 w-4' />
                Газрын зураг
              </TabsTrigger>
              <TabsTrigger value='manual' className='flex items-center gap-2'>
                <IconCurrentLocation className='h-4 w-4' />
                Гараар оруулах
              </TabsTrigger>
            </TabsList>
            <TabsContent value='map' className='space-y-4'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <Label className='text-sm font-medium'>
                    Сав байрлуулах байршлыг сонгоно уу
                  </Label>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={async () => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          async (position) => {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;
                            setEditingBin((prev: any) => ({
                              ...prev,
                              coordinates: { lat, lng },
                              latitude: lat.toString(),
                              longitude: lng.toString(),
                              location:
                                'Байршил тодорхойгүй (ачааллаж байна...)'
                            }));
                            const address = await reverseGeocode(lat, lng);
                            if (address) {
                              setEditingBin((prev: any) => ({
                                ...prev,
                                location: address
                              }));
                            }
                          }
                        );
                      }
                    }}
                    className='flex items-center gap-2'
                  >
                    <IconCurrentLocation className='h-4 w-4' />
                    Миний байршил
                  </Button>
                </div>
                <LeafletMap
                  selectedLocation={editingBin.coordinates}
                  onLocationSelect={async (lat, lng) => {
                    setEditingBin((prev: any) => ({
                      ...prev,
                      coordinates: { lat, lng },
                      latitude: lat.toString(),
                      longitude: lng.toString(),
                      location: 'Байршил тодорхойгүй (ачааллаж байна...)'
                    }));
                    const address = await reverseGeocode(lat, lng);
                    if (address) {
                      setEditingBin((prev: any) => ({
                        ...prev,
                        location: address
                      }));
                    }
                  }}
                  readOnly={false}
                  height='300px'
                  zoom={15}
                />
              </div>
              <div className='grid gap-4'>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='edit-id' className='text-right'>
                    Сав ID
                  </Label>
                  <Input
                    disabled={true}
                    id='edit-id'
                    value={editingBin.id}
                    onChange={(e) =>
                      setEditingBin({ ...editingBin, id: e.target.value })
                    }
                    placeholder='BIN001'
                    className='col-span-3'
                  />
                </div>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='edit-phone' className='text-right'>
                    Утасны дугаар
                  </Label>
                  <Input
                    id='edit-phone'
                    value={editingBin.phone}
                    onChange={(e) =>
                      setEditingBin({ ...editingBin, phone: e.target.value })
                    }
                    placeholder='Утасны дугаар'
                    className='col-span-3'
                  />
                </div>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='edit-name' className='text-right'>
                    Савны нэр
                  </Label>
                  <Input
                    id='edit-name'
                    value={editingBin.binName || ''}
                    onChange={(e) =>
                      setEditingBin({
                        ...editingBin,
                        binName: e.target.value
                      })
                    }
                    placeholder='Савны нэр'
                    className='col-span-3'
                  />
                </div>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='edit-khoroo' className='text-right'>
                    Хорооны дугаар
                  </Label>
                  <Input
                    id='edit-khoroo'
                    value={editingBin.khoroo || ''}
                    onChange={(e) =>
                      setEditingBin({
                        ...editingBin,
                        khoroo: Number(e.target.value)
                      })
                    }
                    placeholder='Хорооны дугаар'
                    className='col-span-3'
                  />
                </div>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='edit-location' className='text-right'>
                    Байршил
                  </Label>
                  <Textarea
                    id='edit-location'
                    value={editingBin.location}
                    onChange={(e) =>
                      setEditingBin({
                        ...editingBin,
                        location: e.target.value
                      })
                    }
                    placeholder='Байршлын дэлгэрэнгүй мэдээлэл'
                    className='col-span-3'
                    rows={2}
                  />
                </div>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label
                    htmlFor='edit-details-manual'
                    className='text-right'
                  >
                    Тайлбар
                  </Label>
                  <Textarea
                    id='edit-details-manual'
                    value={editingBin.details}
                    onChange={(e) =>
                      setEditingBin({
                        ...editingBin,
                        details: e.target.value
                      })
                    }
                    placeholder='Нэмэлт тайлбар...'
                    className='col-span-3'
                    rows={2}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value='manual' className='space-y-4'>
              <div className='grid gap-4'>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='edit-id-manual' className='text-right'>
                    Сав ID
                  </Label>
                  <Input
                    disabled={true}
                    id='edit-id-manual'
                    value={editingBin.id}
                    onChange={(e) =>
                      setEditingBin({ ...editingBin, id: e.target.value })
                    }
                    placeholder='BIN001'
                    className='col-span-3'
                  />
                </div>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='edit-name-manual' className='text-right'>
                    Савны нэр
                  </Label>
                  <Input
                    id='edit-name-manual'
                    value={editingBin.binName || ''}
                    onChange={(e) =>
                      setEditingBin({
                        ...editingBin,
                        binName: e.target.value
                      })
                    }
                    placeholder='Савны нэр'
                    className='col-span-3'
                  />
                </div>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label
                    htmlFor='edit-location-manual'
                    className='text-right'
                  >
                    Байршил
                  </Label>
                  <Textarea
                    id='edit-location-manual'
                    value={editingBin.location}
                    onChange={(e) =>
                      setEditingBin({
                        ...editingBin,
                        location: e.target.value
                      })
                    }
                    placeholder='Байршлын дэлгэрэнгүй мэдээлэл'
                    className='col-span-3'
                    rows={2}
                  />
                </div>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label
                    htmlFor='edit-latitude-manual'
                    className='text-right'
                  >
                    Өргөрөг
                  </Label>
                  <Input
                    id='edit-latitude-manual'
                    type='number'
                    step='any'
                    value={editingBin.latitude || editingBin.coordinates.lat}
                    onChange={(e) => {
                      setEditingBin({
                        ...editingBin,
                        latitude: e.target.value,
                        coordinates: {
                          lat: parseFloat(e.target.value),
                          lng: editingBin.coordinates.lng
                        }
                      });
                    }}
                    placeholder='47.9211'
                    className='col-span-3'
                  />
                </div>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label
                    htmlFor='edit-longitude-manual'
                    className='text-right'
                  >
                    Уртраг
                  </Label>
                  <Input
                    id='edit-longitude-manual'
                    type='number'
                    step='any'
                    value={editingBin.longitude || editingBin.coordinates.lng}
                    onChange={(e) => {
                      setEditingBin({
                        ...editingBin,
                        longitude: e.target.value,
                        coordinates: {
                          lat: editingBin.coordinates.lat,
                          lng: parseFloat(e.target.value)
                        }
                      });
                    }}
                    placeholder='106.9154'
                    className='col-span-3'
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className='text-muted-foreground py-8 text-center'>
            Сонгосон сав олдсонгүй
          </div>
        )}
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isSaving}>
            Цуцлах
          </Button>
          <Button type='button' onClick={save} disabled={isSaving}>
            {isSaving ? 'Хадгалж байна...' : 'Хадгалах'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
