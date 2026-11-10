import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "max-w-lg",
  closeOnBackdrop = true,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="movexa-modal-title"
        className={`my-auto w-full ${size} overflow-hidden rounded-2xl border border-[#D9E3ED] bg-white shadow-2xl`}
      >
        <header className="flex items-center justify-between border-b border-[#D9E3ED] px-5 py-4">
          <h2 id="movexa-modal-title" className="text-base font-bold text-[#193B62]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#087F73]"
          >
            <X size={18} />
          </button>
        </header>
        <div className="max-h-[75vh] overflow-y-auto p-5">
          {children}
        </div>
      </section>
    </div>
  );
}
