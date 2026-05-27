import Link from "next/link";
import { auth } from "@/auth";
import Brand from "@/components/Brand";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-vh-100 d-flex align-items-center bg-light py-5">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-md-5 text-center">
            <div
              className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-4"
              style={{ width: 88, height: 88 }}
            >
              <svg
                width="44"
                height="44"
                fill="currentColor"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path d="M4.355.522a.5.5 0 0 1 .623.333l.291.956A5 5 0 0 1 8 1.5c.967 0 1.84.232 2.567.81l.291-.955a.5.5 0 1 1 .956.29l-.41 1.352A5 5 0 0 1 13 6h.5a.5.5 0 0 0 .5-.5V5a.5.5 0 0 1 1 0v.5A1.5 1.5 0 0 1 13.5 7H13v1h1.5a.5.5 0 0 1 0 1H13v1h.5a1.5 1.5 0 0 1 1.5 1.5v.5a.5.5 0 1 1-1 0v-.5a.5.5 0 0 0-.5-.5H13a5 5 0 0 1-10 0h-.5a.5.5 0 0 0-.5.5v.5a.5.5 0 1 1-1 0v-.5A1.5 1.5 0 0 1 2.5 10H3V9H1.5a.5.5 0 0 1 0-1H3V7h-.5A1.5 1.5 0 0 1 1 5.5V5a.5.5 0 0 1 1 0v.5a.5.5 0 0 0 .5.5H3c0-1.364.547-2.601 1.432-3.503l-.41-1.352a.5.5 0 0 1 .333-.623M4 7v4a4 4 0 0 0 3.5 3.97V7zm4.5 0v7.97A4 4 0 0 0 12 11V7zM12 6a4 4 0 0 0-1.334-2.982A3.98 3.98 0 0 0 8 2a3.98 3.98 0 0 0-2.667 1.018A4 4 0 0 0 4 6z" />
              </svg>
            </div>

            <h1 className="display-6 mb-2">
              <Brand />
            </h1>
            <p className="text-muted fw-medium mb-1">
              Kvalita softvérových systémov
            </p>
            <p className="text-muted small mb-4">
              Predmetová stránka pre študentov FEI STU.
            </p>

            {session?.user ? (
              <Link href="/dashboard" className="btn btn-primary btn-lg px-4">
                Pokračovať do aplikácie
              </Link>
            ) : (
              <Link href="/auth/signin" className="btn btn-primary btn-lg px-4">
                Prihlásiť sa
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
