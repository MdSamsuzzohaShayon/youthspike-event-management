import TabsNav from "@/components/event/TabsNav";
import Link from "next/link";
import { ReactNode, use } from "react";

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