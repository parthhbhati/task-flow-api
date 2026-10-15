const statusStyles = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  in_progress: "bg-blue-50 text-blue-700 ring-blue-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const priorityStyles = {
  low: "bg-slate-100 text-slate-600 ring-slate-200",
  medium: "bg-orange-50 text-orange-700 ring-orange-200",
  high: "bg-rose-50 text-rose-700 ring-rose-200",
};

function formatLabel(value = "") {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function StatusBadge({ value, type = "status" }) {
  const styles = type === "priority" ? priorityStyles : statusStyles;
  const className =
    styles[value] || "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${className}`}
    >
      {formatLabel(value)}
    </span>
  );
}

export default StatusBadge;
