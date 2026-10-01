import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

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
    <nav className="flex items-center justify-between px-6 py-3.5 bg-soil text-white border-b border-[#3d3223] sticky top-0 z-40 shadow-md">
      <Link href="/" className="font-bold text-xl flex items-center gap-2 hover:opacity-90 transition">
        <span>🌾</span>
        <span className="tracking-tight">Harvest Hub</span>
      </Link>

      <div className="flex items-center gap-4 sm:gap-6 text-sm font-medium">
        <Link
          href="/"
          className={`hover:text-emerald-300 transition ${
            router.pathname === "/" ? "text-emerald-300 font-semibold" : "text-gray-200"
          }`}
        >
          Browse
        </Link>

        {user ? (
          <>
            <Link
              href="/orders"
              className={`hover:text-emerald-300 transition ${
                router.pathname === "/orders" ? "text-emerald-300 font-semibold" : "text-gray-200"
              }`}
            >
              My Orders
            </Link>

            {(role === "farmer" || role === "admin") && (
              <Link
                href="/farmer/dashboard"
                className={`hover:text-emerald-300 transition ${
                  router.pathname.startsWith("/farmer") ? "text-emerald-300 font-semibold" : "text-gray-200"
                }`}
              >
                Farmer Dashboard
              </Link>
            )}

            {role === "admin" && (
              <Link
                href="/admin/dashboard"
                className={`hover:text-emerald-300 transition ${
                  router.pathname.startsWith("/admin") ? "text-emerald-300 font-semibold" : "text-gray-200"
                }`}
              >
                Admin
              </Link>
            )}

            <div className="flex items-center gap-2 pl-2 border-l border-gray-700">
              <span className="hidden md:inline-block text-xs text-gray-300 bg-black/20 px-2.5 py-1 rounded-full">
                {profile?.farm_name || profile?.full_name || user.email?.split("@")[0]}
                {role === "farmer" && " (Farmer)"}
              </span>
              <button
                onClick={logout}
                className="bg-gold/90 hover:bg-gold text-soil px-3 py-1.5 rounded-lg font-semibold text-xs transition shadow-xs"
              >
                Log out
              </button>
            </div>
          </>
        ) : (
          <>
            <Link href="/login" className="text-gray-200 hover:text-white transition">
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-leaf hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg font-semibold transition shadow-xs"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}