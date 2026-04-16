import React, { useState, useRef, useEffect } from "react";
import { IOption } from "@/types";
import Image from "next/image";

interface IMultiSelectInputProps {
  className?: string;
  name: string;
  optionList: IOption[];
  label?: string;
  value: string[];
  onChange: (name: string, value: string[]) => void;
  compact?: boolean;
}

function MultiSelectInput({
  className,
  name,
  optionList,
  label,
  value = [],
  onChange,
  compact = false,
}: IMultiSelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleSelect = (val: string) => {
    let newValues: string[];
    if (value.includes(val)) {
      newValues = value.filter((v) => v !== val);
    } else {
      newValues = [...value, val];
    }
    onChange(name, newValues);
    // Don't close dropdown after selection to allow multiple selections
  };

  const clearAll = () => {
    onChange(name, []);
    // Keep dropdown open after clearing to allow immediate selections
  };

  const selectClass = compact
    ? "text-sm p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400"
    : "p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-sm";

  return (
    <div ref={dropdownRef} className={`relative flex flex-col gap-1 ${className || ""}`}>
      <label
        htmlFor={name}
        className={`font-medium text-gray-300 capitalize ${
          compact ? "text-xs" : "text-sm mb-1"
        }`}
      >
        {label || name}
      </label>

      {/* Dropdown button */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={`${selectClass} flex justify-between items-center`}
      >
        <span>
          {value.length > 0
            ? `${value.length} selected`
            : `Select ${label || name}`}
        </span>
        {isOpen ? (
          <Image 
            height={20} 
            width={20} 
            src="/icons/dropdown.svg" 
            className="svg-white w-4 -rotate-180" 
            alt="dropdown" 
          />
        ) : (
          <Image 
            height={20} 
            width={20} 
            src="/icons/dropdown.svg" 
            className="svg-white w-4" 
            alt="dropdown" 
          />
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg shadow-lg top-full">
          <button
            type="button"
            onClick={clearAll}
            className="block w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-700 border-b border-gray-700"
          >
            Clear All
          </button>

          {optionList.map((o, i) => (
            <div
              key={o.id + "_" + i}
              onClick={() => handleSelect(o.value)}
              className="flex justify-between items-center px-3 py-2 text-sm text-white cursor-pointer hover:bg-gray-700"
            >
              <span>{o.text || o.value}</span>
              {value.includes(o.value) && (
                <div className="bg-gray-500 p-1 rounded">
                  <Image 
                    height={16} 
                    width={16} 
                    src="/icons/checked.svg" 
                    className="w-4 svg-white" 
                    alt="checked" 
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MultiSelectInput;