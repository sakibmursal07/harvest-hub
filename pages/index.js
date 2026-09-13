import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*, profiles(farm_name, location)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setProducts(data);
    setLoading(false);
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-1">Today's Harvest</h1>
        <p className="text-gray-600 mb-6">Fresh produce, listed directly by local farmers.</p>

        {loading && <p>Loading products...</p>}
        {!loading && products.length === 0 && (
          <p className="text-gray-500">
            No products yet — log in as a farmer and add your first listing.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="block bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-4xl">
                  🌾
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <p className="text-sm text-gray-500">
                  {p.profiles?.farm_name || "Unknown Farm"} · {p.profiles?.location || "—"}
                </p>
                <p className="mt-2 font-bold text-leaf">
                  ₹{p.price} / {p.unit}
                </p>
                <p className="text-xs text-gray-400 mt-1">{p.quantity_available} available</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}