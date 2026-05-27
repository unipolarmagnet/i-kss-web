import Link from "next/link";
import { signOut } from "@/auth";
import { getEffectiveSession } from "@/lib/session";
import Brand from "@/components/Brand";

export default async function AppNav() {
  const sess = await getEffectiveSession();
  if (!sess) return null;

  // During impersonation hide the admin section — show the genuine student
  // view. Exit is via the "Skončiť impersonáciu" banner.
  const showAdmin = sess.real.role === "admin" && !sess.isImpersonating;
  const showStudent =
    sess.effective.role === "student" && sess.effective.classId != null;

  const brandHref = showAdmin && !showStudent ? "/admin" : "/dashboard";

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm">
      <div className="container">
        <Link className="navbar-brand fs-4 p-0 me-3" href={brandHref}>
          <Brand />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Menu"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {/* Zadania — pre všetkých prihlásených */}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Zadania
              </a>
              <ul className="dropdown-menu">
                <li>
                  <Link className="dropdown-item" href="/zadania">
                    Prehľad zadaní
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <Link className="dropdown-item" href="/zadania/1">
                    Zadanie 1 · Jednotkové testovanie
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href="/zadania/2">
                    Zadanie 2 · Statická analýza
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href="/zadania/3">
                    Zadanie 3 · CI a kvalitatívne brány
                  </Link>
                </li>
              </ul>
            </li>

            {/* Témy — študent v triede */}
            {showStudent && (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Témy
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <Link className="dropdown-item" href="/dashboard">
                      Moja téma
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/topics">
                      Zoznam tém
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/preferences">
                      Preferencie
                    </Link>
                  </li>
                </ul>
              </li>
            )}

            {/* Admin */}
            {showAdmin && (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Admin
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <Link className="dropdown-item" href="/admin/classes">
                      Triedy
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/admin/topics">
                      Témy
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/admin/assignments">
                      Priradenia
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/admin/users">
                      Používatelia
                    </Link>
                  </li>
                </ul>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small d-none d-md-inline">
              {sess.effective.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
              className="m-0"
            >
              <button type="submit" className="btn btn-sm btn-outline-secondary">
                Odhlásiť
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
