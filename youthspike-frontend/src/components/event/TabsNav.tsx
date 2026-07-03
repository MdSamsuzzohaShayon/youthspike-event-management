"use client";

import Link from "next/link";
import { useSelectedLayoutSegment, useSearchParams, usePathname, useSelectedLayoutSegments } from "next/navigation";
import "./TabsNav.css";

export default function TabsNav({ eventId }: { eventId: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();




  const tabs = [
    {
      name: "PLAYER",
      segment: "players",
      color: "bg-yellow-logo text-black",
    },
    {
      name: "Team Standings",
      segment: "teams",
      color: "bg-yellow-logo text-black",
    },
    {
      name: "MATCH",
      segment: "matches",
      color: "bg-yellow-logo text-black",
    },
  ];

  // Convert existing search params → "?key=value&x=y"
  const query = searchParams.toString();
  const suffix = query ? `?${query}` : "";




  return (
    <div className="w-full sticky top-0 z-40">
      <div
        className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl shadow-lg px-6 py-3 flex justify-center gap-6"
      >
        {tabs.map((tab) => {
          const href = `/events/${eventId}/${tab.segment}${suffix}`;
          // const isActive = activeSegment === tab.segment;
          const isActive = pathname.endsWith(`/${tab.segment}`);

          return (
            <Link key={tab.segment} href={href}>
              <div
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${isActive
                  ? `bg-gradient-to-r ${tab.color} shadow-md`
                  : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                  }`}
              >
                <span className="text-sm font-semibold uppercase tracking-wide">
                  {tab.name}
                </span>

                {isActive && (
                  <div
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white/80 rounded"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
