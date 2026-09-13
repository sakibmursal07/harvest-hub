import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabaseClient";

export default function Signup() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "consumer", farmName: "" });
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

    // Step 2: create their profile row (name, role, farm name if applicable)
    const userId = data.user.id;
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      full_name: form.name,
      role: form.role,
      farm_name: form.role === "farmer" ? form.farmName : null,
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
        <h1 className="text-2xl font-bold mb-5">Create your account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input name="name" required onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" name="email" required onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" name="password" required minLength={6} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">I am a...</label>
            <select name="role" onChange={handleChange} value={form.role} className="w-full border rounded px-3 py-2">
              <option value="consumer">Consumer (I want to buy produce)</option>
              <option value="farmer">Farmer (I want to sell produce)</option>
            </select>
          </div>
          {form.role === "farmer" && (
            <div>
              <label className="block text-sm font-medium mb-1">Farm name</label>
              <input name="farmName" onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
          )}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button disabled={loading} className="w-full bg-leaf text-white font-semibold py-2.5 rounded">
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
      </main>
    </div>
  );
}
