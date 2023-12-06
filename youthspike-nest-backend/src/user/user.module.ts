import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],

  providers: [UserResolver],
})
export class UserModule {}
