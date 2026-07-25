import { IGroup } from "@/types";

// Sub-component: Group Filter Menu
interface GroupFilterMenuProps {
    isVisible: boolean;
    groupList: IGroup[];
    onGroupFilter: (e: React.SyntheticEvent, groupId: string | null) => void;
  }
  
  const GroupFilterMenu: React.FC<GroupFilterMenuProps> = ({
    isVisible,
    groupList,
    onGroupFilter,
  }) => {
    if (!isVisible) return null;
  
    return (
        <ul
          className="absolute z-10 top-7 right-3 w-48 bg-gray-100 bg-gray-900 text-gray-800 text-gray-200 rounded-md shadow-lg overflow-hidden"
        >
          <li
            key="all"
            role="presentation"
            className="capitalize px-4 py-3 hover:bg-gray-200 hover:bg-gray-700 cursor-pointer"
            onClick={(e) => onGroupFilter(e, null)}
          >
            All
          </li>
          {groupList.map((group, index) => (
            <li
              key={index}
              role="presentation"
              className="capitalize px-4 py-3 hover:bg-gray-200 hover:bg-gray-700 cursor-pointer"
              onClick={(e) => onGroupFilter(e, group._id)}
            >
              {group.name}
            </li>
          ))}
        </ul>
    );
  };

export default GroupFilterMenu;