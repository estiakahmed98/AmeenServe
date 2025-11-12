import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardHome() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role ?? "GUEST";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2">Welcome, role: <b>{role}</b></p>
    </div>
  );
}
