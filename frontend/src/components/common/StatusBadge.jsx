
const statusStyles = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  ON_TRACK: "bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700",
  PENDING: "bg-amber-50 text-amber-700",
  PENDING_SYNC: "bg-amber-50 text-amber-700",
  QUEUED: "bg-slate-100 text-slate-600",
  INCOMPLETE: "bg-amber-50 text-amber-700",
  UNABLE_TO_ASSESS: "bg-orange-50 text-orange-700",
  CANCELLED: "bg-red-50 text-red-700",
  REJECTED: "bg-red-50 text-red-700",
  FAILED: "bg-red-50 text-red-700",
  VERIFIED: "bg-emerald-50 text-emerald-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
};

function normalizeStatus(status) {
  return String(status ?? "")
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toUpperCase();
}

function formatStatus(status) {
  return String(status ?? "Unknown")
    .trim()
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function StatusBadge({ status, className = "" }) {
  const normalized = normalizeStatus(status);
  const styles = statusStyles[normalized] || "bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${styles} ${className}`}>
      {formatStatus(status)}
    </span>
  );
}
