
export default function EmptyState({
  title,
  description,
  message,
  icon: Icon,
  action,
  className = "",
}) {
  const detail = description ?? message;

  return (
    <section
      className={`rounded-2xl border border-[#D9E3ED] bg-white px-6 py-10 text-center ${className}`}
      aria-live="polite"
    >
      {Icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F7FB] text-[#087F73]">
          <Icon size={22} aria-hidden="true" />
        </div>
      )}
      {title && (
        <h3 className="text-sm font-bold text-[#193B62]">{title}</h3>
      )}
      {detail && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
          {detail}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}
