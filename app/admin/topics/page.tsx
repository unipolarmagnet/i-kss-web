import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { createTopicList } from "./actions";

export default async function AdminTopicsPage() {
  const lists = await prisma.topicList.findMany({
    orderBy: { id: "asc" },
    include: { _count: { select: { topics: true, assignments: true } } },
  });

  return (
    <>
      <nav className="small text-muted mb-2">
        <Link href="/admin" className="text-decoration-none">
          Admin
        </Link>{" "}
        / Témy
      </nav>

      <div className="d-flex align-items-center justify-content-between mb-2">
        <h1 className="h4 fw-semibold mb-0">Topic listy</h1>
        <span className="text-muted small">{lists.length} celkom</span>
      </div>

      <p className="text-muted small">
        Topic list je šablóna tém. V sekcii Priradenia ho viete priradiť k
        triedam (zdieľane alebo samostatne).
      </p>

      <form action={createTopicList} className="row g-2 mb-4">
        <div className="col">
          <input
            type="text"
            name="name"
            className="form-control"
            placeholder="Názov nového topic listu (napr. KSS 2026 témy)"
            required
            maxLength={100}
          />
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-primary">
            + Vytvoriť topic list
          </button>
        </div>
      </form>

      {lists.length === 0 ? (
        <div className="alert alert-light border text-muted">
          Zatiaľ žiadne topic listy.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle bg-white">
            <thead className="table-light">
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th>Názov</th>
                <th style={{ width: 90 }}>Tém</th>
                <th style={{ width: 120 }}>Priradení</th>
                <th style={{ width: 100 }}>Akcie</th>
              </tr>
            </thead>
            <tbody>
              {lists.map((list) => (
                <tr key={list.id}>
                  <td>{list.id}</td>
                  <td>{list.name}</td>
                  <td>{list._count.topics}</td>
                  <td>
                    {list._count.assignments > 0 ? (
                      <span className="badge text-bg-success">
                        {list._count.assignments}×
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/admin/topics/${list.id}`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      Detail
                    </Link>
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
