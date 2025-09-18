import { EEventItem } from "@/types";
import { itemVariants } from "@/utils/animation";
import { motion } from "motion/react";

const EventNavigationTabs = ({
    selectedItem,
    handleItemSelect,
    navItems,
    isMobile = false
  }: {
    selectedItem: EEventItem;
    handleItemSelect: (item: EEventItem) => void;
    navItems: EEventItem[];
    isMobile?: boolean;
  }) => {
    if (isMobile) {
      return (
        <motion.div 
          className="block md:hidden w-full bg-gray-800 p-2 rounded-md mb-4"
          variants={itemVariants}
        >
          <div className="flex justify-between items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item}
                className={`flex-1 cursor-pointer p-2 rounded-md uppercase text-center transition-colors text-xs font-medium ${
                  selectedItem === item
                    ? "bg-yellow-500 text-black"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
                onClick={() => handleItemSelect(item)}
              >
                {item}
              </button>
            ))}
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
          {navItems.map((item) => (
            <li
              key={item}
              className={`cursor-pointer p-2 rounded-md uppercase text-center transition-colors text-sm ${
                selectedItem === item
                  ? "bg-yellow-500 text-black font-semibold"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
              onClick={() => handleItemSelect(item)}
            >
              {item}
            </li>
          ))}
        </ul>
      </motion.div>
    );
  };

  export default EventNavigationTabs;