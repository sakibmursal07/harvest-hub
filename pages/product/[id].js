import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import UpiPaymentModal from "../../components/UpiPaymentModal";
import { supabase } from "../../lib/supabaseClient";

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // UPI payment and reviews state
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [deliveryForm, setDeliveryForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    notes: "",
    paymentMethod: "cod",
  });

  useEffect(() => {
    if (id) {
      loadProduct();
      loadReviews(id);
    }
  }, [id]);

  async function loadProduct() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*, profiles(farm_name, location, verified, upi_id)")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading product:", error);
    } else {
      setProduct(data);
      if (data && data.quantity_available > 0) {
        setQuantity(1);
      }
    }
    setLoading(false);
  }

  async function loadReviews(productId) {
    setReviewsLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, consumer:profiles!reviews_consumer_id_fkey(full_name)")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error && error.code !== "42P01") {
        console.warn("Reviews load notice:", error.message);
      } else if (data) {
        setReviews(data);
      }
    } catch (e) {
      console.warn("Reviews load catch:", e);
    }
    setReviewsLoading(false);
  }

  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return null;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push(`/login?redirect=/product/${id}`);
      return;
    }

    if (!deliveryForm.phone.trim() || deliveryForm.phone.trim().length < 10) {
      setErrorMessage("Please enter a valid 10-digit phone number for delivery updates.");
      return;
    }

    if (!deliveryForm.address.trim()) {
      setErrorMessage("Please provide a complete delivery address.");
      return;
    }

    if (quantity > product.quantity_available) {
      setErrorMessage(`Only ${product.quantity_available} ${product.unit} available in stock.`);
      return;
    }

    setPlacing(true);

    const orderPayload = {
      consumer_id: userData.user.id,
      farmer_id: product.farmer_id,
      product_id: product.id,
      quantity: quantity,
      total_price: Number((product.price * quantity).toFixed(2)),
      status: "pending",
      delivery_address: `${deliveryForm.address}${deliveryForm.notes ? ` (Note: ${deliveryForm.notes})` : ""}`,
      phone: deliveryForm.phone,
      delivery_notes: deliveryForm.notes || null,
      payment_method: deliveryForm.paymentMethod,
    };

    let insertedOrder = null;
    let { data: insData, error } = await supabase.from("orders").insert(orderPayload).select().single();

    if (!error) {
      insertedOrder = insData;
    } else if (error.code === "42703") {
      // Fallback if delivery columns aren't in orders table yet
      const basicPayload = {
        consumer_id: userData.user.id,
        farmer_id: product.farmer_id,
        product_id: product.id,
        quantity: quantity,
        total_price: Number((product.price * quantity).toFixed(2)),
        status: "pending",
      };
      const fallback = await supabase.from("orders").insert(basicPayload).select().single();
      error = fallback.error;
      insertedOrder = fallback.data;
    }

    if (error) {
      setErrorMessage("Failed to place order: " + error.message);
      setPlacing(false);
      return;
    }

    if (insertedOrder) {
      setCreatedOrderId(insertedOrder.id);
    }

    // Decrement available inventory locally and in DB
    const newStock = Math.max(0, product.quantity_available - quantity);
    await supabase.from("products").update({ quantity_available: newStock }).eq("id", product.id);

    setProduct((prev) => ({ ...prev, quantity_available: newStock }));
    setPlacing(false);
    setShowCheckout(false);
    setCheckoutSuccess(true);
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <main className="max-w-3xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="w-full h-72 bg-gray-200 rounded-xl" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <Navbar />
        <main className="max-w-2xl mx-auto p-6 text-center py-20">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Produce Not Found</h2>
          <p className="text-gray-500 mb-6">This listing may have been deactivated or removed by the farmer.</p>
          <Link href="/" className="bg-leaf text-white px-5 py-2.5 rounded-lg font-semibold">
            ← Browse Other Harvests
          </Link>
        </main>
      </div>
    );
  }

  const isOutOfStock = product.quantity_available <= 0;

  return (
    <div>
      <Navbar />
      <main className="max-w-3xl mx-auto p-6 pb-16">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-leaf mb-5 transition">
          ← Back to Browse
        </Link>

        {/* Product Card */}
        <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-72 sm:h-96 object-cover" />
          ) : (
            <div className="w-full h-64 bg-emerald-50 flex flex-col items-center justify-center text-6xl text-emerald-700">
              <span>🌾</span>
              <span className="text-sm font-medium text-emerald-800 mt-2">Farm Fresh Harvest</span>
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 uppercase tracking-wider">
                  {product.category}
                </span>
                <h1 className="text-3xl font-bold text-gray-900 mt-2">{product.name}</h1>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>Sold by <strong>{product.profiles?.farm_name || "Local Farm"}</strong></span>
                  <span>·</span>
                  <span>📍 {product.profiles?.location || "Local Producer"}</span>
                  {product.profiles?.verified && (
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full ml-1">
                      ✓ Verified
                    </span>
                  )}
                </p>

                {/* Rating Badge & UPI Tag */}
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  {averageRating ? (
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold text-amber-800">
                      <span>★ {averageRating}</span>
                      <span className="text-gray-400 font-normal">
                        ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-800">
                      <span>🌱 Fresh Listing</span>
                      <span className="text-gray-400 font-normal">· Be the first to rate</span>
                    </div>
                  )}

                  {product.profiles?.upi_id && (
                    <span className="flex items-center gap-1 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full text-[11px] font-semibold text-purple-700">
                      💳 UPI Accepted
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-3xl font-extrabold text-leaf">
                  ₹{product.price}
                  <span className="text-sm font-normal text-gray-500"> / {product.unit}</span>
                </p>
                <p className={`text-xs font-semibold mt-1 ${isOutOfStock ? "text-red-600" : "text-emerald-700"}`}>
                  {isOutOfStock ? "Sold Out" : `${product.quantity_available} ${product.unit} in stock`}
                </p>
              </div>
            </div>

            {product.description && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">About this produce</h3>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <label className="text-sm font-medium text-gray-700">Quantity ({product.unit}):</label>
                <div className="flex items-center border rounded-lg overflow-hidden bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="px-3 py-1.5 hover:bg-gray-200 disabled:opacity-40 font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 font-semibold text-center min-w-[3rem] bg-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.quantity_available, quantity + 1))}
                    disabled={quantity >= product.quantity_available || isOutOfStock}
                    className="px-3 py-1.5 hover:bg-gray-200 disabled:opacity-40 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto">
                <div className="text-left sm:text-right">
                  <span className="text-xs text-gray-500 block">Total Price:</span>
                  <span className="text-xl font-bold text-gray-900">
                    ₹{(product.price * quantity).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => setShowCheckout(true)}
                  disabled={isOutOfStock}
                  className={`px-8 py-3 rounded-xl font-semibold text-white shadow-md transition duration-150 ${
                    isOutOfStock
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-leaf hover:bg-emerald-800"
                  }`}
                >
                  {isOutOfStock ? "Out of Stock" : "Proceed to Buy"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews & Quality Ratings Section */}
        <div className="bg-white border rounded-2xl p-6 sm:p-8 shadow-sm mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>⭐ Customer Reviews & Ratings</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Real feedback from verified community buyers on this harvest.
              </p>
            </div>

            {averageRating && (
              <div className="flex items-center gap-3 bg-amber-50/70 border border-amber-200/80 px-4 py-2 rounded-2xl">
                <span className="text-3xl font-extrabold text-amber-600">{averageRating}</span>
                <div className="text-xs">
                  <div className="flex text-amber-400 text-sm">
                    {"★".repeat(Math.min(5, Math.max(1, Math.round(Number(averageRating)))))}
                    {"☆".repeat(Math.max(0, 5 - Math.round(Number(averageRating))))}
                  </div>
                  <span className="text-gray-500 font-medium">
                    Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {reviewsLoading ? (
            <div className="py-10 text-center text-gray-400 text-sm animate-pulse">
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10 bg-gray-50/60 rounded-xl border border-dashed border-gray-200 mt-6 p-6">
              <span className="text-3xl block mb-2">🌿</span>
              <h4 className="text-base font-bold text-gray-800 mb-1">No Reviews Yet</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Be among the first to experience this fresh harvest! Order above and leave your rating once delivered.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 mt-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="py-4 first:pt-2 last:pb-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                        {(rev.consumer?.full_name || "Buyer").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-900 block leading-tight">
                          {rev.consumer?.full_name || "Verified Buyer"}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(rev.created_at).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center text-amber-400 text-sm">
                      {"★".repeat(rev.rating)}
                      <span className="text-gray-200">{"★".repeat(Math.max(0, 5 - rev.rating))}</span>
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs sm:text-sm text-gray-700 mt-2 pl-10 leading-relaxed">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
              <button
                onClick={() => setShowCheckout(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-1">Confirm Your Order</h2>
              <p className="text-sm text-gray-500 mb-6">
                Ordering <strong>{quantity} {product.unit} of {product.name}</strong> from {product.profiles?.farm_name}
              </p>

              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={deliveryForm.phone}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, phone: e.target.value })}
                    className="w-full border rounded-lg px-3.5 py-2.5 text-sm focus:border-leaf focus:ring-1 focus:ring-leaf outline-none"
                  />
                  <p className="text-[11px] text-gray-500 mt-0.5">The farmer will call or message this number to confirm delivery.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Complete Delivery Address *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="House/Flat No., Street, Landmark, Village or City, Pincode"
                    value={deliveryForm.address}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, address: e.target.value })}
                    className="w-full border rounded-lg px-3.5 py-2.5 text-sm focus:border-leaf focus:ring-1 focus:ring-leaf outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Deliver before 11 AM, leave at gate..."
                    value={deliveryForm.notes}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                    className="w-full border rounded-lg px-3.5 py-2.5 text-sm focus:border-leaf focus:ring-1 focus:ring-leaf outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer text-sm font-medium transition ${
                      deliveryForm.paymentMethod === "cod" ? "border-leaf bg-emerald-50 text-leaf" : "border-gray-200"
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={deliveryForm.paymentMethod === "cod"}
                        onChange={(e) => setDeliveryForm({ ...deliveryForm, paymentMethod: e.target.value })}
                        className="accent-emerald-700"
                      />
                      <span>Cash on Delivery</span>
                    </label>
                    <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer text-sm font-medium transition ${
                      deliveryForm.paymentMethod === "upi" ? "border-leaf bg-emerald-50 text-leaf" : "border-gray-200"
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="upi"
                        checked={deliveryForm.paymentMethod === "upi"}
                        onChange={(e) => setDeliveryForm({ ...deliveryForm, paymentMethod: e.target.value })}
                        className="accent-emerald-700"
                      />
                      <span>UPI Payment</span>
                    </label>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mt-4 border border-gray-200">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Item Total ({quantity} {product.unit})</span>
                    <span>₹{(product.price * quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Direct Farm Delivery</span>
                    <span className="text-emerald-700 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t mt-2">
                    <span>Total Payable</span>
                    <span className="text-leaf">₹{(product.price * quantity).toFixed(2)}</span>
                  </div>
                </div>

                {errorMessage && (
                  <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                    {errorMessage}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCheckout(false)}
                    className="w-1/3 border border-gray-300 py-3 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={placing}
                    className="w-2/3 bg-leaf hover:bg-emerald-800 text-white py-3 rounded-xl font-semibold shadow-md transition disabled:opacity-50"
                  >
                    {placing ? "Placing Order..." : `Place Order (₹${(product.price * quantity).toFixed(2)})`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Order Success Confirmation Modal */}
        {checkoutSuccess && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-7 text-center shadow-2xl">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
                ✓
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Order Confirmed!</h3>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                Thank you! Your order for <strong>{quantity} {product.unit} of {product.name}</strong> has been received by <strong>{product.profiles?.farm_name || "the farmer"}</strong>.
              </p>

              {/* Instant UPI Payment Banner if user selected UPI */}
              {deliveryForm.paymentMethod === "upi" && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-4 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">💳</span>
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                      Instant Zero-Fee UPI Payment
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed mb-3">
                    Pay <strong>₹{(product.price * quantity).toFixed(2)}</strong> directly to {product.profiles?.farm_name || "the farmer"}&apos;s UPI ID or pay on delivery.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowUpiModal(true)}
                    className="w-full bg-leaf hover:bg-emerald-800 text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <span>📱</span>
                    <span>Scan UPI QR / Pay Now</span>
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Link
                  href="/orders"
                  className="bg-leaf hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-xl transition text-sm"
                >
                  Track in My Orders
                </Link>
                <Link
                  href="/"
                  className="border border-gray-300 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition text-sm"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic UPI Payment Modal */}
        <UpiPaymentModal
          isOpen={showUpiModal}
          onClose={() => setShowUpiModal(false)}
          amount={product ? product.price * quantity : 0}
          orderId={createdOrderId}
          farmerName={product?.profiles?.farm_name}
          farmerUpiId={product?.profiles?.upi_id}
          productName={product?.name}
        />
      </main>
    </div>
  );
}
