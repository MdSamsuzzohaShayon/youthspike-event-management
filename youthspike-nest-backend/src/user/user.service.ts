import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { FilterQuery, Model, ObjectId } from 'mongoose';
import { AppResponse } from 'src/shared/response';
import { User, UserDocument, UserRole } from './user.schema';
import { PlayerService } from 'src/player/player.service';
import { TeamService } from 'src/team/team.service';

@Injectable()
export class UserService {
  private readonly notFound = AppResponse.notFound('user');
  private readonly invalidCredentials = AppResponse.invalidCredentials();

  constructor(@InjectModel(User.name) private userModel: Model<User>, private jwtService: JwtService, private teamService: TeamService) { }

  async create(user: User) {
    const userObj = { ...user };
    const password = userObj.password;
    const hashedPassword = await bcrypt.hash(password, 10);
    userObj.password = hashedPassword;
    const existing = await this.userModel.findOne({ email: user.email, });

    if (existing) throw AppResponse.exists('user');
    return this.userModel.create({ ...userObj });
  }

  async findById(id: string) {
    return this.userModel.findById(id);
  }

  async findOne(filter: FilterQuery<User>) {
    return this.userModel.findOne(filter);
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

    if(userObj.role === UserRole.captain && userObj.captainplayer){
      // const player = await this.playerService.findById(userObj.captainplayer.toString());
      const teamWithCaptain = await this.teamService.findOne({captain: userObj.captainplayer.toString()});
      if(teamWithCaptain){
        userObj.event = teamWithCaptain.event;
      }
      delete userObj.captainplayer
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

  async createOrUpdateAdmin(user: User) {
    let admin = await this.userModel.findOne({
      email: user.email,
    });

    if (!admin) {
      admin = await this.userModel.create(user);
    }
  }

  async query(filter: FilterQuery<User>) {
    return this.userModel.find(filter).sort({ updatedAt: -1 });
  }
}
