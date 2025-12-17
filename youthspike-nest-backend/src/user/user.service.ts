import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { QueryFilter, Model, ObjectId, UpdateQuery } from 'mongoose';
import { AppResponse } from 'src/shared/response';
import { User, UserRole } from './user.schema';
import { PlayerService } from 'src/player/player.service';
import { TeamService } from 'src/team/team.service';
import { Player } from 'src/player/player.schema';
import { Event } from 'src/event/event.schema';

@Injectable()
export class UserService {
  private readonly notFound = AppResponse.notFound('user');
  private readonly invalidCredentials = AppResponse.invalidCredentials();

  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly teamService: TeamService,
    private readonly playerService: PlayerService,
  ) {}

  async create(user: User) {
    const userObj = { ...user };
    const password = userObj.password;
    const hashedPassword = await bcrypt.hash(password, 10);
    userObj.password = hashedPassword;

    return this.userModel.create({ ...userObj });
  }

  // Create user for captain and co captain
  async createCapUser(
    playerExist: Player,
    playerUserExist: User | null,
    eventExist: Event,
    playerUsername: string,
    role: UserRole,
  ): Promise<User> {
    const userObj = {
      email: playerUsername.replace(/\s+/g, ''),
      password: eventExist.coachPassword,
      firstName: playerExist.firstName,
      lastName: playerExist.lastName,
      role,
      captainplayer: null,
      cocaptainplayer: null,
      active: true,
    };
    let newCaptainUser = null;
    if (playerUserExist) {
      userObj.captainplayer = role === UserRole.captain ? playerExist._id : playerUserExist.captainplayer;
      userObj.cocaptainplayer = role === UserRole.co_captain ? playerExist._id : playerUserExist.cocaptainplayer;
      const hashedPassword = await bcrypt.hash(eventExist.coachPassword, 10);
      userObj.password = hashedPassword;
      newCaptainUser = await this.updateOne({ _id: playerUserExist._id }, userObj);
    } else {
      userObj.captainplayer = role === UserRole.captain ? playerExist._id : null;
      userObj.cocaptainplayer = role === UserRole.co_captain ? playerExist._id : null;
      newCaptainUser = await this.create(userObj);
    }
    return newCaptainUser;
  }

  async findById(id: string) {
    return this.userModel.findById(id).lean();
  }

  async findOne(filter: QueryFilter<User>) {
    return this.userModel.findOne(filter);
  }

  async find(filter: QueryFilter<User>) {
    return this.userModel.find(filter);
  }

  async validateLogin(payload: { _id: ObjectId }) {
    const user = await this.userModel.findById(payload._id);
    if (!user) throw this.notFound;
    return user;
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const existingUser: any = await this.userModel.findOne({ email });
    if (!existingUser) throw this.invalidCredentials;
    const passwordFromUser = existingUser.password;
    const passwordMatched = await bcrypt.compare(password, passwordFromUser);
    if (!passwordMatched) throw this.invalidCredentials;

    const userObj = { ...existingUser._doc };
    delete userObj.password;

    if (userObj.role === UserRole.captain && userObj.captainplayer) {
      // const player = await this.playerService.findById(userObj.captainplayer.toString());
      const teamWithCaptain = await this.teamService.findOne({ captain: userObj.captainplayer.toString() });
      if (teamWithCaptain) {
        userObj.event = teamWithCaptain.event;
      }
      delete userObj.captainplayer;
    }

    const token = await this.jwtService.sign({ _id: existingUser._id, email: existingUser.email, role: userObj.role });

    return {
      token,
      user: userObj,
    };
  }

  async createOrUpdate(user: User | Record<string, any>, id?: string) {
    if (id) {
      return this.userModel.findOneAndUpdate(
        {
          _id: id,
        },
        user,
        { upsert: true, new: true },
      );
    }

    return this.userModel.create({
      ...user,
      active: true,
    });
  }

  async updateOne(filter: QueryFilter<User>, updateData: UpdateQuery<User>) {
    return this.userModel.updateOne(filter, updateData);
  }

  async updateMany(filter: QueryFilter<User>, updateData: UpdateQuery<User>) {
    return this.userModel.updateMany(filter, updateData);
  }

  async createOrUpdateAdmin(user: User) {
    let admin = await this.userModel.findOne({
      email: user.email,
    });

    if (!admin) {
      admin = await this.userModel.create(user);
    }
  }

  async delete(filter: QueryFilter<User>) {
    return this.userModel.deleteMany(filter);
  }

  async deleteMany(filter: QueryFilter<User>) {
    return this.userModel.deleteMany(filter);
  }
  async deleteOne(filter: QueryFilter<User>) {
    return this.userModel.deleteOne(filter);
  }
}
