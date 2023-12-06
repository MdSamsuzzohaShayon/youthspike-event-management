/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { hash } from 'bcrypt';
import mongoose, { Document } from 'mongoose';
import { Event } from 'src/event/event.schema';
import { LDO } from 'src/ldo/ldo.schema';
import { Player } from 'src/player/player.schema';
import { AppDocument } from 'src/shared/schema/document.schema';
import { Team } from 'src/team/team.schema';

/**
 * User Roles
 */
export enum UserRole {
  'admin' = 'admin',
  'director' = 'director',
  'coach' = 'coach',
  'captain' = 'captain',
  'manager' = 'manager',
  'player' = 'player',
  'playerAndCoach' = 'playerAndCoach',
}
registerEnumType(UserRole, {
  name: 'UserRole',
});

/**
 * Admin
 */
@ObjectType()
@Schema({ _id: false })
export class Admin {}
const AdminSchema = SchemaFactory.createForClass(Admin);

/**
 * Coach
 */
@ObjectType()
@Schema({ _id: false })
export class Coach {
  @Field({ nullable: true })
  team?: Team;
}
const CoachSchema = SchemaFactory.createForClass(Coach);

/**
 * Manager
 */
@ObjectType()
@Schema({ _id: false })
export class Manager {}
const ManagerSchema = SchemaFactory.createForClass(Manager);

/**
 * Login
 */
@ObjectType()
@Schema({ _id: false })
export class Login {
  @Field()
  @Prop({ required: true })
  email: string;

  @Field({ nullable: true })
  @Prop({ required: false })
  password: string;
}
const LoginSchema = SchemaFactory.createForClass(Login);

/**
 * User
 */
@ObjectType()
@Schema({ timestamps: true })
export class User extends AppDocument {
  @Field()
  @Prop({ required: true })
  firstName: string;

  @Field()
  @Prop({ required: true })
  lastName: string;

  @Field((type) => UserRole)
  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Field((type) => Player, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Player' })
  captainplayer?: Player | string;

  // @Field((type) => Admin, { nullable: true })
  @Prop({ required: false, type: AdminSchema })
  admin?: Admin;

  // @Field((type) => Manager, { nullable: true })
  @Prop({ required: false, type: ManagerSchema })
  manager?: Manager;

  @Field((type) => Login, { nullable: true })
  @Prop({ required: false, type: LoginSchema })
  login?: Login;

  @Field({ nullable: false })
  @Prop({ required: true })
  active: boolean;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
export const UserSchemaFactory = async () => {
  UserSchema.pre('save', async function () {
    // if (this.login?.password && (this.isNew || this.isModified('login.password'))) {
    //   this.login.password = await hash(this.login.password, 10);
    // }
  });

  UserSchema.method('toJSON', function () {
    const obj = this.toObject();

    if (obj.role != UserRole.admin) delete obj.admin;
    if (obj.role != UserRole.coach) delete obj.coach;
    if (obj.role != UserRole.manager) delete obj.manager;

    if (obj?.login?.password) delete obj.login.password;
    return obj;
  });

  return UserSchema;
};
