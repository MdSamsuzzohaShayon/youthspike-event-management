import cld from '@/config/cloudinary.config'
import { IEvent, IMatch, IPlayer, ITeam } from '@/types'
import { AdvancedImage } from '@cloudinary/react'
import React, { useState } from 'react'
import MatchList from '../match/MatchList';
import TeamList from '../team/TeamList';
import PlayerList from '../player/PlayerList';

interface IteamCaptain extends ITeam {
    captain: IPlayer;
}
interface IMatchCaptain extends IMatch {
    teamA: ITeamCaptain;
    teamB: ITeamCaptain;
}

interface IEventRelatives extends IEvent {
    matches?: IMatchCaptain[];
    players?: IPlayer[];
    teams?: IteamCaptain[];
}

interface ITeamCaptain extends ITeam {
    captain: IPlayer;
}



function EventDetail({ event }: { event: IEventRelatives }) {
    const [selectedItem, setSelectedItem] = useState(1);

    const renderContent = () => {
        if (selectedItem === 1) {
            return <PlayerList playerList={event.players} />;
        } else if (selectedItem === 2) {
            return <TeamList teamList={event.teams} />;
        } else {
            return <MatchList matchList={event.matches} />;
        }
    }



    return (
        <div className='w-full'>
            <h1 className='mb-4'>{event.name}</h1>
            {event?.sponsors && event.sponsors.length > 0 && (
                <>
                    <h3 className='mb-4'>Sponsors</h3>
                    <div className="sponsors w-full flex items-center justify-between flex-wrap">
                        {event.sponsors.map((sponsor, i) => (
                            <AdvancedImage cldImg={cld.image(sponsor.toString())} key={i} className="w-20" />
                        ))}
                    </div>
                </>
            )}

            <div className="players-teams-matches w-full flex justify-between items-center flex-col md:flex-row mt-8">
                <div className="side-bar w-full md:w-2/6 flex justify-between items-center flex-row md:flex-col flex-wrap">
                    <li role="presentation" onClick={() => setSelectedItem(1)} className={`item list-none cursor-pointer p-2 ${selectedItem === 1 ? "font-bold bg-yellow-500" : ""} players`}>Players</li>
                    <li role="presentation" onClick={() => setSelectedItem(2)} className={`item list-none cursor-pointer p-2 ${selectedItem === 2 ? "font-bold bg-yellow-500" : ""} teams`}>Teams</li>
                    <li role="presentation" onClick={() => setSelectedItem(3)} className={`item list-none cursor-pointer p-2 ${selectedItem === 3 ? "font-bold bg-yellow-500" : ""} matches`}>Matches</li>
                </div>
                <div className="Content w-full md:w-4/6">
                    {event && renderContent()}
                </div>
            </div>
        </div>
    );
}

export default EventDetail