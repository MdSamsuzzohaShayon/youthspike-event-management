import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { EMessage, ETeam } from "@/types";
import { useCallback, useMemo } from "react";
import PlayerSelectionPanel from "./PlayerSelectionPanel";
import { EXTRA_HEIGHT, screen } from "@/utils/constant";
import { setOutOfRange, setShowTeamPlayers } from "@/redux/slices/matchesSlice";
import RoundDetailPanel from "./RoundDetailPanel";
import RoundButtons from "./RoundButtons";
import { useRoundNavigation } from "@/hooks/useRoundNavigation";
import { setMessage } from "@/redux/slices/elementSlice";

// Constants
const PLAYER_SELECTION_HEIGHT = {
    mobile: 450,
    desktop: 500,
} as const;

// Render left panel content
const LeftSidePanel = () => {
    const dispatch = useAppDispatch();


    const {
        myTeam,
        opTeam,
        showTeamPlayers,
        myPlayers,
        availablePlayerIds,
        disabledPlayerIds,
        selectedNet,
        myTeamE,
        match,
    } = useAppSelector((state) => state.matches);
    const { roundList, current: currentRound } = useAppSelector((state) => state.rounds);


    const { handleRoundChange } = useRoundNavigation({
        roundList,
        allNets: useAppSelector((state) => state.nets.nets),
        myTeamE,
        currentRound,
        match,
    });

    // Event handlers
    const handleClosePlayerSelection = useCallback(() => {
        dispatch(setShowTeamPlayers(false));
        dispatch(setOutOfRange([]));
    }, [dispatch]);

    const handleRoundNavigation = useCallback(
        (roundId: string) => {
            handleRoundChange(roundId, (errorMessage) => {
                dispatch(
                    setMessage({
                        type: EMessage.ERROR,
                        message: errorMessage,
                    })
                );
            });
            dispatch(setMessage(null));
        },
        [dispatch, handleRoundChange]
    );

    //  Memoization
    const opponentTeamE = useMemo<ETeam>(
        () => (myTeamE === ETeam.teamA ? ETeam.teamB : ETeam.teamA),
        [myTeamE]
    );


    const renderRoundButtons = useMemo(() => (
        <RoundButtons
            roundList={roundList}
            currentRoundId={currentRound?._id}
            extendedOvertime={match.extendedOvertime}
            onRoundClick={handleRoundNavigation}
        />
    ), [roundList, currentRound?._id, match.extendedOvertime, handleRoundNavigation]);




    if (showTeamPlayers) {
        return (
            <PlayerSelectionPanel
                selectedNetNum={selectedNet?.num ?? null}
                availablePlayerIds={availablePlayerIds}
                currentRound={currentRound}
                myPlayers={myPlayers}
                disabledPlayerIds={disabledPlayerIds}
                onClose={handleClosePlayerSelection}
            />
        );
    }

    return (
        <RoundDetailPanel
            myTeam={myTeam}
            opTeam={opTeam}
            myTeamE={myTeamE}
            opTeamE={opponentTeamE}
            match={match}
            roundList={roundList}
            roundButtons={renderRoundButtons}
        />
    );
};


export default LeftSidePanel;