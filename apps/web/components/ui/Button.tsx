import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "accent" | "secondary" | "outline-light" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white shadow-card hover:bg-brand-hover",
  accent: "bg-accent text-white shadow-card hover:bg-accent-hover",
  secondary: "border border-border bg-surface text-ink hover:border-border-strong",
  "outline-light": "border border-white/25 bg-white/10 text-white hover:bg-white/20",
  ghost: "text-ink-2 hover:text-ink",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-[3.25rem] px-7 text-base",
};

function buttonClasses(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return [BASE, VARIANTS[variant], SIZES[size], className].filter(Boolean).join(" ");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function ButtonLink({ href, variant = "primary", size = "md", className, ...props }: ButtonLinkProps) {
  return <Link href={href} className={buttonClasses(variant, size, className)} {...props} />;
}
