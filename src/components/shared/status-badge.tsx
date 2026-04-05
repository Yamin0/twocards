type StatusBadgeProps = {
  status: string;
  variant?: "default" | "primary" | "muted" | "success" | "warning";
};

const variantClasses = {
  default: "bg-surface-mid text-on-surface-variant",
  primary: "bg-primary text-white",
  muted: "bg-surface-low text-on-surface-variant",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
};

export function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${variantClasses[variant]}`}
    >
      {status}
    </span>
  );
}
