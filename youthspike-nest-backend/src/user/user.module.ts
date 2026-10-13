import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {UserQueries} from './resolvers/user.queries';
import { JwtModule } from '@nestjs/jwt';
import { UserMutations } from './resolvers/user.mutations';
import { UserFields } from './resolvers/user.fields';
import UserHelpers from './resolvers/user.helpers';

@Module({
  imports: [
    SharedModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],

      useFactory: async (config: ConfigService) => {
        return {
          secret: config.get('JWT_SECRET'),
          signOptions: {
            expiresIn: '1d',
          },
        };
      },

      inject: [ConfigService],
    }),
    ConfigModule.forRoot()],

  providers: [UserResolver, UserQueries, UserMutations, UserFields, UserHelpers],
})
export class UserModule {}
