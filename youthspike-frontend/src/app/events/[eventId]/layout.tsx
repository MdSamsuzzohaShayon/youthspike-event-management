import { ReactNode } from "react";

export default function EventLayout({
  children,
}: {
  children: ReactNode;
}) {

  return (
    <div className="container mx-auto px-2">
      {children}
    </div>
  );
}