"use client";

import { Bell, Menu } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";

interface TopbarProps {
  onMenuToggle: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { fullName, email, venueName, initials } = useAuthUser();

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-[12px]">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Left: hamburger (mobile only) */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Open menu"
        >
          <Menu size={22} strokeWidth={1.5} />
        </button>

        {/* Spacer for desktop */}
        <div className="hidden lg:block" />

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Notification bell */}
          <button
            className="relative p-2 rounded-lg text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} strokeWidth={1.5} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
          </button>

          {/* User avatar section */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium font-[family-name:var(--font-manrope)] text-on-surface leading-tight">
                {fullName || email || "Utilisateur"}
              </p>
              <p className="text-xs font-[family-name:var(--font-inter)] text-on-surface-variant">
                {venueName || "Venue Manager"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center">
              <span className="text-sm font-semibold font-[family-name:var(--font-manrope)] text-on-primary-container">
                {initials || "U"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
