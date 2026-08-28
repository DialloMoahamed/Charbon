"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { LocateFixed } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { emberIcon, NIAMEY_CENTER } from "./mapUtils";

function ClickToPlace({ onChange }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ position }) {
  const map = useMap();
  if (position) map.flyTo(position, 16, { duration: 0.8 });
  return null;
}

export default function LocationPicker({ latitude, longitude, onChange }) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const position = latitude != null && longitude != null ? [latitude, longitude] : null;

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setError("Position refusée ou indisponible. Placez le repère manuellement sur la carte.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-ash">
          Position de livraison <span className="font-normal">(facultatif, aide beaucoup le livreur)</span>
        </label>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="flex items-center gap-1 text-xs font-semibold text-emberdeep disabled:opacity-50"
        >
          <LocateFixed size={14} /> {locating ? "Localisation…" : "Utiliser ma position"}
        </button>
      </div>
      <div className="rounded-lg overflow-hidden border border-paperdeep" style={{ height: 200 }}>
        <MapContainer center={position || NIAMEY_CENTER} zoom={position ? 16 : 12} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPlace onChange={onChange} />
          {position && <FlyTo position={position} />}
          {position && <Marker position={position} icon={emberIcon()} />}
        </MapContainer>
      </div>
      <p className="text-xs text-ash mt-1">
        {position ? "Repère placé — cliquez ailleurs sur la carte pour le déplacer." : "Cliquez sur la carte à l'endroit de la livraison."}
      </p>
      {error && <p className="text-xs text-emberdeep mt-1">{error}</p>}
    </div>
  );
}
