import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AppNav from "@/components/AppNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  if (session.user.role !== "admin") redirect("/dashboard");

  return (
    <>
      <AppNav />
      <main className="container py-4">{children}</main>
    </>
  );
}
