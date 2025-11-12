import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { NextRequest } from "next/server";

const StatusSchema = z.object({
  to: z.enum(["ARRIVING","STARTED","IN_PROGRESS","COMPLETED","CANCELLED","NO_SHOW"]),
  reason: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const parsed = StatusSchema.safeParse(body);
  if (!parsed.success) return new Response("Invalid", { status: 400 });

  const { to, reason } = parsed.data;

  const order = await db.order.update({
    where: { id },
    data: {
      status: to as any,
      ...(to === "STARTED" ? { startedAt: new Date() } : {}),
      ...(to === "COMPLETED" ? { completedAt: new Date() } : {}),
      statusHistory: {
        create: {
          to: to as any,
          actorId: (session.user as any).id,
          reason,
        },
      },
    },
  });

  return Response.json(order);
}
