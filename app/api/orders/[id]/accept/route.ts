import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== "TECHNICIAN" && role !== "ADMIN" && role !== "MANAGER"))
    return new Response("Unauthorized", { status: 401 });

  const order = await db.order.update({
    where: { id },
    data: {
      technician: role === "TECHNICIAN"
        ? { connect: { id: (session.user as any).id } }
        : undefined,
      status: "ACCEPTED",
      statusHistory: {
        create: {
          from: "PENDING",
          to: "ACCEPTED",
          actorId: (session.user as any).id,
        },
      },
    },
    include: { user: true, technician: true, service: true },
  });

  return Response.json(order);
}
