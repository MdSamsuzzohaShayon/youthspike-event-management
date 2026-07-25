import Image from "next/image";

// Sub-component: Bulk Action Menu
interface BulkActionMenuProps {
    isVisible: boolean;
    onBulkCredentials: (e: React.SyntheticEvent) => void;
    onShowChangeGroup: (e: React.SyntheticEvent) => void;
    onBulkTeamOpen: (e: React.SyntheticEvent) => void;
}

const BulkActionMenu: React.FC<BulkActionMenuProps> = ({
    isVisible,
    onBulkCredentials,
    onShowChangeGroup,
    onBulkTeamOpen,
}) => {
    if (!isVisible) return null;

    return (
        <ul
            className="absolute z-10 left-12 top-6 w-48 bg-gray-700 text-gray-300 rounded-md shadow-lg overflow-hidden"
        >
            <li
                role="presentation"
                className="capitalize px-4 py-3 hover:bg-gray-200 hover:bg-gray-700 cursor-pointer flex justify-start gap-x-2 items-center"
                onClick={onBulkCredentials}
            >
                <Image src="/icons/send-email.svg" alt="Send" width={16} height={16} />
                Send Credentials
            </li>
            <li
                role="presentation"
                className="capitalize px-4 py-3 hover:bg-gray-200 hover:bg-gray-700 cursor-pointer flex justify-start gap-x-2 items-center"
                onClick={onShowChangeGroup}
            >
                <Image src="/icons/share.svg" className="svg-white" alt="Send" width={16} height={16} />
                Change Group
            </li>
            {/* // temp  - make sure singleTeamUpdate function in the backend works properly when moving multiple teams, currently it is giving me an error*/}
            {/* <li
            role="presentation"
            className="capitalize px-4 py-3 hover:bg-gray-200 hover:bg-gray-700 cursor-pointer flex justify-start gap-x-2 items-center"
            onClick={onBulkTeamOpen}
          >
            <Image className="svg-white" src="/icons/move.svg" alt="Move" width={16} height={16} />
            Move team
          </li> */}
        </ul>
    );
};


export default BulkActionMenu;

