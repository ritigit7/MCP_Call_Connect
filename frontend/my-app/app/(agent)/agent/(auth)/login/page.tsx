"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Headset,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  BarChart,
  Users,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { baseURL } from "@/lib/api";

const AgentLoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      setApiError("Email and password are required.");
      return;
    }
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await fetch(`${baseURL}/agents/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please try again.');
      }

      // Store token and redirect
      if (data.token) {
        localStorage.setItem('agent-token', data.token);
        if (data.agent && data.agent.id) {
          localStorage.setItem('agent-id', data.agent.id);
        }
        router.push('/agent/dashboard');
      } else {
        throw new Error('No authentication token received.');
      }

    } catch (error) {
      setApiError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-white font-sans">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-10">
        {/* Left Side - Login Form */}
        <div className="col-span-1 flex items-center justify-center bg-white py-12 lg:col-span-4">
          <div className="w-full max-w-md p-10 lg:max-w-[450px] lg:p-[40px]">
            {/* Brand Header */}
            <div className="mb-8 text-center">
              <Headset
                className="mx-auto mb-4 text-indigo-600"
                size={64}
                strokeWidth={1.5}
              />
              <h1 className="text-3xl font-bold text-gray-900">Agent Portal</h1>
              <p className="mt-2 text-base text-gray-500">
                Sign in to manage customer calls
              </p>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="block h-[52px] w-full rounded-lg border-2 border-gray-200 py-3 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 sm:text-sm"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="block h-[52px] w-full rounded-lg border-2 border-gray-200 py-3 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                  >
                    {passwordVisible ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a
                    href="#"
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* API Error Message */}
              {apiError && (
                <div className="flex items-center space-x-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p><strong>Login failed:</strong> {apiError}</p>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-[52px] w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-base font-bold text-white shadow-md transition-all duration-300 hover:brightness-110 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Register Link */}
            <p className="mt-8 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/agent/register"
                className="font-medium text-indigo-600 hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side - Brand Area */}
        <div className="relative col-span-6 hidden items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-12 lg:flex">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold leading-tight">
              Empowering Agents,
              <br />
              Delighting Customers.
            </h2>
            <p className="mt-4 max-w-lg text-lg text-purple-200">
              Our platform provides all the tools you need to deliver
              exceptional support and manage interactions seamlessly.
            </p>
            <div className="mt-10 flex justify-center gap-8">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-purple-300" />
                <span className="text-lg font-semibold">Join 500+ agents</span>
              </div>
              <div className="flex items-center gap-3">
                <BarChart className="h-8 w-8 text-purple-300" />
                <span className="text-lg font-semibold">10,000+ calls daily</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AgentLoginPage;