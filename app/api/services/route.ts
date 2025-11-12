import { db } from "@/lib/db";

export async function GET() {
  try {
    console.log('Fetching services from database...');
    const services = await db.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    
    console.log('Fetched services:', services);
    
    if (!services || services.length === 0) {
      console.warn('No active services found in the database');
      return Response.json([], { status: 200 });
    }
    
    return Response.json(services);
  } catch (error: any) {
    console.error('Error fetching services:', error);
    return Response.json(
      { error: 'Failed to fetch services', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
