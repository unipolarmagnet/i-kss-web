import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  renameTopicList,
  deleteTopicList,
  addTopic,
  updateTopic,
  deleteTopic,
} from "../actions";

export default async function TopicListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listId = Number(id);
  if (!listId) notFound();

  const list = await prisma.topicList.findUnique({
    where: { id: listId },
    include: {
      topics: { orderBy: { displayId: "asc" } },
      _count: { select: { assignments: true } },
    },
  });
  if (!list) notFound();

  const usedByAssignments = list._count.assignments > 0;

  return (
    <>
      <nav className="small text-muted mb-2">
        <Link href="/admin" className="text-decoration-none">
          Admin
        </Link>{" "}
        /{" "}
        <Link href="/admin/topics" className="text-decoration-none">
          Témy
        </Link>{" "}
        / {list.name}
      </nav>

      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <form
          action={renameTopicList}
          className="d-flex gap-2 m-0 flex-grow-1"
          style={{ maxWidth: 480 }}
        >
          <input type="hidden" name="id" value={list.id} />
          <input
            type="text"
            name="name"
            className="form-control fw-semibold"
            defaultValue={list.name}
            required
            maxLength={100}
          />
          <button type="submit" className="btn btn-outline-secondary text-nowrap">
            Premenovať
          </button>
        </form>
        <div className="d-flex gap-2">
          <Link
            href={`/admin/topics/${list.id}/print`}
            target="_blank"
            className="btn btn-outline-primary"
          >
            Náhľad pre tlač (PDF)
          </Link>
          <form action={deleteTopicList} className="m-0">
            <input type="hidden" name="id" value={list.id} />
            <button
              type="submit"
              className="btn btn-outline-danger"
              disabled={usedByAssignments}
              title={
                usedByAssignments
                  ? "List je priradený k triedam — najprv ho odoberte"
                  : "Zmaže topic list aj všetky témy v ňom"
              }
            >
              Zmazať list
            </button>
          </form>
        </div>
      </div>

      <h2 className="h6 fw-semibold">Témy ({list.topics.length})</h2>

      <form action={addTopic} className="row g-2 mb-3">
        <input type="hidden" name="listId" value={listId} />
        <div className="col-12 col-md">
          <input
            type="text"
            name="name"
            className="form-control"
            placeholder="Názov novej témy"
            required
            maxLength={200}
          />
        </div>
        <div className="col-12 col-md">
          <input
            type="text"
            name="description"
            className="form-control"
            placeholder="Popis (voliteľné)"
            maxLength={500}
          />
        </div>
        <div className="col-6 col-md-2">
          <input
            type="number"
            name="capacity"
            className="form-control"
            placeholder="Kapacita"
            defaultValue={1}
            min={1}
            max={1000}
            required
          />
        </div>
        <div className="col-6 col-md-auto">
          <button type="submit" className="btn btn-primary w-100">
            + Pridať
          </button>
        </div>
      </form>

      {list.topics.length === 0 ? (
        <div className="alert alert-light border text-muted">
          V tomto liste zatiaľ nie sú žiadne témy.
        </div>
      ) : (
        <div className="vstack gap-2">
          {list.topics.map((t) => (
            <div className="card" key={t.id}>
              <div className="card-body py-2">
                <div className="row g-2 align-items-center">
                  <div className="col-auto">
                    <span className="badge text-bg-secondary">
                      {t.displayId}
                    </span>
                  </div>
                  <form
                    action={updateTopic}
                    className="col d-flex flex-wrap gap-2 align-items-center m-0"
                  >
                    <input type="hidden" name="id" value={t.id} />
                    <input
                      type="text"
                      name="name"
                      className="form-control form-control-sm"
                      style={{ flex: "2 1 150px" }}
                      defaultValue={t.name}
                      required
                      maxLength={200}
                    />
                    <input
                      type="text"
                      name="description"
                      className="form-control form-control-sm"
                      style={{ flex: "3 1 200px" }}
                      defaultValue={t.description}
                      placeholder="Popis"
                      maxLength={500}
                    />
                    <input
                      type="number"
                      name="capacity"
                      className="form-control form-control-sm"
                      style={{ width: 80 }}
                      defaultValue={t.capacity}
                      min={1}
                      max={1000}
                      required
                    />
                    <button
                      type="submit"
                      className="btn btn-sm btn-outline-primary"
                    >
                      Uložiť
                    </button>
                  </form>
                  <form action={deleteTopic} className="col-auto m-0">
                    <input type="hidden" name="id" value={t.id} />
                    <button
                      type="submit"
                      className="btn btn-sm btn-outline-danger"
                    >
                      Zmazať
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
