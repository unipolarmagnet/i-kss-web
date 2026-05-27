import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  deleteAssignment,
  runAssignmentDistribution,
  reopenAssignment,
  closeReopen,
  resetDistribution,
} from "../actions";

function pluralStudent(n: number): string {
  if (n === 1) return "študent";
  if (n >= 2 && n <= 4) return "študenti";
  return "študentov";
}

type Phase =
  | "initial_collecting"
  | "initial_distributed"
  | "reopen_collecting"
  | "reopen_distributed";

function phaseLabel(p: Phase): string {
  switch (p) {
    case "initial_collecting":
      return "Zbiera preferencie (1. kolo)";
    case "initial_distributed":
      return "1. kolo rozdelené";
    case "reopen_collecting":
      return "2. kolo zbiera preferencie";
    case "reopen_distributed":
      return "2. kolo rozdelené";
  }
}

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assignmentId = Number(id);
  if (!assignmentId) notFound();

  const a = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      list: { include: { topics: { orderBy: { displayId: "asc" } } } },
      classes: {
        include: {
          class: { include: { _count: { select: { members: true } } } },
        },
        orderBy: { classId: "asc" },
      },
    },
  });
  if (!a) notFound();

  const [initialResultsCount, reopenResultsCount, initialPrefStudents] =
    await Promise.all([
      prisma.assignmentResult.count({
        where: { assignmentId, phase: "initial" },
      }),
      prisma.assignmentResult.count({
        where: { assignmentId, phase: "reopen" },
      }),
      prisma.preference.groupBy({
        by: ["studentId"],
        where: { assignmentId, phase: "initial" },
      }),
    ]);

  let phase: Phase;
  if (reopenResultsCount > 0) phase = "reopen_distributed";
  else if (a.reopenedAt) phase = "reopen_collecting";
  else if (initialResultsCount > 0) phase = "initial_distributed";
  else phase = "initial_collecting";

  const classIds = a.classes.map((c) => c.classId);
  const allStudents = await prisma.user.findMany({
    where: { classId: { in: classIds }, role: "student" },
    select: { id: true, email: true, name: true, classId: true },
    orderBy: { email: "asc" },
  });
  const totalStudents = allStudents.length;
  const totalCapacity = a.list.topics.reduce((s, t) => s + t.capacity, 0);
  const effectiveCapacity =
    a.mode === "shared" ? totalCapacity : totalCapacity * a.classes.length;

  const submitterIds = new Set(initialPrefStudents.map((p) => p.studentId));

  const initialResults =
    phase !== "initial_collecting"
      ? await prisma.assignmentResult.findMany({
          where: { assignmentId, phase: "initial" },
        })
      : [];
  const reopenResults =
    phase === "reopen_distributed"
      ? await prisma.assignmentResult.findMany({
          where: { assignmentId, phase: "reopen" },
        })
      : [];

  const topicById = new Map(a.list.topics.map((t) => [t.id, t]));
  const assignedPerTopic = new Map<number, number>();
  for (const r of [...initialResults, ...reopenResults]) {
    if (r.topicId) {
      assignedPerTopic.set(
        r.topicId,
        (assignedPerTopic.get(r.topicId) ?? 0) + 1,
      );
    }
  }

  return (
    <>
      <nav className="small text-muted mb-2">
        <Link href="/admin" className="text-decoration-none">
          Admin
        </Link>{" "}
        /{" "}
        <Link href="/admin/assignments" className="text-decoration-none">
          Priradenia
        </Link>{" "}
        / #{a.id}
      </nav>

      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 fw-semibold mb-0">
          <span className="text-muted">#{a.id}</span> {a.list.name}
        </h1>
        <form action={deleteAssignment} className="m-0">
          <input type="hidden" name="id" value={a.id} />
          <button type="submit" className="btn btn-sm btn-outline-danger">
            Zrušiť priradenie
          </button>
        </form>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="border rounded p-3 h-100 bg-white">
            <div className="text-muted small text-uppercase">Topic list</div>
            <Link
              href={`/admin/topics/${a.list.id}`}
              className="text-decoration-none"
            >
              {a.list.name}
            </Link>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="border rounded p-3 h-100 bg-white">
            <div className="text-muted small text-uppercase">Režim</div>
            <span>{a.mode === "shared" ? "Zdieľané" : "Samostatné"}</span>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="border rounded p-3 h-100 bg-white">
            <div className="text-muted small text-uppercase">Stav</div>
            <span className="badge text-bg-info">{phaseLabel(phase)}</span>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="border rounded p-3 h-100 bg-white">
            <div className="text-muted small text-uppercase">
              Preferencie
            </div>
            <span>
              {submitterIds.size} / {totalStudents}
            </span>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="border rounded p-3 h-100 bg-white">
            <div className="text-muted small text-uppercase mb-1">
              Triedy ({a.classes.length})
            </div>
            <ul className="list-unstyled mb-0">
              {a.classes.map((c) => (
                <li key={c.classId}>
                  <Link
                    href={`/admin/classes/${c.classId}`}
                    className="text-decoration-none"
                  >
                    {c.class.name}
                  </Link>{" "}
                  <span className="text-muted small">
                    · {c.class._count.members}{" "}
                    {pluralStudent(c.class._count.members)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="col-md-6">
          <div className="border rounded p-3 h-100 bg-white">
            <div className="text-muted small text-uppercase mb-1">
              Kapacita vs. študenti
            </div>
            <span>
              {effectiveCapacity} miest · {totalStudents}{" "}
              {pluralStudent(totalStudents)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions per phase */}
      <h2 className="h6 fw-semibold">Akcie rozdelenia</h2>

      {phase === "initial_collecting" && (
        <div className="card mb-4">
          <div className="card-body">
            <p className="text-muted small">
              Spustenie 1. kola prerozdelí témy podľa preferencií (3 kolá podľa
              priority, random pri konflikte).
              {submitterIds.size < totalStudents && (
                <>
                  {" "}
                  <strong className="text-warning-emphasis">
                    Pozor: {totalStudents - submitterIds.size}{" "}
                    {pluralStudent(totalStudents - submitterIds.size)} ešte
                    nepodal preferencie
                  </strong>{" "}
                  — aj tak sa rozdelenie spustí, nepriradení zostanú bez témy.
                </>
              )}
            </p>
            <form action={runAssignmentDistribution} className="m-0">
              <input type="hidden" name="assignmentId" value={a.id} />
              <input type="hidden" name="phase" value="initial" />
              <button type="submit" className="btn btn-primary">
                Spustiť rozdelenie (1. kolo)
              </button>
            </form>
          </div>
        </div>
      )}

      {phase === "initial_distributed" && (
        <div className="d-flex flex-wrap gap-2 mb-4">
          <form action={reopenAssignment} className="m-0">
            <input type="hidden" name="assignmentId" value={a.id} />
            <button type="submit" className="btn btn-primary">
              Otvoriť 2. kolo (re-open)
            </button>
          </form>
          <form action={resetDistribution} className="m-0">
            <input type="hidden" name="assignmentId" value={a.id} />
            <input type="hidden" name="phase" value="initial" />
            <button type="submit" className="btn btn-outline-secondary">
              Resetovať rozdelenie 1. kola
            </button>
          </form>
        </div>
      )}

      {phase === "reopen_collecting" && (
        <div className="d-flex flex-wrap gap-2 mb-4">
          <form action={runAssignmentDistribution} className="m-0">
            <input type="hidden" name="assignmentId" value={a.id} />
            <input type="hidden" name="phase" value="reopen" />
            <button type="submit" className="btn btn-primary">
              Spustiť rozdelenie (2. kolo)
            </button>
          </form>
          <form action={closeReopen} className="m-0">
            <input type="hidden" name="assignmentId" value={a.id} />
            <button type="submit" className="btn btn-outline-secondary">
              Zrušiť 2. kolo
            </button>
          </form>
        </div>
      )}

      {phase === "reopen_distributed" && (
        <div className="d-flex flex-wrap gap-2 mb-4">
          <form action={resetDistribution} className="m-0">
            <input type="hidden" name="assignmentId" value={a.id} />
            <input type="hidden" name="phase" value="reopen" />
            <button type="submit" className="btn btn-outline-secondary">
              Resetovať 2. kolo
            </button>
          </form>
          <form action={resetDistribution} className="m-0">
            <input type="hidden" name="assignmentId" value={a.id} />
            <input type="hidden" name="phase" value="initial" />
            <button
              type="submit"
              className="btn btn-outline-danger"
              title="Zruší aj 1. aj 2. kolo a vráti do zbierania preferencií"
            >
              Resetovať celé rozdelenie
            </button>
          </form>
        </div>
      )}

      {/* Topics */}
      <h2 className="h6 fw-semibold">Témy v priradení</h2>
      <div className="table-responsive mb-4">
        <table className="table table-hover align-middle bg-white">
          <thead className="table-light">
            <tr>
              <th style={{ width: 60 }}>ID</th>
              <th>Názov</th>
              <th>Popis</th>
              <th style={{ width: 130 }}>Kapacita</th>
            </tr>
          </thead>
          <tbody>
            {a.list.topics.map((t) => {
              const taken = assignedPerTopic.get(t.id) ?? 0;
              return (
                <tr key={t.id}>
                  <td>{t.displayId}</td>
                  <td>
                    <strong>{t.name}</strong>
                  </td>
                  <td>{t.description || "—"}</td>
                  <td>
                    {taken} / {t.capacity}
                    {taken >= t.capacity && (
                      <span className="text-muted small"> (plné)</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Results */}
      {phase !== "initial_collecting" && (
        <>
          <h2 className="h6 fw-semibold">Výsledky</h2>
          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle bg-white">
              <thead className="table-light">
                <tr>
                  <th>Študent</th>
                  <th>Email</th>
                  <th>Trieda</th>
                  <th>Téma (1. kolo)</th>
                  <th style={{ width: 70 }}>Prio.</th>
                  {phase === "reopen_distributed" && (
                    <>
                      <th>Téma (2. kolo)</th>
                      <th style={{ width: 70 }}>Prio.</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {allStudents.map((stu) => {
                  const cls = a.classes.find((c) => c.classId === stu.classId);
                  const ir = initialResults.find((r) => r.studentId === stu.id);
                  const rr = reopenResults.find((r) => r.studentId === stu.id);
                  const irTopic = ir?.topicId
                    ? topicById.get(ir.topicId)
                    : null;
                  const rrTopic = rr?.topicId
                    ? topicById.get(rr.topicId)
                    : null;
                  return (
                    <tr key={stu.id}>
                      <td>{stu.name ?? "—"}</td>
                      <td className="small">{stu.email}</td>
                      <td className="small text-muted">
                        {cls?.class.name ?? "—"}
                      </td>
                      <td>
                        {irTopic ? (
                          <strong>
                            {irTopic.displayId}. {irTopic.name}
                          </strong>
                        ) : ir ? (
                          <span className="text-muted">— nepriradený —</span>
                        ) : (
                          <span className="text-muted">— bez prefs —</span>
                        )}
                      </td>
                      <td>{ir?.round && ir.round > 0 ? ir.round : "—"}</td>
                      {phase === "reopen_distributed" && (
                        <>
                          <td>
                            {rrTopic ? (
                              <strong>
                                {rrTopic.displayId}. {rrTopic.name}
                              </strong>
                            ) : rr ? (
                              <span className="text-muted">
                                — nepriradený —
                              </span>
                            ) : irTopic ? (
                              <span className="text-muted small">
                                priradený v 1. kole
                              </span>
                            ) : (
                              <span className="text-muted">— bez prefs —</span>
                            )}
                          </td>
                          <td>
                            {rr?.round && rr.round > 0 ? rr.round : "—"}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-muted small">
            Plný audit log rozdelenia (per kolo, per téma, kto bol v hre, kto
            vyhral random) je v <code>logs/assignments.csv</code>.
          </p>
        </>
      )}
    </>
  );
}
