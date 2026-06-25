'use client'

// ─── TeamTable ────────────────────────────────────────────────────────────────
// Drop-in replacement. Logic unchanged; markup / Tailwind redesigned.

import { IEvent, IEventRelatives, IResponse, ITeam, IUserContext, UserRole } from '@/types';
import { CldImage } from 'next-cloudinary';
import TextImg from '../elements/TextImg';
import Link from 'next/link';
import { useLdoId } from '@/lib/LdoProvider';
import React, { useMemo, useRef, useState } from 'react';
import CheckboxInput from '../elements/forms/CheckboxInput';
import { useUser } from '@/lib/UserProvider';
import { readDate, readTimestamp } from '@/utils/datetime';
import Image from 'next/image';
import SelectInput from '../elements/forms/SelectInput';
import { divisionsToOptionList } from '@/utils/helper';
import { updateEventWithFiles } from '@/utils/request-handlers/updateEvent';
import { useMutation } from '@apollo/client/react';
import { UPDATE_EVENT } from '@/graphql/event';

interface ITeamTableProps {
  teams: ITeam[];
  events: IEventRelatives[];
}

// ── shared pill / badge ───────────────────────────────────────────────────────
function DivisionBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-yellow-300">
      {label}
    </span>
  );
}

// ── action buttons ────────────────────────────────────────────────────────────
function ActionLink({
  href,
  variant = 'outline',
  children,
}: {
  href: string;
  variant?: 'solid' | 'outline';
  children: React.ReactNode;
}) {
  const base =
    'inline-flex items-center rounded-md px-3 py-1.5 text-xs font-bold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400';
  const solid = 'bg-yellow-logo text-black hover:bg-yellow-300 hover:scale-105';
  const outline =
    'border border-yellow-logo text-yellow-logo hover:bg-yellow-400 hover:text-black hover:scale-105';
  return (
    <Link href={href} className={`${base} ${variant === 'solid' ? solid : outline}`}>
      {children}
    </Link>
  );
}

// ── avatar ────────────────────────────────────────────────────────────────────
function TeamAvatar({ team, size = 'sm' }: { team: ITeam; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 32 : 48;
  const cls = size === 'sm' ? 'w-8 h-8' : 'w-12 h-12';
  return team.logo ? (
    <CldImage
      width={dim}
      height={dim}
      crop="fit"
      sizes="100vw"
      className={`${cls} rounded-lg object-cover ring-2`}
      alt={`${team.name} logo`}
      src={team.logo}
    />
  ) : (
    <TextImg className={`${cls} rounded-lg ring-2`} fullText={team.name} />
  );
}


interface ITeamRowProps {
  team: ITeam;
  ldoIdUrl: string;
  eventMap: Map<string, IEventRelatives>;
  user: IUserContext;
  isChecked: boolean;
  onCheckedTeam: (e: React.SyntheticEvent, teamId: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Desktop row
// ─────────────────────────────────────────────────────────────────────────────
function TeamRow({ team, ldoIdUrl, eventMap, user, isChecked, onCheckedTeam }: ITeamRowProps) {

  return (
    <tr className="group border-b border-white/[0.05] transition-colors duration-150 hover:bg-white/[0.03]">

      {/* Name */}
      <td className="py-4 px-6">
        {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (
          <CheckboxInput _id={team._id} name="team-select" defaultValue={isChecked} handleInputChange={onCheckedTeam} className='mr-2' />
        )}
        <span className="font-semibold text-white group-hover:text-yellow-400 transition-colors duration-150">
          {team.name}
        </span>
      </td>

      {/* Logo */}
      <td className="py-4 px-6">
        <TeamAvatar team={team} size="sm" />
      </td>

      {/* Division */}
      <td className="py-4 px-6 text-center">
        {team?.division ? <DivisionBadge label={team.division} /> : <span className="text-gray-600">—</span>}
      </td>

      {/* // Date  */}
      <td className="py-4 px-6">
        {team?.createdAt && readTimestamp(parseInt(team.createdAt, 10))}
      </td>

      {/* Events */}
      <td className="py-4 px-6">
        <div className="flex flex-wrap gap-1 justify-center">
          {!team.events?.length ? <span className="text-gray-600 text-xs">No events</span> : (<>
            {team.events.map((eventId) => {
              const event = eventMap.get(String(eventId));
              if (!event) return null;

              return (
                <Link
                  key={event?._id}
                  href={`/${event?._id}/teams/${ldoIdUrl}`}
                  className="inline-block rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-300 transition-colors hover:border-yellow-400/40 hover:text-yellow-300"
                >
                  {event?.name}
                </Link>
              )
            })}
          </>)}
        </div>
      </td>

      {/* Actions */}
      <td className="py-4 px-6">
        <div className="flex items-center justify-center gap-2">
          <ActionLink href={`/teams/${team._id}/roster/${ldoIdUrl}`} variant="solid">
            View
          </ActionLink>
          <ActionLink href={`/teams/${team._id}/update/${ldoIdUrl}`} variant="outline">
            Edit
          </ActionLink>
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile card
// ─────────────────────────────────────────────────────────────────────────────
function MobileCard({ team, ldoIdUrl, eventMap, user, isChecked, onCheckedTeam }: ITeamRowProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.08] p-4 transition-all duration-200 hover:border-yellow-400/30 hover:shadow-lg hover:shadow-yellow-400/5">
      {/* top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />

      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <TeamAvatar team={team} size="md" />
          <div className="min-w-0">
            <h2 className="truncate font-bold text-white">{team.name}</h2>
            {team?.division && <DivisionBadge label={team.division} />}
          </div>
        </div>
      </div>

      {/* Events */}
      {team.events?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {team.events.map((eventId) => {
            const event = eventMap.get(String(eventId));
            if (!event) return null;

            return (
              <Link
                key={event?._id}
                href={`/${event?._id}/teams/${ldoIdUrl}`}
                className="inline-block rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-300 hover:border-yellow-400/40 hover:text-yellow-300 transition-colors"
              >
                {event?.name}
              </Link>
            )
          })}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2 justify-end">
        <ActionLink href={`/teams/${team._id}/roster/${ldoIdUrl}`} variant="solid">
          View Roster
        </ActionLink>
        <ActionLink href={`/teams/${team._id}/update/${ldoIdUrl}`} variant="outline">
          Edit
        </ActionLink>
        {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (
          <CheckboxInput _id={team._id} name="team-select" defaultValue={isChecked} handleInputChange={onCheckedTeam} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export default function TeamTable({ teams, events }: ITeamTableProps) {
  const { ldoIdUrl } = useLdoId();
  const user = useUser();
  const [mutateEvent] = useMutation<{ updateEvent: IResponse }>(UPDATE_EVENT);

  // State
  const [checkedTeams, setCheckedTeams] = useState<Map<string, boolean>>(new Map());
  const bulkModalRef = useRef<HTMLDialogElement | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<IEventRelatives | null>(null);


  // Memoization
  const eventMap = useMemo(() => {
    const map = new Map<string, IEventRelatives>();
    for (const event of events) {
      map.set(event._id, event);
    }
    return map;
  }, [events]);

  const checkedTeamIds = useMemo(() => {
    return Array.from(checkedTeams)
      .filter(([_, isChecked]) => isChecked) // Filter for checked items
      .map(([teamId]) => teamId)
  }, [checkedTeams]); // Map to just the team IDs



  // Handle events
  const handleCheckedTeam = (e: React.SyntheticEvent, teamId: string) => {
    const inputEl = e.target as HTMLInputElement;
    const newCheckedItems: Map<string, boolean> = new Map(checkedTeams);
    if (inputEl.checked) {
      newCheckedItems.set(teamId, true);
    } else {
      newCheckedItems.set(teamId, false);
    }
    setCheckedTeams(newCheckedItems);
  };

  const handleChangeEvent = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    const event = eventMap.get(inputEl.value);
    if (event) setSelectedEvent(event);
  };




  const handleAddTeamsToEvent = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    // Division based on event
    // Division must match with team division
    // Otherwise show an warning
    // If some division of a team are not available, then add them to the event
    // Do not send those teams that are already on the event

    const teamSet = new Set(checkedTeamIds);
    const divisionSet = new Set();
    for (const team of teams) {
      if (!teamSet.has(team._id)) continue;
      if (!team.division) continue;
      divisionSet.add(String(team.division).toLowerCase());
    }

    const eventDivisionList = selectedEvent?.divisions.split(',');

    if (eventDivisionList) {
      for (const division of eventDivisionList) {
        // All of them will be lower case
        divisionSet.add(division.trim().toLowerCase());
      }
    }

    const divisions = [...divisionSet].join(',');


    await mutateEvent({ variables: { sponsorsInput: [], updateInput: { newteams: [...teamSet], divisions }, eventId: selectedEvent?._id } });

    window.location.reload();
  }


  const handleCloseModal = (e: React.SyntheticEvent) => {
    e.preventDefault();
    bulkModalRef.current?.close();
    setSelectedEvent(null);
  }


  return (
    <div className="w-full">
      {/* ── Desktop table ──────────────────────────────────────────────── */}
      <div className="hidden md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="py-4 px-6 relative flex justify-start items-center gap-x-2">
                <button onClick={() => bulkModalRef.current?.showModal()} className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors" aria-label="Team options">
                  <Image width={16} height={16} src="/icons/dots-vertical.svg" alt="Options" className="svg-white" />
                </button>
                <span className='font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 text-left'>Team Name</span>
              </th>
              {['Logo', 'Division', 'Date', 'Events', 'Actions'].map((col) => (
                <th
                  key={col}
                  className={`py-4 px-6 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 ${col === 'Team Name' || col === 'Logo' ? 'text-left' : 'text-center'
                    }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <TeamRow key={team._id} team={team} ldoIdUrl={ldoIdUrl} eventMap={eventMap} user={user} isChecked={checkedTeams.get(team._id) ?? false} onCheckedTeam={handleCheckedTeam} />
            ))}
          </tbody>
        </table>

        {teams.length === 0 && (
          <div className="py-20 text-center text-gray-600 font-mono text-sm">No teams found</div>
        )}
      </div>

      {/* ── Mobile cards ───────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3 p-4">
        <button onClick={() => bulkModalRef.current?.showModal()} className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors" aria-label="Team options">
          <Image width={16} height={16} src="/icons/dots-vertical.svg" alt="Options" className="svg-white" />
        </button>

        {teams.map((team) => (
          <MobileCard key={team._id} team={team} ldoIdUrl={ldoIdUrl} eventMap={eventMap} user={user} isChecked={checkedTeams.get(team._id) ?? false} onCheckedTeam={handleCheckedTeam} />
        ))}
        {teams.length === 0 && (
          <div className="py-16 text-center text-gray-600 font-mono text-sm">No teams found</div>
        )}
      </div>

      <dialog ref={bulkModalRef} className="modal-dialog">
        <form onSubmit={handleAddTeamsToEvent} className="p-4">
          <button onClick={handleCloseModal} className="w-8 h-8 float-right" aria-label="Team options">
            <Image width={16} height={16} src="/icons/close.svg" alt="Options" className="svg-white" />
          </button>
          <h3>Add teams to event</h3>

          {checkedTeamIds.length === 0 ? <p>No team selected</p> : <p>There are {checkedTeamIds.length} teams selected!</p>}

          <SelectInput
            name="event"
            optionList={events.map((g, gI) => ({
              id: gI + 1,
              value: g._id,
              text: g.name,
            }))}
            handleSelect={handleChangeEvent}
          />
          {/* 
          {divisionOptions.length > 0 && (
            <SelectInput
              name="division"
              optionList={divisionOptions}
              handleSelect={handleChangeDivision}
            />
          )} */}

          <div className="flex justify-start gap-x-2 items-center mt-4">
            <button type="submit" disabled={checkedTeamIds.length === 0} className="btn-info">Add</button>
            <button className="btn-danger">Cancel</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}