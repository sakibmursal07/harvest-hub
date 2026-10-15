import { useState, useEffect } from "react";
import Link from "next/link";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  useEffect(() => {
    // Check if the user has already dismissed the welcome window
    try {
      const dismissed = localStorage.getItem("harvest_hub_welcome_dismissed");
      if (!dismissed) {
        setIsOpen(true);
      }
    } catch (e) {
      setIsOpen(true);
    }

    // Support re-opening manually (e.g. from navbar or demo button)
    const handleReopen = () => setIsOpen(true);
    window.addEventListener("open-harvest-intro", handleReopen);
    return () => window.removeEventListener("open-harvest-intro", handleReopen);
  }, []);

  const handleDismiss = () => {
    try {
      if (dontShowAgain) {
        localStorage.setItem("harvest_hub_welcome_dismissed", "true");
      }
    } catch (e) {
      console.warn("Could not save welcome modal preference:", e);
    }
    setIsOpen(false);
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, dontShowAgain]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-soil/70 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
    >
      <div className="relative w-full max-w-xl bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#3d3223]/15 overflow-hidden transition-all duration-300 transform scale-100">
        
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-soil via-[#382d1f] to-soil text-white px-6 py-7 sm:px-8 sm:py-8 text-center relative border-b border-soil/20">
          {/* Top Skip Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            title="Skip introduction"
          >
            <span>Skip</span>
            <span className="text-[11px] opacity-75">✕</span>
          </button>

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-leaf/40 border border-leaf text-3xl mb-3 shadow-inner">
            🌾
          </div>
          
          <span className="block text-[11px] uppercase tracking-widest font-semibold text-emerald-300 mb-1">
            Official Farm-to-Table Initiative
          </span>
          <h2 id="welcome-modal-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome to Harvest Hub
          </h2>
          <p className="text-gray-300 text-xs sm:text-sm font-medium mt-1 max-w-md mx-auto">
            Direct Farm-to-Consumer Agricultural Platform
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-5">
          <p className="text-gray-700 text-xs sm:text-sm text-center leading-relaxed font-normal">
            Harvest Hub directly connects verified agricultural producers with consumers. 
            By eliminating intermediaries, we ensure fair earnings for farmers and freshly harvested, nutritious produce for households.
          </p>

          {/* 3 Core Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 bg-white rounded-2xl border border-gray-200/80 shadow-xs flex flex-col items-center text-center">
              <span className="text-2xl mb-1">🚜</span>
              <h4 className="text-xs font-bold text-soil">Direct Sourcing</h4>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                Zero middleman commissions. 100% fair grower payout.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-gray-200/80 shadow-xs flex flex-col items-center text-center">
              <span className="text-2xl mb-1">🌱</span>
              <h4 className="text-xs font-bold text-soil">Peak Freshness</h4>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                Harvested within 24–48 hours of scheduled fulfillment.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-gray-200/80 shadow-xs flex flex-col items-center text-center">
              <span className="text-2xl mb-1">🌍</span>
              <h4 className="text-xs font-bold text-soil">Eco-Friendly</h4>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                Fewer transit miles, reducing cold-storage emissions.
              </p>
            </div>
          </div>

          {/* Quick Guidance / Role Selection */}
          <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-950 font-medium">
              <span className="text-base">👩‍🌾</span>
              <span>Are you a registered producer?</span>
            </div>
            <Link
              href="/signup"
              onClick={handleDismiss}
              className="text-leaf font-bold hover:underline whitespace-nowrap"
            >
              List your farm →
            </Link>
          </div>

          {/* User Controls and Actions */}
          <div className="pt-2 border-t border-gray-200/70 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="rounded border-gray-300 text-leaf focus:ring-leaf h-3.5 w-3.5 cursor-pointer accent-leaf"
                />
                <span>Don't show this start window again</span>
              </label>
              <span className="text-[11px] text-gray-400">Esc to skip</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-leaf hover:bg-emerald-800 text-white font-semibold text-sm shadow-md transition transform active:scale-98 focus:outline-none focus:ring-2 focus:ring-leaf/50"
              >
                Enter Marketplace →
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full sm:w-auto py-3 px-6 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-sm transition focus:outline-none"
              >
                Skip
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
