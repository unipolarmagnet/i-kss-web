import Link from "next/link";
import type { ReactNode } from "react";
import AppNav from "@/components/AppNav";

export function AssignmentShell({
  id,
  title,
  subtitle,
  children,
}: {
  id: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <>
      <AppNav />
      <main className="container py-4" style={{ maxWidth: 860 }}>
        <nav className="small text-muted mb-3">
          <Link href="/zadania" className="text-decoration-none">
            Zadania
          </Link>{" "}
          / Zadanie {id}
        </nav>
        <span className="badge text-bg-primary mb-2">Zadanie {id}</span>
        <h1 className="fw-bold mb-1">{title}</h1>
        {subtitle && <p className="text-muted fs-5">{subtitle}</p>}
        {children}
      </main>
    </>
  );
}

export function Toc({ items }: { items: { id: string; label: string }[] }) {
  return (
    <div className="card bg-light border-0 my-4">
      <div className="card-body">
        <h2 className="h6 text-uppercase text-muted mb-2">
          <i className="bi bi-list-ol me-1" />
          Obsah
        </h2>
        <ol className="mb-0 ps-3">
          {items.map((i) => (
            <li key={i.id}>
              <a href={`#${i.id}`} className="text-decoration-none">
                {i.label}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function Section({
  id,
  icon,
  title,
  children,
}: {
  id: string;
  icon?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mb-5">
      <h2 className="h4 fw-semibold border-bottom pb-2 mb-3">
        {icon && <i className={`bi ${icon} text-primary me-2`} />}
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Code({
  filename,
  children,
}: {
  filename?: string;
  children: ReactNode;
}) {
  return (
    <div className="doc-code mb-3">
      {filename && (
        <div className="doc-code__bar">
          <i className="bi bi-file-earmark-code me-1" />
          {filename}
        </div>
      )}
      <pre className="doc-code__pre mb-0">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function IO({
  kind,
  children,
}: {
  kind: "in" | "out";
  children: ReactNode;
}) {
  return (
    <div className={`doc-io doc-io--${kind} mb-3`}>
      <div className="doc-io__label">
        <i
          className={`bi ${kind === "in" ? "bi-box-arrow-in-right" : "bi-box-arrow-right"} me-1`}
        />
        {kind === "in" ? "Vstup" : "Výstup"}
      </div>
      <pre className="doc-io__pre mb-0">{children}</pre>
    </div>
  );
}

export function Note({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="alert alert-warning d-flex gap-2 align-items-start">
      <i className="bi bi-lightbulb-fill mt-1" />
      <div>
        {title && <strong>{title}: </strong>}
        {children}
      </div>
    </div>
  );
}

export function Sources({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  return (
    <ul className="ps-3">
      {items.map((s, i) => (
        <li key={i}>
          <a href={s.href} target="_blank" rel="noreferrer">
            {s.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
