import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
  };

  return (
    <div>
      <Navbar />
      <main className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-5 text-gray-900 dark:text-stone-100">Log in</h1>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-[#1e1913] p-6 rounded-2xl border border-gray-200 dark:border-stone-800 shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-stone-300">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 dark:border-stone-700 bg-white dark:bg-[#282118] text-gray-900 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-leaf" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-stone-300">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 dark:border-stone-700 bg-white dark:bg-[#282118] text-gray-900 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-leaf" />
          </div>
          {error && <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl border border-red-200 dark:border-red-900/50">{error}</p>}
          <button disabled={loading} className="w-full bg-leaf hover:bg-emerald-800 transition text-white font-semibold py-2.5 rounded-xl text-sm shadow-sm">
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </main>
    </div>
  );
}
