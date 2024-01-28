import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';

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

  providers: [UserResolver],
})
export class UserModule {}
