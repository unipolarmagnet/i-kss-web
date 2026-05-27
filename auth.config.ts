import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const ALLOWED_HD = process.env.ALLOWED_HD ?? "stuba.sk";

// Edge-safe: no Prisma, no Node-only APIs.
// Imported by both auth.ts (full Node) and middleware.ts (edge).
export default {
  providers: [
    Google({
      authorization: {
        params: {
          hd: ALLOWED_HD,
          prompt: "select_account",
        },
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
} satisfies NextAuthConfig;
