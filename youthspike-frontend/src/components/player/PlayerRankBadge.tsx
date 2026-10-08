interface IPlayerRankBadgeProps {
    playerRank: number;
    subbedRounds?: number[];
    onTop: boolean;
}


/**
 * Displays player rank and substitution information
 */
const PlayerRankBadge: React.FC<IPlayerRankBadgeProps> = ({
    playerRank,
    subbedRounds,
    onTop,
}) => {
    return (
        <div
            className={`bg-yellow-logo text-center text-black ${onTop ? "rounded-b-lg" : "rounded-t-lg"
                }`}
        >
            <p className="rank"># {playerRank}</p>
            {subbedRounds && subbedRounds.length > 0 && (
                <div className="relative">
                    <p>
                        {subbedRounds.map((roundNumber, index) => {
                            const isLastItem = index + 1 === subbedRounds.length;
                            return `S${roundNumber}${isLastItem ? "" : ", "}`;
                        })}
                    </p>
                </div>
            )}
        </div>
    );
};


export default PlayerRankBadge;