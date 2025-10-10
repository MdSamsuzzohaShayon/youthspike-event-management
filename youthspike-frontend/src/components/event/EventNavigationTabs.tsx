import { EEventItem } from "@/types";
import { itemVariants } from "@/utils/animation";
import { motion } from "motion/react";

const EventNavigationTabs = ({
  selectedItem,
  handleItemSelect,
  isMobile = false,
}: {
  selectedItem: EEventItem;
  handleItemSelect: (item: EEventItem) => void;
  isMobile?: boolean;
}) => {
  if (isMobile) {
    return (
      <motion.div
        className="block md:hidden w-full bg-gray-800 p-2 rounded-md mb-4"
        variants={itemVariants}
      >
        <div className="flex justify-between items-center gap-1">
          <button
            className={`flex-1 cursor-pointer p-2 rounded-md uppercase text-center transition-colors text-xs font-medium ${
              selectedItem === EEventItem.PLAYER
                ? "bg-yellow-logo text-black"
                : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
            onClick={() => handleItemSelect(EEventItem.PLAYER)}
          >
            Players
          </button>
          <button
            className={`flex-1 cursor-pointer p-2 rounded-md uppercase text-center transition-colors text-xs font-medium ${
              selectedItem === EEventItem.TEAM
                ? "bg-yellow-logo text-black"
                : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
            onClick={() => handleItemSelect(EEventItem.TEAM)}
          >
            teams/standings
          </button>
          <button
            className={`flex-1 cursor-pointer p-2 rounded-md uppercase text-center transition-colors text-xs font-medium ${
              selectedItem === EEventItem.MATCH
                ? "bg-yellow-logo text-black"
                : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
            onClick={() => handleItemSelect(EEventItem.MATCH)}
          >
            Matches
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="hidden md:block side-bar w-full lg:w-1/4 bg-gray-800 p-2 rounded-md lg:max-h-screen overflow-auto"
      variants={itemVariants}
    >
      <ul className="flex flex-col gap-2">
        <li
          className={`cursor-pointer p-2 rounded-md uppercase text-center transition-colors text-sm ${
            selectedItem === EEventItem.PLAYER
              ? "bg-yellow-500 text-black font-semibold"
              : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
          onClick={() => handleItemSelect(EEventItem.PLAYER)}
        >
          Players
        </li>
        <li
          className={`cursor-pointer p-2 rounded-md uppercase text-center transition-colors text-sm ${
            selectedItem === EEventItem.TEAM
              ? "bg-yellow-500 text-black font-semibold"
              : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
          onClick={() => handleItemSelect(EEventItem.TEAM)}
        >
          Team/Standings
        </li>
        <li
          className={`cursor-pointer p-2 rounded-md uppercase text-center transition-colors text-sm ${
            selectedItem === EEventItem.MATCH
              ? "bg-yellow-500 text-black font-semibold"
              : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
          onClick={() => handleItemSelect(EEventItem.MATCH)}
        >
          Matches
        </li>
      </ul>
    </motion.div>
  );
};

export default EventNavigationTabs;
