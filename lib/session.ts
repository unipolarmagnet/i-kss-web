import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const IMPERSONATE_COOKIE = "ks-impersonate";

export type SessionUser = {
  id: string;
  email: string;
  role: "admin" | "student";
  classId: number | null;
  name: string | null;
  image: string | null;
};

export type EffectiveSession = {
  real: SessionUser;
  effective: SessionUser;
  isImpersonating: boolean;
};

export async function getEffectiveSession(): Promise<EffectiveSession | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  const real: SessionUser = {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    classId: session.user.classId,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  };

  let effective = real;

  // Impersonation only honored when real user is admin. Non-admin tampering
  // with the cookie has no effect.
  if (real.role === "admin") {
    const c = await cookies();
    const targetId = c.get(IMPERSONATE_COOKIE)?.value;
    if (targetId && targetId !== real.id) {
      const target = await prisma.user.findUnique({
        where: { id: targetId },
      });
      if (target) {
        effective = {
          id: target.id,
          email: target.email,
          role: target.role as "admin" | "student",
          classId: target.classId,
          name: target.name,
          image: target.image,
        };
      }
    }
  }

  return {
    real,
    effective,
    isImpersonating: real.id !== effective.id,
  };
}
