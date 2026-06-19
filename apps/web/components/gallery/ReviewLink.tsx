"use client";

export function ReviewLink({
  token,
  href,
  platform,
  className,
  children,
}: {
  token: string;
  href: string;
  platform: "google" | "trustpilot" | "tripadvisor";
  className?: string;
  children: React.ReactNode;
}) {
  function handleClick(): void {
    void fetch(`/api/gallery/${token}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "review_link_clicked", meta: { platform } }),
    });
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
