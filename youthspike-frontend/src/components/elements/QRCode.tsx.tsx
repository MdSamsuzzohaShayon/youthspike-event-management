"use client";

import { QRCodeCanvas } from "qrcode.react";

interface QRProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCode({ value, size = 200, className }: QRProps) {
  return (
    <div className={`flex items-center justify-center ${className || ""}`}>
      <QRCodeCanvas
        value={value}
        size={size} // controls resolution
        style={{
          width: "100%",
          height: "auto",
          aspectRatio: "1 / 1",
        }}
      />
    </div>
  );
}
