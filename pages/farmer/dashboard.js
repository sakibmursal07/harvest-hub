import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabaseClient";

export default function FarmerDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ farm_name: "", location: "", upi_id: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

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
    if (profileData) {
      setProfileForm({
        farm_name: profileData.farm_name || "",
        location: profileData.location || "",
        upi_id: profileData.upi_id || "",
      });
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("farmer_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setProducts(data);
    setLoading(false);
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");

    let payload = {
      farm_name: profileForm.farm_name,
      location: profileForm.location,
      upi_id: profileForm.upi_id.trim() || null,
    };

    let { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", profile.id);

    // If upi_id column is not added yet, retry without upi_id
    if (error && error.code === "42703") {
      delete payload.upi_id;
      const fallback = await supabase.from("profiles").update(payload).eq("id", profile.id);
      error = fallback.error;
    }

    setSavingProfile(false);
    if (error) {
      setProfileMessage("Failed to update profile: " + error.message);
    } else {
      setProfileMessage("Farm details updated successfully!");
      setEditingProfile(false);
      load();
    }
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

  if (loading) return (<div><Navbar /><p className="p-6">Loading dashboard...</p></div>);
  if (!profile) return (<div><Navbar /><p className="p-6">Please log in as a farmer.</p></div>);

  const activeCount = products.filter(p => p.is_active).length;
  const totalStock = products.reduce((acc, p) => acc + (p.quantity_available || 0), 0);

  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🌾 {profile.farm_name || "Farmer"} Dashboard
              {profile.verified ? (
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  ✓ Verified Farm
                </span>
              ) : (
                <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                  Pending Verification
                </span>
              )}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-1">
              <span>📍 {profile.location || "Location not set yet"} · {profile.full_name}</span>
              {profile.upi_id && (
                <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
                  💳 UPI: {profile.upi_id}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingProfile(!editingProfile)}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3.5 py-2 rounded-lg transition"
            >
              {editingProfile ? "Cancel" : "Edit Farm Info"}
            </button>
            <Link href="/farmer/add-product" className="bg-leaf hover:bg-emerald-800 text-white font-semibold text-sm px-4 py-2 rounded-lg transition">
              + Add Product
            </Link>
          </div>
        </div>

        {/* Profile Editor Modal / Inline Card */}
        {editingProfile && (
          <form onSubmit={saveProfile} className="bg-white border rounded-xl p-5 mb-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-gray-800">Edit Farm Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Farm Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.farm_name}
                  onChange={(e) => setProfileForm({ ...profileForm, farm_name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Green Valley Organic Farm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Farm Location (City / District)</label>
                <input
                  type="text"
                  required
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Kolhapur, Maharashtra"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Farmer UPI ID / VPA (For direct customer QR code payments)
                </label>
                <input
                  type="text"
                  value={profileForm.upi_id}
                  onChange={(e) => setProfileForm({ ...profileForm, upi_id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. 9876543210@upi or farm@okhdfcbank"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Customers who select "UPI on Delivery" will scan a dynamic QR code linked directly to this UPI ID.
                </p>
              </div>
            </div>
            {profileMessage && <p className="text-sm text-emerald-700">{profileMessage}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="bg-leaf hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-1.5 rounded"
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium">Total Listings</p>
            <p className="text-2xl font-bold mt-1 text-gray-800">{products.length}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium">Active Online</p>
            <p className="text-2xl font-bold mt-1 text-emerald-700">{activeCount}</p>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium">Total Stock (Units)</p>
            <p className="text-2xl font-bold mt-1 text-soil">{totalStock}</p>
          </div>
        </div>

        {!profile.verified && (
          <p className="bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm rounded-lg p-3 mb-5">
            Your farm account is pending admin verification. Your listings are still visible to buyers while you wait.
          </p>
        )}

        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800">Your Produce Listings</h2>
          <Link href="/orders" className="text-sm text-leaf hover:underline font-semibold">
            View Received Customer Orders →
          </Link>
        </div>

        <div className="space-y-3">
          {products.length === 0 && (
            <div className="text-center py-10 bg-white border border-dashed rounded-xl">
              <p className="text-gray-500 mb-3">You haven't listed any products yet.</p>
              <Link href="/farmer/add-product" className="bg-leaf text-white font-semibold text-sm px-4 py-2 rounded-lg">
                Create First Listing
              </Link>
            </div>
          )}
          {products.map((p) => (
            <div key={p.id} className="border rounded-xl p-4 bg-white flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-4">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-14 h-14 object-cover rounded-lg" />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                    🌾
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">{p.name}</p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {p.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    ₹{p.price} / {p.unit} · <span className={p.quantity_available === 0 ? "text-red-500 font-semibold" : ""}>{p.quantity_available} {p.unit} in stock</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleActive(p.id, p.is_active)}
                  className={`text-xs border px-3 py-1.5 rounded-lg font-medium transition ${
                    p.is_active ? "border-gray-300 text-gray-700 hover:bg-gray-50" : "bg-emerald-50 text-emerald-700 border-emerald-300"
                  }`}
                >
                  {p.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => deleteProduct(p.id)}
                  className="text-xs border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                >
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
