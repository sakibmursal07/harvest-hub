import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabaseClient";

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  async function checkAdminAndLoad() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(true);

    const { data: farmerData } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "farmer")
      .order("created_at", { ascending: false });
    setFarmers(farmerData || []);

    const { data: productData } = await supabase
      .from("products")
      .select("*, profiles(farm_name)")
      .order("created_at", { ascending: false });
    setProducts(productData || []);

    setLoading(false);
  }

  async function verifyFarmer(id, current) {
    await supabase.from("profiles").update({ verified: !current }).eq("id", id);
    checkAdminAndLoad();
  }

  async function toggleProductActive(id, current) {
    await supabase.from("products").update({ is_active: !current }).eq("id", id);
    checkAdminAndLoad();
  }

  async function deleteProduct(id) {
    if (!confirm("Permanently remove this listing?")) return;
    await supabase.from("products").delete().eq("id", id);
    checkAdminAndLoad();
  }

  if (loading) return (<div><Navbar /><p className="p-6">Loading...</p></div>);
  if (!isAdmin) return (<div><Navbar /><p className="p-6">You don't have access to this page.</p></div>);

  return (
    <div>
      <Navbar />
      <main className="max-w-5xl mx-auto p-6 space-y-10">
        <div>
          <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Verify farmers and moderate listings.</p>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-3">Farmer Verification</h2>
          <div className="space-y-2">
            {farmers.length === 0 && <p className="text-gray-500 text-sm">No farmers yet.</p>}
            {farmers.map((f) => (
              <div key={f.id} className="flex items-center justify-between bg-white border rounded-lg p-4">
                <div>
                  <p className="font-medium">{f.farm_name || "(no farm name)"}</p>
                  <p className="text-xs text-gray-500">{f.full_name} · {f.location || "no location"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${f.verified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {f.verified ? "Verified" : "Pending"}
                  </span>
                  <button onClick={() => verifyFarmer(f.id, f.verified)} className="text-xs border px-3 py-1.5 rounded">
                    {f.verified ? "Unverify" : "Approve"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">All Listings</h2>
          <div className="space-y-2">
            {products.length === 0 && <p className="text-gray-500 text-sm">No products yet.</p>}
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-white border rounded-lg p-4">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {p.profiles?.farm_name || "Unknown farm"} · ₹{p.price}/{p.unit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {p.is_active ? "Active" : "Hidden"}
                  </span>
                  <button onClick={() => toggleProductActive(p.id, p.is_active)} className="text-xs border px-3 py-1.5 rounded">
                    {p.is_active ? "Hide" : "Unhide"}
                  </button>
                  <button onClick={() => deleteProduct(p.id)} className="text-xs border border-red-300 text-red-600 px-3 py-1.5 rounded">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}