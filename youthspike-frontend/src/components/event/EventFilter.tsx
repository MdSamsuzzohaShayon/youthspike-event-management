import { itemVariants } from "@/utils/animation";
import { motion } from "motion/react";
import SelectInput from "../elements/SelectInput";
import { IOption } from "@/types";

const EventFilter = ({
    search,
    handleSearchChange,
    currDivision,
    handleDivisionChange,
    selectedGroup,
    handleGroupChange,
    divisionList,
    groupList,
    isMobile = false
  }: {
    search: string | null;
    handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    currDivision: string | null;
    handleDivisionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    selectedGroup: string | null;
    handleGroupChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    divisionList: IOption[];
    groupList: any[];
    isMobile?: boolean;
  }) => {
    if (isMobile) {
      return (
        <motion.div 
          className="w-full bg-gray-800 p-3 rounded-md"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid grid-cols-1 gap-3">
            <div className="relative">
              <input
                id="search"
                name="search"
                type="text"
                placeholder="Search..."
                className="w-full px-3 py-2 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                value={search || ""}
                onChange={handleSearchChange}
              />
              {search && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 flex items-center justify-center text-gray-400 hover:text-white"
                  onClick={() => handleSearchChange({ target: { value: "" } } as any)}
                >
                  <img
                    src="/icons/close.svg"
                    alt="Clear search"
                    className="w-4 h-4 invert"
                  />
                </button>
              )}
            </div>
            
            <SelectInput
              key="division-input-mobile"
              handleSelect={handleDivisionChange}
              defaultValue={currDivision || ""}
              name="division"
              optionList={divisionList}
              label="Division"
              compact
            />
            
            <SelectInput
              key="group-input-mobile"
              handleSelect={handleGroupChange}
              value={selectedGroup || ""}
              name="group"
              optionList={[
                ...groupList.map((g, index) => ({
                  id: index + 1,
                  value: g._id,
                  text: g.name,
                })),
              ]}
              label="Group"
              compact
            />
          </div>
        </motion.div>
      );
    }
  
    return (
      <motion.div 
        className="hidden md:block search-filter w-full mx-auto mt-4 md:mt-6 space-y-4 bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg"
        variants={itemVariants}
      >
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="w-full">
            <label
              htmlFor="search"
              className="block text-sm md:text-lg font-semibold text-gray-200 mb-1 md:mb-2"
            >
              Search
            </label>
            <div className="relative">
              <input
                id="search"
                name="search"
                type="text"
                placeholder="Type to search..."
                className="w-full px-3 md:px-4 pr-8 md:pr-10 py-2 md:py-3 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm md:text-base"
                value={search || ""}
                onChange={handleSearchChange}
              />
              {search && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 md:right-3 flex items-center justify-center text-gray-400 hover:text-white"
                  onClick={() => handleSearchChange({ target: { value: "" } } as any)}
                >
                  <img
                    src="/icons/close.svg"
                    alt="Clear search"
                    className="w-4 md:w-5 h-4 md:h-5 invert"
                  />
                </button>
              )}
            </div>
          </div>
  
          <SelectInput
            key="division-input"
            handleSelect={handleDivisionChange}
            defaultValue={currDivision || ""}
            name="division"
            optionList={divisionList}
            label="Division"
          />
          
          <SelectInput
            key="group-input"
            handleSelect={handleGroupChange}
            value={selectedGroup || ""}
            name="group"
            optionList={[
              ...groupList.map((g, index) => ({
                id: index + 1,
                value: g._id,
                text: g.name,
              })),
            ]}
            label="Group"
          />
        </div>
      </motion.div>
    );
  };


  export default EventFilter;