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
        <h1 className="text-2xl font-bold mb-5">Add a Product</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product photo</label>
            {preview && (
              <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded mb-2 border" />
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Product name</label>
            <input name="name" required onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select name="category" onChange={handleChange} value={form.category} className="w-full border rounded px-3 py-2">
              <option>Vegetable</option>
              <option>Fruit</option>
              <option>Dairy</option>
              <option>Grain</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">Price (₹)</label>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("open-ai-price-advisor", {
                        detail: { cropName: form.name || "Tomato", category: form.category },
                      })
                    );
                  }}
                  className="text-[11px] text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-md font-bold transition flex items-center gap-1 shadow-xs"
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
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <select name="unit" onChange={handleChange} value={form.unit} className="w-full border rounded px-3 py-2 text-sm">
                <option value="kg">kg</option>
                <option value="dozen">dozen</option>
                <option value="bunch">bunch</option>
                <option value="box">box</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity available</label>
            <input type="number" name="quantity_available" required onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" rows={3} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button disabled={loading} className="w-full bg-leaf text-white font-semibold py-2.5 rounded">
            {loading ? "Saving..." : "List Product"}
          </button>
        </form>
        <AiPriceEstimatorModal onApplyPrice={handleApplyPrice} />
      </main>
    </div>
  );
}