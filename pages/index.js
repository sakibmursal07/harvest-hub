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
    // Pull every active product, plus the farmer's name via a join,
    // ordered so newest listings show first.
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
              className="block bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-lg">{p.name}</h3>
              <p className="text-sm text-gray-500">
                {p.profiles?.farm_name || "Unknown Farm"} · {p.profiles?.location || "—"}
              </p>
              <p className="mt-2 font-bold text-leaf">
                ₹{p.price} / {p.unit}
              </p>
              <p className="text-xs text-gray-400 mt-1">{p.quantity_available} available</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
