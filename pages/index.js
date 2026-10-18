import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Head from "next/head";
import dynamic from "next/dynamic";
import Navbar from "../components/Navbar";
import WelcomeModal from "../components/WelcomeModal";
import CommunityPools from "../components/CommunityPools";
import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import { calculateDistanceKm, resolveFarmCoordinates } from "../lib/geoUtils";

const FarmRadarMap = dynamic(() => import("../components/FarmRadarMap"), {
  ssr: false,
  loading: () => (
    <div className="h-44 sm:h-64 bg-white rounded-3xl border border-gray-200 animate-pulse flex items-center justify-center text-gray-400 text-sm">
      🗺️ Loading Farm Radar Map...
    </div>
  ),
});

const CATEGORIES = ["All", "Vegetable", "Fruit", "Grain", "Dairy"];

export default function Home() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [productRatings, setProductRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [userLocation, setUserLocation] = useState(null);
  const [selectedFarmFilter, setSelectedFarmFilter] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("harvest_user_location");
      if (saved) {
        setUserLocation(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const handleLocationChange = (coords) => {
    setUserLocation(coords);
    try {
      if (coords) {
        localStorage.setItem("harvest_user_location", JSON.stringify(coords));
        setSortBy("nearest");
      } else {
        localStorage.removeItem("harvest_user_location");
      }
    } catch (e) {}
  };

  const categoryNames = {
    All: t("cat_all"),
    Vegetable: t("cat_vegetable"),
    Fruit: t("cat_fruit"),
    Grain: t("cat_grain"),
    Dairy: t("cat_dairy"),
  };

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*, profiles(farm_name, location, verified, upi_id)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading products:", error);
    } else {
      setProducts(data || []);
    }

    // Load buyer ratings map
    try {
      const { data: revData, error: revErr } = await supabase
        .from("reviews")
        .select("product_id, rating");

      if (!revErr && revData) {
        const stats = {};
        for (const r of revData) {
          if (!stats[r.product_id]) {
            stats[r.product_id] = { total: 0, count: 0, avg: 0 };
          }
          stats[r.product_id].total += r.rating;
          stats[r.product_id].count += 1;
        }
        for (const pid in stats) {
          stats[pid].avg = (stats[pid].total / stats[pid].count).toFixed(1);
        }
        setProductRatings(stats);
      }
    } catch (e) {
      console.warn("Reviews load catch in index:", e);
    }

    setLoading(false);
  }

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .map((p) => {
        let calculatedDistance = null;
        if (userLocation) {
          const farmCoords = resolveFarmCoordinates(
            p.profiles?.location,
            p.farmer_id || p.profiles?.farm_name
          );
          calculatedDistance = calculateDistanceKm(
            userLocation.lat,
            userLocation.lng,
            farmCoords.lat,
            farmCoords.lng
          );
        }
        return { ...p, calculatedDistance };
      })
      .filter((p) => {
        const matchesCategory =
          selectedCategory === "All" ||
          p.category?.toLowerCase() === selectedCategory.toLowerCase();

        const matchesFarmFilter =
          !selectedFarmFilter ||
          p.farmer_id === selectedFarmFilter.farmId ||
          p.profiles?.farm_name === selectedFarmFilter.farmName;

        const query = searchQuery.trim().toLowerCase();
        if (!query) return matchesCategory && matchesFarmFilter;

        const matchesName = p.name?.toLowerCase().includes(query);
        const matchesFarm = p.profiles?.farm_name?.toLowerCase().includes(query);
        const matchesLocation = p.profiles?.location?.toLowerCase().includes(query);
        const matchesDesc = p.description?.toLowerCase().includes(query);

        return (
          matchesCategory &&
          matchesFarmFilter &&
          (matchesName || matchesFarm || matchesLocation || matchesDesc)
        );
      })
      .sort((a, b) => {
        if (sortBy === "nearest" && userLocation) {
          if (a.calculatedDistance == null) return 1;
          if (b.calculatedDistance == null) return -1;
          return a.calculatedDistance - b.calculatedDistance;
        }
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        if (sortBy === "rating_desc") {
          const ratingA = productRatings[a.id]?.avg ? Number(productRatings[a.id].avg) : 0;
          const ratingB = productRatings[b.id]?.avg ? Number(productRatings[b.id].avg) : 0;
          return ratingB - ratingA;
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [products, searchQuery, selectedCategory, sortBy, productRatings, userLocation, selectedFarmFilter]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts = { All: products.length };
    for (const p of products) {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    }
    return counts;
  }, [products]);

  return (
    <div className="min-h-screen bg-[#faf7f2] dark:bg-[#14110e] text-soil dark:text-[#f3eee6] transition-colors duration-200">
      <Head>
        <title>Harvest Hub | Farm Fresh Produce Directly From Local Farmers</title>
        <meta
          name="description"
          content="Support local agriculture. Buy freshly harvested vegetables, fruits, and grains directly from verified local farmers."
        />
      </Head>

      <Navbar />
      <WelcomeModal />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-soil to-[#3d3223] dark:from-[#18140f] dark:to-[#120f0b] text-white py-12 px-6 shadow-inner">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block bg-leaf/40 border border-leaf text-emerald-200 text-xs uppercase tracking-widest px-3 py-1 rounded-full font-semibold mb-3">
            {t("hero_tag")}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            {t("hero_title")}
          </h1>
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            {t("hero_desc")}
          </p>

          {/* Search Bar in Hero */}
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              placeholder={t("search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1e1913] text-gray-900 dark:text-gray-100 rounded-2xl py-3.5 pl-12 pr-10 text-sm sm:text-base shadow-xl focus:outline-none focus:ring-2 focus:ring-leaf transition border border-transparent dark:border-stone-700"
            />
            <span className="absolute left-4 top-3.5 text-gray-400 text-lg">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto p-6 sm:p-8">
        {/* Filters and Sorting Controls */}
        <div id="produce-catalog" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-stone-800 scroll-mt-20">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
                    isActive
                      ? "bg-leaf text-white shadow-sm"
                      : "bg-white dark:bg-[#1e1913] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-stone-800 border border-gray-200 dark:border-stone-700"
                  }`}
                >
                  <span>{categoryNames[cat] || cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sorting Dropdown & Quick Map Anchor */}
          <div className="flex items-center gap-2 self-end sm:self-auto text-sm flex-wrap justify-end">
            <a
              href="#farm-radar-map"
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-leaf dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition flex items-center gap-1 shadow-xs"
            >
              <span>🗺️</span>
              <span>Farm Radar Map</span>
            </a>
            <label className="text-gray-500 dark:text-stone-400 text-xs font-medium">{t("sort_label")}</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white dark:bg-[#1e1913] text-gray-900 dark:text-stone-100 border border-gray-200 dark:border-stone-700 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium focus:outline-none focus:border-leaf"
            >
              {userLocation && (
                <option value="nearest">{t("sort_nearest")}</option>
              )}
              <option value="newest">{t("sort_newest")}</option>
              <option value="rating_desc">{t("sort_top_rated")}</option>
              <option value="price_asc">{t("sort_price_low")}</option>
              <option value="price_desc">{t("sort_price_high")}</option>
            </select>
          </div>
        </div>

        {/* Active Farm Filter Alert */}
        {selectedFarmFilter && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌾</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] bg-leaf text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Farm Filter Active
                  </span>
                  <span className="font-extrabold text-soil dark:text-stone-100 text-sm sm:text-base">
                    {selectedFarmFilter.farmName}
                  </span>
                  {selectedFarmFilter.distanceKm && (
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-white/90 dark:bg-stone-900/90 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                      📍 {selectedFarmFilter.distanceKm} km away
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-stone-300 mt-0.5">
                  Showing harvest direct from <strong>{selectedFarmFilter.locationText}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedFarmFilter(null)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1e1913] hover:bg-gray-100 dark:hover:bg-stone-800 text-gray-800 dark:text-stone-200 font-bold text-xs border border-gray-300 dark:border-stone-700 shadow-2xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>✕</span>
              <span>Show All Farms</span>
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white dark:bg-[#1e1913] border border-gray-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm animate-pulse"
              >
                <div className="w-full h-44 bg-gray-200 dark:bg-stone-800" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-stone-800 rounded w-1/3" />
                  <div className="h-6 bg-gray-200 dark:bg-stone-800 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-stone-800 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 dark:bg-stone-800 rounded w-1/4 pt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-[#1e1913] border border-dashed border-gray-300 dark:border-stone-700 rounded-2xl p-8">
            <div className="text-5xl mb-4">🌾</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-stone-100 mb-2">No produce found</h3>
            <p className="text-gray-500 dark:text-stone-400 text-sm max-w-md mx-auto mb-6">
              {searchQuery || selectedCategory !== "All"
                ? "No products matched your search or category filter. Try clearing filters or searching for something else."
                : "No products are listed right now. Are you a local farmer? Join Harvest Hub and list your harvest!"}
            </p>
            {(searchQuery || selectedCategory !== "All" || selectedFarmFilter) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedFarmFilter(null);
                }}
                className="bg-leaf hover:bg-emerald-800 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}

        {/* Products Grid */}
        {!loading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.quantity_available <= 0;
              return (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="group block bg-white dark:bg-[#1e1913] border border-gray-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:hover:border-emerald-700/60 transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="relative overflow-hidden bg-emerald-50/50 dark:bg-emerald-950/20">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/30 flex flex-col items-center justify-center text-4xl text-emerald-700 dark:text-emerald-400">
                        <span>🌾</span>
                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mt-1 uppercase tracking-wide">
                          {p.category}
                        </span>
                      </div>
                    )}

                    {/* Category Tag */}
                    <span className="absolute top-3 left-3 bg-white/90 dark:bg-stone-900/90 text-soil dark:text-stone-200 font-semibold text-xs px-2.5 py-1 rounded-full shadow-xs backdrop-blur-xs">
                      {p.category}
                    </span>

                    {/* Distance Badge on Image if userLocation is active */}
                    {p.calculatedDistance != null && (
                      <span className="absolute bottom-3 left-3 bg-soil/90 dark:bg-black/85 backdrop-blur-sm text-white font-bold text-[11px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-white/20">
                        <span>📍</span>
                        <span>{p.calculatedDistance} km away</span>
                      </span>
                    )}

                    {/* Stock Tag */}
                    <span
                      className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full shadow-xs ${
                        isOutOfStock
                          ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300"
                          : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                      }`}
                    >
                      {isOutOfStock ? t("sold_out") : `${p.quantity_available} ${p.unit} ${t("in_stock")}`}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-stone-100 group-hover:text-leaf dark:group-hover:text-emerald-400 transition">
                      {p.name}
                    </h3>

                    {/* Farmer, Verification & Location */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-stone-400 mt-1 flex-wrap">
                      <span className="font-medium text-gray-700 dark:text-stone-300 truncate">
                        {p.profiles?.farm_name || "Local Farmer"}
                      </span>
                      {p.profiles?.location && (
                        <>
                          <span>·</span>
                          <span className="truncate">📍 {p.profiles.location}</span>
                        </>
                      )}
                      {p.profiles?.verified && (
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold px-1.5 py-0.2 rounded-full shrink-0">
                          ✓
                        </span>
                      )}
                      {p.calculatedDistance != null && (
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                          📍 {p.calculatedDistance} km
                        </span>
                      )}
                    </div>

                    {/* Rating Pill & UPI Badge */}
                    <div className="flex items-center justify-between text-xs mt-2.5">
                      {productRatings[p.id] ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full shrink-0">
                          ★ {productRatings[p.id].avg}
                          <span className="text-gray-400 dark:text-stone-400 font-normal">({productRatings[p.id].count})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full shrink-0">
                          {t("fresh_harvest")}
                        </span>
                      )}

                      {p.profiles?.upi_id && (
                        <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/60 px-2 py-0.5 rounded-full">
                          💳 UPI
                        </span>
                      )}
                    </div>

                    {/* Price and CTA */}
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-stone-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-400 dark:text-stone-400 block">{t("price_label")}</span>
                        <p className="text-xl font-extrabold text-leaf dark:text-emerald-400">
                          ₹{p.price}
                          <span className="text-xs font-normal text-gray-500 dark:text-stone-400"> / {p.unit}</span>
                        </p>
                      </div>

                      <span
                        className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg transition ${
                          isOutOfStock
                            ? "bg-gray-100 dark:bg-stone-800 text-gray-400 dark:text-stone-500"
                            : "bg-emerald-50 dark:bg-emerald-950/50 text-leaf dark:text-emerald-300 group-hover:bg-leaf group-hover:text-white"
                        }`}
                      >
                        {isOutOfStock ? t("sold_out") : t("btn_buy_direct")}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Hyper-Local Farm Radar Map & Distance Finder (In Between Product Listings & Neighborhood Pooling) */}
        <div id="farm-radar-map" className="mt-14 pt-10 border-t border-gray-200/80 dark:border-stone-800">
          <FarmRadarMap
            products={products}
            userLocation={userLocation}
            onLocationChange={handleLocationChange}
            onFilterByFarm={setSelectedFarmFilter}
          />
        </div>

        {/* Neighborhood Pooling / Group-Buying Innovation (Positioned Below Farm Radar Map) */}
        <div className="mt-14 pt-10 border-t border-gray-200/80 dark:border-stone-800">
          <CommunityPools />
        </div>
      </main>
    </div>
  );
}