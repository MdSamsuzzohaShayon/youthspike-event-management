import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EPlayerStatus, Player } from './player.schema';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { CreatePlayerInput } from './resolvers/player.input';
import { rmInvalidProps } from 'src/util/helper';
import * as Papa from 'papaparse';
import { FileUpload } from 'graphql-upload/processRequest.mjs';

type OptionalProps<T> = {
  [K in keyof T]?: T[K];
};

@Injectable()
export class PlayerService {
  constructor(@InjectModel(Player.name) private readonly playerModel: Model<Player>) {}


  playerUsername(firstName: string) {
    const now = new Date();
    const randomNumber = Math.floor(Math.random() * 100).toString().padStart(2, '0');
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
  async find(filter: FilterQuery<Player>) {
    return this.playerModel.find(filter);
  }

  async updateOne(filter: FilterQuery<Player>, player: UpdateQuery<Player>) {
    return this.playerModel.updateOne(filter, player);
  }

  async updateMany(filter: FilterQuery<Player>, player: UpdateQuery<Player>) {
    return this.playerModel.updateMany(filter, player);
  }

  async arrangeFromCSV(uploadedFile: Promise<FileUpload>, event: string, division: string) {
    const { createReadStream, filename, mimetype, encoding } = await uploadedFile;
    return new Promise((resolve, reject) => {
      const teams = [];
      const unassignedPlayers = [];
      createReadStream()
        .pipe(Papa.parse(Papa.NODE_STREAM_INPUT, { header: true }))
        .on('data', (row: Player) => {
          // Organize Entries
          const matchTeam = Object.entries(row).find(([k, v]) => new RegExp(/team/, 'gi').test(k));
          // if (!matchTeam && matchTeam.toString().trim().toUpperCase() !== 'team notes'.toUpperCase()) {
          //   const matchSquad = Object.entries(row).find(([k, v]) => new RegExp(/squad/, 'gi').test(k));
          //   if (matchSquad) {
          //     matchTeam = matchSquad;
          //   }
          // }
          const matchFN = Object.entries(row).find(([k, v]) => new RegExp(/first?\s+name/, 'gi').test(k));
          const matchLN = Object.entries(row).find(([k, v]) => new RegExp(/last?\s+name/, 'gi').test(k));
          const matchEmail = Object.entries(row).find(([k, v]) => new RegExp(/email/, 'gi').test(k));

          // Organize player
          let playerObj = null;
          if (matchFN) {
            const [fnk, fnv] = matchFN;
            const [lnk, lnv] = matchLN ?? [null, null];
            const [ek, ev] = matchEmail ?? [null, null];
            playerObj = {
              firstName: fnv,
              lastName: lnv,
              username: this.playerUsername(fnv),
              rank: null,
              email: ev,
              status: EPlayerStatus.ACTIVE,
              division,
              events: [event],
              teams: [],
            };
          }

          // Organize team
          if (matchTeam) {
            const [tk, tv] = matchTeam;
            if (tv && tv !== '') {
              const findTeamI = teams.findIndex((t) => t.name.trim().toLowerCase() === tv.trim().toLowerCase());
              if (findTeamI !== -1) {
                const newPlayers = [...teams[findTeamI].players];
                playerObj.rank = newPlayers.length === 0 ? 1 : newPlayers.length + 1;
                if (playerObj) newPlayers.push(playerObj);
                teams[findTeamI] = { ...teams[findTeamI], players: newPlayers };
              } else {
                playerObj.rank = 1;
                const teamObj = {
                  name: tv,
                  active: true,
                  players: playerObj ? [playerObj] : [],
                  division: division,
                  captain: null,
                  cocaptain: null,
                  event: event,
                };
                teams.push(teamObj);
              }
            } else {
              if (playerObj) unassignedPlayers.push(playerObj);
            }
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

  async deleteOne(filter: FilterQuery<Player>) {
    const deletePlayer = await this.playerModel.deleteOne(filter);
    return deletePlayer;
  }
}
