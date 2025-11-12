import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { NextRequest } from "next/server";

const TrackSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracyM: z.number().optional(),
  headingDeg: z.number().optional(),
  speedKph: z.number().optional(),
  note: z.string().optional(),
  source: z.enum(["TECH_APP","CUSTOMER_APP","SERVER"]).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const parsed = TrackSchema.safeParse(body);
  if (!parsed.success) return new Response("Invalid", { status: 400 });

  const event = await db.trackingEvent.create({
    data: {
      orderId: id,
      ...parsed.data,
    } as any,
  });

  // TODO: push real-time event via Pusher here

  return Response.json(event);
}
