import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { createAssignment } from "../actions";

export default async function NewAssignmentPage() {
  const [lists, classes] = await Promise.all([
    prisma.topicList.findMany({
      orderBy: { id: "asc" },
      include: { _count: { select: { topics: true } } },
    }),
    prisma.class.findMany({
      orderBy: { id: "asc" },
      include: {
        _count: { select: { members: true, assignmentClasses: true } },
      },
    }),
  ]);

  const eligibleLists = lists.filter((l) => l._count.topics > 0);
  const availableClasses = classes.filter(
    (c) => c._count.assignmentClasses === 0,
  );
  const occupiedClasses = classes.filter(
    (c) => c._count.assignmentClasses > 0,
  );

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
        / Nové
      </nav>

      <h1 className="h4 fw-semibold mb-3">Nové priradenie</h1>

      {eligibleLists.length === 0 ? (
        <div className="alert alert-warning">
          Žiadny topic list nemá témy. Najprv vytvorte topic list s aspoň
          jednou témou v sekcii{" "}
          <Link href="/admin/topics">Témy</Link>.
        </div>
      ) : availableClasses.length === 0 ? (
        <div className="alert alert-warning">
          Všetky triedy už majú aktívne priradenie. Zrušte niektoré, alebo
          pridajte novú triedu v sekcii{" "}
          <Link href="/admin/classes">Triedy</Link>.
        </div>
      ) : (
        <form
          action={createAssignment}
          className="card shadow-sm border-0"
          style={{ maxWidth: 760 }}
        >
          <div className="card-body p-4">
            <div className="mb-3">
              <label htmlFor="listId" className="form-label fw-medium">
                Topic list
              </label>
              <select
                id="listId"
                name="listId"
                className="form-select"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  — vyberte topic list —
                </option>
                {eligibleLists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l._count.topics} tém)
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-medium">
                Triedy (vyberte jednu alebo viac)
              </label>
              <div className="border rounded p-2">
                {availableClasses.map((c) => (
                  <div className="form-check" key={c.id}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="classIds"
                      value={c.id}
                      id={`class-${c.id}`}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`class-${c.id}`}
                    >
                      {c.name}{" "}
                      <span className="text-muted small">
                        · #{c.id} · {c._count.members} študentov
                      </span>
                    </label>
                  </div>
                ))}
              </div>
              {occupiedClasses.length > 0 && (
                <div className="form-text">
                  Tieto triedy už majú aktívne priradenie a nie sú zobrazené:{" "}
                  {occupiedClasses.map((c) => c.name).join(", ")}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="form-label fw-medium">Režim</label>
              <div className="form-check border rounded p-2 ps-5 mb-2">
                <input
                  className="form-check-input"
                  type="radio"
                  name="mode"
                  value="shared"
                  id="mode-shared"
                  defaultChecked
                />
                <label className="form-check-label" htmlFor="mode-shared">
                  <strong>Zdieľané</strong>
                  <div className="text-muted small">
                    Jedno priradenie pre všetky vybrané triedy. Kapacity tém sú
                    spoločné — téma s kapacitou 3 má celkovo 3 miesta naprieč
                    triedami.
                  </div>
                </label>
              </div>
              <div className="form-check border rounded p-2 ps-5">
                <input
                  className="form-check-input"
                  type="radio"
                  name="mode"
                  value="separate"
                  id="mode-separate"
                />
                <label className="form-check-label" htmlFor="mode-separate">
                  <strong>Samostatné</strong>
                  <div className="text-muted small">
                    Pre každú triedu vznikne nezávislé priradenie. Téma s
                    kapacitou 3 má 3 miesta v každej triede zvlášť.
                  </div>
                </label>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary">
                Vytvoriť priradenie
              </button>
              <Link
                href="/admin/assignments"
                className="btn btn-outline-secondary"
              >
                Zrušiť
              </Link>
            </div>
          </div>
        </form>
      )}
    </>
  );
}
