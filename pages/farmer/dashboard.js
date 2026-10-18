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
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-stone-100">
              🌾 {profile.farm_name || "Farmer"} Dashboard
              {profile.verified ? (
                <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-transparent dark:border-emerald-800/40">
                  ✓ Verified Farm
                </span>
              ) : (
                <span className="text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-transparent dark:border-amber-800/40">
                  Pending Verification
                </span>
              )}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-stone-400 mt-1">
              <span>📍 {profile.location || "Location not set yet"} · {profile.full_name}</span>
              {profile.upi_id && (
                <span className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md font-medium">
                  💳 UPI: {profile.upi_id}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingProfile(!editingProfile)}
              className="border border-gray-300 dark:border-stone-700 hover:bg-gray-50 dark:hover:bg-stone-800 text-gray-700 dark:text-stone-300 text-sm font-medium px-3.5 py-2 rounded-xl transition"
            >
              {editingProfile ? "Cancel" : "Edit Farm Info"}
            </button>
            <Link href="/farmer/add-product" className="bg-leaf hover:bg-emerald-800 text-white font-semibold text-sm px-4 py-2 rounded-xl transition shadow-sm">
              + Add Product
            </Link>
          </div>
        </div>

        {/* Profile Editor Modal / Inline Card */}
        {editingProfile && (
          <form onSubmit={saveProfile} className="bg-white dark:bg-[#1e1913] border border-gray-200 dark:border-stone-800 rounded-2xl p-5 mb-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-gray-800 dark:text-stone-100">Edit Farm Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-stone-300 mb-1">Farm Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.farm_name}
                  onChange={(e) => setProfileForm({ ...profileForm, farm_name: e.target.value })}
                  className="w-full border border-gray-300 dark:border-stone-700 bg-white dark:bg-[#282118] text-gray-900 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-leaf"
                  placeholder="e.g. Green Valley Organic Farm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-stone-300 mb-1">Farm Location (City / District)</label>
                <input
                  type="text"
                  required
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  className="w-full border border-gray-300 dark:border-stone-700 bg-white dark:bg-[#282118] text-gray-900 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-leaf"
                  placeholder="e.g. Kolhapur, Maharashtra"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-stone-300 mb-1">
                  Farmer UPI ID / VPA (For direct customer QR code payments)
                </label>
                <input
                  type="text"
                  value={profileForm.upi_id}
                  onChange={(e) => setProfileForm({ ...profileForm, upi_id: e.target.value })}
                  className="w-full border border-gray-300 dark:border-stone-700 bg-white dark:bg-[#282118] text-gray-900 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-leaf"
                  placeholder="e.g. 9876543210@upi or farm@okhdfcbank"
                />
                <p className="text-[11px] text-gray-400 dark:text-stone-500 mt-1">
                  Customers who select "UPI on Delivery" will scan a dynamic QR code linked directly to this UPI ID.
                </p>
              </div>
            </div>
            {profileMessage && <p className="text-sm text-emerald-700 dark:text-emerald-400">{profileMessage}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                className="px-3 py-1.5 text-xs text-gray-600 dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-stone-800 rounded-xl"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="bg-leaf hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-1.5 rounded-xl shadow-xs"
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1e1913] border border-gray-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-stone-400 font-medium">Total Listings</p>
            <p className="text-2xl font-bold mt-1 text-gray-800 dark:text-stone-100">{products.length}</p>
          </div>
          <div className="bg-white dark:bg-[#1e1913] border border-gray-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-stone-400 font-medium">Active Online</p>
            <p className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">{activeCount}</p>
          </div>
          <div className="bg-white dark:bg-[#1e1913] border border-gray-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-stone-400 font-medium">Total Stock (Units)</p>
            <p className="text-2xl font-bold mt-1 text-soil dark:text-amber-400">{totalStock}</p>
          </div>
        </div>

        {!profile.verified && (
          <p className="bg-yellow-50 dark:bg-amber-950/40 border border-yellow-300 dark:border-amber-800 text-yellow-800 dark:text-amber-200 text-sm rounded-xl p-3 mb-5">
            Your farm account is pending admin verification. Your listings are still visible to buyers while you wait.
          </p>
        )}

        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800 dark:text-stone-100">Your Produce Listings</h2>
          <Link href="/orders" className="text-sm text-leaf hover:underline font-semibold">
            View Received Customer Orders →
          </Link>
        </div>

        <div className="space-y-3">
          {products.length === 0 && (
            <div className="text-center py-10 bg-white dark:bg-[#1e1913] border border-dashed border-gray-200 dark:border-stone-800 rounded-2xl">
              <p className="text-gray-500 dark:text-stone-400 mb-3">You haven't listed any products yet.</p>
              <Link href="/farmer/add-product" className="bg-leaf text-white font-semibold text-sm px-4 py-2 rounded-xl">
                Create First Listing
              </Link>
            </div>
          )}
          {products.map((p) => (
            <div key={p.id} className="border border-gray-200 dark:border-stone-800 rounded-2xl p-4 bg-white dark:bg-[#1e1913] flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-4">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-14 h-14 object-cover rounded-xl" />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 dark:bg-stone-800 rounded-xl flex items-center justify-center text-2xl">
                    🌾
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 dark:text-stone-100">{p.name}</p>
                    <span className="text-xs bg-gray-100 dark:bg-stone-800 text-gray-600 dark:text-stone-300 px-2 py-0.5 rounded-md">
                      {p.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-stone-400 mt-0.5">
                    ₹{p.price} / {p.unit} · <span className={p.quantity_available === 0 ? "text-red-500 font-semibold" : ""}>{p.quantity_available} {p.unit} in stock</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleActive(p.id, p.is_active)}
                  className={`text-xs border px-3 py-1.5 rounded-xl font-medium transition ${
                    p.is_active ? "border-gray-300 dark:border-stone-700 text-gray-700 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-800" : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                  }`}
                >
                  {p.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => deleteProduct(p.id)}
                  className="text-xs border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-1.5 rounded-xl transition"
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
