import { useLdoId } from "@/lib/LdoProvider";
import { useUser } from "@/lib/UserProvider";
import { IMatchExpRel } from "@/types";
import { ADMIN_FRONTEND_URL } from "@/utils/keys";
import LocalStorageService from "@/utils/LocalStorageService";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface IActionButtonsProps {
    match: IMatchExpRel;
    iconSize?: number;
}

/** ✅ Reusable Action Buttons */
const ActionButtons = ({ match, iconSize = 20 }: IActionButtonsProps) => {
    const router = useRouter();
    const user = useUser();
    const { ldoIdUrl } = useLdoId();

    const iconClass = `w-${iconSize / 4} h-${iconSize / 4}`;

    const redirectFullScoreboard = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const prevMatch = LocalStorageService.getMatch(match._id);
        if (prevMatch) {
            LocalStorageService.setMatch(match._id, prevMatch.roundId);
        }
        router.push(`/matches/${match?._id}/scoreboard/${ldoIdUrl}`);
    };

    const handleCaptainView = (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (user?.token) {
            router.push(`/matches/${match?._id}/${ldoIdUrl}`);
            return;
        }
        // Remove all local storage
        LocalStorageService.clearAll();
        // sessionStorageService.setItem(MATCH, match._id);
        router.push(`${ADMIN_FRONTEND_URL}/login/?matchId=${match?._id}`);
    };


    return (
        <div className="flex justify-between items-center gap-2 mt-2">
            {/* Spectate */}
            <div
                role="presentation"
                onClick={redirectFullScoreboard}
                className="flex flex-col items-center text-center rounded hover:bg-gray-700 transition-colors cursor-pointer"
            >
                <Image
                    width={iconSize}
                    height={iconSize}
                    src="/icons/spectate.svg"
                    alt="Spectate"
                    className={iconClass}
                />
                <span className="text-[10px] md:text-xs uppercase">
                    Full Scoreboard
                </span>
            </div>

            {/* Captain */}
            <div
                onClick={handleCaptainView}
                role="presentation"
                className="flex flex-col items-center text-center rounded hover:bg-gray-700 transition-colors cursor-pointer"
            >
                <Image
                    width={iconSize}
                    height={iconSize}
                    src="/icons/captain.png"
                    alt="Captain"
                    className={iconClass}
                />
                <span className="text-[10px] md:text-xs uppercase">Captain</span>
            </div>

            {/* Scorekeeper */}
            <Link
                href={`/score-keeping/${match?._id}/${ldoIdUrl}`}
                className="flex flex-col items-center text-center rounded hover:bg-gray-700 transition-colors"
            >
                <Image
                    width={iconSize}
                    height={iconSize}
                    src="/icons/scorekeeper.png"
                    alt="Scorekeeper"
                    className={iconClass}
                />
                <span className="text-[10px] md:text-xs uppercase">Scorekeeper</span>
            </Link>
        </div>
    );
};


export default ActionButtons;