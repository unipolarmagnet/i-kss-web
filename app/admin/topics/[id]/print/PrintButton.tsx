"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn btn-primary"
    >
      Tlačiť / Uložiť ako PDF
    </button>
  );
}
