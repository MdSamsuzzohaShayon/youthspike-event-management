import React, { useRef, useCallback, useMemo } from 'react';
import { AdvancedImage } from '@cloudinary/react';
import Image from 'next/image';
import Link from 'next/link';
import cld from '@/config/cloudinary.config';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { IMatchRelatives, IRoom, IRoundRelatives, ITeam } from '@/types';
import { readDate } from '@/utils/datetime';
import { EMenuTitle, IColMenu } from '@/types/elements';
import { setSelectedColItem } from '@/redux/slices/elementSlice';
import { useLdoId } from '@/lib/LdoProvider';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import TeamInMatch from '../team/TeamInMatch';
import CollapseContent from './CollapseContent';
import { EActionProcess } from '@/types/room';

interface IMatchSettingProps {
  match: IMatchRelatives;
  myTeam: ITeam | null;
  opTeam: ITeam | null;
  currRoom: IRoom | null;
  currRound: IRoundRelatives | null;
}

function MatchSetting({ match, myTeam, opTeam, currRoom, currRound }: IMatchSettingProps) {
  const dispatch = useAppDispatch();
  const { ldoIdUrl } = useLdoId();
  const { ldo } = useAppSelector((state) => state.events);
  const { colMenus, selectedColItem } = useAppSelector((state) => state.elements);
  const dialogSettingEl = useRef<HTMLDialogElement>(null);

  const handleSettingOpen = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    dialogSettingEl.current?.showModal();
  }, []);

  const handleSettingClose = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    dialogSettingEl.current?.close();
  }, []);

  const handleMenuItem = useCallback(
    (e: React.SyntheticEvent, menuItem: EMenuTitle) => {
      e.preventDefault();
      dispatch(setSelectedColItem(menuItem));
    },
    [dispatch],
  );

  const canBeScoreKeeper: boolean = useMemo(() => {
    if (!currRoom) return false;
    // Check the room for all round
    const { rounds } = currRoom;
    // if in the current round both team have submitted thir lineup
    const roundExist = rounds.find((r) => r._id === currRound?._id);
    if (!roundExist) return false;
    if (roundExist?.teamAProcess !== EActionProcess.LINEUP || roundExist?.teamBProcess !== EActionProcess.LINEUP) {
      return false;
    }
    return true;
  }, [currRoom, currRound]);

  const renderMenuItem = useCallback(
    (cm: IColMenu) => {
      if (cm.title === EMenuTitle.EDIT_MATCH) {
        return (
          <Link
            href={`${ADMIN_FRONTEND_URL}/${match.event}/matches/${match._id}/${ldoIdUrl}`}
            key={cm.id}
            target="_blank"
            rel="noopener noreferrer"
            className="item-link border-b border-gray-400 flex justify-between items-center py-2 w-full mt-4"
          >
            {cm.title}
          </Link>
        );
      }

      return (
        <React.Fragment key={cm.id}>
          <button type="button" className="collapse-trigger border-b border-gray-400 flex justify-between items-center py-2 w-full mt-4" onClick={(e) => handleMenuItem(e, cm.title)}>
            <span className="capitalize">{cm.title}</span>
            <Image width={12} height={12} src="/icons/right-arrow.svg" alt="arrow" />
          </button>
          {selectedColItem === cm.title && (
            <div className="collapse-content mt-2">
              <CollapseContent title={selectedColItem} />
            </div>
          )}
        </React.Fragment>
      );
    },
    [selectedColItem, handleMenuItem, match.event, match._id, ldoIdUrl],
  );

  const matchDetails = useMemo(
    () => ({
      date: readDate(match.date),
      description: match.description,
      location: match.location,
      netVariance: match.netVariance,
      numberOfNets: match.numberOfNets,
      numberOfRounds: match.numberOfRounds,
      tieBreaking: match.tieBreaking?.replace(/_/, ' '),
    }),
    [match],
  );

  const dialogHeader = useMemo(
    () => (
      <div className="bg-black-logo w-full h-8 text-center px-2 flex justify-between items-center" onClick={handleSettingClose} role="presentation">
        <div className="false" />
        <h3 className="text-white capitalize">Match Detail</h3>
        <Image width={12} height={12} src="/icons/close.svg" alt="cross" className="h-4 w-4 svg-white" />
      </div>
    ),
    [handleSettingClose],
  );

  const eventLogo = useMemo(
    () => (ldo?.logo ? <AdvancedImage cldImg={cld.image(ldo.logo)} className="w-16" alt={ldo.name} /> : <Image width={64} height={64} src="/free-logo.png" className="w-16" alt="free-logo" />),
    [ldo],
  );

  const scoreKeepingLinks = useMemo(
    () => (
      <div className="score-keeping-wrapper bg-black-logo w-full flex justify-center items-center rounded-lg mt-2 p-2 gap-x-2">
        <Link className="btn-light" href={`/matches/${match._id}/score-keeping/${ldoIdUrl}`}>
          Start New
        </Link>
        <Link className="btn-light" href={`/matches/${match._id}/score-keeping/${ldoIdUrl}`}>
          Edit
        </Link>
      </div>
    ),
    [match._id],
  );

  const teamComponents = useMemo(
    () => (
      <>
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
      </>
    ),
    [myTeam, opTeam],
  );

  const fwangoLink = useMemo(
    () =>
      match.fwango && (
        <Link href={match.fwango} target="_blank" rel="noopener noreferrer" className="item-link uppercase border-b border-gray-400 flex justify-between items-center py-2 w-full mt-4">
          Fwang Link
        </Link>
      ),
    [match.fwango],
  );

  return (
    <>
      <dialog ref={dialogSettingEl} className="w-5/6 bg-white text-black-logo h-5/6">
        {dialogHeader}

        <div className="content p-4 w-full">
          {/* Box 1 - Event Logo and Details */}
          <div className="box-1 bg-black-logo text-white rounded-lg flex justify-between items-center">
            <div className="logo m-2">{eventLogo}</div>
            <div className="detail m-2">
              <h3>{ldo?.name}</h3>
              <p>Date: {matchDetails.date}</p>
              <p>Description: {matchDetails.description}</p>
              <p>Location: {matchDetails.location}</p>
            </div>
          </div>

          {canBeScoreKeeper && scoreKeepingLinks}

          {/* Box 2 - Match Details */}
          <div className="box-2 border border-black-logo rounded-lg mt-4">
            <div className="detail m-2">
              <p>Net Variance: {matchDetails.netVariance}</p>
              <p>Number of Nets: {matchDetails.numberOfNets}</p>
              <p>Number of Rounds: {matchDetails.numberOfRounds}</p>
              <p className="capitalize">Tie breaking strategy: {matchDetails.tieBreaking}</p>
            </div>
          </div>

          {teamComponents}
          {fwangoLink}
          {colMenus.map(renderMenuItem)}
        </div>
      </dialog>

      {/* Setting Icon */}
      <div
        className="img-holder p-2 w-8 absolute left-1 bg-white rounded-full cursor-pointer z-20"
        style={{ top: '47%' }}
        onClick={handleSettingOpen}
        role="button"
        tabIndex={0}
        onKeyDown={handleSettingOpen}
      >
        <Image width={12} height={12} src="/icons/setting.svg" alt="setting" className="w-full" />
      </div>
    </>
  );
}

export default React.memo(MatchSetting);
