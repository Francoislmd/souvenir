"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { DashboardIcon, SessionsIcon, SettingsIcon } from "@/components/operator/nav-icons";
import type { ComponentType } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon, adminOnly: true },
  { href: "/sessions", label: "Sessions", icon: SessionsIcon },
  { href: "/settings", label: "Réglages", icon: SettingsIcon, adminOnly: true },
];

export function Sidebar({
  isAdmin,
  operatorName,
  stripeOnboarded,
}: {
  isAdmin: boolean;
  operatorName: string;
  stripeOnboarded: boolean;
}) {
  const pathname = usePathname();
  const items = ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface px-3 py-4 md:flex">
      <Link href="/dashboard" className="mb-6 px-2">
        <Logo markClassName="h-7 w-7" textClassName="text-base" />
      </Link>

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium transition ${
                active ? "bg-accent-tint text-accent" : "text-ink-2 hover:bg-canvas hover:text-ink"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-card border border-border p-3">
        <p className="truncate text-sm font-medium text-ink">{operatorName}</p>
        <span
          className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
            stripeOnboarded ? "bg-success-tint text-success" : "bg-canvas text-ink-2"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {stripeOnboarded ? "Stripe actif" : "Stripe inactif"}
        </span>
      </div>
    </aside>
  );
}
