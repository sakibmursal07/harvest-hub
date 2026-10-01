import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Head from "next/head";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabaseClient";

const CATEGORIES = ["All", "Vegetable", "Fruit", "Grain", "Dairy"];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*, profiles(farm_name, location, verified)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) console.error("Error loading products:", error);
    else setProducts(data || []);
    setLoading(false);
  }

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory =
          selectedCategory === "All" ||
          p.category?.toLowerCase() === selectedCategory.toLowerCase();

        const query = searchQuery.trim().toLowerCase();
        if (!query) return matchesCategory;

        const matchesName = p.name?.toLowerCase().includes(query);
        const matchesFarm = p.profiles?.farm_name?.toLowerCase().includes(query);
        const matchesLocation = p.profiles?.location?.toLowerCase().includes(query);
        const matchesDesc = p.description?.toLowerCase().includes(query);

        return matchesCategory && (matchesName || matchesFarm || matchesLocation || matchesDesc);
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.price - b.price;
        if (sortBy === "price_desc") return b.price - a.price;
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [products, searchQuery, selectedCategory, sortBy]);

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
    <div className="min-h-screen bg-[#faf7f2] text-soil">
      <Head>
        <title>Harvest Hub | Farm Fresh Produce Directly From Local Farmers</title>
        <meta
          name="description"
          content="Support local agriculture. Buy freshly harvested vegetables, fruits, and grains directly from verified local farmers."
        />
      </Head>

      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-soil to-[#3d3223] text-white py-12 px-6 shadow-inner">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block bg-leaf/40 border border-leaf text-emerald-200 text-xs uppercase tracking-widest px-3 py-1 rounded-full font-semibold mb-3">
            Direct Farm-to-Table Marketplace
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Fresh Produce, Straight From the Soil
          </h1>
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Skip the middleman. Connect directly with local verified farmers for crisp vegetables, sweet seasonal fruits, and wholesome grains.
          </p>

          {/* Search Bar in Hero */}
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              placeholder="Search by vegetable, fruit, grain, or farm name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-gray-900 rounded-2xl py-3.5 pl-12 pr-10 text-sm sm:text-base shadow-xl focus:outline-none focus:ring-2 focus:ring-leaf transition"
            />
            <span className="absolute left-4 top-3.5 text-gray-400 text-lg">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 text-sm font-bold"
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-gray-200">
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
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto text-sm">
            <label className="text-gray-500 text-xs font-medium">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium focus:outline-none focus:border-leaf"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm animate-pulse"
              >
                <div className="w-full h-44 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-1/4 pt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-2xl p-8">
            <div className="text-5xl mb-4">🌾</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No produce found</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              {searchQuery || selectedCategory !== "All"
                ? "No products matched your search or category filter. Try clearing filters or searching for something else."
                : "No products are listed right now. Are you a local farmer? Join Harvest Hub and list your harvest!"}
            </p>
            {(searchQuery || selectedCategory !== "All") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="bg-leaf hover:bg-emerald-800 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm"
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
                  className="group block bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="relative overflow-hidden bg-emerald-50/50">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-emerald-50 to-emerald-100 flex flex-col items-center justify-center text-4xl text-emerald-700">
                        <span>🌾</span>
                        <span className="text-xs font-semibold text-emerald-800 mt-1 uppercase tracking-wide">
                          {p.category}
                        </span>
                      </div>
                    )}

                    {/* Category Tag */}
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-soil font-semibold text-xs px-2.5 py-1 rounded-full shadow-xs">
                      {p.category}
                    </span>

                    {/* Stock Tag */}
                    <span
                      className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full shadow-xs ${
                        isOutOfStock
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {isOutOfStock ? "Sold Out" : `${p.quantity_available} ${p.unit} in stock`}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-leaf transition">
                      {p.name}
                    </h3>

                    {/* Farmer & Location */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                      <span className="font-medium text-gray-700">
                        {p.profiles?.farm_name || "Local Farmer"}
                      </span>
                      {p.profiles?.location && (
                        <>
                          <span>·</span>
                          <span>📍 {p.profiles.location}</span>
                        </>
                      )}
                      {p.profiles?.verified && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded-full ml-0.5">
                          ✓
                        </span>
                      )}
                    </div>

                    {/* Price and CTA */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-400 block">Price:</span>
                        <p className="text-xl font-extrabold text-leaf">
                          ₹{p.price}
                          <span className="text-xs font-normal text-gray-500"> / {p.unit}</span>
                        </p>
                      </div>

                      <span
                        className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg transition ${
                          isOutOfStock
                            ? "bg-gray-100 text-gray-400"
                            : "bg-emerald-50 text-leaf group-hover:bg-leaf group-hover:text-white"
                        }`}
                      >
                        {isOutOfStock ? "Unavailable" : "Buy Direct →"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}