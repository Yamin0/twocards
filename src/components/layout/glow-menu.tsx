"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface GlowMenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  gradient: string;
  iconColor: string;
}

interface GlowMenuProps {
  items: GlowMenuItem[];
  basePath: string;
  onNavigate?: () => void;
}

export function GlowMenu({ items, basePath, onNavigate }: GlowMenuProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === basePath) return pathname === basePath;
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex items-center gap-1 rounded-2xl bg-primary-dark/95 backdrop-blur-xl p-1.5 border border-white/[0.08] shadow-[0_4px_30px_rgba(0,27,64,0.3)]">
      <ul className="flex items-center gap-0.5">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href} className="relative">
              {/* Glow effect behind active item */}
              {active && (
                <motion.div
                  className="absolute inset-0 rounded-xl z-0"
                  layoutId="glow"
                  style={{ background: item.gradient }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30,
                  }}
                />
              )}

              <Link
                href={item.href}
                onClick={onNavigate}
                className={`
                  relative z-10 flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm
                  font-[family-name:var(--font-manrope)] font-medium
                  transition-colors duration-200
                  ${
                    active
                      ? "text-white"
                      : "text-white/50 hover:text-white/80"
                  }
                `}
              >
                <span
                  className={`transition-colors duration-300 ${
                    active ? item.iconColor : ""
                  }`}
                >
                  <Icon size={18} strokeWidth={1.5} />
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
