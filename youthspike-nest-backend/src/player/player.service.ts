import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Player } from './player.schema';
import { FilterQuery, Model, ObjectId, Query, UpdateQuery } from 'mongoose';
import { UserDocument } from 'src/user/user.schema';
import { CreatePlayerInput } from './player.input';
import { rmInvalidProps } from 'src/util/helper';
import * as Upload from 'graphql-upload/Upload.js';
import * as Papa from 'papaparse';

type OptionalProps<T> = {
  [K in keyof T]?: T[K];
};


@Injectable()
export class PlayerService {
  constructor(@InjectModel(Player.name) private readonly playerModel: Model<Player>) { }

  async create(input: CreatePlayerInput) {
    const inputObj = rmInvalidProps(input);
    return this.playerModel.create(inputObj);
  }

  async createMany(input) {
    const uniqueEmail: string[] = [];
    const playerDocs = [];

    for (const p of input) {
      if (
        p.firstName &&
        p.lastName &&
        p.email &&
        p.firstName !== '' &&
        p.lastName !== '' &&
        p.email !== '' &&
        !uniqueEmail.includes(p.email)
      ) {
        playerDocs.push(p);
        uniqueEmail.push(p.email);
      }
    }

    const playerList = await this.playerModel.find({ email: { $in: uniqueEmail } });
    for (let i = 0; i < playerList.length; i++) {
      const findIndex = playerDocs.findIndex((pd) => pd.email === playerList[i].email);
      if (findIndex) playerDocs.splice(findIndex, 1);
    }

    return this.playerModel.insertMany(playerDocs);
  }

  async query(filter: FilterQuery<Player>) {
    return this.playerModel.find(filter).sort({ rank: 1 });
  }

  async findById(playerId: string) {
    return this.playerModel.findById(playerId);
  }

  async updateOne(filter: FilterQuery<Player>, player: UpdateQuery<Player>,) {
    return this.playerModel.updateOne(filter, player);
  }

  async updateMany(filter: FilterQuery<Player>, player: UpdateQuery<Player>) {
    return this.playerModel.updateMany(filter, player);
  }

  async arrangeFromCSV(uploadedFile: Upload, event: string, division: string) {
    const { createReadStream, filename, mimetype, encoding } = await uploadedFile;
    return new Promise((resolve, reject) => {
      const teams = [];
      const unassignedPlayers = [];
      createReadStream()
        .pipe(Papa.parse(Papa.NODE_STREAM_INPUT, { header: true }))
        .on('data', (row: Player) => {

          // Organize Entries
          const matchTeam = Object.entries(row).find(([k, v]) => new RegExp(/team/, 'gi').test(k));
          const matchFN = Object.entries(row).find(([k, v]) => new RegExp(/first?\s+name/, 'gi').test(k));
          const matchLN = Object.entries(row).find(([k, v]) => new RegExp(/last?\s+name/, 'gi').test(k));
          const matchEmail = Object.entries(row).find(([k, v]) => new RegExp(/email/, 'gi').test(k));

          // Organize player
          let playerObj = null;
          if (matchFN && matchLN && matchEmail) {
            const [fnk, fnv] = matchFN;
            const [lnk, lnv] = matchLN;
            const [ek, ev] = matchEmail;
            playerObj = {
              firstName: fnv,
              lastName: lnv,
              rank: null,
              email: ev,
              events: [event],
              teams: []
            };
          }

          // Organize team
          const [tk, tv] = matchTeam;
          if (tv && tv !== '') {
            const findTeamI = teams.findIndex((t) => t.name.trim().toLowerCase() === tv.trim().toLowerCase());
            if (findTeamI !== -1) {
              const newPlayers = [...teams[findTeamI].players];
              playerObj.rank = newPlayers.length === 0 ? 1 : newPlayers.length + 1;
              if (playerObj && playerObj.email) newPlayers.push(playerObj);
              teams[findTeamI] = { ...teams[findTeamI], players: newPlayers };
            } else {
              const teamObj = {
                name: tv,
                active: true,
                players: playerObj && playerObj.email ? [playerObj] : [],
                division: division,
                captain: null,
                cocaptain: null,
                event: event,
              };
              teams.push(teamObj);
            }
          } else {
            if (playerObj && playerObj.email) unassignedPlayers.push(playerObj);
          }
        })

        .on('end', () => {
          // return
          resolve({ teams, unassignedPlayers });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  async delete(filter: FilterQuery<Player>) {
    return this.playerModel.deleteMany(filter);
  }
}
