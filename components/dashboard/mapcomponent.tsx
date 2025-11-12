"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Crosshair, Plus, Minus } from "lucide-react";
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

export function MapComponent() {
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>([
    23.8103, 90.4125,
  ]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [userIcon, setUserIcon] = useState<any>(null);
  const [techIcon, setTechIcon] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const [tracking, setTracking] = useState<boolean>(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [showNotFound, setShowNotFound] = useState<boolean>(false);
  const initialCenter = useRef<[number, number]>([23.8103, 90.4125]);


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
    if (list.length === 0) {
      setShowNotFound(true);
    } else {
      if (showNotFound) setShowNotFound(false);
    }
  };

  const toggleTracking = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    try {
      // Ask permission first
      const permission = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });

      if (permission.state === "denied") {
        alert("Please enable location permission in your browser settings.");
        return;
      }

      if (tracking) {
        if (watchId != null) navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
        setTracking(false);
        return;
      }

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const next: [number, number] = [
            pos.coords.latitude,
            pos.coords.longitude,
          ];
          setUserLocation(next);
          if (map) {
            map.flyTo(next, Math.max(map.getZoom(), 15), { duration: 0.6 });
          }
        },
        (err) => {
          console.error("Location tracking error:", err);
          if (err.code === 1) {
            alert("Permission denied. Please allow location access.");
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000, // refresh every second
          timeout: 20000,
        }
      );

      setWatchId(id as unknown as number);
      setTracking(true);
    } catch (e) {
      console.error("Permission query failed:", e);
    }
  };

  // When tracking, keep the map centered on the latest userLocation
  useEffect(() => {
    if (!tracking || !map || !Array.isArray(userLocation)) return;
    map.flyTo(userLocation, Math.max(map.getZoom(), 15), { duration: 0.4 });
  }, [userLocation, tracking, map]);
  // Cleanup geolocation watcher on unmount
  useEffect(() => {
    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  if (!isClient) {
    return null; // or a loading spinner
  }

  return (
    <div className="relative w-full h-screen">
      {/* Control Panel: Bottom on mobile, Top on desktop */}
      <div className="absolute bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:top-6 md:bottom-auto md:-translate-x-1/2 z-1000 flex flex-col md:flex-row items-center gap-3 bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl px-4 py-3 w-auto">
        <h2 className="hidden md:block text-lg font-semibold text-gray-800">
          🛠️ AmeenServe
        </h2>

        <Select onValueChange={setSelectedService}>
          <SelectTrigger className="w-full md:w-[240px] font-medium text-gray-700">
            <SelectValue placeholder="Select a Service" />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <div className="p-2 text-sm text-gray-500">Loading...</div>
            ) : error ? (
              <div className="p-2 text-sm text-red-500">{error}</div>
            ) : services.length === 0 ? (
              <div className="p-2 text-sm text-gray-500">No services</div>
            ) : (
              services.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Button
          onClick={findNearbyTechnicians}
          className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl px-5 py-2 transition-all"
        >
          📍 Find Technicians
        </Button>
      </div>

      {/* Floating Action Button: Sign In */}
      <div className="absolute top-6 right-4 z-1000">
        <Link href="/login">
          <Button className="bg-gray-800 hover:bg-black text-white font-semibold rounded-full shadow-xl px-5 py-2.5 transition-all">
            Sign in
          </Button>
        </Link>
      </div>

      {/* Map */}
      {isClient && (
        <MapContainer
          center={initialCenter.current}
          zoom={13}
          style={{ height: "100vh", width: "100%" }}
          zoomControl={false}
          whenReady={(((e: any) => setMap(e?.target)) as unknown) as any}
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

      {map && (
        <div className="absolute right-4 top-24 md:top-1/2 md:-translate-y-1/2 z-1000 flex flex-col items-center gap-2">
          <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl p-1.5 flex flex-col items-center">
            <button
              onClick={toggleTracking}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${tracking ? "bg-gray-800 text-white" : "bg-white text-gray-800 hover:bg-gray-100"}`}
              aria-label="Toggle location tracking"
            >
              <Crosshair className="w-5 h-5" />
            </button>
            <div className="w-full h-px bg-gray-200 my-1.5"></div>
            <button
              onClick={() => map && map.setZoom(map.getZoom() + 1)}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white text-gray-800 hover:bg-gray-100 transition-colors"
              aria-label="Zoom in"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => map && map.setZoom(map.getZoom() - 1)}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white text-gray-800 hover:bg-gray-100 transition-colors"
              aria-label="Zoom out"
            >
              <Minus className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {showNotFound && (
        <div className="fixed inset-0 z-1200 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-sm">
            <div className="text-lg font-semibold text-gray-800 mb-2">
              No technicians found
            </div>
            <div className="text-sm text-gray-600 mb-4">
              Try changing the service or moving the map to a different area.
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setShowNotFound(false)}
                className="bg-gray-800 hover:bg-black text-white"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
