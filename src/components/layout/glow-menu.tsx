"use client";

import type * as React from "react";
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

const itemVariants = {
  initial: { rotateX: 0 },
  hover: { rotateX: -90 },
};

const backVariants = {
  initial: { rotateX: 90 },
  hover: { rotateX: 0 },
};

const sharedTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 20,
  mass: 0.8,
};

export function GlowMenu({ items, basePath, onNavigate }: GlowMenuProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === basePath) return pathname === basePath;
    return pathname.startsWith(href);
  };

  return (
    <motion.nav
      className="flex items-center gap-1 rounded-2xl bg-primary-dark/95 backdrop-blur-xl p-1.5 border border-white/[0.08] shadow-[0_4px_30px_rgba(0,27,64,0.3)]"
      initial="initial"
      whileHover="initial"
    >
      <ul className="flex items-center gap-0.5">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <motion.li
              key={item.href}
              className="relative"
              initial="initial"
              whileHover="hover"
            >
              {/* Glow effect behind active item */}
              {active && (
                <motion.div
                  className="absolute inset-0 rounded-xl opacity-100 z-0"
                  layoutId="glow"
                  style={{ background: item.gradient }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30,
                  }}
                />
              )}

              {/* 3D flip container */}
              <motion.div
                className="relative"
                style={{ perspective: 600 }}
              >
                {/* Front face */}
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
                  <motion.div
                    variants={itemVariants}
                    transition={sharedTransition}
                    style={{
                      transformStyle: "preserve-3d",
                      transformOrigin: "center bottom",
                    }}
                    className="flex items-center gap-2"
                  >
                    <span
                      className={`transition-colors duration-300 ${
                        active ? item.iconColor : ""
                      }`}
                    >
                      <Icon size={18} strokeWidth={1.5} />
                    </span>
                    <span className="hidden lg:inline">{item.label}</span>
                  </motion.div>
                </Link>
              </motion.div>
            </motion.li>
          );
        })}
      </ul>
    </motion.nav>
  );
}

/* Vertical variant for sidebar usage */
export function GlowMenuVertical({ items, basePath, onNavigate }: GlowMenuProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === basePath) return pathname === basePath;
    return pathname.startsWith(href);
  };

  return (
    <motion.nav
      className="flex flex-col gap-1 w-full"
      initial="initial"
    >
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <motion.li
              key={item.href}
              className="relative"
              initial="initial"
              whileHover="hover"
            >
              {/* Glow effect behind active item */}
              {active && (
                <motion.div
                  className="absolute inset-0 rounded-xl opacity-100 z-0"
                  layoutId="glow-vertical"
                  style={{ background: item.gradient }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30,
                  }}
                />
              )}

              {/* 3D flip container */}
              <motion.div
                className="relative"
                style={{ perspective: 600 }}
              >
                {/* Front face */}
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`
                    relative z-10 flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm
                    font-[family-name:var(--font-manrope)] font-medium
                    transition-colors duration-200
                    ${
                      active
                        ? "text-white"
                        : "text-white/50 hover:text-white/80"
                    }
                  `}
                >
                  <motion.div
                    variants={itemVariants}
                    transition={sharedTransition}
                    style={{
                      transformStyle: "preserve-3d",
                      transformOrigin: "center bottom",
                    }}
                    className="flex items-center gap-3"
                  >
                    <span
                      className={`transition-colors duration-300 ${
                        active ? item.iconColor : ""
                      }`}
                    >
                      <Icon size={20} strokeWidth={1.5} />
                    </span>
                    <span>{item.label}</span>
                  </motion.div>
                </Link>
              </motion.div>
            </motion.li>
          );
        })}
      </ul>
    </motion.nav>
  );
}
