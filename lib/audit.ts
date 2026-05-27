import { getEffectiveSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

const LOGS_DIR = path.join(process.cwd(), "logs");

function csvEscape(val: unknown): string {
  const s = typeof val === "string" ? val : JSON.stringify(val);
  if (
    s.includes(",") ||
    s.includes('"') ||
    s.includes("\n") ||
    s.includes("\r")
  ) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function appendCsv(file: string, header: string[], row: string[]) {
  await fs.mkdir(LOGS_DIR, { recursive: true });
  const filePath = path.join(LOGS_DIR, file);
  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
  if (!exists) {
    await fs.writeFile(filePath, header.map(csvEscape).join(",") + "\n");
  }
  await fs.appendFile(filePath, row.map(csvEscape).join(",") + "\n");
}

function fileFor(kind: string): string {
  if (kind.startsWith("class.")) return "class-membership.csv";
  if (kind.startsWith("topic.")) return "topics.csv";
  if (kind.startsWith("assignment.")) return "assignments.csv";
  if (kind.startsWith("preference.")) return "submissions.csv";
  if (kind.startsWith("admin.")) return "admin-actions.csv";
  return "audit.csv";
}

export async function logAudit(
  kind: string,
  payload: Record<string, unknown> = {},
) {
  const sess = await getEffectiveSession().catch(() => null);
  const actorEmail = sess?.real.email ?? null;
  const actorRole = sess?.real.role ?? null;
  const now = new Date();

  // When admin acts via impersonation, record both: the real actor as the
  // accountable identity and the impersonated email in the payload.
  const fullPayload: Record<string, unknown> = sess?.isImpersonating
    ? { ...payload, impersonatingAs: sess.effective.email }
    : payload;

  await prisma.auditLog.create({
    data: {
      actorEmail,
      actorRole,
      kind,
      payload: JSON.stringify(fullPayload),
    },
  });

  await appendCsv(
    fileFor(kind),
    ["timestamp_iso", "actor_email", "actor_role", "kind", "payload_json"],
    [
      now.toISOString(),
      actorEmail ?? "",
      actorRole ?? "",
      kind,
      JSON.stringify(fullPayload),
    ],
  );
}
