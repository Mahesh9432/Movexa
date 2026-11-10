
export default function PageHeader({
  category,
  title,
  subtitle,
  action,
  className = "",
}) {
  return (
    <div className={`flex flex-col justify-between gap-4 border-b border-[#D9E3ED] pb-5 sm:flex-row sm:items-center ${className}`}>
      <div className="min-w-0">
        {category && (
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#087F73]">
            {category}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#193B62] sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-gray-500">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}
