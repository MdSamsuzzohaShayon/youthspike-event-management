import { ETeam } from "@/types/team";
import { MATCHES_LS, MUSIC_TIME_PASSED } from "./constant";

interface IMatchLS {
  matchId: string;
  roundId: string;
  date: string;
  netId?: string | null;
}

class LocalStorageService {
  private static instance: LocalStorageService;

  private constructor() {} // Private to enforce singleton

  public static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  // Generic methods
  private getItem<T>(key: string): T | string | null {
    if (typeof window === "undefined") return null; // ⬅️ Guard for SSR
  
    const item = window.localStorage.getItem(key);
    if (!item) return null;
  
    try {
      const parsed = JSON.parse(item);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed as T;
      } else if (typeof parsed === "string") {
        return parsed;
      } else {
        return parsed;
      }
    } catch {
      return item; // not JSON
    }
  }
  

  private setItem(key: string, value: string | Record<string, any>): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  private removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  // Time-related methods
  public hasTimePassed(secondsPassed: number): boolean {
    const musicPlayedTime = this.getItem<string>(MUSIC_TIME_PASSED);
    if (!musicPlayedTime) return true;

    const givenTime = new Date(musicPlayedTime);
    const currentTime = new Date();
    const timeDifferenceSec =
      (currentTime.getTime() - givenTime.getTime()) / 1000;

    return timeDifferenceSec >= secondsPassed && currentTime > givenTime;
  }

  public setMusicPlayedTime(): void {
    this.setItem(MUSIC_TIME_PASSED, new Date().toISOString());
  }

  // Match-related methods
  private isMatchExpired(matchDate: string, daysThreshold = 10): boolean {
    const currentDate = new Date();
    const isoDate = new Date(matchDate);
    const differenceInDays =
      (currentDate.getTime() - isoDate.getTime()) / (1000 * 60 * 60 * 24);
    return differenceInDays >= daysThreshold;
  }

  private filterExpiredMatches(matchList: IMatchLS[]): IMatchLS[] {
    return matchList.filter((match) => !this.isMatchExpired(match.date));
  }

  public setMatch(
    matchId: string,
    roundId: string,
    netId?: string | null
  ): void {
    try {
      // Always fall back to an empty array if nothing is stored yet
      const currentMatches = Array.isArray(this.getItem<IMatchLS[]>(MATCHES_LS))
        ? (this.getItem<IMatchLS[]>(MATCHES_LS) as IMatchLS[])
        : [];

      const matchIndex = currentMatches.findIndex((m) => m.matchId === matchId);

      const newMatch: IMatchLS = {
        matchId,
        roundId,
        date: new Date().toISOString(),
      };
      if (netId) {
        newMatch.netId = netId;
      }

      const updatedMatches =
        matchIndex !== -1
          ? currentMatches.map((m, i) => (i === matchIndex ? newMatch : m))
          : [...currentMatches, newMatch];

      this.setItem(MATCHES_LS, this.filterExpiredMatches(updatedMatches));
    } catch (error) {
      console.error("Error setting match:", error);
    }
  }

  public getMatch(matchId: string): IMatchLS | null {
    const matches = this.getItem<IMatchLS[]>(MATCHES_LS);
    if (!Array.isArray(matches)) return null;
    return matches.find((m) => m.matchId === matchId) || null;
  }

  // Event-related methods
  public setEvent(eventId: string): void {
    this.setItem("eventId", eventId);
  }

  public getEvent(): string | null {
    return this.getItem<string>("eventId");
  }

  public removeEvent(): void {
    this.removeItem("eventId");
  }

  // Team-related methods
  public async setLocalTeam(teamE: ETeam): Promise<boolean> {
    try {
      this.setItem("selectedTeamForAdmin", teamE);
      return true;
    } catch (error) {
      throw error;
    }
  }

  public async getLocalTeam(): Promise<ETeam | null> {
    try {
      // @ts-ignore
      return this.getItem<ETeam>("selectedTeamForAdmin");
    } catch (error) {
      throw error;
    }
  }
}

export default LocalStorageService.getInstance();
