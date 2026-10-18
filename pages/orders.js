import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import UpiPaymentModal from "../components/UpiPaymentModal";
import ReviewModal from "../components/ReviewModal";
import OrderInvoiceModal from "../components/OrderInvoiceModal";
import { supabase } from "../lib/supabaseClient";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState("purchases"); // 'purchases' or 'sales'

  // Modals state
  const [upiModal, setUpiModal] = useState({ isOpen: false, order: null });
  const [reviewModal, setReviewModal] = useState({ isOpen: false, order: null });
  const [invoiceModal, setInvoiceModal] = useState({ isOpen: false, order: null });
  const [reviewedOrders, setReviewedOrders] = useState({});

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
    const currentUserId = userData.user.id;
    setUserId(currentUserId);

    // Get user's role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single();
    setUserRole(profile?.role || "consumer");

    // Fetch existing reviews submitted by this user
    try {
      const { data: userRevs } = await supabase
        .from("reviews")
        .select("order_id, rating")
        .eq("consumer_id", currentUserId);

      if (userRevs) {
        const revMap = {};
        userRevs.forEach((r) => {
          if (r.order_id) revMap[r.order_id] = r.rating;
        });
        setReviewedOrders(revMap);
      }
    } catch (e) {
      console.warn("Reviews table check:", e);
    }

    // Fetch orders with farmer (including upi_id) and consumer profiles
    const { data, error } = await supabase
      .from("orders")
      .select("*, products(name, unit, price, image_url), farmer:profiles!orders_farmer_id_fkey(farm_name, location, upi_id), consumer:profiles!orders_consumer_id_fkey(full_name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Orders fetch error:", error);
    } else {
      setOrders(data || []);
      const salesCount = (data || []).filter((o) => o.farmer_id === currentUserId).length;
      const purchaseCount = (data || []).filter((o) => o.consumer_id === currentUserId).length;
      if (salesCount > 0 && purchaseCount === 0) {
        setActiveTab("sales");
      }
    }
    setLoading(false);
  }

  const handleReviewSubmitted = (orderId, rating) => {
    setReviewedOrders((prev) => ({ ...prev, [orderId]: rating }));
  };

  async function updateStatus(orderId, status) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (!error) loadOrders();
    else alert("Failed to update status: " + error.message);
  }

  const myPurchases = orders.filter((o) => o.consumer_id === userId);
  const receivedOrders = orders.filter((o) => o.farmer_id === userId);

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-transparent dark:border-amber-800/40">⏳ Pending Confirmation</span>;
      case "confirmed":
        return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-transparent dark:border-blue-800/40">🚚 Out for Delivery</span>;
      case "delivered":
        return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-800/40">✓ Delivered</span>;
      case "cancelled":
        return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-transparent dark:border-red-800/40">✕ Cancelled</span>;
      default:
        return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-stone-800 text-gray-700 dark:text-stone-300">{status}</span>;
    }
  };

  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-stone-100">Order Management</h1>
            <p className="text-sm text-gray-500 dark:text-stone-400 mt-1">Track your fresh produce purchases and farm deliveries.</p>
          </div>

          {/* Dual Tabs */}
          {(userRole === "farmer" || userRole === "admin" || receivedOrders.length > 0) && (
            <div className="flex bg-gray-100 dark:bg-[#1e1913] p-1 rounded-xl border border-transparent dark:border-stone-800">
              <button
                onClick={() => setActiveTab("purchases")}
                className={`text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition ${
                  activeTab === "purchases"
                    ? "bg-white dark:bg-stone-800 text-gray-900 dark:text-stone-100 shadow-sm"
                    : "text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-100"
                }`}
              >
                My Purchases ({myPurchases.length})
              </button>
              <button
                onClick={() => setActiveTab("sales")}
                className={`text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition ${
                  activeTab === "sales"
                    ? "bg-white dark:bg-stone-800 text-gray-900 dark:text-stone-100 shadow-sm"
                    : "text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-100"
                }`}
              >
                Farm Deliveries ({receivedOrders.length})
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-gray-200 dark:bg-stone-800 rounded-xl" />
            <div className="h-24 bg-gray-200 dark:bg-stone-800 rounded-xl" />
          </div>
        )}

        {!loading && !userId && (
          <div className="text-center py-16 bg-white dark:bg-[#1c1712] border border-gray-200 dark:border-stone-800 rounded-2xl p-6">
            <p className="text-gray-600 dark:text-stone-300 mb-4">Please log in to see your orders and delivery history.</p>
            <Link href="/login" className="bg-leaf text-white font-semibold px-6 py-2.5 rounded-xl">
              Log in to Harvest Hub
            </Link>
          </div>
        )}

        {/* Tab 1: My Purchases */}
        {!loading && userId && activeTab === "purchases" && (
          <div className="space-y-4">
            {myPurchases.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#1c1712] border border-dashed border-gray-200 dark:border-stone-800 rounded-2xl p-6">
                <div className="text-4xl mb-3">🛒</div>
                <h3 className="font-bold text-gray-800 dark:text-stone-200 text-lg mb-1">No orders placed yet</h3>
                <p className="text-sm text-gray-500 dark:text-stone-400 mb-5">Browse today's harvest to get fresh produce directly from local farmers.</p>
                <Link href="/" className="bg-leaf hover:bg-emerald-800 text-white font-semibold px-5 py-2.5 rounded-xl transition">
                  Browse Fresh Produce
                </Link>
              </div>
            ) : (
              myPurchases.map((o) => (
                <div key={o.id} className="border border-gray-200 dark:border-stone-800 rounded-2xl p-5 bg-white dark:bg-[#1c1712] shadow-sm hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-gray-100 dark:border-stone-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 dark:text-stone-500 font-mono">Order #{o.id.slice(0, 8)}</span>
                        <span className="text-xs text-gray-400 dark:text-stone-500">·</span>
                        <span className="text-xs text-gray-500 dark:text-stone-400">
                          {new Date(o.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-stone-100 mt-1">{o.products?.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-stone-400">
                        From <strong className="text-gray-900 dark:text-stone-200">{o.farmer?.farm_name || "Local Farmer"}</strong> {o.farmer?.location ? `· 📍 ${o.farmer?.location}` : ""}
                      </p>
                    </div>
                    <div>{getStatusBadge(o.status)}</div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-t border-gray-50 dark:border-stone-800/80 mt-2">
                    <div className="space-y-1 text-sm text-gray-600 dark:text-stone-300">
                      <p>
                        Quantity: <strong className="text-gray-900 dark:text-stone-200">{o.quantity} {o.products?.unit}</strong>
                      </p>
                      <p>
                        Total Amount: <strong className="text-leaf text-base">₹{o.total_price}</strong>
                        <span className="text-xs text-gray-400 dark:text-stone-500 ml-2">
                          ({o.payment_method === "upi" ? "UPI on Delivery" : "Cash on Delivery"})
                        </span>
                      </p>
                      {o.delivery_address && (
                        <p className="text-xs text-gray-500 dark:text-stone-400 pt-1">
                          📍 Delivery to: {o.delivery_address}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setInvoiceModal({ isOpen: true, order: o })}
                        className="text-xs bg-gray-100 dark:bg-[#251e17] hover:bg-gray-200 dark:hover:bg-stone-800 text-gray-800 dark:text-stone-200 font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-2xs border border-gray-200 dark:border-stone-700"
                        title="View & Download Tax Invoice / Delivery Receipt"
                      >
                        <span>📄</span>
                        <span>Invoice / Bill</span>
                      </button>

                      {o.payment_method === "upi" && o.status !== "cancelled" && (
                        <button
                          onClick={() => setUpiModal({ isOpen: true, order: o })}
                          className="text-xs bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-2xs"
                        >
                          <span>💳</span>
                          <span>Pay / View UPI QR</span>
                        </button>
                      )}

                      {o.status === "delivered" && (
                        reviewedOrders[o.id] ? (
                          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <span>★</span>
                            <span>Rated {reviewedOrders[o.id]}/5</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => setReviewModal({ isOpen: true, order: o })}
                            className="text-xs bg-amber-400 hover:bg-amber-500 text-soil font-bold px-3 py-1.5 rounded-lg transition shadow-xs flex items-center gap-1"
                          >
                            <span>⭐</span>
                            <span>Rate Produce</span>
                          </button>
                        )
                      )}

                      <Link
                        href={`/product/${o.product_id}`}
                        className="text-xs text-leaf font-semibold hover:underline px-2 py-1"
                      >
                        View Product →
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Orders Received by Farmer */}
        {!loading && userId && activeTab === "sales" && (
          <div className="space-y-4">
            {receivedOrders.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#1c1712] border border-dashed border-gray-200 dark:border-stone-800 rounded-2xl p-6">
                <div className="text-4xl mb-3">🌾</div>
                <h3 className="font-bold text-gray-800 dark:text-stone-200 text-lg mb-1">No customer orders received yet</h3>
                <p className="text-sm text-gray-500 dark:text-stone-400 mb-5">When buyers order your listed produce, delivery requests will appear here.</p>
                <Link href="/farmer/dashboard" className="bg-leaf hover:bg-emerald-800 text-white font-semibold px-5 py-2.5 rounded-xl transition">
                  Manage Produce Listings
                </Link>
              </div>
            ) : (
              receivedOrders.map((o) => (
                <div key={o.id} className="border-2 border-emerald-100 dark:border-emerald-900/60 rounded-2xl p-5 bg-white dark:bg-[#1c1712] shadow-sm hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-gray-100 dark:border-stone-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded border border-transparent dark:border-emerald-800/40">
                          Incoming Customer Order
                        </span>
                        <span className="text-xs text-gray-400 dark:text-stone-500 font-mono">#{o.id.slice(0, 8)}</span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-stone-100 mt-1">
                        {o.quantity} {o.products?.unit} of {o.products?.name}
                      </h3>
                      <p className="text-sm font-semibold text-leaf mt-0.5">
                        Amount to Collect: ₹{o.total_price}
                        <span className="text-xs font-normal text-gray-500 dark:text-stone-400 ml-2">
                          [{o.payment_method === "upi" ? "UPI on Delivery" : "Cash on Delivery"}]
                        </span>
                      </p>
                    </div>
                    <div>{getStatusBadge(o.status)}</div>
                  </div>

                  {/* Customer Delivery Information */}
                  <div className="py-4 bg-gray-50 dark:bg-[#251e17] -mx-5 px-5 my-2 border-y border-gray-100 dark:border-stone-800 text-sm">
                    <p className="font-bold text-gray-800 dark:text-stone-200 text-xs uppercase tracking-wider mb-2">
                      Customer Delivery Details
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-stone-400 block">Customer Name:</span>
                        <span className="font-semibold text-gray-900 dark:text-stone-100">
                          {o.consumer?.full_name || "Harvest Hub Buyer"}
                        </span>
                      </div>
                      {o.phone && (
                        <div>
                          <span className="text-xs text-gray-500 dark:text-stone-400 block">Phone Contact:</span>
                          <a
                            href={`tel:${o.phone}`}
                            className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            📞 {o.phone} (Call Customer)
                          </a>
                        </div>
                      )}
                    </div>
                    {o.delivery_address && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-stone-700">
                        <span className="text-xs text-gray-500 dark:text-stone-400 block">Delivery Address:</span>
                        <p className="text-gray-800 dark:text-stone-200 font-medium">{o.delivery_address}</p>
                      </div>
                    )}
                  </div>

                  {/* Farmer Action Buttons & Print Challan */}
                  <div className="flex flex-wrap gap-2 pt-3 justify-end items-center">
                    <button
                      onClick={() => setInvoiceModal({ isOpen: true, order: o })}
                      className="text-xs bg-gray-100 dark:bg-[#251e17] hover:bg-gray-200 dark:hover:bg-stone-800 text-gray-800 dark:text-stone-200 font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-2xs border border-gray-200 dark:border-stone-700 mr-auto"
                      title="Print Farmer Delivery Challan / Invoice"
                    >
                      <span>📄</span>
                      <span>Challan / Bill</span>
                    </button>

                    {o.status !== "delivered" && o.status !== "cancelled" && (
                      <>
                        <span className="text-xs text-gray-500 dark:text-stone-400">Update Status:</span>
                        {o.status === "pending" && (
                          <button
                            onClick={() => updateStatus(o.id, "confirmed")}
                            className="text-xs bg-leaf hover:bg-emerald-800 text-white font-semibold px-4 py-2 rounded-lg transition"
                          >
                            ✓ Accept & Confirm Delivery
                          </button>
                        )}
                        {o.status === "confirmed" && (
                          <button
                            onClick={() => updateStatus(o.id, "delivered")}
                            className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-4 py-2 rounded-lg transition"
                          >
                            ✓ Mark as Delivered & Paid
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to cancel this order?")) {
                              updateStatus(o.id, "cancelled");
                            }
                          }}
                          className="text-xs border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium px-3.5 py-2 rounded-lg transition"
                        >
                          Cancel Order
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* UPI Payment Modal */}
        <UpiPaymentModal
          isOpen={upiModal.isOpen}
          onClose={() => setUpiModal({ isOpen: false, order: null })}
          amount={upiModal.order?.total_price}
          orderId={upiModal.order?.id}
          farmerName={upiModal.order?.farmer?.farm_name}
          farmerUpiId={upiModal.order?.farmer?.upi_id}
          productName={upiModal.order?.products?.name}
        />

        {/* Review Submission Modal */}
        <ReviewModal
          isOpen={reviewModal.isOpen}
          onClose={() => setReviewModal({ isOpen: false, order: null })}
          order={reviewModal.order}
          onSubmitted={handleReviewSubmitted}
        />

        {/* Farm-to-Table Tax Invoice & Delivery Challan Modal */}
        <OrderInvoiceModal
          isOpen={invoiceModal.isOpen}
          onClose={() => setInvoiceModal({ isOpen: false, order: null })}
          order={invoiceModal.order}
        />
      </main>
    </div>
  );
}
