import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== "TECHNICIAN" && role !== "ADMIN" && role !== "MANAGER"))
    return new Response("Unauthorized", { status: 401 });

  const order = await db.order.update({
    where: { id: params.id },
    data: {
      technician: role === "TECHNICIAN"
        ? { connect: { userId: (session.user as any).id } }
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
