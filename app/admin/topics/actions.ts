"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function createTopicList(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const list = await prisma.topicList.create({ data: { name } });
  await logAudit("topic.list_create", { listId: list.id, name });
  revalidatePath("/admin/topics");
  redirect(`/admin/topics/${list.id}`);
}

export async function renameTopicList(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  const before = await prisma.topicList.findUnique({ where: { id } });
  if (!before || before.name === name) return;
  await prisma.topicList.update({ where: { id }, data: { name } });
  await logAudit("topic.list_rename", {
    listId: id,
    from: before.name,
    to: name,
  });
  revalidatePath("/admin/topics");
  revalidatePath(`/admin/topics/${id}`);
}

export async function deleteTopicList(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  const list = await prisma.topicList.findUnique({
    where: { id },
    include: { _count: { select: { topics: true, assignments: true } } },
  });
  if (!list) return;
  if (list._count.assignments > 0) {
    throw new Error(
      "Topic list je priradený k triedam — najprv ho odoberte z priradení (Phase 4).",
    );
  }
  await prisma.topicList.delete({ where: { id } });
  await logAudit("topic.list_delete", {
    listId: id,
    name: list.name,
    topicsAtDelete: list._count.topics,
  });
  revalidatePath("/admin/topics");
  redirect("/admin/topics");
}

export async function addTopic(formData: FormData) {
  await requireAdmin();
  const listId = Number(formData.get("listId"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const capacity = Math.max(1, Number(formData.get("capacity") ?? 1) || 1);
  if (!listId || !name) return;

  const last = await prisma.topic.findFirst({
    where: { listId },
    orderBy: { displayId: "desc" },
  });
  const displayId = (last?.displayId ?? 0) + 1;

  const topic = await prisma.topic.create({
    data: { listId, displayId, name, description, capacity },
  });
  await logAudit("topic.create", {
    listId,
    topicId: topic.id,
    displayId,
    name,
    capacity,
  });
  revalidatePath(`/admin/topics/${listId}`);
}

export async function updateTopic(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const capacity = Math.max(1, Number(formData.get("capacity") ?? 1) || 1);
  if (!id || !name) return;
  const before = await prisma.topic.findUnique({ where: { id } });
  if (!before) return;
  if (
    before.name === name &&
    before.description === description &&
    before.capacity === capacity
  ) {
    return;
  }
  await prisma.topic.update({
    where: { id },
    data: { name, description, capacity },
  });
  await logAudit("topic.update", {
    topicId: id,
    listId: before.listId,
    before: {
      name: before.name,
      description: before.description,
      capacity: before.capacity,
    },
    after: { name, description, capacity },
  });
  revalidatePath(`/admin/topics/${before.listId}`);
}

export async function deleteTopic(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  const topic = await prisma.topic.findUnique({
    where: { id },
    include: {
      _count: { select: { preferences: true, results: true } },
    },
  });
  if (!topic) return;
  await prisma.topic.delete({ where: { id } });
  await logAudit("topic.delete", {
    topicId: id,
    listId: topic.listId,
    displayId: topic.displayId,
    name: topic.name,
    preferencesAtDelete: topic._count.preferences,
    resultsAtDelete: topic._count.results,
  });
  revalidatePath(`/admin/topics/${topic.listId}`);
}
