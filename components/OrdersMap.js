"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { ExternalLink } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { emberIcon } from "./mapUtils";
import { formatFCFA } from "./ui";

const STATUS_COLOR = {
  "En attente": "#FF6B35",
  "Livrée": "#5B7A4A",
  "Annulée": "#8C8177",
};

export default function OrdersMap({ orders }) {
  const located = orders.filter((o) => o.latitude != null && o.longitude != null);

  if (located.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center bg-white border border-paperdeep">
        <p className="text-sm text-ash">
          Aucune commande localisée pour le moment. Les clients qui placent un repère lors de leur commande
          apparaîtront ici.
        </p>
      </div>
    );
  }

  const center = [located[0].latitude, located[0].longitude];

  return (
    <div className="rounded-xl overflow-hidden border border-paperdeep" style={{ height: 480 }}>
      <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map((o) => (
          <Marker key={o.id} position={[o.latitude, o.longitude]} icon={emberIcon(STATUS_COLOR[o.status] || "#FF6B35")}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold font-mono">{o.reference}</p>
                <p>{o.customerName} · {o.customerPhone}</p>
                <p className="text-xs text-ash">{o.customerAddress}</p>
                <p className="mt-1 font-semibold">{formatFCFA(o.total)} — {o.status}</p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${o.latitude},${o.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 mt-2 text-emberdeep font-medium"
                >
                  <ExternalLink size={12} /> Itinéraire dans Google Maps
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
