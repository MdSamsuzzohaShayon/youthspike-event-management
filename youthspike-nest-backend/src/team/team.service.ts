import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, UpdateQuery } from 'mongoose';
import { Team } from 'src/team/team.schema';
import { CustomTeam } from './resolvers/team.response';
import { MatchService } from 'src/match/match.service';

@Injectable()
export class TeamService {
  constructor(
    @InjectModel(Team.name) private teamModel: Model<Team>,
    private readonly matchService: MatchService
  ) { }

  async query(filter: QueryFilter<Team>) {
    return this.teamModel.find(filter).sort({ name: 1 });
  }

  async findById(teamId: string): Promise<Team | null> {
    try {
      return await this.teamModel.findById(teamId).lean();
    } catch (error) {
      console.error('Error finding team by ID:', error);
      throw error;
    }
  }

  async findByName(name: string) {
    if (!name) return null;
    return this.teamModel.findOne({ name });
  }

  async findOne(filter: QueryFilter<Team>) {
    return this.teamModel.findOne(filter).lean();
  }





  async find(filter: QueryFilter<Team>, offset?: number, limit?: number) {
    let query = this.teamModel.find(filter).sort({ name: -1 }); // always sort for stable pagination

    if (typeof offset === 'number') {
      query = query.skip(offset);
    }

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }

    return query.lean().exec();
  }

  // async create(team: Team) {
  //   const lastTeam = await this.teamModel.findOne({}, {}, { sort: { _id: -1 } });
  //   const lastTeamNum: number = lastTeam?.num || 1;

  //   return this.teamModel.create({
  //     ...team,
  //     active: true,
  //     num: lastTeamNum + 1,
  //   });
  // }
  async create(team: Team) {
    const lastTeam = await this.teamModel.findOne({}, {}, { sort: { _id: -1 } });
    const lastTeamNum: number = lastTeam?.num || 1;

    return this.teamModel.create({
      ...team,
      num: lastTeamNum + 1,
    });
  }

  async insertMany(teams: Team[]) {
    return this.teamModel.insertMany(teams);
  }


  async updateMany(filter: QueryFilter<Team>, updateObj: UpdateQuery<Team>) {
    return this.teamModel.updateMany(filter, updateObj).lean();
  }
  async updateOne(filter: QueryFilter<Team>, updateObj: UpdateQuery<Team>) {
    const updateTeam = await this.teamModel.updateOne(filter, updateObj);
    return updateTeam;
  }

  async delete(filter: QueryFilter<Team>) {
    return this.teamModel.deleteMany(filter);
  }

  async deleteOne(filter: QueryFilter<Team>) {
    return this.teamModel.deleteOne(filter);
  }

  async deleteMany(filter: QueryFilter<Team>) {
    return this.teamModel.deleteMany(filter);
  }

  async countDocuments(filter: QueryFilter<Team>) {
    return this.teamModel.countDocuments();
  }


  // Extras
  normalizeTeams(teams: CustomTeam[]): CustomTeam[] {
    const list: CustomTeam[] = [];
    for (const team of teams) {
      const teamObj = { ...team };
      if (team.groups) {
        const groupIds = new Set<string>();
        for (const g of team.groups) {
          if (g) groupIds.add(String(g));
        }
        teamObj.groups = [...groupIds]
      } else {
        teamObj.groups = [];
      }
      list.push(teamObj);
    }
    return list;
  }

  async teamsWithAbsense(teams: Team[]): Promise<CustomTeam[]> {
    // 1. Create an array of promises to fetch counts concurrently using for...of
    // We wrap the promise so it always returns the teamId alongside the count
    const countPromises = [];
    for (const team of teams) {
      countPromises.push(
        this.matchService
          .teamMatchAbsenseCountDocuments({ team: team._id })
          .then((count) => ({ teamId: String(team._id), count: count || 0 }))
          .catch(() => ({ teamId: String(team._id), count: 0 })) // Safely default to 0 if one fails
      );
    }

    // 2. Wait for all count queries to finish.
    const resolvedCounts = await Promise.all(countPromises);

    // 3. Create a Map hooking the count to the teamId
    const absenceCountsMap = new Map<string, number>();
    for (const resolved of resolvedCounts) {
      absenceCountsMap.set(resolved.teamId, resolved.count);
    }

    // 4. Build the final teamList using a for...of loop
    const teamList = [];
    for (const team of teams) {
      // Use toObject() if team is a Mongoose document, otherwise spread the plain object
      // const teamObj = typeof team.toObject === 'function' ? team.toObject() : { ...team };
      const teamIdStr = String(team._id);

      teamList.push({
        ...team,
        // Look up the count by team ID, defaulting to 0 if not found in the map
        teammatchabsencescount: absenceCountsMap.has(teamIdStr)
          ? absenceCountsMap.get(teamIdStr)
          : 0,
      });
    }


    return teamList;
  }
}
