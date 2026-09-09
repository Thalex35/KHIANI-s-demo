import { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import "leaflet/dist/leaflet.css";

type DeliveryMapPickerProps = {
  latitude?: number;
  longitude?: number;
  onChange: (coordinates: { latitude: number; longitude: number }) => void;
  onConfirm?: (coordinates: { latitude: number; longitude: number }) => void;
};

const markerIcon = L.divIcon({
  className: "map-selected-marker",
  html: `<span class="map-pin-selected"><svg viewBox="0 0 24 24" class="size-6"><path fill="#db6b31" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="3" fill="#fff"/></svg></span>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

function MapClickHandler({ onSelect }: { onSelect: (coords: { latitude: number; longitude: number }) => void }) {
  useMapEvents({
    click(event) {
      onSelect({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });

  return null;
}

export function DeliveryMapPicker({ latitude = 48.8566, longitude = 2.3522, onChange, onConfirm }: DeliveryMapPickerProps) {
  const [selection, setSelection] = useState({ latitude, longitude });
  const handleCoordinates = (coordinates: { latitude: number; longitude: number }) => {
    setSelection(coordinates);
    onChange(coordinates);
  };

  return (
    <div className="mt-4 rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-accent" />
          <span className="text-sm font-medium">Sélection de l’emplacement</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            handleCoordinates(selection);
            onConfirm?.(selection);
          }}
        >
          <Navigation className="mr-1 size-3" />
          Confirmer
        </Button>
      </div>

      <div className="p-3">
        <div className="overflow-hidden rounded-lg border border-border">
          <MapContainer center={[selection.latitude, selection.longitude]} zoom={13} scrollWheelZoom className="h-65 w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onSelect={handleCoordinates} />
            <Marker position={[selection.latitude, selection.longitude]} icon={markerIcon}>
              <Popup>Adresse de livraison</Popup>
            </Marker>
          </MapContainer>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              value={selection.latitude.toFixed(5)}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (!Number.isNaN(value)) {
                  handleCoordinates({ latitude: value, longitude: selection.longitude });
                }
              }}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              value={selection.longitude.toFixed(5)}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (!Number.isNaN(value)) {
                  handleCoordinates({ latitude: selection.latitude, longitude: value });
                }
              }}
              className="mt-1.5"
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Emplacement sélectionné : {selection.latitude.toFixed(5)}, {selection.longitude.toFixed(5)}
        </p>
      </div>
    </div>
  );
}
