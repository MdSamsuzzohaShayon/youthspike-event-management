import cld from '@/config/cloudinary.config';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { IMatchExpRel, IMatchRelatives, ITeam } from '@/types';
import { readDate } from '@/utils/datetime';
import { AdvancedImage } from '@cloudinary/react';
import React, { useRef } from 'react'
import TeamInMatch from '../team/TeamInMatch';
import { MenuTitle } from '@/types/elements';
import { setSelectedColItem } from '@/redux/slices/elementSlice';
import CollapseContent from './CollapseContent';

interface IMatchSettingProps {
    match: IMatchRelatives;
    myTeam: ITeam | null;
    opTeam: ITeam | null;
}

function MatchSetting({ match, myTeam, opTeam }: IMatchSettingProps) {
    const dispatch = useAppDispatch();

    const { ldo } = useAppSelector((state) => state.events);
    const { colMenus, selectedColItem } = useAppSelector((state) => state.elements);
    // Local State
    const dialogSettingEl = useRef<HTMLDialogElement | null>(null);

    // Handle events
    const handleSettingOpen = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!dialogSettingEl.current) return;
        dialogSettingEl.current.showModal();
    };
    const handleSettingClose = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!dialogSettingEl.current) return;
        dialogSettingEl.current.close();
    };

    const handleMenuItem = (e: React.SyntheticEvent, menuItem: MenuTitle) => {
        e.preventDefault();
        dispatch(setSelectedColItem(menuItem));
    };

    return (
        <React.Fragment>
            <dialog ref={dialogSettingEl} className="w-5/6 bg-gray-100 text-gray-900 h-5/6">
                <div className="bg-gray-900 w-full h-8 text-center px-2 flex justify-between items-center" onClick={handleSettingClose} role="presentation">
                    <div className="false"></div>
                    <h3 className='text-gray-100 capitalize'>Match Detail</h3>
                    <img src="/icons/close.svg" alt="cross" className="h-4 w-4 svg-white" />
                </div>

                <div className="content p-4 w-full">
                    <div className="box-1 bg-gray-900 text-gray-100 rounded-lg flex justify-between items-center">
                        <div className="logo m-2">
                            {ldo?.logo ? <AdvancedImage cldImg={cld.image(ldo.logo)} className="w-16" alt={ldo.name} /> : <img src='/free-logo.svg' className="w-16" alt='free-logo' />}
                        </div>
                        <div className="detail m-2">
                            <h3>{ldo?.name}</h3>
                            <p>Date: {readDate(match.date)}</p>
                            <p>Location: {match.location}</p>
                        </div>
                    </div>

                    <div className="box-2 border border-gray-900 rounded-lg mt-4">
                        <div className="detail m-2">
                            <p>Net Variance: {match.netVariance}</p>
                            <p>Number of Nets: {match.numberOfNets}</p>
                            <p>Number of Round: {match.numberOfRounds}</p>
                        </div>
                    </div>

                    {myTeam && (<div className='box-3 border border-gray-900 rounded-lg mt-4 '><TeamInMatch team={myTeam} home /></div>)}
                    {opTeam && (<div className='box-3 border border-gray-900 rounded-lg mt-4 '><TeamInMatch team={opTeam} home={false} /></div>)}

                    {colMenus.map((cm) => <React.Fragment key={cm.id}>
                        <button className="collapse-trigger border-b border-gray-400 flex justify-between items-center py-2 w-full mt-4" onClick={(e) => handleMenuItem(e, cm.title)} >
                            <span className='capitalize'>{cm.title}</span>
                            <span><img src='/icons/right-arrow.svg' alt='arrow' /></span>
                        </button>
                        {selectedColItem === cm.title && (
                            <div className="collapse-content mt-2">
                                <CollapseContent title={selectedColItem} />
                            </div>
                        )}
                    </React.Fragment>)}
                </div>
            </dialog>

            <div className="img-holder p-2 w-8 absolute left-1 bg-gray-100 rounded-full cursor-pointer" style={{ top: '47%' }} role="presentation" onClick={handleSettingOpen} onKeyDown={(e) => { }}>
                <img src="/icons/setting.svg" alt="setting" className="w-full" />
            </div>
        </React.Fragment>
    )
}

export default MatchSetting