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
  'captain' = 'captain',
  'co_captain' = 'co_captain',
}
registerEnumType(UserRole, {
  name: 'UserRole',
});

/**
 * User
 */
@ObjectType()
export class UserBase extends AppDocument {
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

  @Field((type) => Player, { nullable: true })
  @Prop({ required: false, type: mongoose.Schema.Types.ObjectId, ref: 'Player' })
  cocaptainplayer?: Player | string;

  @Field({ nullable: true })
  @Prop({ required: false })
  email: string;

  @Field({ nullable: false })
  @Prop({ required: true })
  active: boolean;
}

@ObjectType()
@Schema({ timestamps: true })
export class User extends UserBase {
  @Field({ nullable: false })
  @Prop({ required: false })
  password: string;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
export const UserSchemaFactory = async () => {
  /*
  UserSchema.pre('save', async function () {
    if (this?.password && (this.isNew || this.isModified('password'))) {
      this.password = await hash(this.password, 10);
    }
  });

  UserSchema.method('toJSON', function () {
    const obj = this.toObject();

    if (obj.role != UserRole.admin) delete obj.admin;
    if (obj.role != UserRole.coach) delete obj.coach;
    if (obj.role != UserRole.manager) delete obj.manager;

    if (obj?.login?.password) delete obj.login.password;
    return obj;
  });
  */

  return UserSchema;
};
