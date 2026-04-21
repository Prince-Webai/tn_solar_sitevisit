'use client';

import { useState } from 'react';
import { MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface LocationCapturerProps {
  onCapture: (coords: { lat: number; lng: number }) => void;
  value?: { lat: number; lng: number };
}

export function LocationCapturer({ onCapture, value }: LocationCapturerProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        onCapture(coords);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-2">
      {!value ? (
        <Button
          type="button"
          onClick={handleCapture}
          disabled={loading}
          variant="outline"
          className="w-full h-12 gap-2 border-dashed border-2 hover:border-vision-green hover:bg-vision-green/5"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-vision-green" />
          ) : (
            <MapPin className="w-4 h-4 text-vision-green" />
          )}
          {t('capture_location')}
        </Button>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold">{t('location_captured')}</p>
            <p className="opacity-80">
              {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCapture}
            className="ml-auto text-[10px] h-7 hover:bg-green-100"
          >
            Recapture
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
