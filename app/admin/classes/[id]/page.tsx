import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  kickStudent,
  toggleEnrollment,
  assignStudentToClass,
} from "../actions";
import { startImpersonation } from "../../users/actions";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classId = Number(id);
  if (!classId) notFound();

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { members: { orderBy: { email: "asc" } } },
  });
  if (!cls) notFound();

  const unassigned = await prisma.user.findMany({
    where: { role: "student", classId: null },
    orderBy: { email: "asc" },
    select: { id: true, name: true, email: true },
  });

  return (
    <>
      <nav className="small text-muted mb-2">
        <Link href="/admin" className="text-decoration-none">
          Admin
        </Link>{" "}
        /{" "}
        <Link href="/admin/classes" className="text-decoration-none">
          Triedy
        </Link>{" "}
        / {cls.name}
      </nav>

      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 fw-semibold mb-0">
          <span className="text-muted">#{cls.id}</span> {cls.name}
        </h1>
        <form action={toggleEnrollment} className="m-0">
          <input type="hidden" name="id" value={cls.id} />
          <input
            type="hidden"
            name="open"
            value={String(!cls.enrollmentOpen)}
          />
          <button
            type="submit"
            className={`btn btn-sm ${cls.enrollmentOpen ? "btn-success" : "btn-outline-danger"}`}
          >
            {cls.enrollmentOpen ? "Otvorená" : "Uzavretá"}
          </button>
        </form>
      </div>

      <h2 className="h6 fw-semibold">Študenti ({cls.members.length})</h2>
      {cls.members.length === 0 ? (
        <div className="alert alert-light border text-muted">
          V tejto triede zatiaľ nie je žiadny študent.
        </div>
      ) : (
        <div className="table-responsive mb-4">
          <table className="table table-hover align-middle bg-white">
            <thead className="table-light">
              <tr>
                <th>Meno</th>
                <th>Email</th>
                <th style={{ width: 240 }}>Akcie</th>
              </tr>
            </thead>
            <tbody>
              {cls.members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name ?? "—"}</td>
                  <td>{m.email}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <form action={startImpersonation} className="m-0">
                        <input type="hidden" name="targetId" value={m.id} />
                        <button
                          type="submit"
                          className="btn btn-sm btn-outline-primary"
                        >
                          Zobraziť ako
                        </button>
                      </form>
                      <form action={kickStudent} className="m-0">
                        <input type="hidden" name="classId" value={classId} />
                        <input type="hidden" name="studentId" value={m.id} />
                        <button
                          type="submit"
                          className="btn btn-sm btn-outline-danger"
                        >
                          Vykopnúť
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

      <h2 className="h6 fw-semibold">Pridať existujúceho študenta</h2>
      {unassigned.length === 0 ? (
        <p className="text-muted small">
          Žiadni študenti bez pridelenia.
        </p>
      ) : (
        <form
          action={assignStudentToClass}
          className="row g-2"
          style={{ maxWidth: 620 }}
        >
          <input type="hidden" name="classId" value={classId} />
          <div className="col">
            <select
              name="studentId"
              className="form-select"
              required
              defaultValue=""
            >
              <option value="" disabled>
                — vyberte z {unassigned.length} nepridelených študentov —
              </option>
              {unassigned.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email} · {u.email}
                </option>
              ))}
            </select>
          </div>
          <div className="col-auto">
            <button type="submit" className="btn btn-primary">
              Pridať do triedy
            </button>
          </div>
        </form>
      )}
    </>
  );
}
