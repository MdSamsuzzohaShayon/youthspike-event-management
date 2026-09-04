import useLdoUrl from "@/hooks/useLdoUrl";
import { useLdoId } from "@/lib/LdoProvider";
import routerService from "@/lib/router-service";
import { useUser } from "@/lib/UserProvider";
import { EPlayerStatus, IPlayerRank, ITeam, TUpdatePlayer, TUpdateTeam, UserRole } from "@/types";
import { FRONTEND_URL } from "@/utils/keys";
import { imgSize } from "@/utils/style";
import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";

interface IPlayerOperationProps {
    player: IPlayerRank;
    actionOpen: boolean;
    rankControls?: boolean;
    selectedTeam?: ITeam | null; // if we are inside a team
    dialogMoveRef: React.RefObject<HTMLDialogElement | null>;
    makeCaptainWithEmailRef: React.RefObject<HTMLDialogElement | null>;
    deleteRef: React.RefObject<HTMLDialogElement | null>;
    
    onUpdateTeam: (e: React.SyntheticEvent, update: Partial<TUpdateTeam>, teamId: string) => void;
    onUpdatePlayer: (e: React.SyntheticEvent, update: Partial<TUpdatePlayer>, playerId: string) => void;
    onDelete: (e: React.SyntheticEvent, playerId: string) => void;

    setActionOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsOptionsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setMovePlayer: React.Dispatch<React.SetStateAction<boolean>>;
    setNewPlayerRole: React.Dispatch<React.SetStateAction<UserRole | null>>;
}

const PlayerOperation = ({ 
    player, actionOpen, rankControls, selectedTeam,dialogMoveRef, makeCaptainWithEmailRef,  deleteRef,
    onDelete, onUpdatePlayer, onUpdateTeam, 
    setActionOpen, setIsOptionsOpen, setMovePlayer, setNewPlayerRole 
}: IPlayerOperationProps) => {
    const user = useUser();
    const { ldoIdUrl } = useLdoId();

    const handleEditRedirect = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        // Set first event
        // if (player.events) SessionStorageService.setItem(CURRENT_EVENT, player.events[0])
        routerService.push(`/players/${player._id}/${ldoIdUrl}`);

    }

    const handleMovePlayerBox = useCallback((e: React.SyntheticEvent) => {
        e.preventDefault();
        setMovePlayer(true);
        setActionOpen((prev) => !prev);
        dialogMoveRef.current?.showModal();
      }, []);
    

    const handleOpenDialog = useCallback((e: React.SyntheticEvent, capOrCo: UserRole) => {
        e.preventDefault();
        if (makeCaptainWithEmailRef.current) {
            setNewPlayerRole(capOrCo);
            setActionOpen((prev) => !prev);
            makeCaptainWithEmailRef.current.showModal();
        }
    }, []);

    return (
        <div
            className="w-8 md:w-10 h-8 md:h-10 relative flex items-center justify-center bg-gray-700 rounded-full hover:bg-gray-600  transition-colors"
            aria-label="Options"
            role="presentation"
            onClick={() => setIsOptionsOpen(true)}
        >
            {actionOpen && (
                <ul
                    className="absolute z-10 right-6 top-12 w-48 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-md shadow-lg overflow-hidden"
                >
                    <li role="presentation" className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                        <Link href={`${FRONTEND_URL}/players/${player._id}`}>Stats</Link>
                    </li>
                    {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (
                        <>
                            <li role="presentation" className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                                <button onClick={handleEditRedirect}>Edit</button>
                            </li>
                            {rankControls && player.status === EPlayerStatus.ACTIVE && (
                                <>
                                    <li
                                        role="presentation"
                                        className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                                        onClick={(e) => (player.email?.trim() && selectedTeam?._id ? onUpdateTeam(e, { captain: player._id }, selectedTeam?._id) : handleOpenDialog(e, UserRole.captain))}
                                    >
                                        Make Captain
                                    </li>
                                    <li
                                        role="presentation"
                                        className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                                        onClick={(e) => (player.email?.trim() && selectedTeam?._id ? onUpdateTeam(e, { cocaptain: player._id }, selectedTeam?._id) : handleOpenDialog(e, UserRole.co_captain))}
                                    >
                                        Make Co-Captain
                                    </li>
                                </>
                            )}
                            <li role="presentation" className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer" onClick={handleMovePlayerBox}>
                                Move Player
                            </li>
                            {player.status === EPlayerStatus.ACTIVE ? (
                                <li role="presentation" className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer" onClick={(e) => onUpdatePlayer(e, { status: EPlayerStatus.INACTIVE }, player._id)}>
                                    Make Inactive
                                </li>
                            ) : (
                                <li role="presentation" className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer" onClick={(e) => onUpdatePlayer(e, { status: EPlayerStatus.ACTIVE }, player._id)}>
                                    Make Active
                                </li>
                            )}
                            <li role="presentation" className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer" onClick={(e) => deleteRef.current?.showModal()}>
                                Delete
                            </li>
                        </>
                    )}
                </ul>
            )}

            <button onClick={() => setActionOpen((prev) => !prev)} className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-full hover:bg-gray-600 transition-colors" aria-label="Options">
                <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dots-vertical.svg" alt="options" className="w-5 h-5 svg-white" />
            </button>
        </div>
    )
}


export default PlayerOperation;