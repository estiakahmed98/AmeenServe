import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const CreateOrder = z.object({
  serviceId: z.string(),
  address: z.string().min(3),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  scheduledAt: z.string().optional(), // ISO
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const json = await req.json();
  const parsed = CreateOrder.safeParse(json);
  if (!parsed.success) return new Response("Invalid data", { status: 400 });

  const { serviceId, address, latitude, longitude, scheduledAt } = parsed.data;

  // generate human friendly code
  const code = `ORD-${Date.now()}`;

  const order = await db.order.create({
    data: {
      code,
      userId: (session.user as any).id || "",
      serviceId,
      address,
      latitude: latitude as any,
      longitude: longitude as any,
      status: "REQUESTED",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      currency: "BDT",
    },
  });

  return Response.json(order);
}
