import { useEffect } from "react";

export default function OrderInvoiceModal({ isOpen, onClose, order }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const invoiceNo = `HH-INV-${order.id.slice(0, 8).toUpperCase()}`;
  const formattedDate = new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const unitPrice =
    order.products?.price ||
    Math.round((order.total_price || 0) / (order.quantity || 1));
  const subtotal = order.total_price || 0;
  const middlemanFeeSaved = Math.round(subtotal * 0.4);

  // Reliable cross-browser Print / PDF generator
  const handlePrint = () => {
    const invoiceContent = document.getElementById("harvest-invoice-sheet");
    if (!invoiceContent) {
      window.print();
      return;
    }

    const printWin = window.open("", "_blank", "width=850,height=950");
    if (!printWin) {
      // If popup blocker intervened, fallback to native window.print
      window.print();
      return;
    }

    printWin.document.open();
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Harvest Hub Tax Invoice - ${invoiceNo}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" />
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background-color: #ffffff !important;
              color: #111827 !important;
              margin: 0;
              padding: 10px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .text-soil { color: #2B2318 !important; }
            .text-leaf { color: #4C6B3F !important; }
            .bg-soil { background-color: #2B2318 !important; }
            .bg-leaf { background-color: #4C6B3F !important; }
            .border-soil { border-color: #2B2318 !important; }
            .border-leaf { border-color: #4C6B3F !important; }
          </style>
        </head>
        <body>
          <div class="max-w-2xl mx-auto">
            ${invoiceContent.innerHTML}
          </div>
          <script>
            window.addEventListener('load', () => {
              setTimeout(() => {
                window.focus();
                window.print();
              }, 300);
            });
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="invoice-overlay fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      
      {/* Background click to dismiss (hidden in print) */}
      <div className="fixed inset-0 print-hidden" onClick={onClose} />

      {/* Main Invoice Modal Card */}
      <div
        id="harvest-invoice-container"
        className="relative bg-white text-gray-900 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden z-10 border border-gray-200"
      >
        
        {/* Modal Top Control Bar (Screen only) */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#FAF7F2] border-b border-gray-200 print-hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            <span className="font-extrabold text-sm sm:text-base text-soil">
              Farm-to-Table Tax Invoice / Delivery Receipt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-leaf hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <span>🖨️</span>
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div id="harvest-invoice-sheet" className="p-6 sm:p-10 font-sans bg-white">
          
          {/* Header & Logo */}
          <div className="flex justify-between items-start border-b-2 border-gray-200 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl">🌾</span>
                <span className="text-2xl font-black tracking-tight text-soil">Harvest Hub</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Direct Farm-to-Consumer Agricultural Platform</p>
              <p className="text-[11px] text-gray-500">Government of India · Digital Agriculture Mission</p>
              <div className="inline-block mt-2 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                ✓ 100% Direct Farmer Payout · Zero Middlemen
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs uppercase tracking-widest text-emerald-800 font-bold block mb-1">
                ORIGINAL TAX INVOICE
              </span>
              <p className="font-mono font-bold text-sm text-gray-800">{invoiceNo}</p>
              <p className="text-xs text-gray-500 mt-0.5">Date: {formattedDate}</p>
              <span className="inline-block mt-2 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                Status: {order.status?.toUpperCase() || "CONFIRMED"}
              </span>
            </div>
          </div>

          {/* Seller (Farmer) & Buyer (Customer) Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 text-xs text-gray-600 border-b border-gray-200 pb-6">
            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-gray-200">
              <span className="font-bold text-soil uppercase tracking-wider block text-[11px] mb-1.5 flex items-center gap-1">
                <span>🚜</span>
                <span>Sold & Harvested By:</span>
              </span>
              <p className="font-bold text-sm text-gray-900">{order.farmer?.farm_name || "Verified Local Producer"}</p>
              <p className="mt-0.5">📍 Location: {order.farmer?.location || "Maharashtra Regional Farm"}</p>
              <p className="mt-0.5">FPO Reg No: FPO-IN-{order.farmer_id ? order.farmer_id.slice(0, 6).toUpperCase() : "8841"}</p>
              {order.farmer?.upi_id && (
                <p className="mt-0.5 font-mono text-[11px] text-emerald-800 font-semibold">UPI ID: {order.farmer.upi_id}</p>
              )}
            </div>

            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-gray-200">
              <span className="font-bold text-soil uppercase tracking-wider block text-[11px] mb-1.5 flex items-center gap-1">
                <span>👤</span>
                <span>Billed & Delivered To:</span>
              </span>
              <p className="font-bold text-sm text-gray-900">{order.consumer?.full_name || "Harvest Hub Customer"}</p>
              <p className="mt-0.5">📍 Address: {order.delivery_address || "Customer Delivery Address on file"}</p>
              {order.phone && <p className="mt-0.5">📞 Contact: {order.phone}</p>}
              <p className="mt-0.5 font-semibold text-gray-800">
                Payment: {order.payment_method === "upi" ? "Direct UPI on Delivery" : "Cash on Delivery (COD)"}
              </p>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase tracking-wider text-[11px] border-b border-gray-200">
                  <th className="py-2.5 px-3 font-bold">Item & Description</th>
                  <th className="py-2.5 px-3 font-bold text-center">Unit Price</th>
                  <th className="py-2.5 px-3 font-bold text-center">Quantity</th>
                  <th className="py-2.5 px-3 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-3">
                    <p className="font-bold text-sm text-gray-900">{order.products?.name || "Fresh Farm Produce"}</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      ✓ Direct Farm-to-Table Consignment (Zero Chemical Preservation)
                    </p>
                  </td>
                  <td className="py-3 px-3 text-center text-gray-700">₹{unitPrice} / {order.products?.unit || "kg"}</td>
                  <td className="py-3 px-3 text-center font-bold text-gray-900">{order.quantity} {order.products?.unit || "kg"}</td>
                  <td className="py-3 px-3 text-right font-bold text-gray-900">₹{subtotal}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Calculations & GST Exemption Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-t border-gray-200 pt-4">
            
            {/* Legal Tax Exemption Notice */}
            <div className="max-w-xs text-[11px] text-gray-600 space-y-1">
              <p className="font-bold text-gray-800">📌 Statutory GST Exemption:</p>
              <p>
                Fresh, unprocessed agricultural fruits and vegetables are <strong>0% EXEMPT from GST</strong> under Notification No. 2/2017-Central Tax (Rate).
              </p>
              <div className="pt-2 text-emerald-800 font-bold flex items-center gap-1">
                <span>🌱</span>
                <span>Direct transit saved ~3.5 kg transport CO₂ emissions</span>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Produce Subtotal:</span>
                <span className="font-medium text-gray-800">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Middleman Commission:</span>
                <span>-₹{middlemanFeeSaved} (0%)</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charges:</span>
                <span className="text-emerald-700 font-semibold">FREE (Farm Direct)</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Applicable GST (0%):</span>
                <span>₹0.00</span>
              </div>
              <div className="border-t-2 border-gray-300 pt-2 flex justify-between items-center text-base font-black text-soil">
                <span>Total Amount:</span>
                <span className="text-leaf text-lg">₹{subtotal}</span>
              </div>
              <p className="text-[10px] text-gray-400 text-right mt-0.5">
                All proceeds transferred directly to farmer
              </p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 pt-4 border-t border-dashed border-gray-200 text-center text-[11px] text-gray-400">
            <p>Thank you for supporting local farmers and sustainable community agriculture!</p>
            <p className="mt-0.5 font-mono text-[10px]">Harvest Hub Verified Digital Challan · System-Generated Invoice</p>
          </div>

        </div>
      </div>
      
      {/* Native Browser Ctrl+P Fallback Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .invoice-overlay,
          #harvest-invoice-container,
          #harvest-invoice-sheet,
          #harvest-invoice-sheet * {
            visibility: visible !important;
          }
          .invoice-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          #harvest-invoice-container {
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 0 !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
