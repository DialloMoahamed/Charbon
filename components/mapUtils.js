"use client";

import L from "leaflet";

// Correctif classique de react-leaflet/webpack : on dessine notre propre pin
// (aux couleurs de la marque) plutôt que de dépendre des images par défaut
// de Leaflet, dont le chemin casse souvent après le bundling.
export function emberIcon(color = "#D97706") {
  return L.divIcon({
    className: "",
    html: `
      <svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0Z" fill="${color}"/>
        <circle cx="15" cy="15" r="6" fill="#171717"/>
      </svg>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -38],
  });
}

// Coordonnées par défaut : centre de Niamey, utilisé quand aucune
// géolocalisation n'est encore disponible.
export const NIAMEY_CENTER = [13.5137, 2.1098];
