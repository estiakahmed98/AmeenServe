import { db } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      password,
      address,
      city,
      latitude,
      longitude,
      role = "USER",
    } = body || {};

    if (!name || !email || !password) {
      return Response.json(
        { error: "Missing required fields: name, email, password" },
        { status: 400 }
      );
    }

    const existing = await db.user.findFirst({ where: { OR: [{ email }, { phone }] } });
    if (existing) {
      return Response.json(
        { error: "User with this email or phone already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        name,
        fullName: name,
        email,
        phone: phone || null,
        passwordHash,
        address: address || null,
        city: city || null,
        role: role === "TECHNICIAN" ? "TECHNICIAN" : "USER",
      },
    });

    // Optionally save a default address entry if lat/lng present
    if (latitude != null || longitude != null) {
      try {
        await db.userAddress.create({
          data: {
            userId: user.id,
            label: "Default",
            address: address || "",
            latitude: latitude != null ? Number(latitude) : null,
            longitude: longitude != null ? Number(longitude) : null,
            isDefault: true,
          },
        });
      } catch (e) {
        console.warn("Failed to create default address for user", e);
      }
    }

    return Response.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
  } catch (error: any) {
    console.error("Signup error:", error);
    return Response.json(
      { error: "Failed to sign up", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
