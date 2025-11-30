"use client"

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { baseURL } from "@/lib/api";
import {
  Headset,
  User,
  Mail,
  Phone,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const CustomerRegisterPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Basic validation on change
    if (value.trim() !== "") {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setApiError(null);
  };

  const validateForm = () => {
    const newErrors = { fullName: "", email: "", phone: "" };
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

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);

    if (validateForm()) {
      setIsLoading(true);
      try {
        const response = await fetch(`${baseURL}/customers/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to register.');
        }

        router.push('/customer/call');
      } catch (error) {
        setApiError((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isFieldValid = (fieldName: keyof typeof formData) =>
    formData[fieldName].trim() !== "" && errors[fieldName] === "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-200 to-purple-300 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-10 shadow-lg">
        <div className="flex justify-center mb-6">
          <Headset size={64} className="text-gray-700" />
        </div>
        <h1 className="text-center text-3xl font-bold text-gray-800">
          Welcome! Let&apos;s Get Started
        </h1>
        <p className="mt-2 text-center text-base text-gray-500">
          Connect with our support agents in seconds
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Form Inputs */}
          {[
            { name: "fullName", label: "Your Name", placeholder: "John Doe", icon: User, type: "text" },
            { name: "email", label: "Email Address", placeholder: "john@example.com", icon: Mail, type: "email" },
            { name: "phone", label: "Phone Number", placeholder: "+1 (555) 123-4567", icon: Phone, type: "tel" },
          ].map(field => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-600">{field.label}</label>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <field.icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
                <input id={field.name} name={field.name} type={field.type} placeholder={field.placeholder} value={formData[field.name as keyof typeof formData]} onChange={handleInputChange} className={`block w-full rounded-lg border-2 py-3 pl-10 pr-10 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-sm h-12 transition-all duration-300 ease-in-out ${errors[field.name as keyof typeof errors] ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`} />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  {isFieldValid(field.name as keyof typeof formData) && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {errors[field.name as keyof typeof errors] && <AlertCircle className="h-5 w-5 text-red-500" />}
                </div>
              </div>
              {errors[field.name as keyof typeof errors] && <p className="mt-2 text-sm text-red-600">{errors[field.name as keyof typeof errors]}</p>}
              {field.name === 'phone' && <p className="mt-2 text-xs text-gray-500">We&apos;ll use this for call identification.</p>}
            </div>
          ))}

          {apiError && (
            <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-100 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <p><strong>Registration failed:</strong> {apiError}</p>
            </div>
          )}
          <button type="submit" disabled={isLoading} className="flex w-full h-14 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-base font-bold text-white shadow-md transition-all duration-300 hover:brightness-110 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Register & Start Calling"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default CustomerRegisterPage;
