'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { normalizeStorageLevel } from '@/lib/utils';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  lat: number;
  lng: number;
  id?: string;
  title?: string;
  fillLevel?: number;
  batteryLevel?: number;
  status?: string;
}

interface LeafletMapProps {
  selectedLocation: Location | null;
  onLocationSelect?: (lat: number, lng: number) => void;
  multipleLocations?: Location[];
  showHeatmap?: boolean;
  height?: string;
  zoom?: number;
  readOnly?: boolean;
}

// Map click handler component
const MapClickHandler = ({ onLocationSelect, readOnly }: { onLocationSelect?: (lat: number, lng: number) => void; readOnly?: boolean }) => {
  useMapEvents({
    click: (e) => {
      if (!readOnly && onLocationSelect) {
        const { lat, lng } = e.latlng;
        onLocationSelect(lat, lng);
      }
    },
  });
  return null;
};

// Custom marker icons based on status
const createCustomIcon = (status?: string, fillLevel?: number) => {
  let color = '#dc2626'; // Default red
  
  if (status === 'active' || fillLevel !== undefined) {
    if (fillLevel !== undefined) {
      const normalizedLevel = normalizeStorageLevel(fillLevel);
      if (normalizedLevel >= 90) color = '#dc2626'; // Red for full
      else if (normalizedLevel >= 70) color = '#f59e0b'; // Yellow for warning
      else color = '#10b981'; // Green for normal
    } else if (status === 'active') {
      color = '#10b981';
    }
  }

  return new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.596 19.404 0 12.5 0z" fill="${color}"/>
        <circle cx="12.5" cy="12.5" r="6" fill="#ffffff"/>
      </svg>
    `),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

// Battery level indicator component
const BatteryIndicator = ({ level }: { level: number }) => {
  const getBatteryColor = (level: number) => {
    if (level >= 60) return '#10b981';
    if (level >= 30) return '#f59e0b';
    return '#dc2626';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-4 border border-gray-300 rounded-sm relative">
        <div 
          className="h-full bg-gray-200 rounded-sm"
          style={{ 
            width: `${level}%`,
            backgroundColor: getBatteryColor(level)
          }}
        />
        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-2 bg-gray-300 rounded-r-sm" />
      </div>
      <span className="text-xs font-medium">{level}%</span>
    </div>
  );
};

// Fill level indicator component
const FillLevelIndicator = ({ level }: { level: number }) => {
  const normalizedLevel = normalizeStorageLevel(level);
  
  const getFillColor = (level: number) => {
    if (level >= 90) return '#dc2626';
    if (level >= 70) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{ 
            width: `${normalizedLevel}%`,
            backgroundColor: getFillColor(normalizedLevel)
          }}
        />
      </div>
      <span className="text-xs font-medium">{normalizedLevel.toFixed(1)}%</span>
    </div>
  );
};

export default function LeafletMap({ 
  selectedLocation, 
  onLocationSelect, 
  multipleLocations = [],
  showHeatmap = false,
  height = '400px',
  zoom = 13,
  readOnly = false
}: LeafletMapProps) {
  const [map, setMap] = useState<L.Map | null>(null);

  const isValidCoord = selectedLocation && (selectedLocation.lat !== 0 || selectedLocation.lng !== 0);

  const center: [number, number] = isValidCoord
    ? [selectedLocation.lat, selectedLocation.lng]
    : [47.9211, 106.9154]; // Ulaanbaatar

  // Fit bounds when multiple locations are provided
  useEffect(() => {
    if (map && multipleLocations.length > 1) {
      const bounds = L.latLngBounds(
        multipleLocations.map(loc => [loc.lat, loc.lng])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, multipleLocations]);

  // Try to center on user's location if available. If access is denied or unavailable,
  // fall back to Ulaanbaatar center at city zoom.
  useEffect(() => {
    if (!map) return;

    // Only attempt when there are no multiple locations to fit (single or none)
    if ((multipleLocations?.length ?? 0) <= 1 && !selectedLocation) {
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
              map.setView([latitude, longitude], Math.max(13, zoom));
            } catch (e) {
              // ignore
            }
          },
          () => {
            // Permission denied or other error -> center Ulaanbaatar
            try {
              map.setView([47.9211, 106.9154], 12);
            } catch (e) {
              // ignore
            }
          },
          { timeout: 5000 }
        );
      } else {
        // No geolocation API -> default to Ulaanbaatar
        try {
          map.setView([47.9211, 106.9154], 12);
        } catch (e) {
          // ignore
        }
      }
    }
  }, [map, multipleLocations, selectedLocation, zoom]);

  return (
    <div className={`w-full rounded-lg border border-gray-300 overflow-hidden`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={true}
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        
        {!readOnly && <MapClickHandler onLocationSelect={onLocationSelect} readOnly={readOnly} />}
        
        {/* Show multiple locations if provided */}
        {multipleLocations.length > 0 ? (
          multipleLocations.map((location, index) => (
            <Marker 
              key={location.id || index}
              position={[location.lat, location.lng]} 
              icon={createCustomIcon(location.status, location.fillLevel)}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-sm mb-2">
                    {location.title || `Сав #${location.id || index + 1}`}
                  </h3>
                  {location.fillLevel !== undefined && (
                    <div className="mb-2">
                      <span className="text-xs text-gray-600 block mb-1">Дүүргэлтийн түвшин:</span>
                      <FillLevelIndicator level={location.fillLevel} />
                    </div>
                  )}
                  {location.batteryLevel !== undefined && (
                    <div className="mb-2">
                      <span className="text-xs text-gray-600 block mb-1">Батарейн түвшин:</span>
                      <BatteryIndicator level={location.batteryLevel} />
                    </div>
                  )}
                  {location.status && (
                    <div className="text-xs">
                      <span className="text-gray-600">Төлөв: </span>
                      <span className={`font-medium ${
                        location.status === 'active' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {location.status === 'active' ? 'Идэвхтэй' : 'Идэвхгүй'}
                      </span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))
        ) : (
          /* Show single selected location */
          isValidCoord && (
            <Marker 
              position={[selectedLocation.lat, selectedLocation.lng]} 
              icon={createCustomIcon('selected', 100)} // force red for selection
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-sm mb-2">
                    {selectedLocation.title || `Сав #${selectedLocation.id || '1'}`}
                  </h3>
                  {selectedLocation.fillLevel !== undefined && (
                    <div className="mb-2">
                      <span className="text-xs text-gray-600 block mb-1">Дүүргэлтийн түвшин:</span>
                      <FillLevelIndicator level={selectedLocation.fillLevel} />
                    </div>
                  )}
                  {selectedLocation.batteryLevel !== undefined && (
                    <div className="mb-2">
                      <span className="text-xs text-gray-600 block mb-1">Батарейн түвшин:</span>
                      <BatteryIndicator level={selectedLocation.batteryLevel} />
                    </div>
                  )}
                  {selectedLocation.status && (
                    <div className="text-xs">
                      <span className="text-gray-600">Төлөв: </span>
                      <span className={`font-medium ${
                        selectedLocation.status === 'active' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {selectedLocation.status === 'active' ? 'Идэвхтэй' : 'Идэвхгүй'}
                      </span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        )}

        {/* Heatmap circles for fill levels */}
        {showHeatmap && multipleLocations.length > 0 && (
          multipleLocations.map((location, index) => {
            if (location.fillLevel === undefined) return null;
            
            const getHeatmapColor = (level: number) => {
              if (level >= 90) return '#dc2626';
              if (level >= 70) return '#f59e0b';
              return '#10b981';
            };

            return (
              <CircleMarker
                key={`heatmap-${location.id || index}`}
                center={[location.lat, location.lng]}
                radius={Math.max(5, location.fillLevel / 10)}
                pathOptions={{
                  color: getHeatmapColor(location.fillLevel),
                  fillColor: getHeatmapColor(location.fillLevel),
                  fillOpacity: 0.3,
                  weight: 2
                }}
              />
            );
          })
        )}
      </MapContainer>
    </div>
  );
} 