import { useState, useEffect } from "react";

const QUICK_CROPS = [
  { name: "Tomato", category: "Vegetable" },
  { name: "Potato", category: "Vegetable" },
  { name: "Basmati Rice", category: "Grain" },
  { name: "Alphonso Mango", category: "Fruit" },
  { name: "Onion", category: "Vegetable" },
  { name: "Green Capsicum", category: "Vegetable" },
];

export default function AiPriceEstimatorModal({ onApplyPrice, initialCrop = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    cropName: initialCrop || "Tomato",
    category: "Vegetable",
    region: "Maharashtra",
    grade: "Grade A+ (Premium / Organic)",
    unit: "kg",
  });
  const [result, setResult] = useState(null);

  useEffect(() => {
    const handleOpen = (e) => {
      if (e?.detail?.cropName) {
        setForm((prev) => ({
          ...prev,
          cropName: e.detail.cropName,
          category: e.detail.category || prev.category,
        }));
      }
      setIsOpen(true);
    };
    window.addEventListener("open-ai-price-advisor", handleOpen);
    return () => window.removeEventListener("open-ai-price-advisor", handleOpen);
  }, []);

  const handleEstimate = async (e) => {
    if (e) e.preventDefault();
    if (!form.cropName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ai-price-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Estimate error:", err);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-soil/75 backdrop-blur-md animate-backdrop-in"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div className="relative w-full max-w-2xl bg-[#FAF7F2] rounded-3xl shadow-2xl border border-soil/20 overflow-hidden animate-modal-in max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-soil via-[#3a2d1d] to-soil text-white px-6 py-5 flex items-center justify-between border-b border-soil/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-leaf/40 border border-emerald-400/40 flex items-center justify-center text-xl shadow-inner animate-pulse-subtle">
              ✨
            </div>
            <div>
              <h3 className="font-extrabold text-lg tracking-tight">AI Fair-Price & Quality Estimator</h3>
              <p className="text-emerald-300 text-xs font-medium">
                Eliminating broker markups with real-time agricultural intelligence
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Quick Crop Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Select or type a crop:
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_CROPS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, cropName: c.name, category: c.category });
                    setResult(null);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition ${
                    form.cropName === c.name
                      ? "bg-leaf text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleEstimate} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <div>
              <label className="block text-xs font-semibold text-soil mb-1">Crop Name</label>
              <input
                type="text"
                required
                value={form.cropName}
                onChange={(e) => setForm({ ...form, cropName: e.target.value })}
                placeholder="e.g. Tomato, Wheat, Mango"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leaf bg-[#FAF7F2]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-soil mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leaf bg-[#FAF7F2]/50"
              >
                <option>Vegetable</option>
                <option>Fruit</option>
                <option>Grain</option>
                <option>Dairy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-soil mb-1">Region / Mandi Zone</label>
              <select
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leaf bg-[#FAF7F2]/50"
              >
                <option>Maharashtra (Nashik/Pune)</option>
                <option>Punjab & Haryana</option>
                <option>Karnataka (Bangalore Rural)</option>
                <option>Uttar Pradesh</option>
                <option>Gujarat</option>
                <option>All India Average</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-soil mb-1">Produce Grade</label>
              <select
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-leaf bg-[#FAF7F2]/50"
              >
                <option>Grade A+ (Premium / Organic)</option>
                <option>Grade A (Fresh Commercial)</option>
                <option>Grade B (Standard Market)</option>
              </select>
            </div>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-leaf hover:bg-emerald-800 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Analyzing Agricultural Economics & Quality...</span>
                  </>
                ) : (
                  <>
                    <span>✨ Calculate Fair Price & Quality Benchmarks</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* AI Assessment Results */}
          {result && (
            <div className="space-y-5 animate-modal-in">
              
              {/* 3-Way Economic Benchmark Comparison */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-soil">
                      Price Transparency Breakdown for {result.crop}
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Comparing Mandi Broker rate vs Harvest Hub Direct-to-Consumer
                    </p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
                    Per {result.unit || "kg"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Mandi Broker */}
                  <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/50 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-red-600 block">
                        Mandi Wholesale
                      </span>
                      <p className="text-[11px] text-gray-500">Middleman pay to farmer</p>
                    </div>
                    <div className="mt-2">
                      <span className="text-xl font-extrabold text-red-700">₹{result.mandiPrice}</span>
                      <span className="text-[10px] text-red-600 block font-medium">⚠️ Heavy broker cut</span>
                    </div>
                  </div>

                  {/* Harvest Hub Recommended */}
                  <div className="p-3.5 rounded-xl border-2 border-emerald-600 bg-emerald-50/70 shadow-sm flex flex-col justify-between relative">
                    <span className="absolute -top-2.5 right-3 bg-emerald-700 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-xs">
                      Fair Trade Match
                    </span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                        Harvest Hub Direct
                      </span>
                      <p className="text-[11px] text-gray-600">Optimal fair price</p>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-black text-emerald-900">₹{result.recommendedDirectPrice}</span>
                      <span className="text-[10px] text-emerald-700 block font-bold">
                        {result.farmerEarningsIncrease}
                      </span>
                    </div>
                  </div>

                  {/* Supermarket Retail */}
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-700 block">
                        Retail / Quick Commerce
                      </span>
                      <p className="text-[11px] text-gray-500">Consumer pays in city</p>
                    </div>
                    <div className="mt-2">
                      <span className="text-xl font-extrabold text-amber-800">₹{result.supermarketPrice}</span>
                      <span className="text-[10px] text-emerald-700 block font-semibold">
                        {result.consumerSavings}
                      </span>
                    </div>
                  </div>

                </div>

                {onApplyPrice && (
                  <button
                    onClick={() => {
                      onApplyPrice(result.recommendedDirectPrice, result);
                      setIsOpen(false);
                    }}
                    className="w-full py-2 rounded-xl bg-gold hover:bg-amber-500 text-soil font-bold text-xs shadow-sm transition"
                  >
                    ✓ Auto-Fill Recommended Price (₹{result.recommendedDirectPrice}/{result.unit})
                  </button>
                )}
              </div>

              {/* Quality & Shelf-Life Assessment */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌱</span>
                  <h4 className="font-extrabold text-sm text-soil">
                    Quality Inspection & Freshness Criteria
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-gray-200">
                    <span className="font-bold text-soil block mb-1">⏱️ Expected Shelf Life</span>
                    <p className="text-gray-700">{result.shelfLifeDays}</p>
                  </div>

                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-gray-200">
                    <span className="font-bold text-soil block mb-1">🏷️ Assessed Quality Grade</span>
                    <p className="text-emerald-800 font-semibold">{result.qualityGrade}</p>
                  </div>
                </div>

                {result.qualityIndicators && (
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <span className="text-xs font-bold text-emerald-950 block mb-1.5">
                      Visual & Freshness Checklist:
                    </span>
                    <ul className="space-y-1 text-xs text-gray-700">
                      {result.qualityIndicators.map((ind, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{ind}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.marketInsight && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-950">
                    <span className="font-bold block mb-0.5">📊 Market Dynamics:</span>
                    <p>{result.marketInsight}</p>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-[#FAF7F2] px-6 py-3.5 border-t border-gray-200 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="px-5 py-2 rounded-xl bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
