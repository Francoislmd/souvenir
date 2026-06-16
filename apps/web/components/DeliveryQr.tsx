"use client";

import { QRCodeSVG } from "qrcode.react";

export function DeliveryQr({ url }: { url: string }) {
  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card">
      <QRCodeSVG value={url} size={240} />
    </div>
  );
}
