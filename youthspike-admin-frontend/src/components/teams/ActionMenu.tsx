import routerService from "@/lib/router-service";
import { ITeam } from "@/types";
import { CURRENT_EVENT } from "@/utils/constant";
import SessionStorageService from "@/utils/SessionStorageService";
import Image from "next/image";

interface IActionMenuProps {
    team: ITeam;
    eventId: string;
    ldoIdUrl: string;
    actionOpen: boolean;
    actionEl: React.RefObject<HTMLUListElement | null>;
    sendCredentialLabel: string;
    onClose: () => void;
    onSendCredential: (e: React.SyntheticEvent, teamId: string) => void;
    onMoveTeamOpen: (e: React.SyntheticEvent, team: ITeam) => void;
    onDeleteTeamOpen: (e: React.SyntheticEvent, team: ITeam) => void;
}

function ActionMenu({
    team,
    eventId,
    ldoIdUrl,
    actionOpen,
    actionEl,
    sendCredentialLabel,
    onClose,
    onSendCredential,
    onMoveTeamOpen,
    onDeleteTeamOpen,
}: IActionMenuProps) {
    const handleEditRedirect = (e: React.SyntheticEvent) => {
        e.preventDefault();
        SessionStorageService.setItem(CURRENT_EVENT, eventId);
        routerService.push(`/teams/${team._id}/update/${ldoIdUrl}`);
    };

    if (!actionOpen) return null;

    return (

        <ul
            ref={actionEl}
            className="absolute z-20 right-0 top-10 w-48 bg-gray-700 rounded-md shadow-lg overflow-hidden"
        >
            <li>
                <button onClick={handleEditRedirect} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 hover:bg-gray-700 cursor-pointer">
                    <Image src="/icons/edit.svg" alt="Edit" width={16} height={16} className="svg-white" />
                    <span className="text-sm">Edit</span>
                </button>
            </li>

            <li
                onClick={(e) => onMoveTeamOpen(e, team)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 hover:bg-gray-700 cursor-pointer"
            >
                <Image src="/icons/move.svg" alt="Move Team" width={16} height={16} className="svg-white" />
                <span className="text-sm">Move Team</span>
            </li>

            <li
                onClick={(e) => {
                    onClose();
                    onSendCredential(e, team._id);
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 hover:bg-gray-700 cursor-pointer"
            >
                <Image src={team.sendCredentials ? "/icons/sent-email.svg" : "/icons/send-email.svg"} alt={`${sendCredentialLabel} Credential`} width={16} height={16} className={team.sendCredentials ? 'svg-green' : 'svg-white'} />
                <span className="text-sm">{sendCredentialLabel} Credential</span>
            </li>

            <li
                onClick={(e) => onDeleteTeamOpen(e, team)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 hover:bg-gray-700 cursor-pointer text-red-500 hover:text-red-400"
                role="presentation"
            >
                <Image src="/icons/delete.svg" alt="Delete" width={16} height={16} className="svg-white" />
                <span className="text-sm">Delete</span>
            </li>
        </ul>

    );
}


export default ActionMenu;