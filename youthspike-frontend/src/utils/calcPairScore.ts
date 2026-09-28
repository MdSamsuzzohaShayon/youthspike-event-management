/**
 * Calculate the combined score of two players.
 */
function calcPairScore(
    playerA: number | null | undefined,
    playerB: number | null | undefined
): number {
    return (playerA || 0) + (playerB || 0);
}


export default calcPairScore;
