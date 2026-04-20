// This file is always loaded via dynamic(() => import(...), { ssr: false })
"use client";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, GeoJSON, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";

const ESRI_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const DEFAULT_CENTER = [44.494887, 11.342616];

function makeBlueIcon() {
  return L.divIcon({
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#1d4ed8;border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,.7)"></div>`,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick([e.latlng.lat, e.latlng.lng]) });
  return null;
}

function GeomanSetup({ onPolygon }) {
  const map = useMap();

  useEffect(() => {
    if (!map.pm) return;
    map.pm.addControls({
      position: "topleft",
      drawMarker: false,
      drawCircle: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawText: false,
      cutPolygon: false,
    });

    function onCreate({ layer }) {
      onPolygon(layer.toGeoJSON().geometry);
    }
    map.on("pm:create", onCreate);

    return () => {
      map.pm.removeControls();
      map.off("pm:create", onCreate);
    };
  }, [map, onPolygon]);

  return null;
}

export default function MappaEditor({ cantiere, onSave, onCancel, saving }) {
  const [pin, setPin] = useState(
    cantiere.lat && cantiere.lng ? [cantiere.lat, cantiere.lng] : null,
  );
  const [polygon, setPolygon] = useState(cantiere.area_geojson || null);
  const icon = useRef(makeBlueIcon()).current;

  const center = pin ?? DEFAULT_CENTER;

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <MapContainer center={center} zoom={pin ? 15 : 6} style={{ height: "100%", width: "100%" }}>
        <TileLayer url={ESRI_TILES} attribution="© Esri" />
        <ClickHandler onMapClick={setPin} />
        <GeomanSetup onPolygon={setPolygon} />
        {pin && <Marker position={pin} icon={icon} />}
        {polygon && (
          <GeoJSON
            key={JSON.stringify(polygon)}
            data={polygon}
            style={{ color: "#1d4ed8", weight: 2, fillOpacity: 0.15 }}
          />
        )}
      </MapContainer>

      {/* Floating footer */}
      <div
        style={{
          position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
          zIndex: 1000, background: "rgba(3,7,18,0.88)", backdropFilter: "blur(8px)",
          borderRadius: 12, padding: "10px 14px", display: "flex",
          alignItems: "center", gap: 10, maxWidth: "calc(100% - 32px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span style={{ color: "#9ca3af", fontSize: 11, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {pin
            ? `📍 ${pin[0].toFixed(5)}, ${pin[1].toFixed(5)}`
            : "Tocca la mappa per posizionare il cantiere"}
        </span>
        <button
          onClick={onCancel}
          style={{
            color: "#9ca3af", fontSize: 12, background: "none",
            border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6, whiteSpace: "nowrap",
          }}
        >
          Annulla
        </button>
        <button
          onClick={() => onSave({ lat: pin?.[0] ?? null, lng: pin?.[1] ?? null, area_geojson: polygon })}
          disabled={!pin || saving}
          style={{
            background: pin && !saving ? "#b91c1c" : "#374151",
            color: "white", fontSize: 12, fontWeight: 600,
            border: "none", borderRadius: 8, padding: "6px 14px",
            cursor: pin && !saving ? "pointer" : "not-allowed", whiteSpace: "nowrap",
          }}
        >
          {saving ? "Salvataggio…" : "Salva Posizione"}
        </button>
      </div>
    </div>
  );
}