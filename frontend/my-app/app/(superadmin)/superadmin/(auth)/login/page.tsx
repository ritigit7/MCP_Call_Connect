"use client";

import React, { useState, useEffect } from "react";
import { Lock, Mail, Eye, EyeOff, Shield, ShieldCheck, Wifi } from "lucide-react";
import { useRouter } from "next/navigation";
import { baseURL } from "@/lib/api";

const SuperAdminLoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [particles, setParticles] = useState<Array<any>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      width: `${Math.random() * 3 + 1}px`,
      height: `${Math.random() * 3 + 1}px`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${Math.random() * 10 + 5}s`,
    }));

    setParticles(newParticles);
  }, []);

  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${baseURL}/superadmin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store auth data
      localStorage.setItem("superAdminToken", data.token);
      localStorage.setItem("superAdmin", JSON.stringify(data.superAdmin));

      // Redirect to dashboard
      router.push("/superadmin/dashboard");
    } catch (err) {
      setError((err as Error).message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative min-h-screen w-full bg-gradient-to-br from-[#1F1335] to-[#0F172A] text-white overflow-hidden">
        {/* Particle Effects */}
        <div className="absolute inset-0 z-0">
          {particles.map((style, i) => (
            <div
              key={i}
              className="absolute bg-white/10 rounded-full animate-particle"
              style={style}
            />
          ))}
        </div>

        {/* Security Indicators */}
        <div className="absolute top-4 left-4 flex items-center gap-2 text-xs text-green-400">
          <ShieldCheck size={16} />
          <span>Secure Connection</span>
        </div>

        <main className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div
            className="w-full max-w-[500px] bg-black/30 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/10
                     p-12 transition-all duration-300 hover:shadow-purple-500/20 hover:border-purple-500/50"
          >
            {/* Header */}
            <div className="text-center mb-10">
              <div className="flex justify-center mb-4">
                <Lock
                  size={64}
                  className="text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]"
                />
              </div>
              <h1 className="text-3xl font-bold text-white">
                SuperAdmin Portal
              </h1>
              <p className="text-gray-400 mt-2">Authorized Access Only</p>
              <p className="text-orange-400/80 text-xs mt-4 flex items-center justify-center gap-2">
                <span className="text-base">(Warning)</span> All actions are logged and monitored
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              {/* Email Input */}
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="email"
                  placeholder="admin@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 bg-[#1E293B] rounded-lg pl-12 pr-4 text-white placeholder-gray-500
                           border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type={passwordVisible ? "text" : "password"}
                  placeholder="Enter secure password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 bg-[#1E293B] rounded-lg pl-12 pr-12 text-white placeholder-gray-500
                           border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Security Features Display */}
              <div className="flex justify-between text-xs text-gray-500 px-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-green-500" />
                  <span>256-bit encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi size={14} className="text-green-500" />
                  <span>Secure connection active</span>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 flex items-center justify-center bg-gradient-to-r from-red-600 to-purple-600 rounded-lg
                         text-white font-bold text-lg tracking-wide
                         transition-all duration-300
                         hover:from-red-700 hover:to-purple-700 hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]
                         disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <Shield className="animate-spin" size={24} />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  "Access Admin Panel"
                )}
              </button>
            </form>

            {/* Last Login Attempt */}
            <div className="text-center mt-4 text-xs text-gray-500">
              {/* Example of a failed attempt message */}
              {/* <p className="text-red-400">Last failed attempt: 2025-11-29 05:00:15 UTC</p> */}
            </div>

            {/* Footer */}
            <footer className="text-center mt-8">
              <p className="text-xs text-gray-500 mb-2">
                Protected by enterprise-grade security protocols.
              </p>
              <p className="text-xs text-gray-500">
                Need help?{" "}
                <a href="#" className="text-blue-400 hover:underline">
                  Contact system administrator
                </a>
              </p>
            </footer>
          </div>
        </main>
      </div>

    </>
  );
};

export default SuperAdminLoginPage;