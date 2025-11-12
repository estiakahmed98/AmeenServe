import { db } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      address,
      city,
      latitude,
      longitude,
      bio,
      yearsExperience,
      skills = [], // array of service IDs
      serviceRadiusKm,
    } = body || {};

    const toNum = (v: any): number | null => {
      if (v === undefined || v === null || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    if (!name || !email || !password) {
      return Response.json(
        { error: "Missing required fields: name, email, password" },
        { status: 400 }
      );
    }

    const normEmail = typeof email === "string" ? email.trim().toLowerCase() : email;

    const existing = await db.user.findFirst({ where: { OR: [{ email: normEmail }] } });
    if (existing) {
      return Response.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        name,
        fullName: name,
        email: normEmail,
        passwordHash,
        role: "TECHNICIAN",
        address: address || null,
        city: city || null,
      },
    });

    // If the project uses a separate Technician model, create it
    let technicianEntityId: string | null = null;
    try {
      // Attempt to create a Technician row with a relation to the user
      const techRes = await (db as any).technician?.create?.({
        data: {
          userId: user.id,
          bio: bio ?? null,
          yearsExperience: toNum(yearsExperience),
          serviceRadiusKm: toNum(serviceRadiusKm),
        },
        select: { id: true },
      });
      if (techRes?.id) technicianEntityId = techRes.id as string;
    } catch (e) {
      // If there's no Technician model or it fails, ignore and continue
      console.warn("Technician model not used or create failed; continuing with User only");
    }

    // Optional default address
    if (latitude != null || longitude != null || address) {
      try {
        await db.userAddress.create({
          data: {
            userId: user.id,
            label: "Default",
            address: address || "",
            latitude: toNum(latitude) as any,
            longitude: toNum(longitude) as any,
            isDefault: true,
          },
        });
      } catch (e) {
        console.warn("Failed to create default address for technician", e);
      }
    }

    // Link selected services (support both schemas: technicianId -> User or -> Technician)
    if (Array.isArray(skills) && skills.length > 0) {
      try {
        const ids = skills.filter((s: any) => typeof s === "string");
        if (ids.length > 0) {
          const existingSvcs = await db.service.findMany({
            where: { id: { in: ids } },
            select: { id: true },
          });
          const validIds = new Set(existingSvcs.map((s) => s.id));

          const targetTechId = technicianEntityId ?? user.id;
          const linkData = ids
            .filter((id) => validIds.has(id))
            .map((serviceId) => ({ technicianId: targetTechId, serviceId, isActive: true }));

          if (linkData.length > 0) {
            try {
              await db.technicianService.createMany({ data: linkData, skipDuplicates: true });
            } catch (e) {
              // If FK expects Technician.id but we used user.id, try resolving real technician id
              if (!technicianEntityId) {
                try {
                  const tech = await (db as any).technician?.findFirst?.({ where: { userId: user.id }, select: { id: true } });
                  if (tech?.id) {
                    const linkData2 = ids
                      .filter((id) => validIds.has(id))
                      .map((serviceId) => ({ technicianId: tech.id as string, serviceId, isActive: true }));
                    if (linkData2.length > 0) {
                      await db.technicianService.createMany({ data: linkData2, skipDuplicates: true });
                    }
                  }
                } catch (e2) {
                  console.warn("Fallback link to Technician failed", e2);
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn("Failed to link technician services", e);
      }
    }

    return Response.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
  } catch (error: any) {
    console.error("Technician register error:", error);
    const message = error?.message || "Unknown error";
    // Basic Prisma error mapping
    if (typeof message === "string" && message.includes("Unique constraint")) {
      return Response.json({ error: "Email already exists" }, { status: 409 });
    }
    if (typeof message === "string" && message.includes("Foreign key")) {
      return Response.json({ error: "Invalid service selected" }, { status: 400 });
    }
    return Response.json(
      { error: "Failed to register technician", details: message },
      { status: 500 }
    );
  }
}
