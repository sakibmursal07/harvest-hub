import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabaseClient";

export default function AddProduct() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", category: "Vegetable", price: "", unit: "kg",
    quantity_available: "", description: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("Please log in as a farmer first.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("products").insert({
      farmer_id: userData.user.id,
      name: form.name,
      category: form.category,
      price: Number(form.price),
      unit: form.unit,
      quantity_available: Number(form.quantity_available),
      description: form.description,
      is_active: true,
    });
    setLoading(false);

    if (error) setError(error.message);
    else router.push("/farmer/dashboard");
  };

  return (
    <div>
      <Navbar />
      <main className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-5">Add a Product</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-sm font-medium mb-1">Price (₹)</label>
              <input type="number" step="0.01" name="price" required onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <select name="unit" onChange={handleChange} value={form.unit} className="w-full border rounded px-3 py-2">
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
      </main>
    </div>
  );
}
