import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { startImpersonation } from "./actions";
import { getEffectiveSession } from "@/lib/session";

export default async function AdminUsersPage() {
  const [users, sess] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { email: "asc" }],
      include: { class: { select: { id: true, name: true } } },
    }),
    getEffectiveSession(),
  ]);

  const admins = users.filter((u) => u.role === "admin");
  const students = users.filter((u) => u.role === "student");

  return (
    <>
      <nav className="small text-muted mb-2">
        <Link href="/admin" className="text-decoration-none">
          Admin
        </Link>{" "}
        / Používatelia
      </nav>

      <div className="d-flex align-items-center justify-content-between mb-2">
        <h1 className="h4 fw-semibold mb-0">Používatelia</h1>
        <span className="text-muted small">
          {users.length} celkom · {admins.length} adminov · {students.length}{" "}
          študentov
        </span>
      </div>

      <p className="text-muted small">
        Tlačidlom <strong>Zobraziť ako</strong> aktivujete impersonáciu —
        uvidíte aplikáciu očami toho študenta. Skončíte cez žltý banner navrchu.
        Všetko sa loguje do <code>logs/admin-actions.csv</code>.
      </p>

      <h2 className="h6 fw-semibold">Administrátori ({admins.length})</h2>
      <div className="table-responsive mb-4">
        <table className="table table-hover align-middle bg-white">
          <thead className="table-light">
            <tr>
              <th>Meno</th>
              <th>Email</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((u) => (
              <tr key={u.id}>
                <td>{u.name ?? "—"}</td>
                <td>{u.email}</td>
                <td className="text-muted small">
                  {u.id === sess?.real.id ? "vy" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="h6 fw-semibold">Študenti ({students.length})</h2>
      {students.length === 0 ? (
        <div className="alert alert-light border text-muted">
          Žiadni študenti v DB.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle bg-white">
            <thead className="table-light">
              <tr>
                <th>Meno</th>
                <th>Email</th>
                <th>Trieda</th>
                <th style={{ width: 150 }}>Akcie</th>
              </tr>
            </thead>
            <tbody>
              {students.map((u) => (
                <tr key={u.id}>
                  <td>{u.name ?? "—"}</td>
                  <td>{u.email}</td>
                  <td>
                    {u.class ? (
                      <Link
                        href={`/admin/classes/${u.class.id}`}
                        className="text-decoration-none"
                      >
                        {u.class.name}
                      </Link>
                    ) : (
                      <span className="text-muted">— bez triedy —</span>
                    )}
                  </td>
                  <td>
                    <form action={startImpersonation} className="m-0">
                      <input type="hidden" name="targetId" value={u.id} />
                      <button
                        type="submit"
                        className="btn btn-sm btn-outline-primary"
                      >
                        Zobraziť ako
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
