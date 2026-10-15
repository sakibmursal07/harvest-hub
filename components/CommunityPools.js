import { useState, useEffect } from "react";
import Link from "next/link";

const DEFAULT_POOLS = [
  {
    id: "pool-1",
    name: "Greenfield Enclave",
    locality: "Sector 21, Nashik Road",
    pincode: "422101",
    currentMembers: 4,
    targetMembers: 5,
    deliveryWindow: "Tomorrow, 8:00 AM - 10:00 AM",
    carbonSavedKg: 3.8,
    farmSource: "Sahyadri Organic Agro",
  },
  {
    id: "pool-2",
    name: "Sunrise Heights Apartments",
    locality: "Kothrud, Pune",
    pincode: "411038",
    currentMembers: 3,
    targetMembers: 5,
    deliveryWindow: "Tomorrow, 9:30 AM - 11:30 AM",
    carbonSavedKg: 4.5,
    farmSource: "Baramati Fresh Produce Farm",
  },
  {
    id: "pool-3",
    name: "Palm Grove Society",
    locality: "Indiranagar, Bengaluru",
    pincode: "560038",
    currentMembers: 5,
    targetMembers: 5,
    deliveryWindow: "Tomorrow, 7:30 AM - 9:00 AM",
    carbonSavedKg: 5.2,
    farmSource: "Mandya Natural Growers",
  },
];

export default function CommunityPools() {
  const [pools, setPools] = useState(DEFAULT_POOLS);
  const [searchPin, setSearchPin] = useState("");
  const [activePoolId, setActivePoolId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    locality: "",
    pincode: "",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("harvest_hub_active_pool");
      if (saved) {
        const parsed = JSON.parse(saved);
        setActivePoolId(parsed.id);
      }
      const customPools = localStorage.getItem("harvest_hub_custom_pools");
      if (customPools) {
        setPools([...JSON.parse(customPools), ...DEFAULT_POOLS]);
      }
    } catch (e) {
      console.warn("Could not load pool preference:", e);
    }
  }, []);

  const handleJoinPool = (pool) => {
    setActivePoolId(pool.id);
    try {
      localStorage.setItem("harvest_hub_active_pool", JSON.stringify(pool));
    } catch (e) {
      console.warn("Could not store active pool:", e);
    }
    // Dispatch event so product pages know immediately
    window.dispatchEvent(new CustomEvent("pool-selected", { detail: pool }));
  };

  const handleLeavePool = () => {
    setActivePoolId(null);
    try {
      localStorage.removeItem("harvest_hub_active_pool");
    } catch (e) {}
    window.dispatchEvent(new Event("pool-cleared"));
  };

  const handleCreatePool = (e) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.pincode.trim()) return;

    const newPool = {
      id: `custom-pool-${Date.now()}`,
      name: createForm.name.trim(),
      locality: createForm.locality.trim() || "Local Neighborhood",
      pincode: createForm.pincode.trim(),
      currentMembers: 1,
      targetMembers: 5,
      deliveryWindow: "Tomorrow, 8:00 AM - 11:00 AM",
      carbonSavedKg: 2.1,
      farmSource: "Verified Local Farm Hub",
    };

    const updated = [newPool, ...pools];
    setPools(updated);
    handleJoinPool(newPool);
    setShowCreateModal(false);
    setCreateForm({ name: "", locality: "", pincode: "" });

    try {
      const existingCustom = JSON.parse(localStorage.getItem("harvest_hub_custom_pools") || "[]");
      localStorage.setItem("harvest_hub_custom_pools", JSON.stringify([newPool, ...existingCustom]));
    } catch (e) {}
  };

  const filteredPools = pools.filter((p) => {
    if (!searchPin.trim()) return true;
    const query = searchPin.trim().toLowerCase();
    return (
      p.pincode.includes(query) ||
      p.name.toLowerCase().includes(query) ||
      p.locality.toLowerCase().includes(query)
    );
  });

  return (
    <section id="community-pools" className="my-10 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-emerald-50 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <span>🏘️</span>
            <span>Neighborhood Pooling Innovation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-soil tracking-tight">
            Community Group-Buying Hub
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 max-w-xl">
            Pool orders with your neighbors in the same apartment or locality. When a pool reaches 5 orders, 
            everyone gets <strong className="text-emerald-700">Free Direct-from-Farm Delivery</strong> + <strong className="text-emerald-700">12% Group Discount</strong>!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl bg-leaf hover:bg-emerald-800 text-white shadow-sm transition flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Start a Pool in My Society</span>
          </button>
        </div>
      </div>

      {/* Active Pool Alert if Joined */}
      {activePoolId && (
        <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                You are currently in an Active Pool:
              </span>
              <h4 className="text-sm font-extrabold text-soil">
                {pools.find((p) => p.id === activePoolId)?.name || "Your Neighborhood Pool"}
              </h4>
              <p className="text-[11px] text-gray-600">
                12% Group Discount and FREE Farm Shipping will automatically apply during checkout!
              </p>
            </div>
          </div>
          <button
            onClick={handleLeavePool}
            className="text-xs text-gray-500 hover:text-red-600 font-semibold underline px-2 py-1"
          >
            Leave Pool
          </button>
        </div>
      )}

      {/* Search by PIN or Colony */}
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search active pools by PIN code, society name, or colony..."
            value={searchPin}
            onChange={(e) => setSearchPin(e.target.value)}
            className="w-full text-xs sm:text-sm bg-[#FAF7F2] border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-leaf"
          />
          <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
        </div>
        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
          Showing {filteredPools.length} nearby pool{filteredPools.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredPools.map((pool) => {
          const isJoined = activePoolId === pool.id;
          const isFull = pool.currentMembers >= pool.targetMembers;
          const progressPercent = Math.min(100, Math.round((pool.currentMembers / pool.targetMembers) * 100));

          return (
            <div
              key={pool.id}
              className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                isJoined
                  ? "border-emerald-600 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/30"
                  : "border-gray-200 bg-white hover:border-emerald-400 hover:shadow-md"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-soil leading-snug">
                      {pool.name}
                    </h3>
                    <p className="text-[11px] text-gray-500">{pool.locality} · PIN {pool.pincode}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    12% OFF
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="my-3">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-soil">
                      {pool.currentMembers}/{pool.targetMembers} Neighbors Joined
                    </span>
                    <span className="text-emerald-700">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        isFull ? "bg-emerald-600" : "bg-leaf"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {isFull
                      ? "✨ Pool full! Maximum discount unlocked for all."
                      : `Only ${pool.targetMembers - pool.currentMembers} more neighbor needed to complete pool!`}
                  </p>
                </div>

                {/* Logistics & Sustainability info */}
                <div className="space-y-1.5 py-2 text-[11px] text-gray-600 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <span>🚚</span>
                    <span>Consolidated Delivery: {pool.deliveryWindow}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>🌱</span>
                    <span className="text-emerald-800 font-semibold">
                      Saves ~{pool.carbonSavedKg} kg CO₂ in transport
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>🚜</span>
                    <span>Farm: {pool.farmSource}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 mt-2 border-t border-gray-100">
                {isJoined ? (
                  <button
                    disabled
                    className="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>✓</span>
                    <span>Joined — Discount Active</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoinPool(pool)}
                    className="w-full py-2 rounded-xl bg-soil hover:bg-[#3d3223] text-white font-semibold text-xs transition flex items-center justify-center gap-1 shadow-xs"
                  >
                    <span>Join Pool (Get 12% OFF)</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Pool Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-soil/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#FAF7F2] rounded-3xl p-6 shadow-2xl border border-gray-200 animate-modal-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏘️</span>
                <h3 className="font-extrabold text-base text-soil">Start a Neighborhood Pool</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePool} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-soil mb-1">
                  Apartment / Society / Colony Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Palms Apartment, Block B"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-leaf text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-soil mb-1">Area / Locality</label>
                <input
                  type="text"
                  placeholder="e.g. Sector 14, Near Metro Station"
                  value={createForm.locality}
                  onChange={(e) => setCreateForm({ ...createForm, locality: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-leaf text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-soil mb-1">Postal PIN Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 411038"
                  value={createForm.pincode}
                  onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-leaf text-xs sm:text-sm"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <span className="font-bold block">💡 How pooling works:</span>
                <p>
                  As soon as you create the pool, your orders unlock free farm delivery and 12% off. 
                  Share this page with your neighbors so they can join and complete the 5-order consolidated batch!
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-leaf hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm shadow-md transition"
                >
                  Create & Join Pool
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 text-xs sm:text-sm hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}
