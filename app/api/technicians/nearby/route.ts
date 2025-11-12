import { NextRequest } from "next/server";
import { db } from "@/lib/db";

// Haversine distance in kilometers
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const c = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const d = 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
  return R * d;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");

    if (!serviceId || !latStr || !lngStr) {
      return Response.json({ error: "Missing required params: serviceId, lat, lng" }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return Response.json({ error: "Invalid lat/lng" }, { status: 400 });
    }

    // Find technician-service links for the selected service
    const techServices = (await db.technicianService.findMany({
      where: {
        serviceId,
        isActive: true,
      },
      // Cast include as any to avoid TS complaints if Prisma client wasn't regenerated yet
      include: ({ technician: true, service: true } as any),
    } as any)) as any[];

    // Build response with distance and filter coordinates
    const results = techServices
      .map((ts: any) => {
        const t = ts.technician as any;
        if (!t) return null;
        // Filter only active technician users with role TECHNICIAN
        if (t.role !== "TECHNICIAN" || t.status !== "ACTIVE") return null;
        const tLat = t.currentLat ? Number(t.currentLat) : null;
        const tLng = t.currentLng ? Number(t.currentLng) : null;
        if (tLat == null || tLng == null) return null;
        const distKm = haversineKm({ lat, lng }, { lat: tLat, lng: tLng });
        const radius = t.serviceRadiusKm != null ? Number(t.serviceRadiusKm) : null;
        const within = radius == null ? true : distKm <= radius + 0.001;
        if (!within) return null;
        return {
          id: t.id as string,
          name: t.fullName || t.name || "Technician",
          latitude: tLat,
          longitude: tLng,
          distanceKm: distKm,
          serviceId: ts.serviceId,
          serviceName: ts.service?.name ?? undefined,
          ratingAvg: t.ratingAvg != null ? Number(t.ratingAvg) : 0,
          ratingCount: t.ratingCount ?? 0,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
      .slice(0, 50);

    return Response.json(results);
  } catch (error: any) {
    console.error("Error in technicians/nearby:", error);
    return Response.json({ error: "Failed to find nearby technicians", details: error?.message }, { status: 500 });
  }
}
