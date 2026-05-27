import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  createClass,
  toggleEnrollment,
  deleteClass,
  renameClass,
} from "./actions";

export default async function AdminClassesPage() {
  const classes = await prisma.class.findMany({
    orderBy: { id: "asc" },
    include: {
      _count: { select: { members: true, assignmentClasses: true } },
    },
  });

  return (
    <>
      <nav className="small text-muted mb-2">
        <Link href="/admin" className="text-decoration-none">
          Admin
        </Link>{" "}
        / Triedy
      </nav>

      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h4 fw-semibold mb-0">Triedy</h1>
        <span className="text-muted small">{classes.length} celkom</span>
      </div>

      <form action={createClass} className="row g-2 mb-4">
        <div className="col">
          <input
            type="text"
            name="name"
            className="form-control"
            placeholder="Názov novej triedy (napr. 1 PIATOK 8:00)"
            required
            maxLength={100}
          />
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-primary">
            + Pridať triedu
          </button>
        </div>
      </form>

      {classes.length === 0 ? (
        <div className="alert alert-light border text-muted">
          Zatiaľ žiadne triedy. Vytvor prvú pomocou formulára vyššie.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle bg-white">
            <thead className="table-light">
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>Názov</th>
                <th style={{ width: 110 }}>Študentov</th>
                <th style={{ width: 130 }}>Stav</th>
                <th style={{ width: 220 }}>Akcie</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id}>
                  <td>{cls.id}</td>
                  <td>
                    <form action={renameClass} className="d-flex gap-2 m-0">
                      <input type="hidden" name="id" value={cls.id} />
                      <input
                        type="text"
                        name="name"
                        className="form-control form-control-sm"
                        defaultValue={cls.name}
                        required
                        maxLength={100}
                      />
                      <button
                        type="submit"
                        className="btn btn-sm btn-outline-secondary text-nowrap"
                      >
                        Uložiť
                      </button>
                    </form>
                  </td>
                  <td>{cls._count.members}</td>
                  <td>
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
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Link
                        href={`/admin/classes/${cls.id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        Detail
                      </Link>
                      <form action={deleteClass} className="m-0">
                        <input type="hidden" name="id" value={cls.id} />
                        <button
                          type="submit"
                          className="btn btn-sm btn-outline-danger"
                          disabled={cls._count.assignmentClasses > 0}
                          title={
                            cls._count.assignmentClasses > 0
                              ? "Trieda je v priradení tém — najprv ho zrušte"
                              : "Zmaže triedu; študenti stratia členstvo"
                          }
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
