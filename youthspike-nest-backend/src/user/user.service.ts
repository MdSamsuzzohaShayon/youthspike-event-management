import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { FilterQuery, Model, ObjectId } from 'mongoose';
import { AppResponse } from 'src/shared/response';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  private readonly notFound = AppResponse.notFound('user');
  private readonly invalidCredentials = AppResponse.invalidCredentials();

  constructor(@InjectModel(User.name) private userModel: Model<User>, private jwtService: JwtService) { }

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
    const existingUser: UserDocument = await this.userModel.findOne({ email });
    if (!existingUser) throw this.invalidCredentials;
    const passwordFromUser = existingUser.password;
    const passwordMatched = await bcrypt.compare(password, passwordFromUser);
    if (!passwordMatched) throw this.invalidCredentials;

    const user = JSON.parse(JSON.stringify(existingUser));
    const userObj = { ...user };
    delete userObj.password;

    const token = await this.jwtService.sign({ _id: existingUser._id, email: existingUser.email, existingUser: user.role });

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
