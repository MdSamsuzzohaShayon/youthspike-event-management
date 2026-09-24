import Link from "next/link";
import InfoCard from "./InfoCard";
import { useAppSelector } from "@/redux/hooks";
import { useLdoId } from "@/lib/LdoProvider";
import { useMemo } from "react";
import { EActionProcess } from "@/types";

const ScoreKeepingLinks = () => {
    const match = useAppSelector((state) => state.matches.match);
    const {current: currRoom} = useAppSelector((state) => state.rooms);
    const {current: currRound} = useAppSelector((state) => state.rounds);
    const { ldoIdUrl } = useLdoId();

    const canBeScoreKeeper = useMemo(() => {
        if (!currRoom || !currRound) return false;
        const roundExist = currRoom.rounds.find((r) => r._id === currRound._id);
        if (!roundExist) return false;
        return (
          roundExist.teamAProcess === EActionProcess.LINEUP &&
          roundExist.teamBProcess === EActionProcess.LINEUP
        );
      }, [currRoom, currRound]);

    if (!canBeScoreKeeper) return null
    return (
        <InfoCard className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5">
            <div className="text-center mb-3">
                <h4 className="text-yellow-logo font-bold text-lg">
                    Score Keeping
                </h4>
                <p className="text-gray-300 text-sm">Manage match scoring</p>
            </div>
            <div className="flex gap-3 justify-center">
                <Link
                    className="btn-info"
                    href={`/score-keeping/${match._id}/${ldoIdUrl}`}
                >
                    Start New
                </Link>
                <Link
                    className="btn-primary"
                    href={`/score-keeping/${match._id}/${ldoIdUrl}`}
                >
                    Edit
                </Link>
            </div>
        </InfoCard>
    );
}

export default ScoreKeepingLinks;
