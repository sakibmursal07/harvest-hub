// Geographic coordinates dictionary for regional agricultural hubs in India
export const KNOWN_HUBS = {
  kolhapur: { lat: 16.705, lng: 74.2433, name: "Kolhapur, Maharashtra" },
  pune: { lat: 18.5204, lng: 73.8567, name: "Pune, Maharashtra" },
  nashik: { lat: 19.9975, lng: 73.7898, name: "Nashik, Maharashtra" },
  sangli: { lat: 16.8524, lng: 74.5815, name: "Sangli, Maharashtra" },
  satara: { lat: 17.6805, lng: 73.993, name: "Satara, Maharashtra" },
  solapur: { lat: 17.6599, lng: 75.9064, name: "Solapur, Maharashtra" },
  nagpur: { lat: 21.1458, lng: 79.0882, name: "Nagpur, Maharashtra" },
  mumbai: { lat: 19.076, lng: 72.8777, name: "Mumbai, Maharashtra" },
  bengaluru: { lat: 12.9716, lng: 77.5946, name: "Bengaluru, Karnataka" },
  mandya: { lat: 12.5244, lng: 76.8967, name: "Mandya, Karnataka" },
  delhi: { lat: 28.6139, lng: 77.209, name: "Delhi-NCR" },
};

// Deterministic jitter based on string id so multiple farms in the same town don't overlap
function hashStringToOffset(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((Math.abs(hash) % 40) - 20) * 0.003;
  const lngOffset = ((Math.abs(hash >> 3) % 40) - 20) * 0.003;
  return { latOffset, lngOffset };
}

// Convert free-form location text from farmer profile into GPS coordinates
export function resolveFarmCoordinates(locationStr = "", farmId = "") {
  const norm = (locationStr || "").toLowerCase();
  let base = KNOWN_HUBS.kolhapur; // Default agricultural hub

  for (const [key, hub] of Object.entries(KNOWN_HUBS)) {
    if (norm.includes(key)) {
      base = hub;
      break;
    }
  }

  const { latOffset, lngOffset } = hashStringToOffset(farmId || locationStr || "farm");
  return {
    lat: Number((base.lat + latOffset).toFixed(5)),
    lng: Number((base.lng + lngOffset).toFixed(5)),
    hubName: base.name,
  };
}

// Haversine formula: Calculates distance between two GPS coordinates in kilometers
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return Number(dist.toFixed(1));
}

// Calculates estimated CO2 emissions saved compared to 850 km average supermarket cold-chain transport
export function calculateCarbonSavedKg(distanceKm) {
  if (!distanceKm) return 2.5;
  const supermarketAverageDistance = 850; // km
  const differenceKm = Math.max(50, supermarketAverageDistance - distanceKm);
  // Average freight emission ~0.005 kg CO2 per km for small produce consignment
  const saved = (differenceKm * 0.0045).toFixed(1);
  return Number(saved);
}
