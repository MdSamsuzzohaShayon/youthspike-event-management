import { EStatsFilter, IFilter } from "@/types";

// Filter key to enum 
export const filterToEnum: Record<keyof IFilter, EStatsFilter>={
    event: EStatsFilter.EVENT,
    startDate: EStatsFilter.START_DATE,
    endDate: EStatsFilter.END_DATE,
    match: EStatsFilter.MATCH,
    game: EStatsFilter.GAME,
    conference: EStatsFilter.CONFERENCE,
    teammate: EStatsFilter.TEAMMATE,
    club: EStatsFilter.CLUB,
    vsPlayer: EStatsFilter.VS_PLAYER
  }