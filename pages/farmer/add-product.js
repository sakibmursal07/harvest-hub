import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabaseClient";
import AiPriceEstimatorModal from "../../components/AiPriceEstimatorModal";

export default function AddProduct() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", category: "Vegetable", price: "", unit: "kg",
    quantity_available: "", description: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleApplyPrice = (recPrice, assessment) => {
    setForm((prev) => ({
      ...prev,
      price: recPrice,
      unit: assessment.unit || prev.unit,
      description: prev.description
        ? `${prev.description}\n\n[Assessed Grade: ${assessment.qualityGrade} · Shelf Life: ${assessment.shelfLifeDays}]`
        : `Farm fresh harvest. Assessed Grade: ${assessment.qualityGrade}. Expected Shelf Life: ${assessment.shelfLifeDays}.`,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("Please log in as a farmer first.");
      return;
    }

    setLoading(true);
    let imageUrl = null;

    // Only attempt an upload if the farmer actually picked a photo.
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const filePath = `${userData.user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, imageFile);

      if (uploadError) {
        setError("Image upload failed: " + uploadError.message);
        setLoading(false);
        return;
      }

      // Turn the uploaded file's path into a public URL we can store and display.
      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    const { error: insertError } = await supabase.from("products").insert({
      farmer_id: userData.user.id,
      name: form.name,
      category: form.category,
      price: Number(form.price),
      unit: form.unit,
      quantity_available: Number(form.quantity_available),
      description: form.description,
      image_url: imageUrl,
      is_active: true,
    });
    setLoading(false);

    if (insertError) setError(insertError.message);
    else router.push("/farmer/dashboard");
  };

  return (
    <div>
      <Navbar />
      <main className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-5 text-gray-900 dark:text-stone-100">Add a Product</h1>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-[#1e1913] p-6 rounded-2xl border border-gray-200 dark:border-stone-800 shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-stone-300">Product photo</label>
            {preview && (
              <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-xl mb-2 border border-gray-200 dark:border-stone-700" />
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-gray-700 dark:text-stone-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 dark:file:bg-emerald-950/60 file:text-emerald-800 dark:file:text-emerald-300 hover:file:bg-emerald-200" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-stone-300">Product name</label>
            <input name="name" required onChange={handleChange} className="w-full border border-gray-300 dark:border-stone-700 bg-white dark:bg-[#282118] text-gray-900 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-leaf" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-stone-300">Category</label>
            <select name="category" onChange={handleChange} value={form.category} className="w-full border border-gray-300 dark:border-stone-700 bg-white dark:bg-[#282118] text-gray-900 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-leaf">
              <option>Vegetable</option>
              <option>Fruit</option>
              <option>Dairy</option>
              <option>Grain</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-stone-300">Price (₹)</label>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("open-ai-price-advisor", {
                        detail: { cropName: form.name || "Tomato", category: form.category },
                      })
                    );
                  }}
                  className="text-[11px] text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 border border-transparent dark:border-emerald-800/40 px-2 py-0.5 rounded-md font-bold transition flex items-center gap-1 shadow-xs"
                  title="Calculate fair market benchmark price with AI"
                >
                  <span>✨</span>
                  <span>AI Advisor</span>
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                name="price"
                value={form.price}
                required
                onChange={handleChange}
                placeholder="₹ Amount"
                className="w-full border border-gray-300 dark:border-stone-700 bg-white dark:bg-[#282118] text-gray-900 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-leaf"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-stone-300">Unit</label>
              <select name="unit" onChange={handleChange} value={form.unit} className="w-full border border-gray-300 dark:border-stone-700 bg-white dark:bg-[#282118] text-gray-900 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-leaf">
                <option value="kg">kg</option>
                <option value="dozen">dozen</option>
                <option value="bunch">bunch</option>
                <option value="box">box</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-stone-300">Quantity available</label>
            <input type="number" name="quantity_available" required onChange={handleChange} className="w-full border border-gray-300 dark:border-stone-700 bg-white dark:bg-[#282118] text-gray-900 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-leaf" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-stone-300">Description</label>
            <textarea name="description" rows={3} onChange={handleChange} className="w-full border border-gray-300 dark:border-stone-700 bg-white dark:bg-[#282118] text-gray-900 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-leaf" />
          </div>
          {error && <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl border border-red-200 dark:border-red-900/50">{error}</p>}
          <button disabled={loading} className="w-full bg-leaf hover:bg-emerald-800 transition text-white font-semibold py-2.5 rounded-xl text-sm shadow-sm">
            {loading ? "Saving..." : "List Product"}
          </button>
        </form>
        <AiPriceEstimatorModal onApplyPrice={handleApplyPrice} />
      </main>
    </div>
  );
}