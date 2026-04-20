// This file is always loaded via dynamic(() => import(...), { ssr: false })
"use client";
import { useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";

const ESRI_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ITALY_CENTER = [44.494887, 11.342616];

function makeIcon(color = "#b91c1c") {
  return L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,.6)"></div>`,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -12],
  });
}

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) {
      map.setView(ITALY_CENTER, 6);
      return;
    }
    if (positions.length === 1) {
      map.setView(positions[0], 14);
      return;
    }
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function MappaView({ cantieri, onEdit }) {
  const positioned = useMemo(() => cantieri.filter((c) => c.lat && c.lng), [cantieri]);
  const positions  = useMemo(() => positioned.map((c) => [c.lat, c.lng]), [positioned]);
  const redIcon    = useMemo(() => makeIcon("#b91c1c"), []);

  return (
    <MapContainer center={ITALY_CENTER} zoom={6} style={{ height: "100%", width: "100%" }}>
      <TileLayer url={ESRI_TILES} attribution="© Esri" />
      <FitBounds positions={positions} />

      {positioned.map((c) => (
        <Marker key={c.id} position={[c.lat, c.lng]} icon={redIcon}>
          <Popup minWidth={150}>
            <p style={{ fontWeight: 700, marginBottom: 2 }}>{c.cantiere}</p>
            <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>{c.cod_cantiere}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#b91c1c", fontSize: 12, fontWeight: 600 }}
              >
                Naviga →
              </a>
              {onEdit && (
                <button
                  onClick={() => onEdit(c)}
                  style={{
                    color: "#6b7280", fontSize: 11, background: "none",
                    border: "none", cursor: "pointer", padding: 0, textAlign: "left",
                  }}
                >
                  Modifica posizione
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {positioned.map((c) =>
        c.area_geojson ? (
          <GeoJSON
            key={`poly-${c.id}`}
            data={c.area_geojson}
            style={{ color: "#b91c1c", weight: 2, fillOpacity: 0.15 }}
          />
        ) : null,
      )}
    </MapContainer>
  );
}