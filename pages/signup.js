import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabaseClient";

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "consumer", farmName: "", location: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Step 1: create the login (Supabase Auth handles password hashing/security)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Step 2: create their profile row (name, role, farm name, and location)
    const userId = data.user.id;
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      full_name: form.name,
      role: form.role,
      farm_name: form.role === "farmer" ? form.farmName : null,
      location: form.location || null,
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/");
  };

  return (
    <div>
      <Navbar />
      <main className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-5 text-gray-900 dark:text-stone-100">Create your account</h1>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-[#1e1913] p-6 rounded-2xl border border-gray-200 dark:border-stone-800 shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-stone-300">Full name</label>
            <input name="name" required onChange={handleChange} className="w-full border border-gray-300 dark:border-stone-700 bg-white dark:bg-[#282118] text-gray-900 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-leaf" placeholder="e.g. Rahul Patil" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-stone-300">Email</label>
            <input type="email" name="email" required onChange={handleChange} className="w-full border border-gray-300 dark:border-stone-700 bg-white dark:bg-[#282118] text-gray-900 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-leaf" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-stone-300">Password</label>
            <input type="password" name="password" required minLength={6} onChange={handleChange} className="w-full border border-gray-300 dark:border-stone-700 bg-white dark:bg-[#282118] text-gray-900 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-leaf" placeholder="At least 6 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-stone-300">I am a...</label>
            <select name="role" onChange={handleChange} value={form.role} className="w-full border border-gray-300 dark:border-stone-700 bg-white dark:bg-[#282118] text-gray-900 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-leaf">
              <option value="consumer">Consumer (I want to buy produce)</option>
              <option value="farmer">Farmer (I want to sell produce)</option>
            </select>
          </div>
          {form.role === "farmer" && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-stone-300">Farm name</label>
              <input name="farmName" required onChange={handleChange} className="w-full border border-gray-300 dark:border-stone-700 bg-white dark:bg-[#282118] text-gray-900 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-leaf" placeholder="e.g. Green Valley Farm" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-stone-300">
              {form.role === "farmer" ? "Farm Location (City / District)" : "Your Location (City / District)"}
            </label>
            <input
              name="location"
              required={form.role === "farmer"}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-stone-700 bg-white dark:bg-[#282118] text-gray-900 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-leaf"
              placeholder="e.g. Kolhapur, Maharashtra"
            />
          </div>
          {error && <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl border border-red-200 dark:border-red-900/50">{error}</p>}
          <button disabled={loading} className="w-full bg-leaf hover:bg-emerald-800 transition text-white font-semibold py-2.5 rounded-xl text-sm shadow-sm">
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
      </main>
    </div>
  );
}
