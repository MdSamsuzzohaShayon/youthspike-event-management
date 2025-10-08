"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IEvent, IMatch, INetRelatives, IRoundRelatives, ITeam } from "@/types";
import { useLdoId } from "@/lib/LdoProvider";
import { useAppDispatch } from "@/redux/hooks";
import { setRankingMap } from "@/redux/slices/playerRankingSlice";
import Link from "next/link";
import { EVENT_ITEM } from "@/utils/constant";
import { EEventItem, IAllStats } from "@/types/event";
import TextImg from "../elements/TextImg";
import MatchList from "../match/MatchList";
import PlayerStandings from "../player/PlayerStandings";
import { CldImage } from "next-cloudinary";

interface ITeamDetailProps {
  event: IEvent;
  team: ITeam;
  nets: INetRelatives[];
  rounds: IRoundRelatives[];
  statsOfPlayer: IAllStats[];
}

enum ETab {
  ROSTER = "ROSTER",
  MATCHES = "MATCHES",
}

function TeamDetail({
  event,
  team,
  nets,
  rounds,
  statsOfPlayer,
}: ITeamDetailProps) {
  const dispatch = useAppDispatch();
  const { ldoIdUrl } = useLdoId();
  const [redirectSymbol, setRedirectSymbol] = useState<string>("?");
  const [selectedItem, setSelectedItem] = useState<ETab>(ETab.ROSTER);

  // Memoized data
  const playerStatsMap = useMemo(
    () => new Map(statsOfPlayer.map((ps) => [ps.playerId, ps.stats])),
    [statsOfPlayer]
  );

  const sortedMatches = useMemo(
    () =>
      [...(team.matches as IMatch[])].sort(
        (a, b) => Number(a.completed) - Number(b.completed)
      ),
    [team.matches]
  );

  // Effects
  useEffect(() => {
    if (team?.playerRanking) {
      const rankingMap = new Map();
      // @ts-ignore
      team.playerRanking.rankings.forEach(({ player, rank }) =>
        rankingMap.set(player._id, rank)
      );
      dispatch(setRankingMap(Array.from(rankingMap)));
    }
  }, [dispatch, team]);

  useEffect(() => {
    if (ldoIdUrl && ldoIdUrl !== "") {
      setRedirectSymbol("&");
    }
  }, [ldoIdUrl]);

  // Event handlers
  const handleSelectGroup = useCallback(
    (e: React.SyntheticEvent, tab: ETab) => {
      e.preventDefault();
      setSelectedItem(tab);
    },
    []
  );

  // Content renderer
  const showContent = useCallback(() => {
    switch (selectedItem) {
      case ETab.ROSTER:
        return (
          <PlayerStandings
            playerStatsMap={playerStatsMap}
            matchList={team.matches as IMatch[]}
            playerList={team.players}
            teamRank
          />
        );
      case ETab.MATCHES:
        return (
          // @ts-ignore
          <MatchList matchList={sortedMatches} nets={nets} rounds={rounds} />
        );
      default:
        return (
          <PlayerStandings
            playerStatsMap={playerStatsMap}
            matchList={team.matches as IMatch[]}
            playerList={team.players}
            teamRank
          />
        );
    }
  }, [
    selectedItem,
    playerStatsMap,
    team.matches,
    team.players,
    sortedMatches,
    nets,
    rounds,
  ]);

  // Reusable components
  const TeamLogo = () =>
    team?.logo ? (
      <CldImage
        alt={team.name}
        width={32}
        height={32}
        src={team.logo}
        className="w-8 h-8 rounded-lg border border-yellow-500/30 object-cover object-center flex-shrink-0"
        crop="fit"
      />
    ) : (
      <TextImg
        className="w-8 h-8 rounded-lg border border-yellow-500/30 flex-shrink-0"
        fullText={team?.name || ""}
        txtCls="text-sm font-bold"
      />
    );

  const StatItem = ({ label, value }: { label: string; value: number }) => (
    <div className="text-right">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-white font-bold text-sm">{value}</div>
    </div>
  );

  const TabButton = ({ tab, label }: { tab: ETab; label: string }) => (
    <button
      onClick={(e) => handleSelectGroup(e, tab)}
      className={`flex-1 py-2 px-2 rounded-md text-xs font-bold transition-all ${
        selectedItem === tab
          ? "bg-yellow-400 text-gray-900 shadow-sm"
          : "text-gray-300 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  const ActionLink = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <Link
      href={href}
      className="flex-1 py-2 px-2 rounded-md text-xs font-bold transition-all text-yellow-logo underline text-center uppercase"
    >
      {children}
    </Link>
  );

  const SectionHeader = ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle: string;
  }) => (
    <div className="text-center mb-6 relative z-10">
      <h1 className="text-4xl font-extrabold uppercase tracking-wide text-yellow-400">
        {title}
      </h1>
      <h2 className="text-sm text-gray-300 uppercase mt-1">{subtitle}</h2>
    </div>
  );

  // Main header section - matches TeamDetailMain styling
  const HeaderSection = () => (
    <div className="header bg-gray-800 rounded-xl">
      {/* Compact Header */}
      <div className="border-b border-yellow-500/30 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TeamLogo />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white truncate leading-tight">
                {team?.name}
              </h1>
              <p className="text-xs text-gray-400 truncate leading-tight">
                {event?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatItem label="Players" value={team?.players?.length || 0} />
            <StatItem label="Matches" value={team?.matches?.length || 0} />
          </div>
        </div>
      </div>

      {/* Action Links */}
      <div className="border-b border-yellow-500/30 px-3 py-1">
        <div className="flex rounded-lg p-1">
          <ActionLink
            href={`/events/${event._id}/${ldoIdUrl}${redirectSymbol}${EVENT_ITEM}=${EEventItem.TEAM}`}
          >
            Standings
          </ActionLink>
          {/* event_item=TEAM&search=College+Station+Aggies */}
          <ActionLink
            href={`/events/${event._id}/${ldoIdUrl}${redirectSymbol}${EVENT_ITEM}=${EEventItem.TEAM}&search=${team.name.split(' ').join("+")}`}
          >
            Stats
          </ActionLink>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-3 py-1">
        <div className="flex bg-gray-700 rounded-lg p-1">
          <TabButton tab={ETab.ROSTER} label="ROSTER" />
          <TabButton tab={ETab.MATCHES} label="MATCHES" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 pb-4">
      <HeaderSection />

      <div className="pt-3">{showContent()}</div>
    </div>
  );
}

export default TeamDetail;
