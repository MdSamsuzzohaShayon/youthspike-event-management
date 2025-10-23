import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EPlayerStatus, Player } from './player.schema';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { CreatePlayerInput } from './resolvers/player.input';
import { rmInvalidProps } from 'src/util/helper';
import * as Papa from 'papaparse';
import { FileUpload } from 'graphql-upload/processRequest.mjs';
import { Team } from 'src/team/team.schema';

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
    // const uniqueEmail: string[] = [];
    // const playerDocs = [];

    // for (const p of playerListInput) {
    //   if (
    //     p.firstName &&
    //     p.lastName &&
    //     p.email &&
    //     p.firstName !== '' &&
    //     p.lastName !== '' &&
    //     p.email !== '' &&
    //     !uniqueEmail.includes(p.email)
    //   ) {
    //     playerDocs.push(p);
    //     uniqueEmail.push(p.email);
    //   }
    // }

    // const playerList = await this.playerModel.find({ email: { $in: uniqueEmail } });
    // for (let i = 0; i < playerList.length; i++) {
    //   const findIndex = playerDocs.findIndex((pd) => pd.email === playerList[i].email);
    //   if (findIndex) playerDocs.splice(findIndex, 1);
    // }

    return this.playerModel.insertMany(playerListInput);
  }

  async findById(playerId: string) {
    const playerExist = await this.playerModel.findById(playerId);
    return playerExist;
  }

  async findOne(filter: FilterQuery<Player>) {
    return this.playerModel.findOne(filter);
  }
  async find(
    filter: FilterQuery<Player>,
    limit?: number,
    offset?: number, // added for consistency & scalability
  ) {
    let query = this.playerModel.find(filter).sort({ createdAt: -1 }); // ensures stable pagination

    if (typeof offset === 'number') {
      query = query.skip(offset);
    }

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }

    return query.exec();
  }

  async updateOne(filter: FilterQuery<Player>, player: UpdateQuery<Player>) {
    return this.playerModel.updateOne(filter, player);
  }

  async updateMany(filter: FilterQuery<Player>, player: UpdateQuery<Player>) {
    return this.playerModel.updateMany(filter, player);
  }

  async arrangeFromCSV(
    uploadedFile: Promise<FileUpload>,
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
  async delete(filter: FilterQuery<Player>) {
    return this.playerModel.deleteMany(filter);
  }

  async deleteOne(filter: FilterQuery<Player>) {
    const deletePlayer = await this.playerModel.deleteOne(filter);
    return deletePlayer;
  }
}
