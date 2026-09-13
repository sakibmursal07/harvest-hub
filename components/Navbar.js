import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) loadRole(data.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadRole(session.user.id);
      else setRole(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadRole(userId) {
    const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
    setRole(data?.role || null);
  }

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-soil text-white">
      <Link href="/" className="font-bold text-lg">🌾 Harvest Hub</Link>
      <div className="flex items-center gap-5 text-sm">
        <Link href="/">Browse</Link>
        {user ? (
          <>
            <Link href="/orders">My Orders</Link>
            <Link href="/farmer/dashboard">Farmer Dashboard</Link>
            {role === "admin" && <Link href="/admin/dashboard">Admin</Link>}
            <button onClick={logout} className="bg-gold text-soil px-3 py-1.5 rounded font-semibold">
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup" className="bg-leaf px-3 py-1.5 rounded font-semibold">
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}