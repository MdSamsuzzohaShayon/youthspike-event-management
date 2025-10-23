import TabsNav from "@/components/event/TabsNav";
import Link from "next/link";
import { ReactNode, use } from "react";

export default function EventLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);

  return (
    <div className="w-full min-h-screen">
      <div className="container mx-auto px-2">
        {/* Event Header */}
        <div className="text-center w-full flex flex-col items-center mb-6 animate-fade-in">
          <Link href="/">
            <img
              alt="youthspike-logo"
              width="100"
              height="100"
              className="w-48"
              src="/free-logo.png"
            />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold mt-2 text-white">2025 PRO LEAGUE</h1>
        </div>

        {/* Tabs Navigation (Client Component) */}
        <TabsNav eventId={eventId} />

        {/* Page Content */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 md:mt-6">
          <div className="content w-full rounded-md bg-gray-800 p-3 md:p-4 animate-fade-in-up">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}