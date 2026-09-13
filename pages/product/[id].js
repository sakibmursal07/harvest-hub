import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../../components/Navbar";
import { supabase } from "../../lib/supabaseClient";

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (id) loadProduct();
  }, [id]);

  async function loadProduct() {
    const { data, error } = await supabase
      .from("products")
      .select("*, profiles(farm_name, location)")
      .eq("id", id)
      .single();
    if (error) console.error(error);
    else setProduct(data);
  }

  async function placeOrder() {
    setMessage("");
    // Must be logged in to order
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setMessage("Please log in to place an order.");
      return;
    }

    setPlacing(true);
    const { error } = await supabase.from("orders").insert({
      consumer_id: userData.user.id,
      farmer_id: product.farmer_id,
      product_id: product.id,
      quantity: quantity,
      total_price: product.price * quantity,
      status: "pending",
    });
    setPlacing(false);

    if (error) setMessage("Something went wrong: " + error.message);
    else {
      setMessage("Order placed! Check 'My Orders' to track it.");
    }
  }

  if (!product) return (<div><Navbar /><p className="p-6">Loading...</p></div>);

  return (
    <div>
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">
        {product.image_url && (
  <img src={product.image_url} alt={product.name} className="w-full h-64 object-cover rounded-lg mb-4" />
)}
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-gray-500 mb-4">
          Sold by {product.profiles?.farm_name} · {product.profiles?.location}
        </p>
        <p className="text-lg font-semibold text-leaf mb-2">₹{product.price} / {product.unit}</p>
        <p className="text-sm text-gray-500 mb-4">{product.quantity_available} {product.unit} available</p>
        <p className="mb-6">{product.description}</p>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-medium">Quantity ({product.unit}):</label>
          <input
            type="number"
            min="1"
            max={product.quantity_available}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="border rounded px-3 py-1.5 w-24"
          />
        </div>

        <p className="font-semibold mb-4">Total: ₹{(product.price * quantity).toFixed(2)}</p>

        <button
          onClick={placeOrder}
          disabled={placing}
          className="bg-leaf text-white font-semibold px-6 py-2.5 rounded"
        >
          {placing ? "Placing order..." : "Place Order"}
        </button>

        {message && <p className="mt-4 text-sm">{message}</p>}
      </main>
    </div>
  );
}
