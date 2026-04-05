import Link from "next/link";

export function Logo({ className = "", size = "default" }: { className?: string; size?: "small" | "default" | "large" }) {
  const sizeClasses = {
    small: "text-lg",
    default: "text-2xl",
    large: "text-3xl",
  };

  return (
    <Link href="/" className={`font-[family-name:var(--font-nunito)] font-bold text-primary-dark ${sizeClasses[size]} ${className}`}>
      twocards.
    </Link>
  );
}
