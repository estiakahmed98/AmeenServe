import { NextRequest } from "next/server";

// Minimal placeholder handler for /api/orders/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Placeholder: return 204 if no specific behaviour is required here yet
  return new Response(null, { status: 204 });
}
