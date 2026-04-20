// This file is always loaded via dynamic(() => import(...), { ssr: false })
"use client";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, GeoJSON, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";

const ESRI_SAT =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_LABELS =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
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

// Riceve il riferimento alla mappa e sposta la view sul risultato scelto
function PanTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.setView([target.lat, target.lng], 16);
  }, [map, target]);
  return null;
}

function GeoSearch({ onSelect }) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  function search(q) {
    setQuery(q);
    clearTimeout(timerRef.current);
    if (q.trim().length < 3) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=it`,
          { headers: { "Accept-Language": "it" } },
        );
        const data = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  function pick(r) {
    onSelect({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
    setQuery(r.display_name.split(",")[0]);
    setResults([]);
  }

  return (
    <div
      style={{
        position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
        zIndex: 1000, width: "min(320px, calc(100% - 80px))",
      }}
    >
      <div style={{ position: "relative" }}>
        <input
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder="Cerca città o indirizzo…"
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(3,7,18,0.88)", backdropFilter: "blur(8px)",
            color: "white", fontSize: 13, outline: "none",
          }}
        />
        {loading && (
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 11 }}>
            …
          </span>
        )}
      </div>
      {results.length > 0 && (
        <div
          style={{
            marginTop: 4, background: "rgba(3,7,18,0.95)", backdropFilter: "blur(8px)",
            borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
            overflow: "hidden",
          }}
        >
          {results.map((r) => (
            <button
              key={r.place_id}
              onClick={() => pick(r)}
              style={{
                width: "100%", textAlign: "left", padding: "8px 12px",
                background: "none", border: "none", cursor: "pointer",
                color: "#f1f5f9", fontSize: 12,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MappaEditor({ cantiere, onSave, onCancel, saving }) {
  const [pin, setPin]         = useState(
    cantiere.lat && cantiere.lng ? [cantiere.lat, cantiere.lng] : null,
  );
  const [polygon, setPolygon] = useState(cantiere.area_geojson || null);
  const [panTarget, setPanTarget] = useState(null);
  const icon = useRef(makeBlueIcon()).current;

  const center = pin ?? DEFAULT_CENTER;

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <MapContainer center={center} zoom={pin ? 15 : 6} style={{ height: "100%", width: "100%" }}>
        <TileLayer url={ESRI_SAT} attribution="© Esri" />
        <TileLayer url={ESRI_LABELS} attribution="" />
        <ClickHandler onMapClick={setPin} />
        <GeomanSetup onPolygon={setPolygon} />
        <PanTo target={panTarget} />
        {pin && <Marker position={pin} icon={icon} />}
        {polygon && (
          <GeoJSON
            key={JSON.stringify(polygon)}
            data={polygon}
            style={{ color: "#1d4ed8", weight: 2, fillOpacity: 0.15 }}
          />
        )}
      </MapContainer>

      {/* Search bar */}
      <GeoSearch onSelect={(t) => { setPanTarget(t); setPin([t.lat, t.lng]); }} />

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
            : "Cerca o tocca la mappa per posizionare"}
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