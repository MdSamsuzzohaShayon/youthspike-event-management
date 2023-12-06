import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { FilterQuery, Model, ObjectId } from 'mongoose';
import { AppResponse } from 'src/shared/response';
import { Login, User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  private readonly notFound = AppResponse.notFound('user');
  private readonly invalidCredentials = AppResponse.invalidCredentials();

  constructor(@InjectModel(User.name) private userModel: Model<User>, private jwtService: JwtService) { }

  async create(user: User) {
    const userObj = { ...user };
    const password = userObj.login.password;
    const hashedPassword = await bcrypt.hash(password, 10);
    const loginObj: { email: string; password: string } = {
      email: userObj.login.email,
      password: hashedPassword,
    };
    const newUser = { ...userObj, login: loginObj };
    const existing = await this.userModel.findOne({
      'login.email': user.login.email,
    });

    if (existing) throw AppResponse.exists('user');
    return this.userModel.create({
      ...newUser,
    });
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

  async login(login: Login): Promise<{ user: User; token: string }> {
    const existing: UserDocument = await this.userModel.findOne({
      'login.email': login.email,
    });
    if (!existing) throw this.invalidCredentials;
    const passwordFromUser = existing.login.password;
    const passwordMatched = await bcrypt.compare(login.password, passwordFromUser);
    if (!passwordMatched) throw this.invalidCredentials;

    const user = JSON.parse(JSON.stringify(existing));
    const token = await this.jwtService.sign({ _id: existing._id });

    return {
      token,
      user,
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
      'login.email': user.login.email,
    });

    if (!admin) admin = await this.userModel.create(user);
    else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.login.password, salt);
      admin.login.password = hashedPassword;
      await admin.save();
    }
  }

  async query(filter: FilterQuery<User>) {
    return this.userModel.find(filter).sort({ updatedAt: -1 });
  }
}
