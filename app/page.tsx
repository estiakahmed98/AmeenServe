"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Dynamically import Leaflet components with SSR disabled
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const { Marker } = mod;
      return function CustomMarker(props: any) {
        return <Marker {...props} />;
      };
    }),
  { ssr: false }
);

const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

export default function Home() {
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>([
    23.8103, 90.4125,
  ]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [userIcon, setUserIcon] = useState<any>(null);
  const [techIcon, setTechIcon] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const L = require("leaflet");
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const userIcon = L.icon({
        iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        iconSize: [32, 32],
      });

      const techIcon = L.icon({
        iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
        iconSize: [32, 32],
      });

      setUserIcon(userIcon);
      setTechIcon(techIcon);
    }

    const fetchServices = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/api/services");
        console.log("Fetched services:", response.data);
        setServices(response.data || []);
      } catch (err) {
        console.error("Error fetching services:", err);
        setError("Failed to load services. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, []);

  const findNearbyTechnicians = async () => {
    if (!selectedService) {
      alert("Please select a service first.");
      return;
    }
    const res = await axios.get("/api/technicians/nearby", {
      params: {
        serviceId: selectedService,
        lat: userLocation[0],
        lng: userLocation[1],
      },
    });
    const data = res?.data;
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.items)
      ? data.items
      : [];
    setTechnicians(list);
  };

  if (!isClient) {
    return null; // or a loading spinner
  }

  return (
    <div className="relative w-full h-screen">
      {/* Control panel */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-1000 flex flex-col md:flex-row items-center gap-3 bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl px-4 py-3">
        <h2 className="hidden md:block text-lg font-semibold text-gray-800">
          🛠️ AmeenServe
        </h2>

        <Select onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[220px] md:w-[240px] font-medium text-gray-700">
            <SelectValue placeholder="Select a Service Category" />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <div className="p-2 text-sm text-gray-500">
                Loading services...
              </div>
            ) : error ? (
              <div className="p-2 text-sm text-red-500">{error}</div>
            ) : services.length === 0 ? (
              <div className="p-2 text-sm text-gray-500">
                No services available
              </div>
            ) : (
              Array.from(
                new Map(
                  services
                    .filter((s) => s.category)
                    .map((s) => [s.category.id, s.category])
                ).values()
              ).map((cat: any) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {selectedCategory && (
          <Select onValueChange={setSelectedService}>
            <SelectTrigger className="w-[220px] md:w-[240px] font-medium text-gray-700">
              <SelectValue placeholder="Select a Service" />
            </SelectTrigger>
            <SelectContent>
              {services
                .filter((s) => s.categoryId === selectedCategory)
                .map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}

        <Button
          onClick={findNearbyTechnicians}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl px-5 py-2 transition-all"
        >
          📍 Find Technicians
        </Button>
      </div>

      {/* Map */}
      {isClient && (
        <MapContainer
          center={userLocation}
          zoom={13}
          style={{ height: "100vh", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User marker */}
          {userIcon && (
            <Marker position={userLocation} icon={userIcon}>
              <Popup>You are here</Popup>
            </Marker>
          )}

          {/* Technicians */}
          {(Array.isArray(technicians) ? technicians : []).map((tech) => (
            <Marker
              key={tech.id}
              position={[tech.latitude, tech.longitude]}
              icon={techIcon}
            >
              <Popup>
                <b>{tech.name}</b> <br />
                {tech.serviceType}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}
