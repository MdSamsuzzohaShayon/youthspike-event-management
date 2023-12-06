import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { TeamResolver } from './team.resolver';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],

  providers: [TeamResolver],
})
export class TeamModule {}
