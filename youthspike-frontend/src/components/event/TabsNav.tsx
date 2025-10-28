"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { motion } from "framer-motion";
import "./TabsNav.css";

export default function TabsNav({ eventId }: { eventId: string }) {
  const activeSegment = useSelectedLayoutSegment();

  const tabs = [
    {
      name: "PLAYER",
      segment: "players",
      color: "bg-yellow-logo text-black",
    },
    {
      name: "TEAM",
      segment: "teams",
      color: "bg-yellow-logo text-black",
    },
    {
      name: "MATCH",
      segment: "matches",
      color: "bg-yellow-logo text-black",
    },
  ];

  return (
    <>
      {/* Mobile Navigation - Bottom Sheet Style */}
      <div className="block md:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] max-w-md">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="bg-gray-800/95 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl p-3"
        >
          <div className="flex justify-between items-center gap-1">
            {tabs.map((tab) => {
              const href = `/events/${eventId}/${tab.segment}`;
              const isActive = activeSegment === tab.segment;

              return (
                <Link key={tab.segment} href={href} className="flex-1">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? `bg-gradient-to-r ${tab.color} shadow-lg`
                        : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                    }`}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="mobileActiveIndicator"
                        className="absolute -top-1 w-1.5 h-1.5 bg-white rounded-full"
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {tab.name}
                    </span>

                    {/* Ripple Effect */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-white/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Desktop Navigation - Horizontal Bar */}
      <div className="hidden md:block w-full sticky top-0 z-40">
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
          className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl shadow-lg px-6 py-3 flex justify-center gap-6"
        >
          {tabs.map((tab, index) => {
            const href = `/events/${eventId}/${tab.segment}`;
            const isActive = activeSegment === tab.segment;

            return (
              <Link key={tab.segment} href={href}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-r ${tab.color} shadow-md`
                      : "text-gray-300 hover:text-white hover:bg-gray-700/50"
                  }`}
                >
                  {/* Label */}
                  <span className="text-sm font-semibold uppercase tracking-wide">
                    {tab.name}
                  </span>

                  {/* Active underline */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white/80 rounded"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </motion.div>
      </div>

      {/* Mobile Spacer */}
      <div className="block md:hidden h-24" />
    </>
  );
}
