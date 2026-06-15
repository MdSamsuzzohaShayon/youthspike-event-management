import React, {
  ChangeEvent,
  Key,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import InputField from './InputField';
import { debounce } from '@/utils/helper';

type IdType = string | number;

interface IBaseSelectableItem {
  id: IdType;
}

interface GenericMultiSelectProps<T extends IBaseSelectableItem> {
  // Input label
  label?: ReactNode;
  // All selectable items
  items: T[];
  // Selected item ids
  defaultSelectedIds?: T['id'][];
  // Called when selection changes
  onSelectionChange?: (selectedIds: T['id'][]) => void;
  // Render item label
  getItemLabel: (item: T) => string;
  // Search matcher
  searchBy?: (item: T) => string[];
  // Custom key extractor
  getItemKey?: (item: T) => Key;
  // Additional wrapper class
  className?: string;
  // Empty state
  emptyMessage?: ReactNode;
  // Debounce delay
  debounceDelay?: number;
}

function GenericMultiSelect<T extends IBaseSelectableItem>({
  label,
  items,
  defaultSelectedIds = [],
  onSelectionChange,
  getItemLabel,
  searchBy,
  getItemKey,
  className = '',
  emptyMessage = 'No items found',
  debounceDelay = 250,
}: GenericMultiSelectProps<T>) {
  /**
   * Store selected ids in Set
   *
   * Why?
   * - O(1) lookup
   * - Better than array.includes()
   */
  const [selectedIds, setSelectedIds] = useState<Set<T['id']>>(
    () => new Set(defaultSelectedIds)
  );
  const [searchQuery, setSearchQuery] = useState<string>('');


  useEffect(() => {
    setSelectedIds(new Set(defaultSelectedIds));
  }, [defaultSelectedIds]);


  const handleSearchChange = useMemo(
    () =>
      debounce((event: ChangeEvent<HTMLInputElement>) => {
        if (event?.target?.value?.trim()) setSearchQuery(event.target.value.trim().toLowerCase());
      }, debounceDelay),
    [debounceDelay]
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;

    return items.filter((item) => {
      const searchableValues = searchBy
        ? searchBy(item)
        : [getItemLabel(item)];

      return searchableValues.some(
        (value) =>
          typeof value === 'string' &&
          value.toLowerCase().includes(searchQuery)
      );
    });
  }, [items, searchQuery, searchBy, getItemLabel]);


  const handleToggle = useCallback(
    (itemId: T['id']) => {
      const updatedSelectedIds = new Set(selectedIds);

      if (updatedSelectedIds.has(itemId)) {
        updatedSelectedIds.delete(itemId);
      } else {
        updatedSelectedIds.add(itemId);
      }

      // Update internal state
      setSelectedIds(updatedSelectedIds);

      // Notify parent AFTER state update logic
      onSelectionChange?.([...updatedSelectedIds]);
    },
    [selectedIds, onSelectionChange]
  );

  return (
    <div className={`flex w-full flex-col gap-x-3 ${className}`}>
      {/* {label && <label className='text-sm font-medium text-gray-300 mb-1 uppercase'>{label}</label>} */}

      {items.length > 15 && (
        <InputField
          name="search"
          label={typeof label === 'string' ? label : 'Search'}
          className="w-full"
          onChange={handleSearchChange}
        />
      )}

      {filteredItems.length === 0 ? (
        <div>{emptyMessage}</div>
      ) : (
        <ul className="flex flex-wrap items-center gap-3">
          {filteredItems.map((item) => {
            const itemId = item.id;
            const isSelected = selectedIds.has(itemId);

            return (
              <li
                key={getItemKey ? getItemKey(item) : itemId}
                className="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggle(itemId)}
                />

                <span className="capitalize">
                  {getItemLabel(item)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default GenericMultiSelect;