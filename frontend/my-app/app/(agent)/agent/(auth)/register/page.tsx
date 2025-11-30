"use client";

import React, { useState, useMemo } from "react";
import {
  Headset,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BarChart,
  Users,
  Check,
} from "lucide-react";
import Link from "next/link";

const AgentRegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (value.trim() !== "") {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const passwordStrength = useMemo(() => {
    const password = formData.password;
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  }, [formData.password]);

  const getStrengthProps = () => {
    switch (passwordStrength) {
      case 1:
        return { label: "Weak", color: "bg-red-500", width: "w-1/3" };
      case 2:
        return { label: "Medium", color: "bg-yellow-500", width: "w-2/3" };
      case 3:
        return { label: "Strong", color: "bg-green-500", width: "w-full" };
      default:
        return { label: "", color: "bg-gray-200", width: "w-0" };
    }
  };

  const strengthProps = getStrengthProps();

  const passwordReqs = {
    length: formData.password.length >= 6,
    number: /\d/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };

  const validateForm = () => {
    const newErrors = { fullName: "", email: "", password: "", confirmPassword: "" };
    let isValid = true;

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email address is invalid.";
      isValid = false;
    }

    if (Object.values(passwordReqs).some(req => !req)) {
        newErrors.password = "Password does not meet all requirements.";
        isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      console.log("Form Data Submitted:", formData);
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
  };

  const isFieldValid = (fieldName: keyof typeof errors) =>
    formData[fieldName as keyof typeof formData] !== "" && errors[fieldName] === "";

  return (
    <main className="min-h-screen w-full bg-white font-sans">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-10">
        {/* Left Side - Form */}
        <div className="col-span-1 flex items-center justify-center bg-white py-12 lg:col-span-4">
          <div className="w-full max-w-md p-6 lg:max-w-[450px] lg:p-8">
            <div className="mb-8 text-center">
              <Headset className="mx-auto mb-4 text-indigo-600" size={56} strokeWidth={1.5} />
              <h1 className="text-3xl font-bold text-gray-900">Join Our Team</h1>
              <p className="mt-2 text-base text-gray-500">Create your agent account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><User className="h-5 w-5 text-gray-400" /></span>
                  <input id="fullName" name="fullName" type="text" placeholder="John Doe" value={formData.fullName} onChange={handleInputChange} className={`block h-[52px] w-full rounded-lg border-2 py-3 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 sm:text-sm ${errors.fullName ? 'border-red-500' : 'border-gray-200 focus:border-indigo-500'}`} />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    {isFieldValid("fullName") && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {errors.fullName && <AlertCircle className="h-5 w-5 text-red-500" />}
                  </div>
                </div>
                {errors.fullName && <p className="mt-2 text-sm text-red-600 transition-all">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Mail className="h-5 w-5 text-gray-400" /></span>
                  <input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} className={`block h-[52px] w-full rounded-lg border-2 py-3 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 sm:text-sm ${errors.email ? 'border-red-500' : 'border-gray-200 focus:border-indigo-500'}`} />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    {isFieldValid("email") && !errors.email && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {errors.email && <AlertCircle className="h-5 w-5 text-red-500" />}
                  </div>
                </div>
                {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Lock className="h-5 w-5 text-gray-400" /></span>
                  <input id="password" name="password" type={passwordVisible ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleInputChange} className={`block h-[52px] w-full rounded-lg border-2 py-3 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 sm:text-sm ${errors.password ? 'border-red-500' : 'border-gray-200 focus:border-indigo-500'}`} />
                  <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600">
                    {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-600">Password Strength: {strengthProps.label}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${strengthProps.color} transition-all duration-300`} style={{ width: strengthProps.width }}></div>
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-gray-500">
                        <li className={`flex items-center transition-colors ${passwordReqs.length ? 'text-green-600' : ''}`}>
                            <Check className="h-4 w-4 mr-2" /> At least 6 characters
                        </li>
                        <li className={`flex items-center transition-colors ${passwordReqs.number ? 'text-green-600' : ''}`}>
                            <Check className="h-4 w-4 mr-2" /> Contains a number
                        </li>
                        <li className={`flex items-center transition-colors ${passwordReqs.special ? 'text-green-600' : ''}`}>
                            <Check className="h-4 w-4 mr-2" /> Contains a special character
                        </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Lock className="h-5 w-5 text-gray-400" /></span>
                  <input id="confirmPassword" name="confirmPassword" type={confirmPasswordVisible ? "text" : "password"} placeholder="••••••••" value={formData.confirmPassword} onChange={handleInputChange} className={`block h-[52px] w-full rounded-lg border-2 py-3 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 sm:text-sm ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200 focus:border-indigo-500'}`} />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    {formData.confirmPassword && formData.password === formData.confirmPassword && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {errors.confirmPassword && <AlertCircle className="h-5 w-5 text-red-500" />}
                  </div>
                </div>
                {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>

              {/* Terms Acceptance */}
              <div className="flex items-start">
                <div className="flex h-6 items-center">
                  <input id="termsAccepted" name="termsAccepted" type="checkbox" checked={formData.termsAccepted} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                </div>
                <div className="ml-3 text-sm leading-6">
                  <label htmlFor="termsAccepted" className="text-gray-700">
                    I agree to the{" "}
                    <a href="#" className="font-semibold text-indigo-600 hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="font-semibold text-indigo-600 hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>

              {/* Register Button */}
              <button type="submit" disabled={isLoading || !formData.termsAccepted} className="flex h-[52px] w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-base font-bold text-white shadow-md transition-all duration-300 hover:brightness-110 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70">
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Create Agent Account"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/agent/login" className="font-medium text-indigo-600 hover:underline">
                Sign in
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

export default AgentRegisterPage;