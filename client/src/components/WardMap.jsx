import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../utils/leafletSetup';
import { typeLabel } from '../constants/resourceTypes';

const DEFAULT_CENTER = [16.705, 74.2433]; // Kolhapur

function WardMap({ needs, resources }) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={13} className="h-[500px] w-full rounded border border-gray-300">
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {needs.map((n) => (
        <Marker key={`need-${n._id}`} position={[n.location.coordinates[1], n.location.coordinates[0]]}>
          <Popup>
            <p className="font-semibold">{n.description}</p>
            <p className="text-sm">
              {typeLabel(n.type)} · Qty {n.quantity} · {n.urgency}
            </p>
            <p className="text-sm">Status: {n.status}</p>
            {n.requester?.name && <p className="text-sm">By: {n.requester.name}</p>}
          </Popup>
        </Marker>
      ))}

      {resources.map((r) => (
        <Marker key={`resource-${r._id}`} position={[r.location.coordinates[1], r.location.coordinates[0]]}>
          <Popup>
            <p className="font-semibold">{r.label}</p>
            <p className="text-sm">
              {typeLabel(r.type)} · Qty {r.quantity}
            </p>
            <p className="text-sm">Status: {r.status}</p>
            {r.owner?.name && <p className="text-sm">By: {r.owner.name}</p>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default WardMap;