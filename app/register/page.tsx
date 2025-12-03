// Page: Register
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { trackSignup } from "@/lib/analytics";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");

    // Try to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message === "Invalid login credentials") {
        // If login fails due to invalid credentials, try sign up
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          console.error("Signup failed:", signUpError.message);
          setError(signUpError.message);
          return;
        }

        // Track successful signup
        trackSignup("email");
      } else {
        setError(signInError.message);
        return;
      }
    }

    // If sign in or sign up succeeded, move forward
    router.push("/create");
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Register</h1>

      <label className="block font-medium mb-1">Email</label>
      <input
        className="w-full p-2 border rounded mb-4"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />

      <label className="block font-medium mb-1">Password</label>
      <input
        className="w-full p-2 border rounded mb-4"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
      />

      {error && <p className="text-red-600 mb-2">⚠ {error}</p>}

      <button
        className="bg-black text-white px-4 py-2 rounded w-full"
        onClick={handleRegister}
      >
        Register / Sign In
      </button>
    </div>
  );
}
