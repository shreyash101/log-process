"use client";
import { useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    //   options: { emailRedirectTo: null },
    });
  
    if (error) {
      setError(error.message);
    } else {
      // Immediately log in after signing up
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
  
      if (loginError) {
        setError(loginError.message);
      } else {
        router.push("/log-dashboard"); // Redirect to dashboard
      }
    }
  
    setLoading(false);
  };

  const signInWithGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/log-dashboard`,
      }
    });
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleSignup} className="p-6 bg-white shadow-md rounded">
        <h2 className="text-xl font-bold mb-4">Sign Up</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2 mb-2 w-full"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border p-2 mb-2 w-full"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white p-2 w-full cursor-pointer"
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
        <div className="my-4 text-center">— OR —</div>

        <button
          type="button"
          onClick={signInWithGitHub}
          className="w-full bg-gray-900 text-white p-2 rounded cursor-pointer"
        >
          Sign in with GitHub
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>
    </div>
  );
}
