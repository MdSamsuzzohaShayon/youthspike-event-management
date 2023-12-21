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

  async createMany(input: CreatePlayerInput[]) {
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
    return this.playerModel.find(filter).sort({rank: 1});
  }

  async findById(playerId: string) {
    return this.playerModel.findById(playerId);
  }

  async update(player: UpdateQuery<Player>, playerId: string) {
    return this.playerModel.findOneAndUpdate({ _id: playerId }, { ...player });
  }

  async updateMany(filter: FilterQuery<Player>, player: UpdateQuery<Player>) {
    return this.playerModel.updateMany(filter, player);
  }

  async arrangeFromCSV(uploadedFile: Upload, event: string): Promise<CreatePlayerInput[]> {
    const { createReadStream, filename, mimetype, encoding } = await uploadedFile;
    return new Promise((resolve, reject) => {
      const data: CreatePlayerInput[] = [];
      createReadStream()
        .pipe(Papa.parse(Papa.NODE_STREAM_INPUT, { header: true }))
        .on('data', (row: Player) => {
          const matchingFN = Object.entries(row).find(([k, v]) => new RegExp(/first?\s+name/, 'gi').test(k));
          const matchingLN = Object.entries(row).find(([k, v]) => new RegExp(/last?\s+name/, 'gi').test(k));
          const matchingEmail = Object.entries(row).find(([k, v]) => new RegExp(/email/, 'gi').test(k));
          if (matchingFN && matchingLN && matchingEmail) {
            const [fnk, fnv] = matchingFN;
            const [lnk, lnv] = matchingLN;
            const [ek, ev] = matchingEmail;
            data.push({
              firstName: fnv,
              lastName: lnv,
              // rank: Math.floor(Math.random() * 99 + 1),
              email: ev,
              event,
            });
          }
        })
        .on('end', () => {
          resolve(data);
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
