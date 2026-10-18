import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const { language, setLanguage, t, languages } = useLanguage();
  const { theme, toggleTheme, isDark, mounted } = useTheme();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) loadProfile(data.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    const { data } = await supabase
      .from("profiles")
      .select("role, full_name, farm_name")
      .eq("id", userId)
      .single();
    setProfile(data || null);
  }

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const role = profile?.role;

  return (
    <nav className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3.5 bg-soil dark:bg-[#18140f] text-white border-b border-[#3d3223] dark:border-stone-800 sticky top-0 z-40 shadow-md gap-3 transition-colors duration-200">
      <Link href="/" className="font-bold text-xl flex items-center gap-2 hover:opacity-90 transition">
        <span>🌾</span>
        <span className="tracking-tight">Harvest Hub</span>
      </Link>

      <div className="flex items-center gap-3 sm:gap-4 text-sm font-medium flex-wrap">
        <Link
          href="/"
          className={`hover:text-emerald-300 transition ${
            router.pathname === "/" ? "text-emerald-300 font-semibold" : "text-gray-200"
          }`}
        >
          {t("nav_browse")}
        </Link>

        <Link
          href="/#community-pools"
          className="text-gray-300 hover:text-emerald-200 transition flex items-center gap-1 text-xs sm:text-sm"
          title="Community Group-Buying Pools"
        >
          <span>🏘️</span>
          <span className="hidden md:inline">{t("nav_pools")}</span>
        </Link>

        <button
          onClick={() => {
            window.dispatchEvent(new Event("open-ai-price-advisor"));
          }}
          className="text-emerald-300 hover:text-white bg-emerald-900/50 hover:bg-emerald-800/60 border border-emerald-500/40 px-2.5 py-1 rounded-lg transition flex items-center gap-1 text-xs font-semibold shadow-xs"
          title="AI Fair-Price & Crop Quality Estimator"
        >
          <span>✨</span>
          <span>{t("nav_ai_pricing")}</span>
        </button>

        <button
          onClick={() => {
            if (router.pathname !== "/") {
              router.push("/").then(() => {
                setTimeout(() => window.dispatchEvent(new Event("open-harvest-intro")), 300);
              });
            } else {
              window.dispatchEvent(new Event("open-harvest-intro"));
            }
          }}
          className="text-gray-300 hover:text-emerald-200 transition flex items-center gap-1 text-xs sm:text-sm"
          title="View project overview and mission"
        >
          <span className="text-xs">ℹ️</span>
          <span>{t("nav_about")}</span>
        </button>

        {/* Multilingual Selector: English / हिंदी / मराठी */}
        <div className="flex items-center bg-black/30 border border-emerald-500/30 rounded-xl p-0.5 text-xs font-semibold">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`px-2 py-1 rounded-lg transition-all text-[11px] sm:text-xs ${
                language === l.code
                  ? "bg-leaf text-white font-bold shadow-xs scale-102"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
              title={`Switch language to ${l.label}`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Dark Mode Switch */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/30 hover:bg-black/50 border border-emerald-500/30 text-xs font-semibold text-gray-200 hover:text-white transition shadow-xs cursor-pointer active:scale-95"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Dark Mode"
        >
          <span className="text-sm transform transition-transform duration-300 hover:rotate-12">
            {mounted ? (isDark ? "☀️" : "🌙") : "🌙"}
          </span>
          <span className="hidden sm:inline text-[11px] font-bold">
            {mounted ? (isDark ? t("nav_light_mode") : t("nav_dark_mode")) : t("nav_dark_mode")}
          </span>
        </button>

        {user ? (
          <>
            <Link
              href="/orders"
              className={`hover:text-emerald-300 transition ${
                router.pathname === "/orders" ? "text-emerald-300 font-semibold" : "text-gray-200"
              }`}
            >
              {t("nav_orders")}
            </Link>

            {(role === "farmer" || role === "admin") && (
              <Link
                href="/farmer/dashboard"
                className={`hover:text-emerald-300 transition ${
                  router.pathname.startsWith("/farmer") ? "text-emerald-300 font-semibold" : "text-gray-200"
                }`}
              >
                {t("nav_farmer_dashboard")}
              </Link>
            )}

            {role === "admin" && (
              <Link
                href="/admin/dashboard"
                className={`hover:text-emerald-300 transition ${
                  router.pathname.startsWith("/admin") ? "text-emerald-300 font-semibold" : "text-gray-200"
                }`}
              >
                {t("nav_admin")}
              </Link>
            )}

            <div className="flex items-center gap-2 pl-2 border-l border-gray-700">
              <span className="hidden lg:inline-block text-xs text-gray-300 bg-black/20 px-2.5 py-1 rounded-full">
                {profile?.farm_name || profile?.full_name || user.email?.split("@")[0]}
                {role === "farmer" && " (Farmer)"}
              </span>
              <button
                onClick={logout}
                className="bg-gold/90 hover:bg-gold text-soil px-3 py-1.5 rounded-lg font-semibold text-xs transition shadow-xs"
              >
                {t("nav_logout")}
              </button>
            </div>
          </>
        ) : (
          <>
            <Link href="/login" className="text-gray-200 hover:text-white transition">
              {t("nav_login")}
            </Link>
            <Link
              href="/signup"
              className="bg-leaf hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg font-semibold transition shadow-xs"
            >
              {t("nav_signup")}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}