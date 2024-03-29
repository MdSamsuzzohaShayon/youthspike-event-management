import cld from '@/config/cloudinary.config'
import { IEvent, IMatchExpRel, IPlayer, ITeam } from '@/types'
import { AdvancedImage } from '@cloudinary/react'
import React, { useState } from 'react'
import MatchList from '../match/MatchList';
import TeamList from '../team/TeamList';
import PlayerList from '../player/PlayerList';

interface IteamCaptain extends ITeam {
    captain: IPlayer;
}
interface IMatchCaptain extends IMatchExpRel {
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

enum EItem{
    PLAYER = "PLAYER",
    MATCH = "MATCH",
    TEAM = "TEAM",
}


function EventDetail({ event }: { event: IEventRelatives }) {
    const [selectedItem, setSelectedItem] = useState<EItem>(EItem.MATCH);

    const renderContent = () => {
        switch (selectedItem) {
            case EItem.PLAYER:
                return <PlayerList playerList={event.players} />;
            case EItem.TEAM:
                return <TeamList teamList={event.teams} divisions={event.divisions} />;
            case EItem.MATCH:
                return <MatchList matchList={event.matches} divisions={event.divisions}  />;
            default:
                return null;
        }
    };

    const renderSponsors = () => {
        return event.sponsors?.map((sponsor, i) => (
            <AdvancedImage cldImg={cld.image(sponsor.logo.toString())} key={i} className="w-20" />
        ));
    };

    return (
        <div className='w-full'>
            <h1 className='my-4 text-center'>{event.name}</h1>
            {event?.sponsors && event.sponsors.length > 0 && (
                <>
                    <h3 className='mb-4'>Sponsors</h3>
                    <div className="sponsors w-full flex items-center justify-between md:justify-start flex-wrap gap-2 bg-gray-900">
                        {renderSponsors()}
                    </div>
                </>
            )}

            <div className="flex flex-col md:flex-row mt-8 bg-gray-900 px-2">
                <div className="side-bar sticky top-0 w-full md:w-2/6 flex flex-row md:flex-col flex-wrap mb-2 ">
                    <li role="presentation" onClick={() => setSelectedItem(EItem.PLAYER)} className={`list-none cursor-pointer p-2 ${selectedItem === EItem.PLAYER ? "font-bold bg-yellow-400" : "bg-gray-900"}`}>Players</li>
                    <li role="presentation" onClick={() => setSelectedItem(EItem.TEAM)} className={`list-none cursor-pointer p-2 ${selectedItem === EItem.TEAM ? "font-bold bg-yellow-400" : "bg-gray-900"}`}>Teams</li>
                    <li role="presentation" onClick={() => setSelectedItem(EItem.MATCH)} className={`list-none cursor-pointer p-2 ${selectedItem === EItem.MATCH ? "font-bold bg-yellow-400" : "bg-gray-900"}`}>Matches</li>
                </div>
                <div className="w-full md:w-4/6 static">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

export default EventDetail;