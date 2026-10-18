import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ReviewModal({ isOpen, onClose, order, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setErrorMessage("Please log in to submit a review.");
      return;
    }

    setSubmitting(true);

    const reviewPayload = {
      order_id: order.id,
      product_id: order.product_id,
      consumer_id: userData.user.id,
      rating: rating,
      comment: comment.trim() || null,
    };

    const { error } = await supabase.from("reviews").insert(reviewPayload);

    setSubmitting(false);

    if (error) {
      if (error.code === "42P01") {
        setErrorMessage("Please run migration_v3.sql in your Supabase dashboard to enable reviews!");
      } else if (error.code === "23505") {
        setErrorMessage("You have already reviewed this order!");
      } else {
        setErrorMessage("Error submitting review: " + error.message);
      }
      return;
    }

    if (onSubmitted) onSubmitted(order.id, rating);
    onClose();
  };

  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e1913] border border-gray-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-stone-200 text-lg font-bold w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-stone-800 flex items-center justify-center transition"
        >
          ✕
        </button>

        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-full flex items-center justify-center text-2xl mx-auto mb-3 border border-transparent dark:border-amber-800/40">
          ⭐
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-stone-100 text-center">Rate Your Produce</h3>
        <p className="text-xs text-gray-500 dark:text-stone-400 text-center mt-1 mb-5">
          How was the quality of <strong className="text-gray-900 dark:text-stone-200">{order.products?.name}</strong> from{" "}
          <strong className="text-gray-900 dark:text-stone-200">{order.farmer?.farm_name || "the farmer"}</strong>?
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Interactive Star Rating */}
          <div className="text-center">
            <div className="flex justify-center items-center gap-2 mb-1">
              {stars.map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-3xl sm:text-4xl transition transform hover:scale-110 focus:outline-none"
                >
                  <span
                    className={
                      (hoverRating || rating) >= star
                        ? "text-amber-400 drop-shadow-xs"
                        : "text-gray-300 dark:text-stone-600"
                    }
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-gray-600 dark:text-stone-300">
              {rating === 5 && "Excellent & Farm-Fresh! 🌿"}
              {rating === 4 && "Great Quality! 👍"}
              {rating === 3 && "Good / Average Produce 🙂"}
              {rating === 2 && "Could be fresher 😕"}
              {rating === 1 && "Disappointed 😞"}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-stone-300 uppercase mb-1">
              Share your feedback (Optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about the freshness, taste, and packaging..."
              className="w-full border border-gray-300 dark:border-stone-700 bg-white dark:bg-[#282118] text-gray-900 dark:text-stone-100 placeholder-gray-400 dark:placeholder-stone-500 rounded-xl px-3.5 py-2.5 text-sm focus:border-leaf focus:ring-1 focus:ring-leaf outline-none"
            />
          </div>

          {errorMessage && (
            <p className="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
              {errorMessage}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 border border-gray-300 dark:border-stone-700 py-2.5 rounded-xl font-medium text-gray-700 dark:text-stone-300 text-sm hover:bg-gray-50 dark:hover:bg-stone-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-2/3 bg-leaf hover:bg-emerald-800 text-white py-2.5 rounded-xl font-semibold text-sm shadow-md transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Review ⭐"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
