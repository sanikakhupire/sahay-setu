import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../utils/leafletSetup';

const DEFAULT_CENTER = [16.705, 74.2433]; // Kolhapur

// Reports map clicks to the parent
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Moves the map when "Use my location" succeeds
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 16);
  }, [target, map]);
  return null;
}

function LocationPicker({ value, onChange }) {
  const [flyTarget, setFlyTarget] = useState(null);
  const [geoError, setGeoError] = useState('');

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setGeoError('Your browser does not support location access. Click the map instead.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onChange(point);
        setFlyTarget(point);
        setGeoError('');
      },
      () => setGeoError('Could not get your location. Click the map instead.')
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">
          {value
            ? `Selected: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
            : 'Click the map to drop a pin'}
        </span>
        <button
          type="button"
          onClick={handleLocate}
          className="text-sm bg-gray-100 hover:bg-gray-200 rounded px-3 py-1"
        >
          Use my location
        </button>
      </div>

      {geoError && <p className="text-sm text-red-600 mb-2">{geoError}</p>}

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={14}
        className="h-72 w-full rounded border border-gray-300"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onChange} />
        <FlyTo target={flyTarget} />
        {value && <Marker position={[value.lat, value.lng]} />}
      </MapContainer>
    </div>
  );
}

export default LocationPicker;