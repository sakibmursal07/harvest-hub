import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { resolveFarmCoordinates, calculateDistanceKm, calculateCarbonSavedKg, KNOWN_HUBS } from "../lib/geoUtils";

export default function FarmRadarMap({ products = [], userLocation, onLocationChange, onFilterByFarm }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [detecting, setDetecting] = useState(false);
  const [locError, setLocError] = useState("");
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Group active products by unique farm
  const farmList = [];
  const farmMap = new Map();

  for (const p of products) {
    const farmId = p.farmer_id || p.profiles?.farm_name || "unknown";
    if (!farmMap.has(farmId)) {
      const coords = resolveFarmCoordinates(p.profiles?.location, farmId);
      const farmObj = {
        farmId,
        farmName: p.profiles?.farm_name || "Local Verified Farm",
        locationText: p.profiles?.location || "Maharashtra, India",
        lat: coords.lat,
        lng: coords.lng,
        verified: p.profiles?.verified || false,
        products: [p],
      };
      farmMap.set(farmId, farmObj);
      farmList.push(farmObj);
    } else {
      farmMap.get(farmId).products.push(p);
    }
  }

  // Detect User GPS using Browser HTML5 Geolocation API
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setLocError("GPS Geolocation is not supported by your browser.");
      return;
    }
    setDetecting(true);
    setLocError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
          label: "My Live GPS Location",
        };
        onLocationChange(coords);
        setDetecting(false);
      },
      (err) => {
        console.warn("Geolocation permission error:", err.message);
        setLocError("Location access denied. You can pick a regional demo location below.");
        setDetecting(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Quick Demo Location picker (ideal for classroom presentations)
  const handleSelectDemoHub = (key) => {
    if (key === "gps") {
      handleDetectGps();
      return;
    }
    const hub = KNOWN_HUBS[key];
    if (hub) {
      onLocationChange({
        lat: hub.lat,
        lng: hub.lng,
        label: hub.name,
      });
      setLocError("");
    }
  };

  // Initialize Leaflet Map (Client-Side only)
  useEffect(() => {
    let isCancelled = false;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      const L = (await import("leaflet")).default;

      if (isCancelled) return;

      // Clean up previous instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const defaultCenter = userLocation
        ? [userLocation.lat, userLocation.lng]
        : [16.705, 74.2433]; // Default Kolhapur center

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: userLocation ? 10 : 8,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      renderMarkers(L, map, markersGroup);
    }

    initMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isExpanded]);

  // Re-render markers when user location or farms change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    import("leaflet").then((module) => {
      const L = module.default;
      renderMarkers(L, mapInstanceRef.current, markersLayerRef.current);
    });
  }, [userLocation, products]);

  function renderMarkers(L, map, layerGroup) {
    layerGroup.clearLayers();
    const bounds = [];

    // 1. Render User Marker if available
    if (userLocation) {
      bounds.push([userLocation.lat, userLocation.lng]);

      const userIcon = L.divIcon({
        className: "custom-user-marker",
        html: `
          <div style="position:relative; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:28px; height:28px; background:rgba(37,99,235,0.3); border-radius:50%; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="width:16px; height:16px; background:#2563EB; border:3px solid white; border-radius:50%; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(layerGroup)
        .bindPopup(`
          <div style="font-family:sans-serif; font-size:12px; padding:2px;">
            <strong style="color:#1E40AF; display:block; margin-bottom:2px;">📍 Your Location</strong>
            <span style="color:#4B5563;">${userLocation.label || "Detected GPS Position"}</span>
          </div>
        `);
    }

    // 2. Render Farm Markers
    farmList.forEach((farm) => {
      bounds.push([farm.lat, farm.lng]);

      const dist = userLocation
        ? calculateDistanceKm(userLocation.lat, userLocation.lng, farm.lat, farm.lng)
        : null;

      const farmIcon = L.divIcon({
        className: "custom-farm-marker",
        html: `
          <div style="background:#4C6B3F; color:white; border:2px solid white; border-radius:12px; padding:4px 7px; font-size:11px; font-weight:bold; box-shadow:0 3px 8px rgba(0,0,0,0.25); display:flex; align-items:center; gap:3px; cursor:pointer; transform:translate(-50%, -50%);">
            <span>🌾</span>
            <span>${dist ? `${dist} km` : "Farm"}</span>
          </div>
        `,
        iconSize: [60, 26],
        iconAnchor: [30, 13],
      });

      const marker = L.marker([farm.lat, farm.lng], { icon: farmIcon }).addTo(layerGroup);

      marker.on("click", () => {
        setSelectedFarm({ ...farm, distanceKm: dist });
      });

      const productBadges = farm.products
        .map((p) => `<span style="background:#ECFDF5; color:#065F46; padding:2px 6px; border-radius:6px; font-size:10px; margin-right:4px;">${p.name} (₹${p.price}/${p.unit})</span>`)
        .join("");

      marker.bindPopup(`
        <div style="font-family:sans-serif; font-size:12px; min-width:180px; padding:4px;">
          <h4 style="font-weight:bold; color:#2B2318; margin:0 0 2px 0;">🌾 ${farm.farmName}</h4>
          <p style="color:#6B7280; font-size:11px; margin:0 0 6px 0;">📍 ${farm.locationText}</p>
          ${dist ? `<p style="color:#059669; font-weight:bold; font-size:11px; margin:0 0 6px 0;">Distance: 📍 ${dist} km away</p>` : ""}
          <div style="margin-top:6px; display:flex; flex-wrap:wrap; gap:4px;">
            ${productBadges}
          </div>
        </div>
      `);
    });

    if (bounds.length > 0 && map) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      } catch (e) {}
    }
  }

  return (
    <section className="mb-10 bg-white rounded-3xl p-5 sm:p-7 border border-gray-200/90 shadow-sm overflow-hidden">
      
      {/* Top Banner & Location Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <span>🗺️</span>
            <span>Hyper-Local Farm Radar</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-soil tracking-tight">
            Farms Near You & Food Miles Tracker
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm mt-0.5">
            Discover local farms within driving radius. Bypassing state-wide transport reduces food miles and delivers peak freshness!
          </p>
        </div>

        {/* GPS Control Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDetectGps}
            disabled={detecting}
            className="px-3.5 py-2 rounded-xl bg-leaf hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            {detecting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Detecting GPS...</span>
              </>
            ) : (
              <>
                <span>📍</span>
                <span>Detect My Location</span>
              </>
            )}
          </button>

          {/* Quick Demo Location Selector */}
          <select
            onChange={(e) => handleSelectDemoHub(e.target.value)}
            defaultValue=""
            className="bg-[#FAF7F2] border border-gray-200 text-soil text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-leaf cursor-pointer"
            title="Pick a regional location to test distance"
          >
            <option value="" disabled>
              🎯 Quick City Demo
            </option>
            <option value="kolhapur">Kolhapur (SM Farm Base)</option>
            <option value="pune">Pune / Kothrud</option>
            <option value="nashik">Nashik Agricultural Hub</option>
            <option value="sangli">Sangli Region</option>
            <option value="satara">Satara</option>
            <option value="mumbai">Mumbai Metro</option>
          </select>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-xs font-semibold text-gray-500 hover:text-soil border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            title={isExpanded ? "Collapse Map" : "Expand Map"}
          >
            {isExpanded ? "Hide Map ▲" : "Show Map ▼"}
          </button>
        </div>
      </div>

      {/* GPS Status / Error alert */}
      {userLocation && (
        <div className="mt-3 py-2 px-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between text-emerald-900 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-bold">✓ Active GPS:</span>
            <span>{userLocation.label} ({userLocation.lat}, {userLocation.lng})</span>
          </div>
          <span className="font-semibold text-[11px] text-emerald-700">
            Farms sorted by nearest driving radius
          </span>
        </div>
      )}

      {locError && (
        <div className="mt-3 py-2 px-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
          ⚠️ {locError}
        </div>
      )}

      {/* Map Container */}
      {isExpanded && (
        <div className="mt-4 relative rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
          <div ref={mapContainerRef} className="w-full h-72 sm:h-96 z-0" />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm p-2.5 rounded-xl border border-gray-200 shadow-sm text-[11px] space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#2563EB] rounded-full inline-block border-2 border-white shadow-xs"></span>
              <span className="font-medium text-gray-700">You (Customer)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-leaf rounded-md inline-block border border-white shadow-xs"></span>
              <span className="font-medium text-gray-700">Local Verified Farms</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Farm Detail Drawer */}
      {selectedFarm && (
        <div className="mt-4 p-4 bg-emerald-50/80 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn shadow-xs">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm sm:text-base text-soil">🌾 {selectedFarm.farmName}</h4>
              {selectedFarm.distanceKm && (
                <span className="text-xs bg-emerald-700 text-white font-bold px-2.5 py-0.5 rounded-full">
                  📍 {selectedFarm.distanceKm} km away
                </span>
              )}
              {selectedFarm.verified && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  ✓ Verified Farm
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              📍 {selectedFarm.locationText} · <strong>{selectedFarm.products.length} product(s)</strong> available for direct order
            </p>
            {selectedFarm.distanceKm && (
              <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                🌱 Direct local transit saves ~{calculateCarbonSavedKg(selectedFarm.distanceKm)} kg of transport CO₂
              </p>
            )}
          </div>
          <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
            {onFilterByFarm && (
              <button
                type="button"
                onClick={() => {
                  onFilterByFarm(selectedFarm);
                  const el = document.getElementById("produce-catalog");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-xs bg-leaf hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <span>🔍</span>
                <span>View This Farm's Produce ({selectedFarm.products.length}) ↑</span>
              </button>
            )}
            <button
              onClick={() => setSelectedFarm(null)}
              className="text-xs text-gray-500 hover:text-gray-800 font-semibold underline px-2 py-1"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </section>
  );
}
