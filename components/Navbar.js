import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if someone is already logged in when the page loads
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // Keep this in sync if they log in/out while on the page
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

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
