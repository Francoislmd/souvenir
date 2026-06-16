"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon, SessionsIcon, SettingsIcon } from "@/components/operator/nav-icons";
import type { ComponentType } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const ITEMS: NavItem[] = [
  { href: "/sessions", label: "Sessions", icon: SessionsIcon },
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon, adminOnly: true },
  { href: "/settings", label: "Réglages", icon: SettingsIcon, adminOnly: true },
];

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-surface/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-xl gap-1 px-2 py-2">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex-1 py-1 text-center">
              <span
                className={`inline-flex w-full flex-col items-center gap-0.5 rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  active ? "bg-accent-tint text-accent" : "text-ink-2"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
