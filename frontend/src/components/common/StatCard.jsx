
export default function StatCard({
  label,
  value,
  description,
  subtext,
  icon: Icon,
  trend,
  trendDirection = "neutral",
  className = "",
}) {
  const detail = description ?? subtext;

  const trendStyles = {
    positive: "text-emerald-700 bg-emerald-50",
    negative: "text-red-700 bg-red-50",
    neutral: "text-gray-600 bg-gray-100",
  };

  return (
    <section className={`rounded-2xl border border-[#D9E3ED] bg-white p-5 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0F7F6] text-[#087F73]">
            <Icon size={18} aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-2">
        <p className="text-2xl font-bold tracking-tight text-[#193B62]">
          {value ?? "—"}
        </p>
        {trend && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${trendStyles[trendDirection] || trendStyles.neutral}`}>
            {trend}
          </span>
        )}
      </div>

      {detail && (
        <p className="mt-2 text-xs leading-5 text-gray-500">{detail}</p>
      )}
    </section>
  );
}
