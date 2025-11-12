"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function SignupPage() {
  const [role, setRole] = useState<"USER" | "TECHNICIAN">("USER");
  const [form, setForm] = useState({
    firstName: "",
    otherNames: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    city: "",
    latitude: "",
    longitude: "",
    bio: "",
    yearsExperience: "",
    skills: "",
    serviceRadiusKm: "",
  });

  const [locationError, setLocationError] = useState<string | null>(null);
  const [availableServices, setAvailableServices] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [toast, setToast] = useState<null | { message: string; type: "success" | "error" }>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3000);
  };

  // Load services for technician skills selection
  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await axios.get("/api/services");
        // Expecting array of { id, name, ... }
        setAvailableServices(
          (res.data || []).map((s: any) => ({ id: s.id, name: s.name }))
        );
      } catch (e) {
        console.error("Failed to load services", e);
      }
    };
    loadServices();
  }, []);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));
      },
      (error) => {
        setLocationError(
          "Unable to retrieve your location. Please enter manually."
        );
        console.error("Error getting location: ", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const handleChange = (e: any) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (role === "USER") {
        await axios.post("/api/auth/signup", {
          name: `${form.firstName} ${form.otherNames}`,
          email: form.email,
          phone: form.phone,
          password: form.password,
          address: form.address,
          city: form.city,
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
          role,
        });
      } else {
        await axios.post("/api/technicians/register", {
          name: `${form.firstName} ${form.otherNames}`,
          email: form.email,
          password: form.password,
          address: form.address,
          city: form.city,
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
          bio: form.bio,
          yearsExperience: parseInt(form.yearsExperience),
          skills: selectedServiceIds,
          serviceRadiusKm: parseFloat(form.serviceRadiusKm),
        });
      }
      showToast("Account created successfully!", "success");
      window.setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.error || err?.message || "Something went wrong";
      showToast(msg, "error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-white relative overflow-hidden">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-md px-4 py-2 shadow-lg text-sm ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}
      {/* Top blue wave */}
      <div className="absolute top-0 left-0 w-full h-[180px] bg-linear-to-b from-sky-400 to-sky-300 rounded-b-[100px]" />

      {/* Signup card */}
      <div className="z-10 w-full max-w-md mt-24 mb-10 px-6">
        <div className="bg-white shadow-2xl rounded-3xl p-8">
          {/* Role selector */}
          <div className="flex justify-center mb-6">
            <div className="flex bg-gray-100 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setRole("USER")}
                className={`px-4 py-2 text-sm font-medium ${
                  role === "USER"
                    ? "bg-sky-500 text-white"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                User
              </button>
              <button
                type="button"
                onClick={() => setRole("TECHNICIAN")}
                className={`px-4 py-2 text-sm font-medium ${
                  role === "TECHNICIAN"
                    ? "bg-sky-500 text-white"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                Technician
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm text-gray-700">First name</label>
              <Input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Other names</label>
              <Input
                name="otherNames"
                value={form.otherNames}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Email</label>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Phone number</label>
              <Input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Password</label>
              <Input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Address</label>
              <Input
                name="address"
                value={form.address}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-700">City</label>
              <Input
                name="city"
                value={form.city}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-700">Location</label>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Use my current location
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    name="latitude"
                    type="number"
                    step="0.000001"
                    placeholder="Latitude"
                    value={form.latitude}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Input
                    name="longitude"
                    type="number"
                    step="0.000001"
                    placeholder="Longitude"
                    value={form.longitude}
                    onChange={handleChange}
                  />
                </div>
              </div>
              {locationError && (
                <p className="text-xs text-red-500">{locationError}</p>
              )}
            </div>

            {role === "TECHNICIAN" && (
              <>
                <div>
                  <label className="text-sm text-gray-700">Bio</label>
                  <Input
                    name="bio"
                    placeholder="Short description"
                    value={form.bio}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700">
                    Years of experience
                  </label>
                  <Input
                    name="yearsExperience"
                    type="number"
                    value={form.yearsExperience}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700">
                    Select skills (services)
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {availableServices.map((svc) => {
                      const active = selectedServiceIds.includes(svc.id);
                      return (
                        <button
                          key={svc.id}
                          type="button"
                          onClick={() => toggleService(svc.id)}
                          className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                            active
                              ? "bg-sky-100 border-sky-400 text-sky-700"
                              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                          aria-pressed={active}
                        >
                          {svc.name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Click to toggle. You can select multiple services.
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-700">
                    Service radius (km)
                  </label>
                  <Input
                    name="serviceRadiusKm"
                    type="number"
                    value={form.serviceRadiusKm}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
              <input type="checkbox" required />
              <span>
                Agree with{" "}
                <span className="text-blue-600 cursor-pointer">
                  terms & conditions
                </span>
              </span>
            </div>

            <Button
              type="submit"
              className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-lg mt-2"
            >
              Sign up
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            I’m already a member?{" "}
            <Link href="/login" className="text-blue-600 font-medium">
              Login
            </Link>
          </p>
        </div>
      </div>

      {/* Bottom design strip */}
      <div className="absolute bottom-0 left-0 w-full h-[80px] bg-linear-to-t from-sky-400 to-sky-300 rounded-t-[80px]" />
    </div>
  );
}
