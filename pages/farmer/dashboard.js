import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabaseClient";

export default function FarmerDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single();
    setProfile(profileData);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("farmer_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setProducts(data);
    setLoading(false);
  }

  async function toggleActive(id, current) {
    await supabase.from("products").update({ is_active: !current }).eq("id", id);
    load();
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this listing?")) return;
    await supabase.from("products").delete().eq("id", id);
    load();
  }

  if (loading) return (<div><Navbar /><p className="p-6">Loading...</p></div>);
  if (!profile) return (<div><Navbar /><p className="p-6">Please log in as a farmer.</p></div>);

  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">{profile.farm_name || "Farmer"} Dashboard</h1>
          <Link href="/farmer/add-product" className="bg-leaf text-white font-semibold px-4 py-2 rounded">
            + Add Product
          </Link>
        </div>

        {!profile.verified && (
          <p className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded p-3 mb-5">
            Your farm account is pending admin verification. Your listings are still visible while you wait,
            but verification builds buyer trust.
          </p>
        )}

        <div className="space-y-3 mt-4">
          {products.length === 0 && <p className="text-gray-500">You haven't listed any products yet.</p>}
          {products.map((p) => (
            <div key={p.id} className="border rounded-lg p-4 bg-white flex justify-between items-center">
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-gray-500">₹{p.price}/{p.unit} · {p.quantity_available} available</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(p.id, p.is_active)} className="text-xs border px-3 py-1.5 rounded">
                  {p.is_active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => deleteProduct(p.id)} className="text-xs border border-red-300 text-red-600 px-3 py-1.5 rounded">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
