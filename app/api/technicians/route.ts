import { NextRequest } from "next/server";

export async function GET(_req: NextRequest) {
	// Placeholder: return empty list
	return new Response(JSON.stringify([]), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}
