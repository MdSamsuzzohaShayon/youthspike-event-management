import cld from '@/config/cloudinary.config';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { IMatchRelatives, ITeam } from '@/types';
import { readDate } from '@/utils/datetime';
import { AdvancedImage } from '@cloudinary/react';
import React, { useRef } from 'react';
import { EMenuTitle, IColMenu } from '@/types/elements';
import { setSelectedColItem } from '@/redux/slices/elementSlice';
import Image from 'next/image';
import Link from 'next/link';
import { useLdoId } from '@/lib/LdoProvider';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import TeamInMatch from '../team/TeamInMatch';
import CollapseContent from './CollapseContent';

interface IMatchSettingProps {
  match: IMatchRelatives;
  myTeam: ITeam | null;
  opTeam: ITeam | null;
}

function MatchSetting({ match, myTeam, opTeam }: IMatchSettingProps) {
  const dispatch = useAppDispatch();
  const {ldoIdUrl} = useLdoId();

  const { ldo } = useAppSelector((state) => state.events);
  const { colMenus, selectedColItem } = useAppSelector((state) => state.elements);

  const dialogSettingEl = useRef<HTMLDialogElement | null>(null);

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

  const handleMenuItem = (e: React.SyntheticEvent, menuItem: EMenuTitle) => {
    e.preventDefault();
    dispatch(setSelectedColItem(menuItem));
  };

  const renderMenuItem = (cm: IColMenu) => {
    if (cm.title === EMenuTitle.EDIT_MATCH) {
      return (
        <Link
          href={`${ADMIN_FRONTEND_URL}/${match.event}/matches/${match._id}/${ldoIdUrl}`}
          key={cm.id}
          target="_blink"
          className="item-link border-b border-gray-400 flex justify-between items-center py-2 w-full mt-4"
        >
          {cm.title}{' '}
        </Link>
      );
    }

    return (
      <React.Fragment key={cm.id}>
        <button type="button" className="collapse-trigger border-b border-gray-400 flex justify-between items-center py-2 w-full mt-4" onClick={(e) => handleMenuItem(e, cm.title)}>
          <span className="capitalize">{cm.title}</span>
          <span>
            <Image width={12} height={12} src="/icons/right-arrow.svg" alt="arrow" />
          </span>
        </button>
        {selectedColItem === cm.title && (
          <div className="collapse-content mt-2">
            <CollapseContent title={selectedColItem} />
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <React.Fragment>
      <dialog ref={dialogSettingEl} className="w-5/6 bg-white text-black-logo h-5/6">
        {/* Dialog Header */}
        <div className="bg-black-logo w-full h-8 text-center px-2 flex justify-between items-center" onClick={handleSettingClose} role="presentation">
          <div className="false" />
          <h3 className="text-white capitalize">Match Detail</h3>
          <Image height={12} width={12} src="/icons/close.svg" alt="cross" className="h-4 w-4 svg-white" />
        </div>

        {/* Dialog Content */}
        <div className="content p-4 w-full">
          {/* Box 1 - Event Logo and Details */}
          <div className="box-1 bg-black-logo text-white rounded-lg flex justify-between items-center">
            <div className="logo m-2">
              {ldo?.logo ? <AdvancedImage cldImg={cld.image(ldo.logo)} className="w-16" alt={ldo.name} /> : <Image width={100} height={100} src="/free-logo.png" className="w-16" alt="free-logo" />}
            </div>
            <div className="detail m-2">
              <h3>{ldo?.name}</h3>
              <p>Date: {readDate(match.date)}</p>
              <p>Location: {match.description}</p>
            </div>
          </div>

          {/* Box 2 - Match Details */}
          <div className="box-2 border border-black-logo rounded-lg mt-4">
            <div className="detail m-2">
              <p>Net Variance: {match.netVariance}</p>
              <p>Number of Nets: {match.numberOfNets}</p>
              <p>Number of Rounds: {match.numberOfRounds}</p>
            </div>
          </div>

          {/* Box 3 - Team Details */}
          {myTeam && (
            <div className="box-3 border border-black-logo rounded-lg mt-4">
              <TeamInMatch team={myTeam} home />
            </div>
          )}
          {opTeam && (
            <div className="box-3 border border-black-logo rounded-lg mt-4">
              <TeamInMatch team={opTeam} home={false} />
            </div>
          )}

          {/* Render Menu Items */}
          {match.fwango && (
            <Link href={match.fwango} target="_blink" className="item-link uppercase border-b border-gray-400 flex justify-between items-center py-2 w-full mt-4">
              Fwang Link
            </Link>
          )}
          {colMenus.map((cm) => renderMenuItem(cm))}
        </div>
      </dialog>

      {/* Setting Icon */}
      <div className="img-holder p-2 w-8 absolute left-1 bg-white rounded-full cursor-pointer z-20" style={{ top: '47%' }} role="presentation" onClick={handleSettingOpen} onKeyDown={() => {}}>
        <Image width={12} height={12} src="/icons/setting.svg" alt="setting" className="w-full" />
      </div>
    </React.Fragment>
  );
}

export default MatchSetting;
