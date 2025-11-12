import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: async ({ token, req }) => {
      const path = req.nextUrl.pathname;

      // Public routes
  if (path.startsWith("/login") || path === "/") return true;

  // Allow some public API endpoints (e.g. services list) to be fetched without auth
  if (path.startsWith("/api/services")) return true;

      // Require auth for everything else
      if (!token) return false;

      // Example RBAC guards:
      if (path.startsWith("/dashboard/admin")) {
        return token.role === "ADMIN" || token.role === "MANAGER";
      }
      if (path.startsWith("/dashboard/technician")) {
        return token.role === "TECHNICIAN" || token.role === "ADMIN" || token.role === "MANAGER";
      }

      return true;
    },
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
