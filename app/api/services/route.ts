import { db } from "@/lib/db";

export async function GET() {
  const services = await db.service.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return Response.json(services);
}
