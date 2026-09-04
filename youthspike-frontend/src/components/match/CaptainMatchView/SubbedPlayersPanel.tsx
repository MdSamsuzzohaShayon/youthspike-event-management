import { IPlayer } from "@/types";

/** Rendering the sub list is its own concern — memoized so it only re-renders when the list itself changes. */
interface SubbedPlayersPanelProps {
    players: IPlayer[];
}

function SubbedPlayersPanel({ players }: SubbedPlayersPanelProps) {
    return (
        <div className="bg-gray-100 p-4 rounded-md">
            <h2 className="text-lg font-semibold mb-2">Subbed Players</h2>
            {players.length > 0 ? (
                players.map((player) => (
                    <div key={player._id} className="capitalize">
                        {`${player.firstName} ${player.lastName}`}
                    </div>
                ))
            ) : (
                <p>No subbed players available.</p>
            )}
        </div>
    );
}

export default SubbedPlayersPanel;