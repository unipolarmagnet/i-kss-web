import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deleteAssignment } from "./actions";

function statusLabel(a: {
  reopenedAt: Date | null;
  _count: { results: number; preferences: number };
}): string {
  if (a._count.results > 0) {
    return a.reopenedAt ? "Re-open kolo" : "Rozdelené";
  }
  if (a._count.preferences > 0) {
    return `Preferencie zaslané (${a._count.preferences})`;
  }
  return "Zbiera preferencie";
}

export default async function AssignmentsPage() {
  const assignments = await prisma.assignment.findMany({
    orderBy: { id: "asc" },
    include: {
      list: { select: { id: true, name: true } },
      classes: { include: { class: { select: { id: true, name: true } } } },
      _count: { select: { preferences: true, results: true } },
    },
  });

  return (
    <>
      <nav className="small text-muted mb-2">
        <Link href="/admin" className="text-decoration-none">
          Admin
        </Link>{" "}
        / Priradenia
      </nav>

      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 fw-semibold mb-0">Priradenia</h1>
        <Link href="/admin/assignments/new" className="btn btn-primary">
          + Nové priradenie
        </Link>
      </div>

      <p className="text-muted small">
        Priradenie spája topic list s triedami. Pri <strong>zdieľanom</strong>{" "}
        režime sú kapacity tém spoločné naprieč triedami; pri{" "}
        <strong>samostatnom</strong> má každá trieda vlastný pool kapacít.
      </p>

      {assignments.length === 0 ? (
        <div className="alert alert-light border text-muted">
          Zatiaľ žiadne priradenia. Začnite kliknutím na „+ Nové priradenie".
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle bg-white">
            <thead className="table-light">
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>Topic list</th>
                <th>Triedy</th>
                <th style={{ width: 120 }}>Režim</th>
                <th style={{ width: 180 }}>Stav</th>
                <th style={{ width: 150 }}>Akcie</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>
                    <Link
                      href={`/admin/topics/${a.list.id}`}
                      className="text-decoration-none"
                    >
                      {a.list.name}
                    </Link>
                  </td>
                  <td>
                    {a.classes.map((c) => c.class.name).join(", ") || (
                      <span className="text-muted">— bez tried —</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${a.mode === "shared" ? "text-bg-info" : "text-bg-secondary"}`}
                    >
                      {a.mode === "shared" ? "Zdieľané" : "Samostatné"}
                    </span>
                  </td>
                  <td className="small">{statusLabel(a)}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Link
                        href={`/admin/assignments/${a.id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        Detail
                      </Link>
                      <form action={deleteAssignment} className="m-0">
                        <input type="hidden" name="id" value={a.id} />
                        <button
                          type="submit"
                          className="btn btn-sm btn-outline-danger"
                          title="Zruší priradenie aj preferencie/výsledky"
                        >
                          Zmazať
                        </button>
                      </form>
                    </div>
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
