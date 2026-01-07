import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EPlayerStatus, Player } from './player.schema';
import { QueryFilter, Model, UpdateQuery } from 'mongoose';
import { CreatePlayerInput } from './resolvers/player.input';
import { rmInvalidProps } from 'src/utils/helper';
import * as Papa from 'papaparse';
import { Team } from 'src/team/team.schema';
import { FileUpload } from 'graphql-upload/processRequest.mjs';
import * as GraphQLUploadModule from 'graphql-upload/GraphQLUpload.mjs';
const GraphQLUpload = GraphQLUploadModule.default;

type OptionalProps<T> = {
  [K in keyof T]?: T[K];
};

@Injectable()
export class PlayerService {
  constructor(@InjectModel(Player.name) private readonly playerModel: Model<Player>) {}

  playerUsername(firstName: string) {
    const now = new Date();
    const randomNumber = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0');
    const username = `${firstName.trim().toLowerCase()}${now.getMilliseconds()}${randomNumber}`;
    return username;
  }

  async create(input: CreatePlayerInput) {
    const inputObj = rmInvalidProps(input);
    return this.playerModel.create(inputObj);
  }

  async createMany(playerListInput) {
    return this.playerModel.insertMany(playerListInput);
  }

  async findById(playerId: string) {
    const playerExist = await this.playerModel.findById(playerId).lean();
    return playerExist;
  }

  async findOne(filter: QueryFilter<Player>) {
    return this.playerModel.findOne(filter).lean();
  }
  async find(
    filter: QueryFilter<Player>,
    limit?: number,
    offset?: number, // added for consistency & scalability
  ) {
    let query = this.playerModel.find(filter); // ensures stable pagination

    if (typeof offset === 'number') {
      query = query.skip(offset);
    }

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }
    return query.lean().exec();
  }

  async updateOne(filter: QueryFilter<Player>, player: UpdateQuery<Player>) {
    return this.playerModel.updateOne(filter, player);
  }

  async updateMany(filter: QueryFilter<Player>, player: UpdateQuery<Player>) {
    return this.playerModel.updateMany(filter, player);
  }

  async arrangeFromCSV(
    uploadedFile: FileUpload,
    event: string,
    division: string,
  ): Promise<{ unassignedPlayers: Player[]; teams: Team[] }> {
    const { createReadStream } = await uploadedFile;

    return new Promise((resolve, reject) => {
      const teams = new Map<string, Team>(); // Use Map for O(1) team lookups
      const unassignedPlayers: Player[] = [];
      const seenPlayers = new Set<string>(); // Track duplicate players

      createReadStream()
        .pipe(Papa.parse(Papa.NODE_STREAM_INPUT, { header: true }))
        .on('data', (row: Player) => {
          // Extract fields efficiently
          const teamKey = Object.keys(row).find((k) => /team/gi.test(k));
          const firstNameKey = Object.keys(row).find((k) => /first?\s+name/gi.test(k));
          const lastNameKey = Object.keys(row).find((k) => /last?\s+name/gi.test(k));
          const emailKey = Object.keys(row).find((k) => /email/gi.test(k));

          if (!firstNameKey || !row[firstNameKey]) return; // Skip rows without first name

          const playerIdentifier = `${row[firstNameKey]?.toLowerCase()}_${row[lastNameKey]?.toLowerCase()}`;

          // Skip duplicate players
          if (seenPlayers.has(playerIdentifier)) return;
          seenPlayers.add(playerIdentifier);

          const playerObj: Player = {
            firstName: row[firstNameKey],
            lastName: row[lastNameKey],
            name: `${row[firstNameKey]}_${row[lastNameKey]}`,
            username: this.playerUsername(row[firstNameKey]),
            email: row[emailKey],
            status: EPlayerStatus.ACTIVE,
            division,
            events: [event],
            teams: [],
          };

          // Handle team assignment
          const teamName = teamKey ? row[teamKey]?.trim() : '';

          if (teamName) {
            if (!teams.has(teamName)) {
              teams.set(teamName, {
                name: teamName,
                active: true,
                players: [] as Player[],
                division,
                captain: null,
                cocaptain: null,
                event,
                logo: '',
                rankLock: false,
                sendCredentials: false,
              });
            }

            const team = teams.get(teamName);
            team.players.push(playerObj as any);
          } else {
            unassignedPlayers.push(playerObj);
          }
        })
        .on('end', () => {
          resolve({
            teams: Array.from(teams.values()),
            unassignedPlayers,
          });
        })
        .on('error', reject);
    });
  }
  async delete(filter: QueryFilter<Player>) {
    return this.playerModel.deleteMany(filter);
  }

  async deleteOne(filter: QueryFilter<Player>) {
    const deletePlayer = await this.playerModel.deleteOne(filter);
    return deletePlayer;
  }
}
