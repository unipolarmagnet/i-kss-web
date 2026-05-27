import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isProtected =
    path.startsWith("/dashboard") ||
    path.startsWith("/admin") ||
    path.startsWith("/classes") ||
    path.startsWith("/preferences") ||
    path.startsWith("/topics") ||
    path.startsWith("/zadania");
  if (isProtected && !req.auth) {
    return NextResponse.redirect(new URL("/auth/signin", req.nextUrl.origin));
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/classes/:path*",
    "/preferences/:path*",
    "/topics/:path*",
    "/zadania/:path*",
  ],
};
