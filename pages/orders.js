import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabaseClient";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      return;
    }
    setUserId(userData.user.id);

    // RLS (set up in schema.sql) makes sure this only returns orders
    // where you're either the consumer or the farmer involved.
    const { data, error } = await supabase
      .from("orders")
      .select("*, products(name, unit), profiles!orders_farmer_id_fkey(farm_name)")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setOrders(data);
    setLoading(false);
  }

  async function updateStatus(orderId, status) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (!error) loadOrders();
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-5">My Orders</h1>
        {loading && <p>Loading...</p>}
        {!loading && !userId && <p>Please log in to see your orders.</p>}
        {!loading && userId && orders.length === 0 && <p>No orders yet.</p>}

        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{o.products?.name}</p>
                  <p className="text-sm text-gray-500">
                    {o.quantity} {o.products?.unit} · From {o.profiles?.farm_name}
                  </p>
                  <p className="text-sm text-gray-500">₹{o.total_price}</p>
                </div>
                <span className="text-xs font-semibold uppercase bg-gray-100 px-2.5 py-1 rounded-full">
                  {o.status}
                </span>
              </div>

              {/* Only the farmer who owns this order sees status controls */}
              {o.farmer_id === userId && o.status !== "delivered" && o.status !== "cancelled" && (
                <div className="flex gap-2 mt-3">
                  {o.status === "pending" && (
                    <button onClick={() => updateStatus(o.id, "confirmed")} className="text-xs bg-leaf text-white px-3 py-1.5 rounded">
                      Confirm order
                    </button>
                  )}
                  {o.status === "confirmed" && (
                    <button onClick={() => updateStatus(o.id, "delivered")} className="text-xs bg-leaf text-white px-3 py-1.5 rounded">
                      Mark delivered
                    </button>
                  )}
                  <button onClick={() => updateStatus(o.id, "cancelled")} className="text-xs border px-3 py-1.5 rounded">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
