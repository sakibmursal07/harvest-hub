import { useState, useEffect } from "react";
import Link from "next/link";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Automatically trigger the Start Window whenever the website is opened!
    // 350ms slight delay allows the page to load smoothly before the Start Window slides in
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 350);

    // Support manual re-opening via Navbar "About" or custom button
    const handleReopen = () => {
      setIsClosing(false);
      setIsOpen(true);
    };
    window.addEventListener("open-harvest-intro", handleReopen);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("open-harvest-intro", handleReopen);
    };
  }, []);

  const handleDismiss = () => {
    if (isClosing) return;
    setIsClosing(true);

    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 240); // Matches .animate-modal-out duration
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isClosing) {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isClosing]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-soil/75 backdrop-blur-md transition-all ${
        isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      onClick={(e) => {
        // Dismiss if clicking backdrop
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div
        className={`relative w-full max-w-xl bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#3d3223]/20 overflow-hidden transform ${
          isClosing ? "animate-modal-out" : "animate-modal-in"
        }`}
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-br from-soil via-[#382d1f] to-[#251e15] text-white px-6 py-7 sm:px-8 sm:py-8 text-center relative border-b border-soil/30 shadow-inner">
          
          {/* Top-Right Prominent Skip Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-gray-100 hover:text-white transition-all duration-200 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 group border border-white/10"
            title="Skip directly to website"
          >
            <span>Skip</span>
            <span className="text-[11px] opacity-75 group-hover:rotate-90 transition-transform duration-200">✕</span>
          </button>

          {/* Animated 🌾 Emblem */}
          <div className="relative inline-block mb-3">
            <div className="absolute inset-0 bg-emerald-500/25 rounded-2xl blur-md animate-pulse-subtle"></div>
            <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-leaf/40 border border-emerald-400/40 text-3xl shadow-lg animate-float-gentle">
              🌾
            </div>
          </div>
          
          <span className="block text-[11px] uppercase tracking-widest font-semibold text-emerald-300 mb-1 animate-pulse-subtle">
            Official Farm-to-Table Platform
          </span>
          <h2 id="welcome-modal-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome to Harvest Hub
          </h2>
          <p className="text-gray-300 text-xs sm:text-sm font-medium mt-1 max-w-md mx-auto">
            Direct Farm-to-Consumer Agricultural Marketplace
          </p>
        </div>

        {/* Start Window Body */}
        <div className="p-6 sm:p-8 space-y-5">
          <p className="text-gray-700 text-xs sm:text-sm text-center leading-relaxed font-normal">
            Harvest Hub directly connects verified agricultural producers with consumers. 
            By eliminating intermediaries, we ensure fair earnings for farmers and freshly harvested, nutritious produce for households.
          </p>

          {/* 3 Core Pillars with Interactive Hover Animations */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 bg-white rounded-2xl border border-gray-200/90 shadow-xs flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-emerald-500/50 group cursor-default">
              <span className="text-2xl mb-1 inline-block group-hover:scale-125 transition-transform duration-200">
                🚜
              </span>
              <h4 className="text-xs font-bold text-soil group-hover:text-emerald-800 transition-colors">
                Direct Sourcing
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                Zero middleman commissions. 100% fair grower payout.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-gray-200/90 shadow-xs flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-emerald-500/50 group cursor-default">
              <span className="text-2xl mb-1 inline-block group-hover:scale-125 transition-transform duration-200">
                🌱
              </span>
              <h4 className="text-xs font-bold text-soil group-hover:text-emerald-800 transition-colors">
                Peak Freshness
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                Harvested within 24–48 hours of scheduled fulfillment.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-gray-200/90 shadow-xs flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-emerald-500/50 group cursor-default">
              <span className="text-2xl mb-1 inline-block group-hover:scale-125 transition-transform duration-200">
                🌍
              </span>
              <h4 className="text-xs font-bold text-soil group-hover:text-emerald-800 transition-colors">
                Eco-Friendly
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                Fewer transit miles, reducing cold-storage emissions.
              </p>
            </div>
          </div>

          {/* Quick Guidance / Role Selection */}
          <div className="bg-emerald-50/80 border border-emerald-200/70 rounded-xl p-3 flex items-center justify-between gap-2 text-xs transition-all hover:bg-emerald-50">
            <div className="flex items-center gap-2 text-emerald-950 font-medium">
              <span className="text-base animate-bounce">👩‍🌾</span>
              <span>Are you a registered producer?</span>
            </div>
            <Link
              href="/signup"
              onClick={handleDismiss}
              className="text-leaf font-bold hover:underline hover:text-emerald-800 whitespace-nowrap"
            >
              List your farm →
            </Link>
          </div>

          {/* Actions: Enter or Skip */}
          <div className="pt-2 border-t border-gray-200/70 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-leaf hover:bg-emerald-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-98 focus:outline-none focus:ring-2 focus:ring-leaf/50 flex items-center justify-center gap-2 group"
            >
              <span>Explore Marketplace</span>
              <span className="group-hover:translate-x-1.5 transition-transform duration-200 text-base">
                →
              </span>
            </button>
            
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full sm:w-auto py-3 px-6 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 hover:text-gray-900 text-gray-700 font-semibold text-sm transition-all duration-200 active:scale-95 focus:outline-none shadow-xs"
            >
              Skip
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
