import { useUser } from "@/lib/UserProvider";
import { IMatch, IMatchExpRel, UserRole } from "@/types";
import CheckboxInput from "../elements/forms/CheckboxInput";
import Link from "next/link";
import { FRONTEND_URL } from "@/utils/keys";
import Image from "next/image";
import { useLdoId } from "@/lib/LdoProvider";

interface IActionButtonsProps {
    match: IMatchExpRel;
    iconSize: number;
    isChecked: boolean;
    setActionOpen: React.Dispatch<React.SetStateAction<boolean>>;
    handleSelectMatch: (e: React.SyntheticEvent, _id: string) => void;
}
/** ✅ Reusable Action Buttons - optimized with useCallback */
const ActionButtons = ({ match, iconSize, isChecked, setActionOpen, handleSelectMatch }: IActionButtonsProps) => {
    const user = useUser();
    const { ldoIdUrl } = useLdoId();
    const iconClass = `w-${iconSize / 4} h-${iconSize / 4}`;

    const handleOpenAction = (e: React.SyntheticEvent) => {
        e.preventDefault();
        setActionOpen((prevState) => !prevState);
    };

    return (
        <div className="flex justify-between items-center gap-2 mt-2 md:mt-0 relative">
            {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && <CheckboxInput name="bulk-match" defaultValue={isChecked} _id={match._id} handleInputChange={handleSelectMatch} />}
            {/* Spectate */}
            <Link href={`${FRONTEND_URL}/matches/${match._id}/scoreboard/?view=ROUND${ldoIdUrl}`} className="flex flex-col items-center text-center p-1 md:p-2 rounded hover:bg-gray-700 transition-colors">
                <Image width={iconSize} height={iconSize} src="/icons/spectate.svg" alt="Spectate" className={iconClass} />
                <span className="text-[10px] md:text-xs uppercase mt-1">Full Scoreboard</span>
            </Link>

            {/* Captain */}
            <Link href={`${FRONTEND_URL}/matches/${match._id}/${ldoIdUrl}`} className="flex flex-col items-center text-center p-1 md:p-2 rounded hover:bg-gray-700 transition-colors">
                <Image width={iconSize} height={iconSize} src="/icons/captain.png" alt="Captain" className={iconClass} />
                <span className="text-[10px] md:text-xs uppercase mt-1">Captain</span>
            </Link>

            {/* Scorekeeper */}
            <Link href={`${FRONTEND_URL}/score-keeping/${match._id}/${ldoIdUrl}`} className="flex flex-col items-center text-center p-1 md:p-2 rounded hover:bg-gray-700 transition-colors">
                <Image width={iconSize} height={iconSize} src="/icons/scorekeeper.png" alt="Scorekeeper" className={iconClass} />
                <span className="text-[10px] md:text-xs uppercase mt-1">Scorekeeper</span>
            </Link>

            <Image src="/icons/dots-vertical.svg" height={20} width={20} alt="dot-vertical" className="w-4 svg-white" role="presentation" onClick={handleOpenAction} />
        </div>
    );

};

export default ActionButtons;