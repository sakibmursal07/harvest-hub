import { useState } from "react";

export default function UpiPaymentModal({
  isOpen,
  onClose,
  amount,
  orderId,
  farmerName,
  farmerUpiId,
  productName,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Use farmer's UPI ID or display notice if not configured yet
  const upiId = farmerUpiId?.trim() || "";
  const payeeName = farmerName || "Harvest Hub Farmer";
  const note = `HarvestHub_Order_${orderId ? String(orderId).slice(0, 8) : "Direct"}`;

  // Standard Indian UPI Intent URL
  const upiUri = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${Number(amount || 0).toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`
    : "";

  const qrCodeUrl = upiUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(upiUri)}`
    : "";

  const handleCopy = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e1913] border border-gray-200 dark:border-stone-800 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-stone-200 text-lg font-bold w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-stone-800 flex items-center justify-center transition"
        >
          ✕
        </button>

        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full flex items-center justify-center text-2xl mx-auto mb-3 border border-transparent dark:border-emerald-800/40">
          💳
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-stone-100">Scan & Pay with UPI</h3>
        <p className="text-xs text-gray-500 dark:text-stone-400 mt-1 mb-4">
          Direct payment for <strong className="text-gray-900 dark:text-stone-200">{productName || "Fresh Produce"}</strong>
        </p>

        {upiId ? (
          <div>
            {/* Scannable QR Code */}
            <div className="bg-white p-3 border-2 border-emerald-600/30 rounded-2xl inline-block shadow-sm mb-3">
              <img
                src={qrCodeUrl}
                alt="UPI Payment QR Code"
                className="w-48 h-48 mx-auto rounded-lg"
              />
            </div>

            <div className="bg-gray-50 dark:bg-[#282118] rounded-xl p-3 mb-4 text-left border border-gray-100 dark:border-stone-700">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-gray-500 dark:text-stone-400">Payable Amount:</span>
                <span className="font-extrabold text-base text-leaf">
                  ₹{Number(amount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-stone-400">Paying To:</span>
                <span className="font-medium text-gray-800 dark:text-stone-200">{payeeName}</span>
              </div>
              <div className="flex justify-between items-center text-xs mt-1.5 pt-1.5 border-t border-gray-200 dark:border-stone-700">
                <span className="text-gray-500 dark:text-stone-400 font-mono text-[11px] truncate max-w-[170px]">
                  {upiId}
                </span>
                <button
                  onClick={handleCopy}
                  className="text-[11px] text-leaf font-bold hover:underline"
                >
                  {copied ? "✓ Copied!" : "Copy UPI ID"}
                </button>
              </div>
            </div>

            {/* Mobile Deep-Link Button */}
            <a
              href={upiUri}
              className="block sm:hidden w-full bg-leaf hover:bg-emerald-800 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition shadow-sm mb-3"
            >
              📱 Open UPI App (GPay / PhonePe / Paytm)
            </a>

            <p className="text-[11px] text-gray-400 dark:text-stone-500">
              Supported by Google Pay, PhonePe, Paytm, BHIM & any banking UPI app.
            </p>
          </div>
        ) : (
          <div className="py-6 px-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-left mb-4">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
              Farmer UPI ID Pending
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              <strong>{payeeName}</strong> has not linked their UPI ID yet. You can still pay smoothly using <strong>UPI on Delivery</strong> when the farmer or delivery person arrives!
            </p>
            <div className="mt-3 text-right">
              <span className="text-xs font-bold text-gray-700 dark:text-stone-300">Amount Due: </span>
              <span className="text-base font-bold text-leaf">₹{Number(amount || 0).toFixed(2)}</span>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-2 border border-gray-200 dark:border-stone-700 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-stone-300 hover:bg-gray-50 dark:hover:bg-stone-800 transition"
        >
          Done / Close
        </button>
      </div>
    </div>
  );
}
