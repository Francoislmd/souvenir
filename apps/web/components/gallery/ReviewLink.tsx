"use client";

export function ReviewLink({
  token,
  href,
  className,
  children,
}: {
  token: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  function handleClick(): void {
    void fetch(`/api/gallery/${token}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "review_link_clicked" }),
    });
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
