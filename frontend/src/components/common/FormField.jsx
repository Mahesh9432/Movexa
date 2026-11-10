import { useId } from "react";

export default function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  options = [],
  error,
  description,
  disabled = false,
  rows = 3,
  className = "",
  inputClassName = "",
  autoComplete,
  min,
  max,
  step,
}) {
  const generatedId = useId();
  const fieldId = name || generatedId;
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;
  const describedBy = [
    description ? descriptionId : null,
    error ? errorId : null,
  ].filter(Boolean).join(" ") || undefined;

  const controlClass = `w-full rounded-xl border bg-[#F4F7FB] px-3.5 py-2.5 text-sm font-medium text-[#193B62] transition-colors placeholder:font-normal placeholder:text-gray-400 focus:border-[#087F73] focus:outline-none focus:ring-2 focus:ring-[#087F73]/10 disabled:cursor-not-allowed disabled:opacity-60 ${
    error ? "border-red-400" : "border-[#D9E3ED]"
  } ${inputClassName}`;

  const commonProps = {
    id: fieldId,
    name,
    value: value ?? "",
    onChange,
    required,
    disabled,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy,
    className: controlClass,
  };

  const normalizedOptions = options.map((option) =>
    typeof option === "object"
      ? option
      : { label: option, value: option }
  );

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-xs font-semibold text-[#193B62]"
        >
          {label}
          {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
        </label>
      )}

      {type === "textarea" ? (
        <textarea
          {...commonProps}
          rows={rows}
          placeholder={placeholder}
        />
      ) : type === "select" ? (
        <select {...commonProps}>
          <option value="" disabled>
            {placeholder || "Select an option"}
          </option>
          {normalizedOptions.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...commonProps}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
        />
      )}

      {description && (
        <p id={descriptionId} className="text-xs text-gray-500">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
